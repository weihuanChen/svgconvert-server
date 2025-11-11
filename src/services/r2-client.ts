import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * R2 客户端 - 用于与 Cloudflare R2 交互
 * 支持文件上传、下载、删除操作
 */
export class R2Client {
  private s3: S3Client | null = null;

  constructor() {
    if (CONFIG.r2.enabled) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${CONFIG.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: CONFIG.r2.accessKeyId,
          secretAccessKey: CONFIG.r2.secretAccessKey,
        },
      });
      logger.info('✓ R2 客户端已初始化');
    } else {
      logger.info('⚠ R2 客户端未启用 (缺少 R2_ACCOUNT_ID)');
    }
  }

  /**
   * 检查 R2 是否启用
   */
  isEnabled(): boolean {
    return this.s3 !== null;
  }

  /**
   * 上传文件到 R2
   * @param key 文件在 R2 中的键
   * @param body 文件内容
   * @param contentType 文件 MIME 类型
   * @param metadata 自定义元数据
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    if (!this.s3) {
      throw new Error('R2 未启用');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: CONFIG.r2.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3.send(command);
      logger.info(`✓ R2 文件上传成功: ${key}`);
    } catch (error) {
      logger.error(`✗ R2 文件上传失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 从 R2 下载文件
   * @param key 文件在 R2 中的键
   * @returns 文件内容
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (!this.s3) {
      throw new Error('R2 未启用');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: CONFIG.r2.bucketName,
        Key: key,
      });

      const response = await this.s3.send(command);
      const chunks: Uint8Array[] = [];

      // 将流转换为 Buffer
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      logger.info(`✓ R2 文件下载成功: ${key} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      logger.error(`✗ R2 文件下载失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 删除 R2 中的文件
   * @param key 文件在 R2 中的键
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3) {
      throw new Error('R2 未启用');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: CONFIG.r2.bucketName,
        Key: key,
      });

      await this.s3.send(command);
      logger.info(`✓ R2 文件删除成功: ${key}`);
    } catch (error) {
      logger.error(`✗ R2 文件删除失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 生成 R2 文件键 (key)
   * 格式: {type}/{date}/{taskId}/{fileName}
   * 例: output/2025-01-11/task-123/example.png
   *
   * @param taskId 任务 ID
   * @param fileName 文件名
   * @param type 文件类型 (input 或 output)
   * @returns 生成的 R2 键
   */
  generateR2Key(
    taskId: string,
    fileName: string,
    type: 'input' | 'output'
  ): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // 清理文件名中的特殊字符
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${type}/${date}/${taskId}/${sanitizedFileName}`;
  }
}

// 导出全局实例
export const r2Client = new R2Client();

