/**
 * Environment-Specific Configuration Management
 * Provides secure, environment-aware configuration with validation
 */

import { secrets, secretManager } from './secret-manager';
import { logger } from './logger';

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // Environment identification
  environment: Environment;
  nodeEnv: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  
  // Database configuration
  database: {
    url?: string;
    poolSize: number;
    ssl: boolean;
    timeout: number;
  };
  
  // Cache configuration
  cache: {
    redisUrl?: string;
    fallbackToMemory: boolean;
    ttl: {
      short: number;
      medium: number;
      long: number;
    };
  };
  
  // API configuration
  api: {
    timeout: number;
    retryAttempts: number;
    baseUrl?: string;
  };
  
  // Security configuration
  security: {
    csrfSecret: string;
    nextAuthSecret: string;
    jwtExpiration: string;
    sessionTimeout: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
  
  // Monitoring configuration
  monitoring: {
    sentryDsn?: string;
    logLevel: string;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
  };
  
  // Feature flags
  features: {
    analytics: boolean;
    errorReporting: boolean;
    debugMode: boolean;
    abTesting: boolean;
    gdprCompliance: boolean;
  };
  
  // External services
  external: {
    googleAnalyticsId?: string;
    stripePublishableKey?: string;
    // Add other external service keys as needed
  };
  
  // GDPR/Privacy configuration
  privacy: {
    encryptionKey: string;
    dataRetentionDays: number;
    cookieConsentVersion: string;
    anonymizeIPs: boolean;
  };
}

/**
 * Environment-specific configuration templates
 */
const ENVIRONMENTS: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    environment: 'development',
    isDevelopment: true,
    database: {
      poolSize: 2,
      ssl: false,
      timeout: 10000,
    },
    cache: {
      fallbackToMemory: true,
      ttl: {
        short: 300,    // 5 minutes
        medium: 1800,  // 30 minutes
        long: 3600,    // 1 hour
      },
    },
    api: {
      timeout: 10000,
      retryAttempts: 2,
    },
    security: {
      jwtExpiration: '7d',
      sessionTimeout: 3600, // 1 hour
      rateLimit: {
        windowMs: 60000,    // 1 minute
        maxRequests: 100,
      },
    },
    monitoring: {
      logLevel: 'debug',
      enablePerformanceMonitoring: false,
      enableErrorReporting: false,
    },
    features: {
      debugMode: true,
      abTesting: true,
    },
    privacy: {
      dataRetentionDays: 30,
      anonymizeIPs: false,
    },
  },
  
  staging: {
    environment: 'staging',
    isStaging: true,
    database: {
      poolSize: 5,
      ssl: true,
      timeout: 15000,
    },
    cache: {
      fallbackToMemory: false,
      ttl: {
        short: 600,    // 10 minutes
        medium: 3600,  // 1 hour
        long: 7200,    // 2 hours
      },
    },
    api: {
      timeout: 15000,
      retryAttempts: 3,
    },
    security: {
      jwtExpiration: '1d',
      sessionTimeout: 1800, // 30 minutes
      rateLimit: {
        windowMs: 60000,    // 1 minute
        maxRequests: 50,
      },
    },
    monitoring: {
      logLevel: 'info',
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
    },
    features: {
      debugMode: false,
      abTesting: true,
    },
    privacy: {
      dataRetentionDays: 90,
      anonymizeIPs: true,
    },
  },
  
  production: {
    environment: 'production',
    isProduction: true,
    database: {
      poolSize: 10,
      ssl: true,
      timeout: 20000,
    },
    cache: {
      fallbackToMemory: false,
      ttl: {
        short: 900,    // 15 minutes
        medium: 7200,  // 2 hours
        long: 86400,   // 1 day
      },
    },
    api: {
      timeout: 20000,
      retryAttempts: 3,
    },
    security: {
      jwtExpiration: '4h',
      sessionTimeout: 900, // 15 minutes
      rateLimit: {
        windowMs: 60000,    // 1 minute
        maxRequests: 30,
      },
    },
    monitoring: {
      logLevel: 'warn',
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
    },
    features: {
      debugMode: false,
      abTesting: true,
    },
    privacy: {
      dataRetentionDays: 730, // 2 years
      anonymizeIPs: true,
    },
  },
};

class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private config: EnvironmentConfig | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  /**
   * Initialize and validate environment configuration
   */
  public initialize(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;
    const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || nodeEnv) as Environment;

    // Validate environment consistency
    if (nodeEnv !== appEnv && process.env.NODE_ENV !== 'development') {
      logger.warn(`Environment mismatch: NODE_ENV=${nodeEnv}, NEXT_PUBLIC_APP_ENV=${appEnv}`);
    }

    // Get base configuration for the environment
    const baseConfig = ENVIRONMENTS[appEnv];
    if (!baseConfig) {
      throw new Error(`Unsupported environment: ${appEnv}`);
    }

    // Validate required secrets for this environment
    this.validateEnvironmentSecrets(appEnv);

    // Build complete configuration
    this.config = this.buildEnvironmentConfig(appEnv, baseConfig);

    // Log configuration summary (without sensitive data)
    this.logConfigurationSummary(this.config);

    return this.config;
  }

  /**
   * Build complete environment configuration
   */
  private buildEnvironmentConfig(env: Environment, baseConfig: Partial<EnvironmentConfig>): EnvironmentConfig {
    return {
      // Environment identification
      environment: env,
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: env === 'development',
      isStaging: env === 'staging',
      isProduction: env === 'production',
      
      // Database configuration
      database: {
        url: secrets.getDatabaseUrl(),
        ...baseConfig.database,
      },
      
      // Cache configuration
      cache: {
        redisUrl: secrets.getRedisUrl(),
        ...baseConfig.cache,
      },
      
      // API configuration
      api: {
        timeout: secrets.getApiTimeout(),
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        ...baseConfig.api,
      },
      
      // Security configuration (always required)
      security: {
        csrfSecret: secrets.getCsrfSecret(),
        nextAuthSecret: secrets.getNextAuthSecret(),
        ...baseConfig.security,
      },
      
      // Monitoring configuration
      monitoring: {
        sentryDsn: secrets.getSentryDsn(),
        logLevel: secrets.getLogLevel(),
        enablePerformanceMonitoring: secrets.isErrorReportingEnabled(),
        enableErrorReporting: secrets.isErrorReportingEnabled(),
        ...baseConfig.monitoring,
      },
      
      // Feature flags
      features: {
        analytics: secrets.isAnalyticsEnabled(),
        errorReporting: secrets.isErrorReportingEnabled(),
        debugMode: secrets.isDebugModeEnabled(),
        abTesting: true, // Default enabled
        gdprCompliance: true, // Always enabled
        ...baseConfig.features,
      },
      
      // External services
      external: {
        googleAnalyticsId: secrets.getAnalyticsId(),
        stripePublishableKey: secrets.getStripePublishableKey(),
      },
      
      // Privacy configuration
      privacy: {
        encryptionKey: secrets.getGdprEncryptionKey(),
        cookieConsentVersion: '1.0',
        ...baseConfig.privacy,
      },
    };
  }

  /**
   * Validate that all required secrets are available for the environment
   */
  private validateEnvironmentSecrets(environment: Environment): void {
    const validationResult = secretManager.validateEnvironment(environment);
    
    if (!validationResult.isValid) {
      const errorMessage = `Environment validation failed for ${environment}: ${validationResult.errors.join(', ')}`;
      
      if (environment === 'production') {
        throw new Error(`🚨 CRITICAL: ${errorMessage}`);
      } else {
        logger.warn(`Environment validation warnings for ${environment}:`, validationResult.warnings);
      }
    }

    // Check for secrets that need rotation
    const secretsNeedingRotation = secretManager.getSecretsNeedingRotation();
    if (secretsNeedingRotation.length > 0) {
      logger.warn(`Secrets needing rotation in ${environment}:`, secretsNeedingRotation);
    }
  }

  /**
   * Log configuration summary (sanitized)
   */
  private logConfigurationSummary(config: EnvironmentConfig): void {
    logger.info(`Environment configuration initialized:`, {
      environment: config.environment,
      nodeEnv: config.nodeEnv,
      hasDatabase: !!config.database.url,
      hasCache: !!config.cache.redisUrl,
      hasSentry: !!config.monitoring.sentryDsn,
      hasAnalytics: !!config.external.googleAnalyticsId,
      features: Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name),
      security: {
        hasCsrfSecret: !!config.security.csrfSecret,
        hasNextAuthSecret: !!config.security.nextAuthSecret,
        jwtExpiration: config.security.jwtExpiration,
      },
    });
  }

  /**
   * Get current environment configuration
   */
  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.initialize();
    }
    return this.config;
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.getConfig().features[feature];
  }

  /**
   * Get database configuration with fallbacks
   */
  public getDatabaseConfig() {
    const config = this.getConfig();
    return {
      url: config.database.url,
      poolSize: config.database.poolSize,
      ssl: config.database.ssl,
      timeout: config.database.timeout,
    };
  }

  /**
   * Get cache configuration with fallbacks
   */
  public getCacheConfig() {
    const config = this.getConfig();
    return {
      redisUrl: config.cache.redisUrl,
      fallbackToMemory: config.cache.fallbackToMemory || config.environment === 'development',
      ttl: config.cache.ttl,
    };
  }

  /**
   * Get security configuration
   */
  public getSecurityConfig() {
    const config = this.getConfig();
    return config.security;
  }

  /**
   * Get monitoring configuration
   */
  public getMonitoringConfig() {
    const config = this.getConfig();
    return config.monitoring;
  }

  /**
   * Get privacy configuration
   */
  public getPrivacyConfig() {
    const config = this.getConfig();
    return config.privacy;
  }

  /**
   * Validate configuration at runtime
   */
  public validateRuntimeConfig(): { isValid: boolean; errors: string[] } {
    const config = this.getConfig();
    const errors: string[] = [];

    // Check required URLs
    if (config.environment === 'production') {
      if (!config.database.url) {
        errors.push('DATABASE_URL is required in production');
      }
      if (!config.cache.redisUrl) {
        errors.push('REDIS_URL is required in production');
      }
      if (!config.monitoring.sentryDsn) {
        errors.push('SENTRY_DSN is recommended in production');
      }
    }

    // Check security configuration
    if (!config.security.csrfSecret || config.security.csrfSecret.length < 16) {
      errors.push('CSRF_SECRET must be at least 16 characters');
    }
    if (!config.security.nextAuthSecret || config.security.nextAuthSecret.length < 32) {
      errors.push('NEXTAUTH_SECRET must be at least 32 characters');
    }

    // Check privacy configuration
    if (!config.privacy.encryptionKey || config.privacy.encryptionKey.length < 32) {
      errors.push('GDPR_ENCRYPTION_KEY must be at least 32 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get environment-specific deployment validation
   */
  public getDeploymentValidation(): {
    canDeploy: boolean;
    warnings: string[];
    blockers: string[];
  } {
    const config = this.getConfig();
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Check production readiness
    if (config.isProduction) {
      // Required for production
      if (!config.database.url) {
        blockers.push('DATABASE_URL is required for production deployment');
      }
      if (!config.cache.redisUrl) {
        warnings.push('REDIS_URL not configured - using memory cache fallback');
      }
      if (!config.monitoring.sentryDsn) {
        warnings.push('SENTRY_DSN not configured - error monitoring disabled');
      }
      if (config.security.jwtExpiration === '7d') {
        warnings.push('JWT expiration is very long for production (7 days)');
      }
    }

    // Check staging readiness
    if (config.isStaging) {
      if (!config.database.url) {
        warnings.push('DATABASE_URL not configured for staging');
      }
    }

    return {
      canDeploy: blockers.length === 0,
      warnings,
      blockers,
    };
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentConfigManager.getInstance();

// Export utility functions
export const config = {
  // Environment info
  get environment() { return environmentConfig.getConfig().environment; },
  get isDevelopment() { return environmentConfig.getConfig().isDevelopment; },
  get isStaging() { return environmentConfig.getConfig().isStaging; },
  get isProduction() { return environmentConfig.getConfig().isProduction; },
  
  // Feature flags
  isFeatureEnabled: (feature: keyof EnvironmentConfig['features']) => environmentConfig.isFeatureEnabled(feature),
  
  // Configuration getters
  getDatabaseConfig: () => environmentConfig.getDatabaseConfig(),
  getCacheConfig: () => environmentConfig.getCacheConfig(),
  getSecurityConfig: () => environmentConfig.getSecurityConfig(),
  getMonitoringConfig: () => environmentConfig.getMonitoringConfig(),
  getPrivacyConfig: () => environmentConfig.getPrivacyConfig(),
  
  // Validation
  validateRuntime: () => environmentConfig.validateRuntimeConfig(),
  validateDeployment: () => environmentConfig.getDeploymentValidation(),
};

export default environmentConfig;