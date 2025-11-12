import { Hono } from 'hono';
import type { Context } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { detectLocale, getTranslation } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import { taskManager } from '../services/taskManager.js';
import { convertFile } from '../services/converters/index.js';
import { r2Client } from '../services/r2-client.js';
import { CONFIG } from '../config/index.js';
import {
  getFileExtension,
  isValidFormat,
  normalizeFormat,
  getTaskFilePath,
} from '../utils/file.js';
import type { ConversionParams } from '../types/index.js';

const upload = new Hono();

upload.post('/', async (c: Context) => {
  const locale = detectLocale(c.req.header('accept-language'));

  try {
    logger.info('Upload endpoint called');

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(
        {
          error: 'no_file',
          message: getTranslation(locale, 'upload.failed'),
        },
        400
      );
    }

    // Validate file size
    if (file.size > CONFIG.maxFileSize) {
      return c.json(
        {
          error: 'file_too_large',
          message: getTranslation(locale, 'upload.file_too_large'),
        },
        400
      );
    }

    // Get input format
    const inputExt = getFileExtension(file.name);
    if (!isValidFormat(inputExt)) {
      return c.json(
        {
          error: 'invalid_format',
          message: getTranslation(locale, 'upload.invalid_format'),
        },
        400
      );
    }

    const inputFormat = normalizeFormat(inputExt);

    // Parse conversion parameters
    const receivedFormat = formData.get('outputFormat');
    logger.info(`📥 Received outputFormat from frontend: "${receivedFormat}" (type: ${typeof receivedFormat})`);
    
    const outputFormat = normalizeFormat(
      (formData.get('outputFormat') as string) || 'png'
    );
    logger.info(`✓ After normalization: "${outputFormat}"`);

    if (!isValidFormat(outputFormat)) {
      return c.json(
        {
          error: 'invalid_output_format',
          message: getTranslation(locale, 'errors.invalid_params'),
        },
        400
      );
    }

    const params: ConversionParams = {
      outputFormat,
      width: formData.get('width')
        ? parseInt(formData.get('width') as string)
        : undefined,
      height: formData.get('height')
        ? parseInt(formData.get('height') as string)
        : undefined,
      quality: formData.get('quality')
        ? parseInt(formData.get('quality') as string)
        : undefined,
      backgroundColor: (formData.get('backgroundColor') as string) || undefined,
      maintainAspectRatio:
        formData.get('maintainAspectRatio') === 'true' ||
        formData.get('maintainAspectRatio') === '1',
      colors: formData.get('colors')
        ? parseInt(formData.get('colors') as string)
        : undefined,
      smoothing: formData.get('smoothing')
        ? parseFloat(formData.get('smoothing') as string)
        : undefined,
    };

    // Create task
    const task = taskManager.createTask(
      '', // Will be set after saving file
      inputFormat,
      params
    );

    // Save uploaded file
    const inputFilename = `input.${inputFormat}`;
    const inputPath = getTaskFilePath(task.taskId, inputFilename);
    const outputFilename = `output.${outputFormat}`;
    const outputPath = getTaskFilePath(task.taskId, outputFilename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));

    // Update task with file path
    task.inputFile = inputPath;

    logger.info(`File saved: ${inputPath}`);

    // Start conversion asynchronously
    processConversion(task.taskId, inputPath, outputPath, inputFormat, params, file.name);

    return c.json({
      taskId: task.taskId,
      status: task.status,
      outputFormat: task.outputFormat,
      message: getTranslation(locale, 'upload.success'),
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return c.json(
      {
        error: 'upload_failed',
        message: getTranslation(locale, 'upload.failed'),
      },
      500
    );
  }
});

// Async conversion process
async function processConversion(
  taskId: string,
  inputPath: string,
  outputPath: string,
  inputFormat: string,
  params: ConversionParams,
  fileName?: string
): Promise<void> {
  try {
    taskManager.updateTaskStatus(taskId, 'PROCESSING');
    logger.info(`Starting conversion for task ${taskId}`);

    await convertFile({
      inputPath,
      outputPath,
      inputFormat: inputFormat as any,
      params,
    });

    // 如果启用 R2，尝试上传结果
    if (r2Client.isEnabled() && fileName) {
      try {
        const outputBuffer = await fs.readFile(outputPath);
        const outputFileKey = r2Client.generateR2Key(
          taskId,
          fileName.replace(/\.\w+$/, `.${params.outputFormat}`),
          'output'
        );

        await r2Client.uploadFile(
          outputFileKey,
          outputBuffer,
          `image/${params.outputFormat}`,
          { taskId, sourceFileName: fileName }
        );

        logger.info(`✓ Output uploaded to R2: ${outputFileKey}`);
      } catch (r2Error) {
        logger.warn('⚠ R2 upload failed, keeping local file:', r2Error);
        // 不中断流程，保留本地文件
      }
    }

    taskManager.updateTaskStatus(taskId, 'COMPLETED', outputPath);
    logger.info(`Conversion completed for task ${taskId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    taskManager.updateTaskStatus(taskId, 'ERROR', undefined, errorMessage);
    logger.error(`Conversion failed for task ${taskId}:`, error);
  }
}

export default upload;
