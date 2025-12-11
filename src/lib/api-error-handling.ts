/**
 * API Error Handling Middleware and Utilities
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppException, ErrorType, ErrorLogger, createErrorResponse, getErrorContext } from './error-handling';

// Request ID generator
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware for API error handling
export function withErrorHandling<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<R>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { windowMs: number; max: number };
    timeoutMs?: number;
    enableCircuitBreaker?: boolean;
    circuitBreakerName?: string;
  } = {}
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Add request ID to headers for tracking
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-request-id', requestId);
    
    try {
      // Apply timeout if specified
      const timeoutPromise = options.timeoutMs 
        ? new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(AppException.timeoutError(`Request timeout after ${options.timeoutMs}ms`));
            }, options.timeoutMs);
          })
        : null;

      // Execute handler with timeout
      const result = await Promise.race([
        handler(req, ...args),
        ...(timeoutPromise ? [timeoutPromise] : [])
      ]);

      // Log successful request metrics
      const duration = Date.now() - startTime;
      console.log(`[API] ${req.method} ${req.url} - ${duration}ms - ${requestId}`);

      return result as NextResponse;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error with context
      const errorContext = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        duration,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers.entries())
      };

      // Handle different error types
      let appException: AppException;

      if (error instanceof AppException) {
        appException = error;
      } else if (error instanceof Error) {
        // Convert unknown errors to AppException
        appException = AppException.serverError(error.message, errorContext);
      } else {
        appException = AppException.serverError('Unknown error occurred', errorContext);
      }

      // Log error
      ErrorLogger.log(appException, errorContext);

      // Create error response
      const errorResponse = createErrorResponse(appException, requestId);
      
      // Add error headers for debugging
      const response = NextResponse.json(errorResponse, { 
        status: appException.statusCode 
      });
      
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-error-type', appException.type);
      response.headers.set('x-error-id', appException.id);

      // Add rate limit headers if applicable
      if (appException.type === ErrorType.RATE_LIMIT) {
        response.headers.set('retry-after', '60'); // 1 minute
      }

      return response;
    }
  };
}

// Circuit breaker decorator for external service calls
export function withCircuitBreaker<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  serviceName: string,
  options: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    timeoutMs?: number;
  } = {}
) {
  const circuitBreaker = ErrorLogger.getCircuitBreaker(serviceName);
  
  return async (...args: T): Promise<R> => {
    return circuitBreaker.execute(() => {
      const timeoutPromise = options.timeoutMs 
        ? new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(AppException.timeoutError(`Circuit breaker timeout for ${serviceName}`));
            }, options.timeoutMs);
          })
        : null;

      return timeoutPromise ? Promise.race([operation(...args), timeoutPromise]) : operation(...args);
    });
  };
}

// Rate limiting utility
export class RateLimitManager {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(
    identifier: string,
    options: { windowMs: number; max: number }
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / options.windowMs)}`;
    
    let requestData = this.requests.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + options.windowMs };
      this.requests.set(key, requestData);
    }

    requestData.count++;
    
    const allowed = requestData.count <= options.max;
    const remaining = Math.max(0, options.max - requestData.count);
    
    return {
      allowed,
      remaining,
      resetTime: requestData.resetTime
    };
  }

  static getRemainingRequests(
    identifier: string,
    windowMs: number
  ): number {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const requestData = this.requests.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      return 0;
    }
    
    return requestData.count;
  }
}

// API Response Helpers
export function createSuccessResponse<T>(
  data: T,
  options: {
    statusCode?: number;
    message?: string;
    meta?: Record<string, any>;
    cacheControl?: string;
    corsHeaders?: boolean;
  } = {}
): NextResponse {
  const {
    statusCode = 200,
    message,
    meta,
    cacheControl,
    corsHeaders = false
  } = options;

  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
    ...(meta && { meta })
  };

  const nextResponse = NextResponse.json(response, { status: statusCode });

  if (cacheControl) {
    nextResponse.headers.set('cache-control', cacheControl);
  }

  if (corsHeaders) {
    nextResponse.headers.set('access-control-allow-origin', '*');
    nextResponse.headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
    nextResponse.headers.set('access-control-allow-headers', 'Content-Type, Authorization');
  }

  return nextResponse;
}

export function createPaginatedResponse<T>(
  data: T[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    cacheControl?: string;
  } = {}
): NextResponse {
  const { page = 1, limit = 10, total = data.length, hasMore, cacheControl } = options;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  
  const response = {
    success: true,
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: hasMore !== undefined ? hasMore : endIndex < total,
      startIndex,
      endIndex
    },
    timestamp: new Date().toISOString()
  };

  const nextResponse = NextResponse.json(response);
  
  if (cacheControl) {
    nextResponse.headers.set('cache-control', cacheControl);
  }

  return nextResponse;
}

// Validation Helpers
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw AppException.validation(`Missing required fields: ${missingFields.join(', ')}`, {
      missingFields,
      providedFields: Object.keys(data)
    });
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw AppException.validation('Invalid email format');
  }
}

export function validateId(id: string | number): void {
  if (!id || (typeof id === 'string' && !id.trim())) {
    throw AppException.validation('ID is required');
  }
}

// Database Error Handlers
export function handleDatabaseError(error: any, operation: string): never {
  console.error(`Database error during ${operation}:`, error);
  
  // Handle specific database errors
  if (error.code === '23505') { // Unique constraint violation
    throw AppException.validation('Resource already exists');
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    throw AppException.validation('Referenced resource does not exist');
  }
  
  if (error.code === '23502') { // Not null constraint violation
    throw AppException.validation('Required field is missing');
  }
  
  if (error.code === '08006') { // Connection failure
    throw AppException.serverError('Database connection failed');
  }
  
  // Default database error
  throw AppException.serverError(`Database error during ${operation}`, {
    operation,
    errorCode: error.code,
    errorDetail: error.detail
  });
}

// External API Error Handlers
export async function handleExternalApiError(
  response: Response,
  serviceName: string
): Promise<never> {
  let errorMessage = `External API error from ${serviceName}`;
  let errorData: any = null;
  
  try {
    errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch {
    // If we can't parse JSON, use status text
    errorMessage = `${serviceName}: ${response.status} ${response.statusText}`;
  }
  
  const statusCode = response.status;
  
  // Map HTTP status codes to our error types
  let errorType: ErrorType;
  
  if (statusCode === 401) {
    errorType = ErrorType.AUTHENTICATION;
  } else if (statusCode === 403) {
    errorType = ErrorType.AUTHORIZATION;
  } else if (statusCode === 404) {
    errorType = ErrorType.NOT_FOUND;
  } else if (statusCode === 429) {
    errorType = ErrorType.RATE_LIMIT;
  } else if (statusCode >= 500) {
    errorType = ErrorType.EXTERNAL_SERVICE;
  } else {
    errorType = ErrorType.CLIENT_ERROR;
  }
  
  throw AppException.create({
    type: errorType,
    message: errorMessage,
    statusCode: statusCode === 0 ? 502 : statusCode,
    context: {
      serviceName,
      originalStatus: response.status,
      originalStatusText: response.statusText,
      responseData: errorData
    },
    recoverable: statusCode >= 500 || statusCode === 429,
    retryable: statusCode >= 500 || statusCode === 429
  });
}

// Health Check Error Handler
export function createHealthCheckResponse(
  checks: Record<string, { status: 'healthy' | 'degraded' | 'unhealthy'; message?: string; responseTime?: number }>
): NextResponse {
  const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
    ? 'healthy' 
    : Object.values(checks).some(check => check.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  };

  return NextResponse.json(response, { status: statusCode });
}

// CORS Preflight Handler
export function handleCorsPreflight(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('access-control-allow-origin', '*');
  response.headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('access-control-allow-headers', 'Content-Type, Authorization');
  response.headers.set('access-control-max-age', '86400');
  return response;
}