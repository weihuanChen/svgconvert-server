import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  tempDir: process.env.TEMP_DIR || path.join(__dirname, '../../temp'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10), // 20MB default
  cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '5', 10),
  fileRetentionMinutes: parseInt(process.env.FILE_RETENTION_MINUTES || '30', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS || '*',

  // ===== R2 配置 =====
  r2: {
    enabled: !!process.env.R2_ACCOUNT_ID,
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'svg-converter',
  },

  // ===== 队列配置 =====
  queue: {
    enabled: process.env.ENABLE_QUEUE_MODE === 'true',
    webhookSecret: process.env.QUEUE_WEBHOOK_SECRET || '',
  },

  // ===== 回调配置 =====
  callback: {
    enabled: process.env.ENABLE_CALLBACK === 'true',
    timeoutMs: parseInt(process.env.CALLBACK_TIMEOUT_MS || '30000', 10),
  },
};
