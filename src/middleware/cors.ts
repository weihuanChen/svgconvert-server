import type { Context, Next } from 'hono';
import { CONFIG } from '../config/index.js';

export async function corsMiddleware(c: Context, next: Next): Promise<void> {
  const origin = c.req.header('origin');

  c.header('Access-Control-Allow-Origin', CONFIG.allowedOrigins);
  c.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Accept-Language');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return;
  }

  await next();
}
