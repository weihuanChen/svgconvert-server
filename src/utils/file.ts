import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config/index.js';
import type { ConversionFormat } from '../types/index.js';

export async function ensureTempDir(): Promise<void> {
  try {
    await fs.access(CONFIG.tempDir);
  } catch {
    await fs.mkdir(CONFIG.tempDir, { recursive: true });
  }
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

export function isValidFormat(format: string): format is ConversionFormat {
  const validFormats: ConversionFormat[] = ['png', 'jpg', 'jpeg', 'svg', 'pdf', 'webp', 'gif'];
  return validFormats.includes(format as ConversionFormat);
}

export function normalizeFormat(format: string): ConversionFormat {
  const normalized = format.toLowerCase();
  if (normalized === 'jpeg') return 'jpg';
  return normalized as ConversionFormat;
}

export async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return stats;
  } catch {
    return null;
  }
}

export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getTaskFilePath(taskId: string, filename: string): string {
  return path.join(CONFIG.tempDir, `${taskId}_${filename}`);
}
