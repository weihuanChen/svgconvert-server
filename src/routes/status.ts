import { Hono } from 'hono';
import type { Context } from 'hono';
import { taskManager } from '../services/taskManager.js';
import { detectLocale, getTranslation } from '../utils/i18n.js';

const status = new Hono();

status.get('/:taskId', async (c: Context) => {
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

  return c.json({
    taskId: task.taskId,
    status: task.status,
    error: task.error,
  });
});

export default status;
