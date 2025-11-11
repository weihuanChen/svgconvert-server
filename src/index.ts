import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';
import { ensureTempDir } from './utils/file.js';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startCleanupJob } from './services/cleanup.js';

// Routes
import upload from './routes/upload.js';
import status from './routes/status.js';
import download from './routes/download.js';
import cleanup from './routes/cleanup.js';
import queue from './routes/queue.js';

const app = new Hono();

// Middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);
app.onError(errorHandler);

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'SVG Convert Server',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// API Routes
app.route('/api/upload', upload);
app.route('/api/status', status);
app.route('/api/download', download);
app.route('/api/cleanup', cleanup);

// 条件化路由：队列模式（如果启用）
if (CONFIG.queue.enabled) {
  app.route('/api/queue', queue);
  logger.info('✓ 队列模式已启用');
} else {
  logger.info('⚠ 队列模式已禁用，使用本地文件上传模式');
}

// Initialize server
async function startServer() {
  try {
    // Ensure temp directory exists
    await ensureTempDir();
    logger.info(`Temp directory ready: ${CONFIG.tempDir}`);

    // Start file cleanup cron job
    startCleanupJob();
    logger.info('Cleanup job started');

    // Start server
    logger.info(`Starting server on port ${CONFIG.port}...`);

    serve({
      fetch: app.fetch,
      port: CONFIG.port,
    });

    logger.info(`Server running at http://localhost:${CONFIG.port}`);
    logger.info(`Environment: ${CONFIG.nodeEnv}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
