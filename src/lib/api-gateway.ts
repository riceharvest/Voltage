/**
 * Enhanced API Gateway and Management System
 * 
 * Provides intelligent routing, rate limiting, versioning, and performance monitoring
 * for the global soda platform API infrastructure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// API Gateway Types
export interface GatewayConfig {
  version: string;
  rateLimit: RateLimitConfig;
  security: SecurityConfig;
  routing: RoutingConfig;
  monitoring: MonitoringConfig;
  cors: CORSConfig;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest, retryAfter: number) => void;
}

export interface SecurityConfig {
  requireAuth: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  apiKeyRequired: boolean;
  rateLimitEnabled: boolean;
  requestValidation: boolean;
}

export interface RoutingConfig {
  services: Record<string, string>;
  loadBalancing: 'round-robin' | 'least-connections' | 'weighted';
  healthChecks: boolean;
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsEndpoint: string;
  realTimeMetrics: boolean;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  webhookUrl?: string;
  emailAlerts: boolean;
  slackIntegration: boolean;
  thresholds: Record<string, number>;
}

export interface CORSConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  optionsSuccessStatus: number;
}

// Rate Limiting Implementation
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanup();
    setInterval(() => this.cleanup(), 60000).unref();
  }

  isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.config.maxRequests) {
      const resetTime = Math.min(...validRequests) + this.config.windowMs;
      return { allowed: false, remaining: 0, resetTime };
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - validRequests.length,
      resetTime: now + this.config.windowMs
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs * 2;
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// API Analytics and Monitoring
export class APIAnalytics {
  private metrics: Map<string, MetricCollector> = new Map();
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const metricTypes = [
      'request_count',
      'response_time',
      'error_rate',
      'throughput',
      'active_connections'
    ];

    metricTypes.forEach(type => {
      this.metrics.set(type, new MetricCollector(type, this.config));
    });
  }

  recordRequest(endpoint: string, method: string, statusCode: number, duration: number, userId?: string): void {
    const timestamp = Date.now();
    
    // Record request count
    this.metrics.get('request_count')?.record({
      endpoint,
      method,
      statusCode,
      timestamp,
      userId
    });

    // Record response time
    this.metrics.get('response_time')?.record({
      endpoint,
      method,
      duration,
      timestamp
    });

    // Record error rate
    if (statusCode >= 400) {
      this.metrics.get('error_rate')?.record({
        endpoint,
        method,
        statusCode,
        timestamp
      });
    }

    // Record throughput
    this.metrics.get('throughput')?.record({
      endpoint,
      method,
      timestamp
    });
  }

  getMetrics(type: string, timeRange?: { start: number; end: number }) {
    const collector = this.metrics.get(type);
    return collector?.getMetrics(timeRange);
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [type, collector] of this.metrics.entries()) {
      result[type] = collector.getMetrics();
    }
    return result;
  }

  // Real-time performance monitoring
  getPerformanceReport(): PerformanceReport {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    return {
      requestCount: this.metrics.get('request_count')?.getMetrics({ start: oneHourAgo, end: now }) || 0,
      averageResponseTime: this.calculateAverageResponseTime(oneHourAgo, now),
      errorRate: this.calculateErrorRate(oneHourAgo, now),
      throughput: this.calculateThroughput(oneHourAgo, now),
      uptime: this.calculateUptime(),
      recommendations: this.generateRecommendations()
    };
  }

  private calculateAverageResponseTime(start: number, end: number): number {
    const metrics = this.metrics.get('response_time')?.getMetrics({ start, end }) || [];
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  private calculateErrorRate(start: number, end: number): number {
    const errorMetrics = this.metrics.get('error_rate')?.getMetrics({ start, end }) || [];
    const totalRequests = this.metrics.get('request_count')?.getMetrics({ start, end }) || [];
    
    return totalRequests.length > 0 ? (errorMetrics.length / totalRequests.length) * 100 : 0;
  }

  private calculateThroughput(start: number, end: number): number {
    const requests = this.metrics.get('request_count')?.getMetrics({ start, end }) || [];
    const duration = (end - start) / 1000; // seconds
    return duration > 0 ? requests.length / duration : 0;
  }

  private calculateUptime(): number {
    // Simplified uptime calculation - in production, this would be more sophisticated
    return 99.9; // Placeholder
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgResponseTime = this.calculateAverageResponseTime(Date.now() - 3600000, Date.now());
    const errorRate = this.calculateErrorRate(Date.now() - 3600000, Date.now());

    if (avgResponseTime > 200) {
      recommendations.push('Consider implementing response caching to reduce response times');
    }
    
    if (errorRate > 5) {
      recommendations.push('High error rate detected - review error logs and improve error handling');
    }

    return recommendations;
  }
}

// Metric Collector for tracking specific metrics
class MetricCollector {
  private data: any[] = [];
  private type: string;
  private config: MonitoringConfig;

  constructor(type: string, config: MonitoringConfig) {
    this.type = type;
    this.config = config;
  }

  record(data: any): void {
    if (this.config.enabled) {
      this.data.push(data);
      // Keep only last 10000 records to prevent memory issues
      if (this.data.length > 10000) {
        this.data = this.data.slice(-10000);
      }
    }
  }

  getMetrics(timeRange?: { start: number; end: number }) {
    if (!timeRange) {
      return this.data;
    }
    
    return this.data.filter(item => 
      item.timestamp >= timeRange.start && item.timestamp <= timeRange.end
    );
  }
}

export interface PerformanceReport {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
  recommendations: string[];
}

// API Gateway Middleware
export function createAPIGateway(config: GatewayConfig) {
  const rateLimiter = new RateLimiter(config.rateLimit);
  const analytics = new APIAnalytics(config.monitoring);

  return async function gateway(
    handler: (req: NextRequest) => Promise<NextResponse>,
    req: NextRequest
  ): Promise<NextResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    // Add request ID to headers for tracing
    req.headers.set('x-request-id', requestId);
    
    try {
      // Rate limiting check
      if (config.security.rateLimitEnabled) {
        const clientKey = config.rateLimit.keyGenerator?.(req) || req.ip || 'unknown';
        const rateLimitResult = rateLimiter.isAllowed(clientKey);
        
        if (!rateLimitResult.allowed) {
          analytics.recordRequest(
            req.nextUrl.pathname,
            req.method,
            429,
            Date.now() - startTime
          );

          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Too many requests',
              requestId,
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            },
            {
              status: 429,
              headers: {
                'x-ratelimit-limit': config.rateLimit.maxRequests.toString(),
                'x-ratelimit-remaining': rateLimitResult.remaining.toString(),
                'x-ratelimit-reset': rateLimitResult.resetTime.toString(),
                'x-request-id': requestId
              }
            }
          );
        }
      }

      // Security headers
      const response = await handler(req);
      
      // Add security and monitoring headers
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-api-version', config.version);
      response.headers.set('x-response-time', (Date.now() - startTime).toString());
      
      // Record analytics
      analytics.recordRequest(
        req.nextUrl.pathname,
        req.method,
        response.status,
        Date.now() - startTime
      );

      return response;
    } catch (error) {
      // Record error analytics
      analytics.recordRequest(
        req.nextUrl.pathname,
        req.method,
        500,
        Date.now() - startTime
      );

      console.error('API Gateway Error:', error);
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
          requestId
        },
        {
          status: 500,
          headers: {
            'x-request-id': requestId
          }
        }
      );
    }
  };
}

// Request/Response Transformation
export class RequestTransformer {
  static transformRequest(req: NextRequest): NextRequest {
    // Add request timestamp
    req.headers.set('x-request-timestamp', Date.now().toString());
    
    // Normalize headers
    const normalizedHeaders = new Headers();
    for (const [key, value] of req.headers.entries()) {
      normalizedHeaders.set(key.toLowerCase(), value);
    }
    
    return new NextRequest(req.url, {
      method: req.method,
      headers: normalizedHeaders,
      body: req.body,
      cache: req.cache,
      credentials: req.credentials,
      integrity: req.integrity,
      keepalive: req.keepalive,
      mode: req.mode,
      redirect: req.redirect,
      referrer: req.referrer,
      referrerPolicy: req.referrerPolicy,
    });
  }

  static transformResponse(response: NextResponse): NextResponse {
    // Add response headers for caching and performance
    response.headers.set('x-cache-status', 'MISS'); // Can be set to HIT/MISS by cache layer
    response.headers.set('x-powered-by', 'Voltage-Soda-API-Gateway');
    
    return response;
  }
}

// API Version Manager
export class APIVersionManager {
  private versions: Map<string, VersionConfig> = new Map();
  
  registerVersion(version: string, config: VersionConfig): void {
    this.versions.set(version, config);
  }

  getVersion(req: NextRequest): VersionConfig | null {
    // Check Accept header for version
    const acceptHeader = req.headers.get('accept');
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.voltage-soda\.v(\d+)\+json/);
      if (versionMatch) {
        const version = `v${versionMatch[1]}`;
        return this.versions.get(version) || null;
      }
    }

    // Check URL path for version
    const pathMatch = req.nextUrl.pathname.match(/^\/api\/v(\d+)\//);
    if (pathMatch) {
      const version = `v${pathMatch[1]}`;
      return this.versions.get(version) || null;
    }

    // Return latest version
    return this.versions.get('v1') || null;
  }

  isBackwardCompatible(newVersion: string, oldVersion: string): boolean {
    const newConfig = this.versions.get(newVersion);
    const oldConfig = this.versions.get(oldVersion);
    
    if (!newConfig || !oldConfig) return false;
    
    // Simplified backward compatibility check
    return newConfig.supportedFeatures.every(feature => 
      oldConfig.supportedFeatures.includes(feature)
    );
  }
}

export interface VersionConfig {
  version: string;
  supportedFeatures: string[];
  deprecationDate?: Date;
  sunsetDate?: Date;
}

// Default gateway configuration
export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  version: '2.0',
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    keyGenerator: (req: NextRequest) => {
      return req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
    }
  },
  security: {
    requireAuth: false,
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    apiKeyRequired: false,
    rateLimitEnabled: true,
    requestValidation: true
  },
  routing: {
    services: {
      'flavors': '/api/flavors',
      'ingredients': '/api/ingredients',
      'amazon': '/api/amazon',
      'suppliers': '/api/suppliers'
    },
    loadBalancing: 'round-robin',
    healthChecks: true,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 10000
    }
  },
  monitoring: {
    enabled: true,
    metricsEndpoint: '/api/metrics',
    realTimeMetrics: true,
    alerting: {
      emailAlerts: true,
      slackIntegration: false,
      thresholds: {
        responseTime: 200,
        errorRate: 5,
        throughput: 100
      }
    }
  },
  cors: {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200
  }
};