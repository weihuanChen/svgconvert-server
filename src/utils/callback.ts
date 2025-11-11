import { CONFIG } from '../config/index.js';
import { logger } from './logger.js';

/**
 * 回调负载接口
 */
export interface CallbackPayload {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  outputFileKey?: string;
  outputFileSize?: number;
  processingDuration: number;
  errorMessage?: string;
}

/**
 * 通知前端任务完成/失败
 * @param callbackUrl 前端回调 URL
 * @param callbackToken 回调认证 token
 * @param payload 回调数据
 */
export async function notifyCompletion(
  callbackUrl: string,
  callbackToken: string,
  payload: CallbackPayload
): Promise<void> {
  if (!CONFIG.callback.enabled) {
    logger.warn('⚠ 回调功能已禁用，跳过通知');
    return;
  }

  try {
    logger.info(`📤 发送回调: ${callbackUrl} [任务: ${payload.taskId}]`);

    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONFIG.callback.timeoutMs
    );

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${callbackToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `回调失败: ${response.status} ${response.statusText}`
      );
    }

    logger.info(`✓ 回调发送成功: ${payload.taskId}`);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(
        `✗ 回调超时 (${CONFIG.callback.timeoutMs}ms): ${payload.taskId}`,
        error
      );
    } else {
      logger.error(`✗ 回调错误: ${payload.taskId}`, error);
    }
    throw error;
  }
}

