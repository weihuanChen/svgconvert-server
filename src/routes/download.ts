import { Hono } from 'hono';
import type { Context } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { taskManager } from '../services/taskManager.js';
import { detectLocale, getTranslation } from '../utils/i18n.js';
import { getFileStats } from '../utils/file.js';
import { logger } from '../utils/logger.js';

const download = new Hono();

download.get('/:taskId', async (c: Context) => {
  const locale = detectLocale(c.req.header('accept-language'));
  const taskId = c.req.param('taskId');

  const task = taskManager.getTask(taskId);

  if (!task) {
    return c.json(
      {
        error: 'task_not_found',
        message: getTranslation(locale, 'errors.task_not_found'),
      },
      404
    );
  }

  if (task.status === 'ERROR') {
    return c.json(
      {
        error: 'conversion_failed',
        message: getTranslation(locale, 'conversion.failed'),
        details: task.error,
      },
      400
    );
  }

  if (task.status !== 'COMPLETED') {
    return c.json(
      {
        error: 'not_ready',
        message: getTranslation(locale, 'conversion.processing'),
        status: task.status,
      },
      400
    );
  }

  if (!task.outputFile) {
    return c.json(
      {
        error: 'file_not_found',
        message: getTranslation(locale, 'download.not_found'),
      },
      404
    );
  }

  // Check if file exists
  const fileStats = await getFileStats(task.outputFile);
  if (!fileStats) {
    return c.json(
      {
        error: 'file_not_found',
        message: getTranslation(locale, 'download.not_found'),
      },
      404
    );
  }

  try {
    // Read file
    const fileBuffer = await fs.readFile(task.outputFile);

    // Get MIME type
    const mimeType = mime.lookup(task.outputFile) || 'application/octet-stream';

    // Generate download filename
    const filename = `converted_${taskId}.${task.outputFormat}`;

    logger.info(`Downloading file: ${filename}`);

    // Set headers and return file
    c.header('Content-Type', mimeType);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', fileStats.size.toString());

    return new Response(fileBuffer);
  } catch (error) {
    logger.error('Download error:', error);
    return c.json(
      {
        error: 'download_failed',
        message: getTranslation(locale, 'errors.internal_error'),
      },
      500
    );
  }
});

export default download;
