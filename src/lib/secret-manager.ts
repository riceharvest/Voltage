/**
 * Centralized Secret Management System
 * Provides secure environment variable handling, validation, and secret rotation
 */

import { logger } from './logger';

// Secret types for better typing and validation
export type SecretType = 
  | 'api-key'
  | 'database-url'
  | 'encryption-key'
  | 'jwt-secret'
  | 'csrf-secret'
  | 'redis-url'
  | 'sentry-dsn'
  | 'analytics-id'
  | 'oauth-secret'
  | 'webhook-secret'
  | 'custom';

// Environment variable validation rules
export interface SecretValidationRule {
  type: SecretType;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
  sensitive?: boolean;
  description: string;
}

// Secret validation configuration
export const SECRET_VALIDATION_RULES: Record<string, SecretValidationRule> = {
  // Database secrets
  DATABASE_URL: {
    type: 'database-url',
    required: false, // Optional for development
    pattern: /^(postgresql|mysql|mongodb):\/\/.*/i,
    description: 'Database connection string'
  },
  REDIS_URL: {
    type: 'redis-url',
    required: false,
    pattern: /^redis:\/\/.*/i,
    description: 'Redis connection string'
  },

  // Authentication secrets
  NEXTAUTH_SECRET: {
    type: 'jwt-secret',
    required: true,
    minLength: 32,
    sensitive: true,
    description: 'NextAuth.js secret for JWT signing'
  },
  NEXTAUTH_URL: {
    type: 'custom',
    required: true,
    pattern: /^https?:\/\/.*/i,
    description: 'NextAuth.js URL'
  },

  // CSRF protection
  CSRF_SECRET: {
    type: 'csrf-secret',
    required: true,
    minLength: 16,
    sensitive: true,
    description: 'CSRF token secret'
  },

  // GDPR/Encryption
  GDPR_ENCRYPTION_KEY: {
    type: 'encryption-key',
    required: true,
    minLength: 32,
    sensitive: true,
    description: 'AES-256-GCM encryption key for GDPR data'
  },

  // Monitoring and analytics
  SENTRY_DSN: {
    type: 'sentry-dsn',
    required: false,
    pattern: /^https:\/\/.*@.*\.ingest\.sentry\.io\/\d+$/i,
    description: 'Sentry DSN for error monitoring'
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    type: 'sentry-dsn',
    required: false,
    pattern: /^https:\/\/.*@.*\.ingest\.sentry\.io\/\d+$/i,
    description: 'Public Sentry DSN for client-side error monitoring'
  },
  NEXT_PUBLIC_ANALYTICS_ID: {
    type: 'analytics-id',
    required: false,
    pattern: /^G-[A-Z0-9]+$/i,
    description: 'Google Analytics tracking ID'
  },

  // API configuration
  API_TIMEOUT: {
    type: 'custom',
    required: false,
    pattern: /^\d+$/,
    description: 'API request timeout in milliseconds'
  },
  
  // Feature flags
  ENABLE_DEBUG_MODE: {
    type: 'custom',
    required: false,
    allowedValues: ['true', 'false'],
    description: 'Enable debug mode logging'
  },

  // OAuth and external services (examples)
  GOOGLE_CLIENT_ID: {
    type: 'api-key',
    required: false,
    description: 'Google OAuth client ID'
  },
  GOOGLE_CLIENT_SECRET: {
    type: 'api-key',
    required: false,
    sensitive: true,
    description: 'Google OAuth client secret'
  },

  STRIPE_SECRET_KEY: {
    type: 'api-key',
    required: false,
    sensitive: true,
    pattern: /^sk_(live|test)_[a-zA-Z0-9]+$/i,
    description: 'Stripe secret key for payments'
  },
  STRIPE_PUBLISHABLE_KEY: {
    type: 'api-key',
    required: false,
    pattern: /^pk_(live|test)_[a-zA-Z0-9]+$/i,
    description: 'Stripe publishable key'
  },

  // Webhook secrets
  WEBHOOK_SECRET: {
    type: 'webhook-secret',
    required: false,
    sensitive: true,
    description: 'Secret for webhook signature verification'
  }
};

// Environment-specific required variables
export const REQUIRED_SECRETS_BY_ENVIRONMENT = {
  development: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'CSRF_SECRET',
    'GDPR_ENCRYPTION_KEY'
  ],
  staging: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'CSRF_SECRET',
    'GDPR_ENCRYPTION_KEY',
    'DATABASE_URL',
    'REDIS_URL'
  ],
  production: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'CSRF_SECRET',
    'GDPR_ENCRYPTION_KEY',
    'DATABASE_URL',
    'REDIS_URL',
    'SENTRY_DSN'
  ]
};

// Validation result interface
export interface SecretValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidFormat: string[];
}

/**
 * Secret Manager class for centralized secret management
 */
export class SecretManager {
  private static instance: SecretManager;
  private validatedSecrets: Map<string, string> = new Map();
  private validationCache: Map<string, boolean> = new Map();

  private constructor() {
    this.initializeSecretValidation();
  }

  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  /**
   * Initialize secret validation on startup
   */
  private async initializeSecretValidation(): Promise<void> {
    try {
      const nodeEnv = process.env.NODE_ENV || 'development';
      await this.validateEnvironment(nodeEnv as keyof typeof REQUIRED_SECRETS_BY_ENVIRONMENT);
    } catch (error) {
      logger.error('Failed to initialize secret validation:', error);
      // Don't throw here to allow development to continue with fallbacks
    }
  }

  /**
   * Get a validated secret value
   * Never logs or exposes secret values
   */
  public getSecret(name: string): string | undefined {
    const secretName = name.toUpperCase().trim();
    
    // Check if we've already validated this secret
    if (this.validationCache.has(secretName)) {
      const isValid = this.validationCache.get(secretName);
      if (isValid && this.validatedSecrets.has(secretName)) {
        return this.validatedSecrets.get(secretName);
      }
    }

    // Validate the secret
    const value = process.env[secretName];
    if (!value) {
      logger.warn(`Environment variable ${secretName} is not set`);
      return undefined;
    }

    const validationResult = this.validateSecret(secretName, value);
    if (validationResult.isValid) {
      this.validatedSecrets.set(secretName, value);
      this.validationCache.set(secretName, true);
      return value;
    } else {
      this.validationCache.set(secretName, false);
      logger.error(`Invalid secret ${secretName}:`, validationResult.errors);
      return undefined;
    }
  }

  /**
   * Get a required secret (throws error if not found or invalid)
   */
  public getRequiredSecret(name: string): string {
    const secretName = name.toUpperCase().trim();
    const value = this.getSecret(secretName);
    
    if (!value) {
      const rule = SECRET_VALIDATION_RULES[secretName];
      const description = rule?.description || 'Required environment variable';
      throw new Error(`Required secret ${secretName} is missing or invalid: ${description}`);
    }
    
    return value;
  }

  /**
   * Get all secrets for a specific category
   */
  public getSecretsByType(type: SecretType): Record<string, string> {
    const secrets: Record<string, string> = {};
    
    for (const [name, rule] of Object.entries(SECRET_VALIDATION_RULES)) {
      if (rule.type === type) {
        const value = this.getSecret(name);
        if (value) {
          secrets[name] = value;
        }
      }
    }
    
    return secrets;
  }

  /**
   * Validate a single secret
   */
  private validateSecret(name: string, value: string): SecretValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rule = SECRET_VALIDATION_RULES[name];
    if (!rule) {
      // Unknown secret - issue warning but don't fail
      warnings.push(`Unknown environment variable: ${name}`);
      return { isValid: true, errors, warnings, missingRequired: [], invalidFormat: [] };
    }

    // Check if value is empty
    if (!value || value.trim() === '') {
      if (rule.required) {
        errors.push(`${name} is required but empty`);
      }
      return { isValid: errors.length === 0, errors, warnings, missingRequired: errors, invalidFormat: [] };
    }

    // Validate pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${name} does not match expected pattern`);
      this.addInvalidFormat(name, errors);
    }

    // Validate length
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${name} must be at least ${rule.minLength} characters long`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${name} must be no more than ${rule.maxLength} characters long`);
    }

    // Validate allowed values
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(`${name} must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Check for obvious development defaults in production
    if (process.env.NODE_ENV === 'production' && rule.sensitive) {
      if (value.includes('fallback') || value.includes('change-in-production') || value.length < 16) {
        errors.push(`${name} appears to be a development default and is not suitable for production`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingRequired: [],
      invalidFormat: errors.some(e => e.includes('pattern')) ? [name] : []
    };
  }

  private addInvalidFormat(name: string, errors: string[]): void {
    // This is a helper to track invalid format errors
    // Implementation can be enhanced to track these separately
  }

  /**
   * Validate all environment variables for a specific environment
   */
  public async validateEnvironment(environment: keyof typeof REQUIRED_SECRETS_BY_ENVIRONMENT): Promise<SecretValidationResult> {
    const requiredVars = REQUIRED_SECRETS_BY_ENVIRONMENT[environment];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const missingRequired: string[] = [];
    const invalidFormat: string[] = [];

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        allErrors.push(`Required variable ${varName} is missing`);
        missingRequired.push(varName);
        continue;
      }

      const validation = this.validateSecret(varName, value);
      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);
      
      if (validation.invalidFormat.length > 0) {
        invalidFormat.push(...validation.invalidFormat);
      }
    }

    // Check all configured secrets
    for (const [varName, rule] of Object.entries(SECRET_VALIDATION_RULES)) {
      const value = process.env[varName];
      if (value) {
        const validation = this.validateSecret(varName, value);
        allErrors.push(...validation.errors);
        allWarnings.push(...validation.warnings);
        
        if (validation.invalidFormat.length > 0) {
          invalidFormat.push(...validation.invalidFormat);
        }
      }
    }

    const isValid = allErrors.length === 0;

    // Log validation results (without exposing secret values)
    if (!isValid) {
      logger.error(`Environment validation failed for ${environment}:`, {
        errors: allErrors.length,
        warnings: allWarnings.length,
        missingRequired,
        invalidFormat: invalidFormat.length
      });
    } else if (allWarnings.length > 0) {
      logger.warn(`Environment validation passed with warnings for ${environment}:`, {
        warnings: allWarnings.length
      });
    } else {
      logger.info(`Environment validation passed for ${environment}`);
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      missingRequired,
      invalidFormat
    };
  }

  /**
   * Check if secret rotation is needed
   */
  public shouldRotateSecret(name: string): boolean {
    const secretName = name.toUpperCase().trim();
    const rule = SECRET_VALIDATION_RULES[secretName];
    
    if (!rule || !rule.sensitive) {
      return false;
    }

    const value = this.getSecret(secretName);
    if (!value) {
      return false;
    }

    // Check for common indicators that a secret needs rotation
    const rotationIndicators = [
      value.includes('fallback'),
      value.includes('change-in-production'),
      value.includes('example'),
      value.includes('your-'),
      value.includes('replace-me'),
      value.length < 32 // For sensitive keys
    ];

    return rotationIndicators.some(indicator => indicator);
  }

  /**
   * Get all secrets that need rotation
   */
  public getSecretsNeedingRotation(): string[] {
    const secretsNeedingRotation: string[] = [];
    
    for (const [name, rule] of Object.entries(SECRET_VALIDATION_RULES)) {
      if (this.shouldRotateSecret(name)) {
        secretsNeedingRotation.push(name);
      }
    }
    
    return secretsNeedingRotation;
  }

  /**
   * Sanitize value for logging (mask sensitive data)
   */
  public static sanitizeForLogging(value: string, sensitive: boolean = false): string {
    if (!sensitive) {
      return value;
    }
    
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  /**
   * Clear validation cache (useful for testing)
   */
  public clearCache(): void {
    this.validatedSecrets.clear();
    this.validationCache.clear();
  }
}

// Export singleton instance
export const secretManager = SecretManager.getInstance();

// Utility functions for common use cases
export const secrets = {
  // Database
  getDatabaseUrl: () => secretManager.getSecret('DATABASE_URL'),
  getRedisUrl: () => secretManager.getSecret('REDIS_URL'),
  
  // Authentication
  getNextAuthSecret: () => secretManager.getRequiredSecret('NEXTAUTH_SECRET'),
  getNextAuthUrl: () => secretManager.getRequiredSecret('NEXTAUTH_URL'),
  getCsrfSecret: () => secretManager.getRequiredSecret('CSRF_SECRET'),
  
  // Encryption
  getGdprEncryptionKey: () => secretManager.getRequiredSecret('GDPR_ENCRYPTION_KEY'),
  
  // Monitoring
  getSentryDsn: () => secretManager.getSecret('SENTRY_DSN'),
  getPublicSentryDsn: () => secretManager.getSecret('NEXT_PUBLIC_SENTRY_DSN'),
  getAnalyticsId: () => secretManager.getSecret('NEXT_PUBLIC_ANALYTICS_ID'),
  
  // Configuration
  getApiTimeout: () => {
    const timeout = secretManager.getSecret('API_TIMEOUT');
    return timeout ? parseInt(timeout, 10) : 5000;
  },
  
  getCacheTtl: () => {
    const ttl = secretManager.getSecret('NEXT_PUBLIC_CACHE_TTL');
    return ttl ? parseInt(ttl, 10) : 0;
  },
  
  getLogLevel: () => secretManager.getSecret('LOG_LEVEL') || 'info',
  getClientLogLevel: () => secretManager.getSecret('NEXT_PUBLIC_LOG_LEVEL') || 'warn',
  
  // Feature flags
  isDebugModeEnabled: () => secretManager.getSecret('ENABLE_DEBUG_MODE') === 'true',
  isAnalyticsEnabled: () => secretManager.getSecret('NEXT_PUBLIC_ENABLE_ANALYTICS') === 'true',
  isErrorReportingEnabled: () => secretManager.getSecret('NEXT_PUBLIC_ENABLE_ERROR_REPORTING') === 'true',
  
  // External services
  getGoogleClientId: () => secretManager.getSecret('GOOGLE_CLIENT_ID'),
  getGoogleClientSecret: () => secretManager.getSecret('GOOGLE_CLIENT_SECRET'),
  getStripeSecretKey: () => secretManager.getSecret('STRIPE_SECRET_KEY'),
  getStripePublishableKey: () => secretManager.getSecret('STRIPE_PUBLISHABLE_KEY'),
  getWebhookSecret: () => secretManager.getSecret('WEBHOOK_SECRET')
};

export default secretManager;