type LogLevel = 'info' | 'error' | 'warn' | 'debug';

function formatDate(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = formatDate();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', message, data);
    }
  },
};
