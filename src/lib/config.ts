/**
 * Environment Configuration with Validation
 *
 * This module provides typed, validated access to environment variables
 * and ensures all required configuration is present at startup.
 */

export type Environment = 'development' | 'staging' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
  // Environment
  nodeEnv: string;
  appEnv: Environment;

  // Logging
  logLevel: LogLevel;
  clientLogLevel: LogLevel;

  // API
  apiUrl: string;
  apiTimeout: number;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableDebugMode: boolean;

  // External Services
  analyticsId?: string;
  sentryDsn?: string;
  databaseUrl?: string;

  // Security
  nextAuthSecret?: string;
  nextAuthUrl?: string;

  // Performance
  cacheTtl: number;
}

/**
 * Validates and parses environment variables
 */
function validateEnvironment(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || 'development') as Environment;

  // Validate environment values
  if (!['development', 'staging', 'production'].includes(appEnv)) {
    throw new Error(`Invalid NEXT_PUBLIC_APP_ENV: ${appEnv}. Must be development, staging, or production.`);
  }

  // Validate log levels
  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  const clientLogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn') as LogLevel;

  const validLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }
  if (!validLogLevels.includes(clientLogLevel)) {
    throw new Error(`Invalid NEXT_PUBLIC_LOG_LEVEL: ${clientLogLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  // Required variables based on environment
  const requiredVars: Record<Environment, string[]> = {
    development: [],
    staging: [],
    production: []
  };

  // Check required variables
  const missingVars: string[] = [];
  requiredVars[appEnv].forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for ${appEnv}: ${missingVars.join(', ')}`);
  }

  // Parse and validate numeric values
  const apiTimeout = parseInt(process.env.API_TIMEOUT || '5000', 10);
  if (isNaN(apiTimeout) || apiTimeout <= 0) {
    throw new Error(`Invalid API_TIMEOUT: ${process.env.API_TIMEOUT}. Must be a positive number.`);
  }

  const cacheTtl = parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '0', 10);
  if (isNaN(cacheTtl) || cacheTtl < 0) {
    throw new Error(`Invalid NEXT_PUBLIC_CACHE_TTL: ${process.env.NEXT_PUBLIC_CACHE_TTL}. Must be a non-negative number.`);
  }

  // Parse boolean values
  const enableAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  const enableErrorReporting = process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true';
  const enableDebugMode = process.env.ENABLE_DEBUG_MODE === 'true';

  return {
    nodeEnv,
    appEnv,
    logLevel,
    clientLogLevel,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
    apiTimeout,
    enableAnalytics,
    enableErrorReporting,
    enableDebugMode,
    analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    sentryDsn: process.env.SENTRY_DSN,
    databaseUrl: process.env.DATABASE_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    cacheTtl
  };
}

// Cache the validated config
let configCache: AppConfig | null = null;

/**
 * Get validated application configuration
 * This should be called once at application startup
 */
export function getConfig(): AppConfig {
  if (!configCache) {
    configCache = validateEnvironment();
  }
  return configCache;
}

/**
 * Validate configuration on module load (for server-side validation)
 */
if (typeof window === 'undefined') {
  try {
    getConfig();
  } catch (error) {
    console.error('Environment configuration validation failed:', error);
    // In production, this would cause the app to fail to start
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export default getConfig;