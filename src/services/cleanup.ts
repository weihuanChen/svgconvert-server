import cron from 'node-cron';
import { taskManager } from './taskManager.js';
import { deleteFile } from '../utils/file.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

export function startCleanupJob(): void {
  // Run cleanup every N minutes (configurable via environment)
  const cronExpression = `*/${CONFIG.cleanupIntervalMinutes} * * * *`;

  logger.info(
    `Starting cleanup job with interval: ${CONFIG.cleanupIntervalMinutes} minutes`
  );
  logger.info(
    `Files will be retained for: ${CONFIG.fileRetentionMinutes} minutes`
  );

  cron.schedule(cronExpression, async () => {
    await performCleanup();
  });
}

export async function performCleanup(): Promise<void> {
  try {
    logger.info('Running cleanup job...');

    const oldTasks = taskManager.getOldTasks(CONFIG.fileRetentionMinutes);

    if (oldTasks.length === 0) {
      logger.info('No files to clean up');
      return;
    }

    logger.info(`Found ${oldTasks.length} old tasks to clean up`);

    let deletedCount = 0;

    for (const task of oldTasks) {
      try {
        // Delete input file
        if (task.inputFile) {
          const deleted = await deleteFile(task.inputFile);
          if (deleted) {
            logger.debug(`Deleted input file: ${task.inputFile}`);
          }
        }

        // Delete output file
        if (task.outputFile) {
          const deleted = await deleteFile(task.outputFile);
          if (deleted) {
            logger.debug(`Deleted output file: ${task.outputFile}`);
          }
        }

        // Remove task from manager
        taskManager.deleteTask(task.taskId);
        deletedCount++;

        logger.debug(`Cleaned up task: ${task.taskId}`);
      } catch (error) {
        logger.error(`Failed to clean up task ${task.taskId}:`, error);
      }
    }

    logger.info(`Cleanup completed. Removed ${deletedCount} tasks.`);
  } catch (error) {
    logger.error('Cleanup job failed:', error);
  }
}
