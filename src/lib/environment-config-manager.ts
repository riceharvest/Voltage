/**
 * Environment-Specific Configuration Management
 * 
 * Provides comprehensive configuration management for development, staging,
 * and production environments with secrets handling and validation
 */

import fs from 'fs';
import path from 'path';

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production';
  description: string;
  baseUrl: string;
  apiUrl: string;
  cdnUrl?: string;
  features: Record<string, any>;
  database: DatabaseConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  thirdPartyServices: ThirdPartyServiceConfig[];
  environmentVariables: Record<string, string>;
  secrets: string[]; // References to secret management system
  constraints: ConfigConstraint[];
  dependencies: string[]; // Other environment configs this depends on
  lastValidated: string;
  validatedBy: string;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  passwordRef: string; // Reference to secret management
  ssl: boolean;
  connectionPool: {
    min: number;
    max: number;
    idleTimeout: number;
  };
  migrations: {
    enabled: boolean;
    path: string;
    autoRun: boolean;
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retention: number; // days
  };
}

export interface CacheConfig {
  type: 'redis' | 'memcached' | 'memory';
  host: string;
  port: number;
  passwordRef?: string;
  db: number;
  ttl: number; // seconds
  compression: boolean;
  cluster?: {
    nodes: { host: string; port: number }[];
    options: Record<string, any>;
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  outputs: {
    type: 'console' | 'file' | 'database' | 'external';
    config: Record<string, any>;
  }[];
  retention: {
    enabled: boolean;
    days: number;
    maxSize: string; // e.g., '100MB', '1GB'
  };
  sampling: {
    enabled: boolean;
    rate: number; // 0-1
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  apm: {
    enabled: boolean;
    service: 'sentry' | 'datadog' | 'newrelic' | 'custom';
    config: Record<string, any>;
  };
  metrics: {
    enabled: boolean;
    collection: 'prometheus' | 'statsd' | 'cloudwatch';
    interval: number; // seconds
    retention: number; // days
  };
  alerts: {
    enabled: boolean;
    channels: {
      type: 'email' | 'slack' | 'webhook' | 'pagerduty';
      config: Record<string, any>;
      thresholds: Record<string, number>;
    }[];
  };
  healthChecks: {
    enabled: boolean;
    endpoints: string[];
    interval: number; // seconds
    timeout: number; // seconds
  };
}

export interface SecurityConfig {
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    credentials: boolean;
  };
  csrf: {
    enabled: boolean;
    secretRef: string;
    expiration: number; // hours
  };
  rateLimiting: {
    enabled: boolean;
    windowMs: number; // milliseconds
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  headers: Record<string, string>;
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    algorithm: string;
    keyRef: string;
  };
}

export interface PerformanceConfig {
  optimization: {
    compression: boolean;
    minification: boolean;
    bundling: boolean;
    caching: boolean;
  };
  scaling: {
    autoScaling: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
    targetMemory: number;
  };
  cdn: {
    enabled: boolean;
    provider: 'cloudflare' | 'aws-cloudfront' | 'azure-cdn' | 'custom';
    config: Record<string, any>;
  };
  database: {
    readReplicas: number;
    connectionPooling: boolean;
    queryOptimization: boolean;
  };
}

export interface ThirdPartyServiceConfig {
  name: string;
  type: 'api' | 'library' | 'service';
  enabled: boolean;
  config: Record<string, any>;
  secrets: string[]; // References to secrets
  healthCheck?: {
    endpoint: string;
    timeout: number;
    expectedStatus: number;
  };
  fallback?: {
    enabled: boolean;
    strategy: 'circuit-breaker' | 'timeout' | 'retry';
    config: Record<string, any>;
  };
}

export interface ConfigConstraint {
  type: 'required' | 'forbidden' | 'pattern' | 'range' | 'dependency';
  key: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
  suggestions: string[];
  score: number; // 0-100
}

export interface ConfigValidationError {
  key: string;
  type: string;
  message: string;
  severity: 'error' | 'warning';
  path: string;
}

export interface ConfigValidationWarning {
  key: string;
  message: string;
  suggestion?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ConfigDiff {
  environment: string;
  from: string;
  to: string;
  changes: ConfigChange[];
  breaking: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  migrationRequired: boolean;
}

export interface ConfigChange {
  key: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
  impact: 'none' | 'minor' | 'major' | 'breaking';
  description: string;
}

export class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private configs: Map<string, EnvironmentConfig> = new Map();
  private validationHistory: Map<string, ConfigValidationResult[]> = new Map();
  private readonly configsDir = path.join(process.cwd(), 'environments');
  private readonly secretsDir = path.join(process.cwd(), 'secrets');
  private readonly currentEnvFile = path.join(process.cwd(), '.env.current');

  private constructor() {
    this.initializeDirectories();
    this.loadConfigurations();
  }

  static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  private initializeDirectories(): void {
    if (!fs.existsSync(this.configsDir)) {
      fs.mkdirSync(this.configsDir, { recursive: true });
    }

    if (!fs.existsSync(this.secretsDir)) {
      fs.mkdirSync(this.secretsDir, { recursive: true });
    }

    // Create default environment configurations
    this.createDefaultConfigurations();
  }

  private createDefaultConfigurations(): void {
    const defaultConfigs = [
      this.createDevelopmentConfig(),
      this.createStagingConfig(),
      this.createProductionConfig()
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.name, config);
      this.saveConfiguration(config);
    });
  }

  private createDevelopmentConfig(): EnvironmentConfig {
    return {
      name: 'development',
      type: 'development',
      description: 'Local development environment',
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3000/api',
      features: {
        debug: true,
        hotReload: true,
        sourceMaps: true,
        detailedLogging: true,
        featureFlags: {
          'global-soda-platform': { enabled: true, rolloutPercentage: 100 },
          'amazon-regional-integration': { enabled: false, rolloutPercentage: 0 }
        }
      },
      database: {
        type: 'sqlite',
        host: 'localhost',
        port: 3306,
        database: 'energy_drink_dev',
        username: 'dev_user',
        passwordRef: 'dev_db_password',
        ssl: false,
        connectionPool: { min: 1, max: 5, idleTimeout: 300000 },
        migrations: { enabled: true, path: './migrations', autoRun: true },
        backup: { enabled: false, schedule: '', retention: 0 }
      },
      cache: {
        type: 'memory',
        host: 'localhost',
        port: 6379,
        db: 0,
        ttl: 300,
        compression: false
      },
      logging: {
        level: 'debug',
        format: 'text',
        outputs: [{ type: 'console', config: {} }],
        retention: { enabled: false, days: 0, maxSize: '0' },
        sampling: { enabled: false, rate: 1.0 }
      },
      monitoring: {
        enabled: false,
        apm: { enabled: false, service: 'sentry', config: {} },
        metrics: { enabled: false, collection: 'prometheus', interval: 60, retention: 7 },
        alerts: { enabled: false, channels: [] },
        healthChecks: { enabled: true, endpoints: ['/api/health'], interval: 30, timeout: 5 }
      },
      security: {
        cors: {
          enabled: true,
          origins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          credentials: true
        },
        csrf: { enabled: false, secretRef: 'csrf_secret', expiration: 24 },
        rateLimiting: { enabled: false, windowMs: 900000, maxRequests: 100, skipSuccessfulRequests: false },
        headers: {},
        encryption: { atRest: false, inTransit: false, algorithm: 'aes-256', keyRef: 'encryption_key' }
      },
      performance: {
        optimization: { compression: false, minification: false, bundling: false, caching: false },
        scaling: { autoScaling: false, minInstances: 1, maxInstances: 1, targetCPU: 80, targetMemory: 80 },
        cdn: { enabled: false, provider: 'custom', config: {} },
        database: { readReplicas: 0, connectionPooling: false, queryOptimization: false }
      },
      thirdPartyServices: [],
      environmentVariables: {
        NODE_ENV: 'development',
        DEBUG: 'true',
        LOG_LEVEL: 'debug'
      },
      secrets: ['dev_db_password', 'csrf_secret', 'encryption_key'],
      constraints: [],
      dependencies: [],
      lastValidated: new Date().toISOString(),
      validatedBy: 'system'
    };
  }

  private createStagingConfig(): EnvironmentConfig {
    return {
      name: 'staging',
      type: 'staging',
      description: 'Staging environment for testing',
      baseUrl: 'https://staging.energy-drink-app.com',
      apiUrl: 'https://staging.energy-drink-app.com/api',
      cdnUrl: 'https://staging-cdn.energy-drink-app.com',
      features: {
        debug: false,
        hotReload: false,
        sourceMaps: true,
        detailedLogging: true,
        featureFlags: {
          'global-soda-platform': { enabled: true, rolloutPercentage: 50 },
          'amazon-regional-integration': { enabled: true, rolloutPercentage: 25 }
        }
      },
      database: {
        type: 'postgresql',
        host: process.env.STAGING_DB_HOST || 'staging-db.internal',
        port: 5432,
        database: 'energy_drink_staging',
        username: process.env.STAGING_DB_USER || 'staging_user',
        passwordRef: 'staging_db_password',
        ssl: true,
        connectionPool: { min: 2, max: 10, idleTimeout: 300000 },
        migrations: { enabled: true, path: './migrations', autoRun: true },
        backup: { enabled: true, schedule: '0 2 * * *', retention: 7 }
      },
      cache: {
        type: 'redis',
        host: process.env.STAGING_REDIS_HOST || 'staging-redis.internal',
        port: 6379,
        passwordRef: 'staging_redis_password',
        db: 0,
        ttl: 600,
        compression: true
      },
      logging: {
        level: 'info',
        format: 'json',
        outputs: [
          { type: 'file', config: { path: '/var/log/app.log' } },
          { type: 'external', config: { endpoint: 'https://staging-logs.energy-drink-app.com' } }
        ],
        retention: { enabled: true, days: 30, maxSize: '1GB' },
        sampling: { enabled: true, rate: 0.1 }
      },
      monitoring: {
        enabled: true,
        apm: { enabled: true, service: 'sentry', config: { dsn: process.env.SENTRY_DSN } },
        metrics: { enabled: true, collection: 'prometheus', interval: 60, retention: 30 },
        alerts: {
          enabled: true,
          channels: [
            {
              type: 'email',
              config: { recipients: ['devops@energy-drink-app.com'] },
              thresholds: { errorRate: 5, responseTime: 2000 }
            }
          ]
        },
        healthChecks: { enabled: true, endpoints: ['/api/health', '/api/ready'], interval: 30, timeout: 10 }
      },
      security: {
        cors: {
          enabled: true,
          origins: ['https://staging.energy-drink-app.com'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          credentials: true
        },
        csrf: { enabled: true, secretRef: 'csrf_secret', expiration: 24 },
        rateLimiting: { enabled: true, windowMs: 900000, maxRequests: 1000, skipSuccessfulRequests: false },
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        encryption: { atRest: true, inTransit: true, algorithm: 'aes-256', keyRef: 'encryption_key' }
      },
      performance: {
        optimization: { compression: true, minification: true, bundling: true, caching: true },
        scaling: { autoScaling: true, minInstances: 2, maxInstances: 5, targetCPU: 70, targetMemory: 80 },
        cdn: { enabled: true, provider: 'cloudflare', config: { zoneId: process.env.CLOUDFLARE_ZONE_ID } },
        database: { readReplicas: 1, connectionPooling: true, queryOptimization: true }
      },
      thirdPartyServices: [
        {
          name: 'amazon-affiliate',
          type: 'api',
          enabled: true,
          config: { region: 'us-east-1', associateTag: 'staging' },
          secrets: ['amazon_access_key', 'amazon_secret_key'],
          healthCheck: { endpoint: '/api/health', timeout: 5, expectedStatus: 200 }
        }
      ],
      environmentVariables: {
        NODE_ENV: 'staging',
        DEBUG: 'false',
        LOG_LEVEL: 'info'
      },
      secrets: ['staging_db_password', 'staging_redis_password', 'csrf_secret', 'encryption_key', 'amazon_access_key', 'amazon_secret_key'],
      constraints: [
        { type: 'required', key: 'NODE_ENV', message: 'NODE_ENV must be set', severity: 'error' },
        { type: 'pattern', key: 'baseUrl', value: /^https:\/\/.+/, message: 'Base URL must be HTTPS in staging', severity: 'error' }
      ],
      dependencies: [],
      lastValidated: new Date().toISOString(),
      validatedBy: 'system'
    };
  }

  private createProductionConfig(): EnvironmentConfig {
    return {
      name: 'production',
      type: 'production',
      description: 'Production environment',
      baseUrl: 'https://energy-drink-app.com',
      apiUrl: 'https://energy-drink-app.com/api',
      cdnUrl: 'https://cdn.energy-drink-app.com',
      features: {
        debug: false,
        hotReload: false,
        sourceMaps: false,
        detailedLogging: false,
        featureFlags: {
          'global-soda-platform': { enabled: true, rolloutPercentage: 100 },
          'amazon-regional-integration': { enabled: true, rolloutPercentage: 100 },
          'premade-syrup-marketplace': { enabled: true, rolloutPercentage: 75 }
        }
      },
      database: {
        type: 'postgresql',
        host: process.env.PRODUCTION_DB_HOST || 'prod-db.internal',
        port: 5432,
        database: 'energy_drink_prod',
        username: process.env.PRODUCTION_DB_USER || 'prod_user',
        passwordRef: 'prod_db_password',
        ssl: true,
        connectionPool: { min: 5, max: 25, idleTimeout: 300000 },
        migrations: { enabled: true, path: './migrations', autoRun: false },
        backup: { enabled: true, schedule: '0 1 * * *', retention: 90 }
      },
      cache: {
        type: 'redis',
        host: process.env.PRODUCTION_REDIS_HOST || 'prod-redis.internal',
        port: 6379,
        passwordRef: 'prod_redis_password',
        db: 0,
        ttl: 3600,
        compression: true,
        cluster: {
          nodes: [
            { host: 'prod-redis-1.internal', port: 6379 },
            { host: 'prod-redis-2.internal', port: 6379 },
            { host: 'prod-redis-3.internal', port: 6379 }
          ],
          options: { redisOptions: { password: 'prod_redis_password' } }
        }
      },
      logging: {
        level: 'warn',
        format: 'json',
        outputs: [
          { type: 'file', config: { path: '/var/log/app.log', maxSize: '100MB', maxFiles: 10 } },
          { type: 'external', config: { endpoint: 'https://logs.energy-drink-app.com' } }
        ],
        retention: { enabled: true, days: 90, maxSize: '10GB' },
        sampling: { enabled: true, rate: 0.01 }
      },
      monitoring: {
        enabled: true,
        apm: { enabled: true, service: 'sentry', config: { dsn: process.env.SENTRY_DSN } },
        metrics: { enabled: true, collection: 'prometheus', interval: 30, retention: 365 },
        alerts: {
          enabled: true,
          channels: [
            {
              type: 'email',
              config: { recipients: ['ops@energy-drink-app.com', 'devops@energy-drink-app.com'] },
              thresholds: { errorRate: 1, responseTime: 1000 }
            },
            {
              type: 'slack',
              config: { webhook: process.env.SLACK_WEBHOOK_URL },
              thresholds: { errorRate: 5, responseTime: 5000 }
            }
          ]
        },
        healthChecks: { enabled: true, endpoints: ['/api/health', '/api/ready'], interval: 15, timeout: 5 }
      },
      security: {
        cors: {
          enabled: true,
          origins: ['https://energy-drink-app.com'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          credentials: true
        },
        csrf: { enabled: true, secretRef: 'csrf_secret', expiration: 24 },
        rateLimiting: { enabled: true, windowMs: 900000, maxRequests: 10000, skipSuccessfulRequests: false },
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        },
        encryption: { atRest: true, inTransit: true, algorithm: 'aes-256', keyRef: 'encryption_key' }
      },
      performance: {
        optimization: { compression: true, minification: true, bundling: true, caching: true },
        scaling: { autoScaling: true, minInstances: 3, maxInstances: 20, targetCPU: 60, targetMemory: 70 },
        cdn: { enabled: true, provider: 'cloudflare', config: { zoneId: process.env.CLOUDFLARE_ZONE_ID } },
        database: { readReplicas: 3, connectionPooling: true, queryOptimization: true }
      },
      thirdPartyServices: [
        {
          name: 'amazon-affiliate',
          type: 'api',
          enabled: true,
          config: { region: 'us-east-1', associateTag: 'energydrinks-20' },
          secrets: ['amazon_access_key', 'amazon_secret_key'],
          healthCheck: { endpoint: '/api/health', timeout: 5, expectedStatus: 200 },
          fallback: { enabled: true, strategy: 'circuit-breaker', config: { failureThreshold: 5, timeout: 30000 } }
        }
      ],
      environmentVariables: {
        NODE_ENV: 'production',
        DEBUG: 'false',
        LOG_LEVEL: 'warn'
      },
      secrets: ['prod_db_password', 'prod_redis_password', 'csrf_secret', 'encryption_key', 'amazon_access_key', 'amazon_secret_key'],
      constraints: [
        { type: 'required', key: 'NODE_ENV', message: 'NODE_ENV must be set', severity: 'error' },
        { type: 'pattern', key: 'baseUrl', value: /^https:\/\/.+/, message: 'Base URL must be HTTPS in production', severity: 'error' },
        { type: 'required', key: 'SENTRY_DSN', message: 'SENTRY_DSN must be configured in production', severity: 'error' }
      ],
      dependencies: [],
      lastValidated: new Date().toISOString(),
      validatedBy: 'system'
    };
  }

  private loadConfigurations(): void {
    try {
      if (fs.existsSync(this.configsDir)) {
        const files = fs.readdirSync(this.configsDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const configPath = path.join(this.configsDir, file);
            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content) as EnvironmentConfig;
            this.configs.set(config.name, config);
          } catch (error) {
            console.error(`Failed to load configuration from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }

  private saveConfiguration(config: EnvironmentConfig): void {
    try {
      const configPath = path.join(this.configsDir, `${config.name}.json`);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(`Failed to save configuration for ${config.name}:`, error);
    }
  }

  // Configuration Management
  public getConfiguration(environment: string): EnvironmentConfig | undefined {
    return this.configs.get(environment);
  }

  public getAllConfigurations(): EnvironmentConfig[] {
    return Array.from(this.configs.values());
  }

  public createConfiguration(config: EnvironmentConfig): void {
    // Validate configuration
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configs.set(config.name, config);
    this.saveConfiguration(config);
  }

  public updateConfiguration(environment: string, updates: Partial<EnvironmentConfig>): void {
    const config = this.configs.get(environment);
    if (!config) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }

    const updatedConfig = { ...config, ...updates, lastValidated: new Date().toISOString() };
    
    // Validate updated configuration
    const validation = this.validateConfiguration(updatedConfig);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configs.set(environment, updatedConfig);
    this.saveConfiguration(updatedConfig);
  }

  public deleteConfiguration(environment: string): void {
    if (!this.configs.has(environment)) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }

    this.configs.delete(environment);
    
    const configPath = path.join(this.configsDir, `${environment}.json`);
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  // Configuration Validation
  public validateConfiguration(config: EnvironmentConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!config.name || config.name.trim() === '') {
      errors.push({
        key: 'name',
        type: 'required',
        message: 'Configuration name is required',
        severity: 'error',
        path: 'name'
      });
    }

    if (!config.baseUrl || !config.baseUrl.startsWith('http')) {
      errors.push({
        key: 'baseUrl',
        type: 'pattern',
        message: 'Base URL must be a valid HTTP/HTTPS URL',
        severity: 'error',
        path: 'baseUrl'
      });
    }

    // Constraint validation
    config.constraints.forEach(constraint => {
      const value = this.getNestedValue(config, constraint.key);
      
      switch (constraint.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push({
              key: constraint.key,
              type: 'required',
              message: constraint.message,
              severity: constraint.severity,
              path: constraint.key
            });
          }
          break;
          
        case 'forbidden':
          if (value !== undefined && value !== null) {
            errors.push({
              key: constraint.key,
              type: 'forbidden',
              message: constraint.message,
              severity: constraint.severity,
              path: constraint.key
            });
          }
          break;
          
        case 'pattern':
          if (value && constraint.value && !new RegExp(constraint.value).test(String(value))) {
            errors.push({
              key: constraint.key,
              type: 'pattern',
              message: constraint.message,
              severity: constraint.severity,
              path: constraint.key
            });
          }
          break;
      }
    });

    // Security validation
    if (config.type === 'production') {
      if (!config.security.encryption.atRest) {
        errors.push({
          key: 'security.encryption.atRest',
          type: 'required',
          message: 'Encryption at rest is required in production',
          severity: 'error',
          path: 'security.encryption.atRest'
        });
      }

      if (!config.security.encryption.inTransit) {
        errors.push({
          key: 'security.encryption.inTransit',
          type: 'required',
          message: 'Encryption in transit is required in production',
          severity: 'error',
          path: 'security.encryption.inTransit'
        });
      }

      if (!config.baseUrl.startsWith('https://')) {
        errors.push({
          key: 'baseUrl',
          type: 'pattern',
          message: 'Production environment must use HTTPS',
          severity: 'error',
          path: 'baseUrl'
        });
      }
    }

    // Performance validation
    if (config.performance.scaling.autoScaling && config.performance.scaling.minInstances >= config.performance.scaling.maxInstances) {
      warnings.push({
        key: 'performance.scaling',
        message: 'Auto-scaling min instances should be less than max instances',
        suggestion: 'Adjust min and max instance counts for effective auto-scaling',
        impact: 'medium'
      });
    }

    // Calculate score
    const maxErrors = 10;
    const maxWarnings = 5;
    let score = 100;
    
    score -= Math.min(errors.length * 10, maxErrors);
    score -= Math.min(warnings.length * 5, maxWarnings);

    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
      suggestions,
      score: Math.max(0, score)
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Configuration Comparison
  public compareConfigurations(fromEnv: string, toEnv: string): ConfigDiff {
    const from = this.configs.get(fromEnv);
    const to = this.configs.get(toEnv);

    if (!from || !to) {
      throw new Error(`One or both configurations not found: ${fromEnv}, ${toEnv}`);
    }

    const changes: ConfigChange[] = [];
    let breaking = false;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let migrationRequired = false;

    // Deep comparison logic would go here
    // For now, we'll implement a basic comparison

    // Check for breaking changes
    if (from.database.type !== to.database.type) {
      changes.push({
        key: 'database.type',
        type: 'modified',
        oldValue: from.database.type,
        newValue: to.database.type,
        impact: 'breaking',
        description: 'Database type change requires data migration'
      });
      breaking = true;
      riskLevel = 'high';
      migrationRequired = true;
    }

    return {
      environment: toEnv,
      from: fromEnv,
      to: toEnv,
      changes,
      breaking,
      riskLevel,
      migrationRequired
    };
  }

  // Environment Variable Management
  public getEnvironmentVariables(environment: string): Record<string, string> {
    const config = this.configs.get(environment);
    if (!config) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }

    const variables = { ...config.environmentVariables };
    
    // Add resolved secrets (in a real implementation, these would be fetched from a secret manager)
    config.secrets.forEach(secretRef => {
      const secretValue = process.env[secretRef.toUpperCase()] || `placeholder_${secretRef}`;
      variables[secretRef] = secretValue;
    });

    return variables;
  }

  public setCurrentEnvironment(environment: string): void {
    if (!this.configs.has(environment)) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }

    fs.writeFileSync(this.currentEnvFile, environment);
  }

  public getCurrentEnvironment(): string | null {
    try {
      if (fs.existsSync(this.currentEnvFile)) {
        return fs.readFileSync(this.currentEnvFile, 'utf8').trim();
      }
    } catch (error) {
      console.error('Failed to read current environment:', error);
    }
    return null;
  }

  // Validation History
  public getValidationHistory(environment: string): ConfigValidationResult[] {
    return this.validationHistory.get(environment) || [];
  }

  public recordValidation(environment: string, result: ConfigValidationResult): void {
    const history = this.validationHistory.get(environment) || [];
    history.push(result);
    
    // Keep only last 100 validations
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.validationHistory.set(environment, history);
  }

  // Export/Import
  public exportConfiguration(environment: string): string {
    const config = this.configs.get(environment);
    if (!config) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }

    return JSON.stringify({
      config,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  public importConfiguration(configJson: string): void {
    try {
      const data = JSON.parse(configJson);
      if (!data.config) {
        throw new Error('Invalid configuration format');
      }

      const config = data.config as EnvironmentConfig;
      this.createConfiguration(config);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Migration Helpers
  public validateMigrationReadiness(sourceEnv: string, targetEnv: string): {
    ready: boolean;
    issues: string[];
    recommendations: string[];
    migrationPlan?: {
      steps: string[];
      estimatedDuration: number;
      riskAssessment: string;
    };
  } {
    const source = this.configs.get(sourceEnv);
    const target = this.configs.get(targetEnv);

    if (!source || !target) {
      return {
        ready: false,
        issues: ['Source or target environment configuration not found'],
        recommendations: []
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate both configurations
    const sourceValidation = this.validateConfiguration(source);
    const targetValidation = this.validateConfiguration(target);

    if (!sourceValidation.valid) {
      issues.push(`Source environment validation failed: ${sourceValidation.errors.map(e => e.message).join(', ')}`);
    }

    if (!targetValidation.valid) {
      issues.push(`Target environment validation failed: ${targetValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Check for breaking changes
    const diff = this.compareConfigurations(sourceEnv, targetEnv);
    if (diff.breaking) {
      issues.push('Breaking changes detected between environments');
      recommendations.push('Review and plan data migration for breaking changes');
    }

    // Check dependencies
    target.dependencies.forEach(dep => {
      if (!this.configs.has(dep)) {
        issues.push(`Required dependency '${dep}' not found`);
      }
    });

    const ready = issues.length === 0;

    if (ready) {
      recommendations.push('Environment is ready for migration');
      if (diff.migrationRequired) {
        recommendations.push('Plan and execute data migration before switching traffic');
      }
    }

    return {
      ready,
      issues,
      recommendations,
      migrationPlan: ready ? {
        steps: [
          'Create backup of source environment',
          'Execute data migration if required',
          'Deploy configuration to target environment',
          'Run validation tests',
          'Switch traffic to target environment',
          'Monitor deployment success'
        ],
        estimatedDuration: 30, // minutes
        riskAssessment: diff.riskLevel
      } : undefined
    };
  }
}

// Export singleton instance
export const environmentConfigManager = EnvironmentConfigManager.getInstance();