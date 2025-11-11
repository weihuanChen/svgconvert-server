import type { Context } from 'hono';
import { logger } from '../utils/logger.js';
import { detectLocale, getTranslation } from '../utils/i18n.js';

export function errorHandler(err: Error, c: Context) {
  logger.error('Error occurred:', err);

  const locale = detectLocale(c.req.header('accept-language'));
  const message = getTranslation(locale, 'errors.internal_error');

  return c.json(
    {
      error: 'internal_error',
      message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  );
}
