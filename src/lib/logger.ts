import { getConfig } from './config';

let logger: any = null;

// Only initialize winston on server side
if (typeof window === 'undefined') {
  const winston = require('winston');
  const config = getConfig();

  // Define log levels
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  // Create Winston logger
  logger = winston.createLogger({
    level: config.logLevel,
    levels,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'energy-drink-app' },
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      // File transport for production logging
      ...(process.env.NODE_ENV === 'production'
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
            }),
          ]
        : []),
    ],
  });

  // If we're not in production, log to console with simpler format
  if (process.env.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }
} else {
  // Client-side simple logger fallback
  logger = {
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${message}`, meta);
      }
    },
    info: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[INFO] ${message}`, meta);
      }
    },
    warn: (message: string, meta?: any) => {
      console.warn(`[WARN] ${message}`, meta);
    },
    error: (message: string, error?: Error | any) => {
      console.error(`[ERROR] ${message}`, error);
    },
  };
}

export function logDebug(message: string, meta?: any): void {
  logger.debug(message, meta);
}

export function logInfo(message: string, meta?: any): void {
  logger.info(message, meta);
}

export function logWarn(message: string, meta?: any): void {
  logger.warn(message, meta);
}

export function logError(message: string, error?: Error | any): void {
  logger.error(message, error);
}

// Export the logger instance for advanced usage
export { logger };