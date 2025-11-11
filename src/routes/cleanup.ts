import { Hono } from 'hono';
import type { Context } from 'hono';
import { taskManager } from '../services/taskManager.js';
import { detectLocale, getTranslation } from '../utils/i18n.js';
import { deleteFile } from '../utils/file.js';
import { logger } from '../utils/logger.js';

const cleanup = new Hono();

cleanup.delete('/:taskId', async (c: Context) => {
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

  // Delete input file
  if (task.inputFile) {
    await deleteFile(task.inputFile);
  }

  // Delete output file if exists
  if (task.outputFile) {
    await deleteFile(task.outputFile);
  }

  // Remove task from manager
  taskManager.deleteTask(taskId);

  logger.info(`Task ${taskId} cleaned up`);

  return c.json({
    message: 'Task cleaned up successfully',
    taskId,
  });
});

export default cleanup;
