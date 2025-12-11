/**
 * Comprehensive Error Handling Infrastructure
 * 
 * This module provides a sophisticated error handling system for the energy drink application,
 * including custom exception types, circuit breakers, retry logic, and comprehensive logging.
 * 
 * Key Features:
 * - Custom exception types with categorization and severity levels
 * - Circuit breaker pattern for external service resilience
 * - Retry logic with exponential backoff
 * - Comprehensive error logging and monitoring integration
 * - Context-aware error responses
 * - Recovery and retry mechanisms
 * 
 * @module error-handling
 * @author Energy Drink App Team
 * @since 2.0.0
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Application Error Interface
 * 
 * Represents a structured error with metadata for monitoring, logging,
 * and user-facing error responses.
 * 
 * @interface AppError
 */
export interface AppError {
  /** Unique identifier for error tracking */
  id: string;
  /** Error type/category for classification */
  type: ErrorType;
  /** Human-readable error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
  /** HTTP status code for API errors */
  statusCode?: number;
  /** Original cause/error that triggered this error */
  cause?: Error;
  /** Additional context information for debugging */
  context?: Record<string, any>;
  /** When the error occurred */
  timestamp: Date;
  /** Associated user ID for user-specific errors */
  userId?: string;
  /** Associated session ID for tracking */
  sessionId?: string;
  /** URL where error occurred */
  url?: string;
  /** User agent string for client context */
  userAgent?: string;
  /** Error severity level for prioritization */
  severity: ErrorSeverity;
  /** Whether the error condition can be recovered from */
  recoverable: boolean;
  /** Whether the operation can be retried */
  retryable: boolean;
}

/**
 * Error Type Enumeration
 * 
 * Categorizes different types of errors for proper handling and monitoring.
 * Each type has specific handling logic and retry policies.
 * 
 * @enum ErrorType
 */
export enum ErrorType {
  /** Network connectivity or timeout errors */
  NETWORK = 'network',
  /** Input validation or data format errors */
  VALIDATION = 'validation',
  /** Authentication failures (login, token issues) */
  AUTHENTICATION = 'authentication',
  /** Authorization failures (permission denied) */
  AUTHORIZATION = 'authorization',
  /** Resource not found errors */
  NOT_FOUND = 'not_found',
  /** Internal server errors */
  SERVER_ERROR = 'server_error',
  /** Client-side application errors */
  CLIENT_ERROR = 'client_error',
  /** Request timeout errors */
  TIMEOUT = 'timeout',
  /** Rate limiting errors */
  RATE_LIMIT = 'rate_limit',
  /** External dependency failures */
  DEPENDENCY = 'dependency',
  /** Configuration or setup errors */
  CONFIGURATION = 'configuration',
  /** Business logic validation errors */
  BUSINESS_LOGIC = 'business_logic',
  /** External service integration errors */
  EXTERNAL_SERVICE = 'external_service'
}

/**
 * Error Severity Levels
 * 
 * Defines the severity levels for prioritizing error handling
 * and determining appropriate response strategies.
 * 
 * @enum ErrorSeverity
 */
export enum ErrorSeverity {
  /** Low severity: informational or minor issues */
  LOW = 'low',
  /** Medium severity: should be monitored but not urgent */
  MEDIUM = 'medium',
  /** High severity: requires attention and monitoring */
  HIGH = 'high',
  /** Critical severity: requires immediate attention */
  CRITICAL = 'critical'
}

/**
 * Error Response Format
 * 
 * Standardized format for API error responses with consistent
 * structure for client-side error handling.
 * 
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details object */
  error: {
    /** Unique error identifier */
    id: string;
    /** Error type for categorization */
    type: ErrorType;
    /** Human-readable error message */
    message: string;
    /** Optional error code */
    code?: string;
    /** HTTP status code */
    statusCode: number;
    /** ISO timestamp when error occurred */
    timestamp: string;
    /** Request ID for tracking */
    requestId?: string;
    /** Whether the operation can be retried */
    retryable: boolean;
    /** Additional context information */
    context?: Record<string, any>;
  };
  /** Optional metadata for error response */
  meta?: {
    /** Link to error documentation */
    documentation?: string;
    /** Support contact information */
    supportContact?: string;
  };
}

/**
 * Circuit Breaker Implementation
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external services are experiencing issues. Automatically opens
 * the circuit after a threshold of failures and attempts periodic recovery.
 * 
 * @class CircuitBreaker
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker('user-service', 5, 60000);
 * 
 * try {
 *   const result = await breaker.execute(() => userService.getUser(id));
 * } catch (error) {
 *   if (breaker.getState() === 'open') {
 *     // Circuit is open, service is unavailable
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  /** Current number of consecutive failures */
  private failures = 0;
  /** Timestamp of the last failure */
  private lastFailureTime?: number;
  /** Current circuit state: closed, open, or half-open */
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  /** Number of failures needed to open the circuit */
  private readonly failureThreshold: number;
  /** Time to wait before attempting to close the circuit (milliseconds) */
  private readonly recoveryTimeout: number;
  /** Name identifier for this circuit breaker */
  private readonly name: string;

  /**
   * Creates a circuit breaker instance
   * @param name - Identifier for the circuit breaker
   * @param failureThreshold - Number of failures to open circuit (default: 5)
   * @param recoveryTimeout - Time to wait before recovery attempt (default: 60s)
   */
  constructor(
    name: string,
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000 // 1 minute
  ) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  /**
   * Executes an operation through the circuit breaker
   * Handles circuit state transitions and failure tracking
   * 
   * @template T The expected return type of the operation
   * @param operation - Async function to execute
   * @returns Result of the operation
   * @throws Error if circuit is open or operation fails
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Determines if enough time has passed to attempt circuit reset
   * @returns True if recovery should be attempted
   * @private
   */
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime && 
           Date.now() - this.lastFailureTime > this.recoveryTimeout;
  }

  /**
   * Handles successful operation execution
   * Resets failure count and closes the circuit
   * @private
   */
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Handles operation failure
   * Increments failure count and opens circuit if threshold exceeded
   * @private
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Gets the current state of the circuit breaker
   * @returns Current state: 'closed', 'open', or 'half-open'
   */
  getState(): string {
    return this.state;
  }

  /**
   * Gets the current failure count
   * @returns Number of consecutive failures
   */
  getFailureCount(): number {
    return this.failures;
  }
}

/**
 * Retry Logic Handler with Exponential Backoff
 * 
 * Provides intelligent retry functionality with exponential backoff,
 * configurable retry policies, and support for different error types.
 * 
 * @class RetryHandler
 * @example
 * ```typescript
 * const result = await RetryHandler.withRetry(
 *   () => apiService.fetchData(),
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     backoffMultiplier: 2
 *   }
 * );
 * ```
 */
export class RetryHandler {
  /**
   * Executes an operation with retry logic and exponential backoff
   * 
   * @template T The expected return type of the operation
   * @param operation - Async function to execute
   * @param options - Retry configuration options
   * @returns Result of the operation
   * @throws The last error if all retry attempts fail
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      /** Maximum number of retry attempts (default: 3) */
      maxAttempts?: number;
      /** Initial delay between retries in ms (default: 1000) */
      baseDelay?: number;
      /** Maximum delay between retries in ms (default: 10000) */
      maxDelay?: number;
      /** Multiplier for exponential backoff (default: 2) */
      backoffMultiplier?: number;
      /** Error types that should trigger retries */
      retryableErrors?: ErrorType[];
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryableErrors = [
        ErrorType.NETWORK,
        ErrorType.TIMEOUT,
        ErrorType.SERVER_ERROR,
        ErrorType.RATE_LIMIT
      ]
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxAttempts;
        
        if (isLastAttempt) {
          throw error;
        }

        // Check if error is retryable
        if (error instanceof AppException) {
          if (!retryableErrors.includes(error.type)) {
            throw error;
          }
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay
        );

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Utility method to create a delayed promise
   * @param ms - Delay duration in milliseconds
   * @private
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom Application Exception Class
 * 
 * Extends the standard Error class with additional metadata and context
 * for comprehensive error handling and monitoring.
 * 
 * @class AppException
 * @extends Error
 * @example
 * ```typescript
 * throw new AppException({
 *   type: ErrorType.VALIDATION,
 *   message: 'Invalid email format',
 *   statusCode: 400,
 *   code: 'INVALID_EMAIL',
 *   context: { field: 'email', value: 'invalid-email' },
 *   recoverable: true
 * });
 * ```
 */
export class AppException extends Error {
  /** Error type for classification */
  public readonly type: ErrorType;
  /** HTTP status code */
  public readonly statusCode: number;
  /** Optional error code */
  public readonly code?: string;
  /** Additional context information */
  public readonly context?: Record<string, any>;
  /** Whether the error can be recovered from */
  public readonly recoverable: boolean;
  /** Whether the operation can be retried */
  public readonly retryable: boolean;
  /** Unique error identifier */
  public readonly id: string;

  /**
   * Creates an application exception
   * @param params - Exception parameters and metadata
   */
  constructor(params: {
    /** Error type for classification */
    type: ErrorType;
    /** Human-readable error message */
    message: string;
    /** HTTP status code */
    statusCode: number;
    /** Optional error code for programmatic handling */
    code?: string;
    /** Additional context for debugging */
    context?: Record<string, any>;
    /** Whether the error can be recovered from */
    recoverable?: boolean;
    /** Whether the operation can be retried */
    retryable?: boolean;
    /** Original cause/error */
    cause?: Error;
  }) {
    super(params.message);
    this.name = 'AppException';
    this.type = params.type;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.context = params.context;
    this.recoverable = params.recoverable ?? true;
    this.retryable = params.retryable ?? false;
    this.cause = params.cause;
    this.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (params.cause) {
      this.stack = `${this.stack}\nCaused by: ${params.cause.stack}`;
    }
  }

  /**
   * Converts the exception to a structured AppError object
   * @returns Structured error object for logging and monitoring
   */
  toError(): AppError {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      cause: this.cause,
      context: this.context,
      timestamp: new Date(),
      severity: this.getSeverity(),
      recoverable: this.recoverable,
      retryable: this.retryable
    };
  }

  /**
   * Determines error severity based on error type
   * @returns Error severity level
   * @private
   */
  private getSeverity(): ErrorSeverity {
    switch (this.type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.CONFIGURATION:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVER_ERROR:
      case ErrorType.EXTERNAL_SERVICE:
      case ErrorType.DEPENDENCY:
        return ErrorSeverity.MEDIUM;
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
      case ErrorType.RATE_LIMIT:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Factory method to create a generic application exception
   * @param params - Exception parameters
   * @returns New AppException instance
   */
  static create(params: {
    type: ErrorType;
    message: string;
    statusCode: number;
    code?: string;
    context?: Record<string, any>;
    recoverable?: boolean;
    retryable?: boolean;
    cause?: Error;
  }): AppException {
    return new AppException(params);
  }

  /**
   * Factory method for validation errors
   * @param message - Validation error message
   * @param context - Additional validation context
   * @returns Validation error exception
   */
  static validation(message: string, context?: Record<string, any>): AppException {
    return new AppException({
      type: ErrorType.VALIDATION,
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      context,
      recoverable: true,
      retryable: false
    });
  }

  /**
   * Factory method for not found errors
   * @param resource - Resource that was not found
   * @param context - Additional context
   * @returns Not found error exception
   */
  static notFound(resource: string, context?: Record<string, any>): AppException {
    return new AppException({
      type: ErrorType.NOT_FOUND,
      message: `${resource} not found`,
      statusCode: 404,
      code: 'NOT_FOUND',
      context,
      recoverable: true,
      retryable: false
    });
  }

  /**
   * Factory method for authentication errors
   * @param message - Authentication error message
   * @returns Authentication error exception
   */
  static unauthorized(message: string = 'Unauthorized'): AppException {
    return new AppException({
      type: ErrorType.AUTHENTICATION,
      message,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      recoverable: true,
      retryable: false
    });
  }

  /**
   * Factory method for authorization errors
   * @param message - Authorization error message
   * @returns Authorization error exception
   */
  static forbidden(message: string = 'Forbidden'): AppException {
    return new AppException({
      type: ErrorType.AUTHORIZATION,
      message,
      statusCode: 403,
      code: 'FORBIDDEN',
      recoverable: true,
      retryable: false
    });
  }

  /**
   * Factory method for server errors
   * @param message - Server error message
   * @param context - Additional error context
   * @returns Server error exception
   */
  static serverError(message: string = 'Internal server error', context?: Record<string, any>): AppException {
    return new AppException({
      type: ErrorType.SERVER_ERROR,
      message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      context,
      recoverable: false,
      retryable: true
    });
  }

  /**
   * Factory method for network errors
   * @param message - Network error message
   * @param cause - Original network error
   * @returns Network error exception
   */
  static networkError(message: string = 'Network error', cause?: Error): AppException {
    return new AppException({
      type: ErrorType.NETWORK,
      message,
      statusCode: 0,
      code: 'NETWORK_ERROR',
      cause,
      recoverable: true,
      retryable: true
    });
  }

  /**
   * Factory method for timeout errors
   * @param message - Timeout error message
   * @returns Timeout error exception
   */
  static timeoutError(message: string = 'Request timeout'): AppException {
    return new AppException({
      type: ErrorType.TIMEOUT,
      message,
      statusCode: 408,
      code: 'TIMEOUT',
      recoverable: true,
      retryable: true
    });
  }

  /**
   * Factory method for rate limit errors
   * @param message - Rate limit error message
   * @returns Rate limit error exception
   */
  static rateLimitError(message: string = 'Rate limit exceeded'): AppException {
    return new AppException({
      type: ErrorType.RATE_LIMIT,
      message,
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      recoverable: true,
      retryable: true
    });
  }
}

/**
 * Error Logging and Monitoring System
 * 
 * Centralized error logging with integration to multiple monitoring services
 * including Sentry, console logging, and external logging services.
 * 
 * @class ErrorLogger
 */
export class ErrorLogger {
  /** Circuit breakers for different services/components */
  private static readonly circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Logs an error with comprehensive metadata
   * Handles conversion to structured format and distribution to monitoring services
   * 
   * @param error - Error to log (Error or AppException)
   * @param context - Additional context information
   * @example
   * ```typescript
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   ErrorLogger.log(error, { userId: '123', operation: 'data-sync' });
   * }
   * ```
   */
  static log(error: Error | AppException, context?: Record<string, any>): void {
    // Convert to AppError if not already
    const appError = error instanceof AppException ? error.toError() : {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ErrorType.SERVER_ERROR,
      message: error.message,
      statusCode: 500,
      cause: error,
      context,
      timestamp: new Date(),
      severity: ErrorSeverity.MEDIUM,
      recoverable: false,
      retryable: false
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', appError);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    // Send to Sentry
    this.sendToSentry(appError);

    // Log to external services (implement based on requirements)
    this.logToExternalServices(appError);
  }

  /**
   * Sends error to Sentry for monitoring and alerting
   * Includes structured context and tags for better error tracking
   * 
   * @param error - Structured error object
   * @private
   */
  private static sendToSentry(error: AppError): void {
    try {
      Sentry.withScope((scope) => {
        scope.setTag('errorType', error.type);
        scope.setTag('severity', error.severity);
        scope.setTag('recoverable', error.recoverable.toString());
        scope.setTag('retryable', error.retryable.toString());
        
        if (error.context) {
          scope.setContext('errorContext', error.context);
        }

        if (error.cause) {
          scope.setExtra('originalError', error.cause.message);
          scope.setExtra('originalStack', error.cause.stack);
        }

        Sentry.captureException(error.cause || new Error(error.message), {
          tags: {
            errorId: error.id,
            errorType: error.type,
            severity: error.severity
          }
        });
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  /**
   * Logs errors to external monitoring services
   * Placeholder for integration with other monitoring tools
   * 
   * @param error - Structured error object
   * @private
   */
  private static logToExternalServices(error: AppError): void {
    // Implement logging to other services as needed
    // e.g., CloudWatch, DataDog, LogRocket, etc.
  }

  /**
   * Gets or creates a circuit breaker for a named service/component
   * @param name - Name identifier for the circuit breaker
   * @returns Circuit breaker instance
   */
  static getCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Gets the current state of all circuit breakers
   * Useful for monitoring and debugging circuit breaker status
   * 
   * @returns Object mapping circuit breaker names to their states
   */
  static getAllCircuitBreakerStates(): Record<string, { state: string; failures: number }> {
    const states: Record<string, { state: string; failures: number }> = {};
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      states[name] = {
        state: breaker.getState(),
        failures: breaker.getFailureCount()
      };
    }
    return states;
  }
}

/**
 * Creates a standardized error response for API endpoints
 * 
 * @param error - AppException to format as response
 * @param requestId - Optional request ID for tracking
 * @returns Standardized error response
 * @example
 * ```typescript
 * try {
 *   return await riskyOperation();
 * } catch (error) {
 *   return NextResponse.json(createErrorResponse(error, requestId));
 * }
 * ```
 */
export function createErrorResponse(error: AppException, requestId?: string): ErrorResponse {
  return {
    success: false,
    error: {
      id: error.id,
      type: error.type,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      requestId,
      retryable: error.retryable,
      context: error.context
    },
    meta: {
      documentation: `https://docs.example.com/errors/${error.code?.toLowerCase()}`,
      supportContact: 'support@example.com'
    }
  };
}

/**
 * Checks if an error is retryable based on its properties
 * 
 * @param error - Error to check
 * @returns True if the error can be retried
 * @example
 * ```typescript
 * if (isRetryableError(error)) {
 *   await RetryHandler.withRetry(() => operation());
 * }
 * ```
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof AppException) {
    return error.retryable;
  }
  return false;
}

/**
 * Gets the severity level of an error
 * 
 * @param error - Error to analyze
 * @returns Error severity level
 */
export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof AppException) {
    return error.toError().severity;
  }
  return ErrorSeverity.MEDIUM;
}

/**
 * Error Context Interface
 * 
 * Defines the structure for capturing error context information
 * including user, session, and environment details.
 * 
 * @interface ErrorContext
 */
export interface ErrorContext {
  /** Associated user ID */
  userId?: string;
  /** Associated session ID */
  sessionId?: string;
  /** URL where error occurred */
  url?: string;
  /** User agent string */
  userAgent?: string;
  /** Additional context information */
  additionalContext?: Record<string, any>;
}

/**
 * Captures current error context from the execution environment
 * Automatically detects whether running on server or client
 * 
 * @returns Error context object with available information
 * @example
 * ```typescript
 * const context = getErrorContext();
 * // On client: includes URL, userAgent, sessionId, viewport info
 * // On server: returns empty object (minimal context available)
 * ```
 */
export function getErrorContext(): ErrorContext {
  if (typeof window === 'undefined') {
    // Server-side context
    return {};
  }

  return {
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    sessionId: getSessionId(),
    additionalContext: {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  };
}

/**
 * Gets or creates a session ID for error tracking
 * Uses sessionStorage to maintain session across page loads
 * 
 * @returns Session identifier string
 * @private
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('error_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error_session_id', sessionId);
  }
  return sessionId;
}