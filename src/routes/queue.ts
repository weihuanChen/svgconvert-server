import { Hono } from 'hono';
import type { Context } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { taskManager } from '../services/taskManager.js';
import { r2Client } from '../services/r2-client.js';
import { convertFile } from '../services/converters/index.js';
import { notifyCompletion } from '../utils/callback.js';
import type { QueueMessage } from '../types/cloudflare.js';

const queue = new Hono();

/**
 * POST /api/queue/process
 * 接收来自 Cloudflare Queues 的消息并处理转换任务
 */
queue.post('/process', async (c: Context) => {
  if (!CONFIG.queue.enabled) {
    return c.json(
      { error: 'Queue mode is disabled' },
      400
    );
  }

  try {
    const message: QueueMessage = await c.req.json();
    const {
      taskId,
      sourceFileKey,
      fileName,
      sourceFormat,
      options,
      callbackUrl,
      callbackToken,
    } = message;

    logger.info(`📋 [队列] 接收到任务: ${taskId}`);

    // 创建本地任务记录
    const task = taskManager.createTask(
      '', // 暂时为空
      sourceFormat,
      {
        outputFormat: options.targetFormat,
        width: (options as any).width,
        height: (options as any).height,
        quality: (options as any).quality,
        backgroundColor: (options as any).backgroundColor,
        maintainAspectRatio: (options as any).maintainAspectRatio,
      } as any
    );

    // 异步处理任务 (不阻塞响应)
    processQueueTask(
      taskId,
      sourceFileKey,
      fileName,
      sourceFormat,
      options,
      callbackUrl,
      callbackToken
    ).catch((error) => {
      logger.error(`✗ [队列] 任务处理错误 [${taskId}]:`, error);
    });

    return c.json(
      {
        success: true,
        taskId,
        message: 'Task accepted for processing',
      },
      202
    );
  } catch (error) {
    logger.error('[队列] 消息解析错误:', error);
    return c.json(
      { error: 'Failed to process message', details: String(error) },
      400
    );
  }
});

/**
 * POST /api/queue/status/:taskId
 * 查询任务处理状态
 */
queue.get('/status/:taskId', (c: Context) => {
  const taskId = c.req.param('taskId');
  const task = taskManager.getTask(taskId);

  if (!task) {
    return c.json(
      { error: 'Task not found', taskId },
      404
    );
  }

  return c.json({
    taskId: task.taskId,
    status: task.status,
    error: task.error,
    completedAt: task.completedAt,
  });
});

/**
 * 处理队列任务的核心逻辑
 */
async function processQueueTask(
  taskId: string,
  sourceFileKey: string,
  fileName: string,
  sourceFormat: string,
  options: any,
  callbackUrl: string,
  callbackToken: string
) {
  const startTime = Date.now();

  try {
    logger.info(`⚙️ [队列] 开始处理任务: ${taskId}`);
    taskManager.updateTaskStatus(taskId, 'PROCESSING');

    // ===== 步骤 1: 从 R2 下载源文件 =====
    logger.info(`📥 [队列] 从 R2 下载源文件: ${sourceFileKey}`);
    const sourceBuffer = await r2Client.downloadFile(sourceFileKey);
    logger.info(
      `✓ [队列] 源文件已下载: ${sourceFileKey} (${sourceBuffer.length} bytes)`
    );

    // ===== 步骤 2: 创建临时工作目录 =====
    const tempDir = path.join(CONFIG.tempDir, taskId);
    await fs.mkdir(tempDir, { recursive: true });
    logger.info(`📁 [队列] 临时目录已创建: ${tempDir}`);

    // ===== 步骤 3: 保存源文件 =====
    const inputPath = path.join(tempDir, `input.${sourceFormat}`);
    await fs.writeFile(inputPath, sourceBuffer);
    logger.info(`💾 [队列] 源文件已保存: ${inputPath}`);

    // ===== 步骤 4: 执行文件转换 =====
    const outputFormat = options.targetFormat;
    const outputPath = path.join(tempDir, `output.${outputFormat}`);

    logger.info(
      `🔄 [队列] 开始转换: ${sourceFormat.toUpperCase()} → ${outputFormat.toUpperCase()}`
    );

    await convertFile({
      inputPath,
      outputPath,
      inputFormat: sourceFormat as any,
      params: {
        outputFormat,
        width: options.width,
        height: options.height,
        quality: options.quality,
        backgroundColor: options.backgroundColor,
        maintainAspectRatio: options.maintainAspectRatio,
        colors: options.colors,
        smoothing: options.smoothing,
      },
    });

    logger.info(`✓ [队列] 转换完成: ${outputPath}`);

    // ===== 步骤 5: 上传结果到 R2 =====
    const outputBuffer = await fs.readFile(outputPath);
    const outputFileKey = r2Client.generateR2Key(
      taskId,
      fileName.replace(/\.\w+$/, `.${outputFormat}`),
      'output'
    );

    logger.info(`📤 [队列] 上传输出文件到 R2: ${outputFileKey}`);

    await r2Client.uploadFile(
      outputFileKey,
      outputBuffer,
      `image/${outputFormat}`,
      { taskId, sourceFileName: fileName }
    );

    logger.info(
      `✓ [队列] 输出文件已上传: ${outputFileKey} (${outputBuffer.length} bytes)`
    );

    // ===== 步骤 6: 更新本地任务状态 =====
    taskManager.updateTaskStatus(taskId, 'COMPLETED', outputPath);

    // ===== 步骤 7: 发送完成回调 =====
    if (callbackUrl && callbackToken) {
      const processingDuration = Date.now() - startTime;
      logger.info(`🔔 [队列] 发送完成回调: ${taskId}`);

      try {
        await notifyCompletion(callbackUrl, callbackToken, {
          taskId,
          status: 'COMPLETED',
          outputFileKey,
          outputFileSize: outputBuffer.length,
          processingDuration,
        });

        logger.info(
          `✓ [队列] 任务完成: ${taskId} (耗时: ${processingDuration}ms)`
        );
      } catch (callbackError) {
        logger.error(`✗ [队列] 完成回调失败: ${taskId}`, callbackError);
        // 即使回调失败也不要抛出错误，因为转换已经完成
      }
    }

    // ===== 步骤 8: 清理临时文件（可选） =====
    // 保留临时文件以便调试，可由定时清理任务处理
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingDuration = Date.now() - startTime;

    logger.error(`✗ [队列] 任务失败: ${taskId}`, error);
    taskManager.updateTaskStatus(taskId, 'ERROR', undefined, errorMessage);

    // ===== 步骤 9: 发送失败回调 =====
    if (callbackUrl && callbackToken) {
      logger.info(`🔔 [队列] 发送失败回调: ${taskId}`);

      try {
        await notifyCompletion(callbackUrl, callbackToken, {
          taskId,
          status: 'FAILED',
          errorMessage,
          processingDuration,
        });

        logger.info(`✓ [队列] 失败回调已发送: ${taskId}`);
      } catch (callbackError) {
        logger.error(
          `✗ [队列] 失败回调也失败了: ${taskId}`,
          callbackError
        );
      }
    }
  }
}

export default queue;

