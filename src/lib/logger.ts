import winston from 'winston';
import { getConfig } from './config';

const config = getConfig();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create Winston logger
const logger = winston.createLogger({
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