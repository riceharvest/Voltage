/**
 * Client-Side Error Recovery System
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, Database, Shield, CheckCircle } from 'lucide-react';
import { AppException, ErrorType, ErrorLogger, isRetryableError } from '@/lib/error-handling';
import { useOffline } from '@/lib/use-offline';

// Error Recovery Context
interface ErrorRecoveryContextType {
  errors: Map<string, AppException>;
  retryError: (errorId: string) => Promise<void>;
  dismissError: (errorId: string) => void;
  clearAllErrors: () => void;
  registerRetryable: (operation: () => Promise<any>) => Promise<any>;
  getErrorCount: () => number;
  isOnline: boolean;
  lastOnlineCheck: Date | null;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | undefined>(undefined);

// Hook for using error recovery context
export function useErrorRecovery() {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within ErrorRecoveryProvider');
  }
  return context;
}

// Error Recovery Provider Component
export function ErrorRecoveryProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<Map<string, AppException>>(new Map());
  const { isOnline, lastOnlineCheck } = useOffline();
  const retryTimeoutMap = new Map<string, NodeJS.Timeout>();

  const retryError = async (errorId: string): Promise<void> => {
    const error = errors.get(errorId);
    if (!error) return;

    // Check if error is retryable
    if (!error.retryable && !isRetryableError(error)) {
      console.warn('Error is not retryable:', errorId);
      return;
    }

    // Add delay to prevent rapid retries
    const delay = Math.min(1000 * Math.pow(2, Math.floor(Math.random() * 3)), 10000);
    
    const timeout = setTimeout(async () => {
      try {
        // Attempt to retry the operation
        if (error.context?.retryOperation) {
          await error.context.retryOperation();
          // Remove error on successful retry
          setErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.delete(errorId);
            return newErrors;
          });
        } else {
          console.warn('No retry operation available for error:', errorId);
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        // Keep error in state for potential future retry
      }
    }, delay);

    retryTimeoutMap.set(errorId, timeout);
  };

  const dismissError = (errorId: string) => {
    // Clear any pending retry timeout
    const timeout = retryTimeoutMap.get(errorId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeoutMap.delete(errorId);
    }

    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(errorId);
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    // Clear all pending retry timeouts
    for (const timeout of retryTimeoutMap.values()) {
      clearTimeout(timeout);
    }
    retryTimeoutMap.clear();
    
    setErrors(new Map());
  };

  const registerRetryable = async (operation: () => Promise<any>): Promise<any> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppException || error instanceof Error) {
        const appException = error instanceof AppException 
          ? error 
          : AppException.serverError(error.message, { originalError: error });
        
        const errorId = appException.id;
        
        // Store error with context for potential retry
        setErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.set(errorId, {
            ...appException,
            context: {
              ...appException.context,
              retryOperation: operation
            }
          });
          return newErrors;
        });
        
        // Log error
        ErrorLogger.log(error);
        
        throw appException;
      }
      throw error;
    }
  };

  const getErrorCount = () => errors.size;

  const contextValue: ErrorRecoveryContextType = {
    errors,
    retryError,
    dismissError,
    clearAllErrors,
    registerRetryable,
    getErrorCount,
    isOnline,
    lastOnlineCheck
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
      <GlobalErrorNotification />
      <OfflineIndicator />
    </ErrorRecoveryContext.Provider>
  );
}

// Global Error Notification Component
function GlobalErrorNotification() {
  const { errors, dismissError, retryError } = useErrorRecovery();
  const [notification, setNotification] = useState<{
    id: string;
    error: AppException;
    timestamp: Date;
  } | null>(null);

  useEffect(() => {
    if (errors.size > 0 && !notification) {
      const [errorId, error] = Array.from(errors.entries())[0];
      setNotification({
        id: errorId,
        error,
        timestamp: new Date()
      });
    }
  }, [errors.size, notification]);

  if (!notification) return null;

  const { error } = notification;

  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return <Wifi className="h-5 w-5 text-blue-500" />;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DEPENDENCY:
        return <Database className="h-5 w-5 text-orange-500" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <Shield className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection Issue';
      case ErrorType.SERVER_ERROR:
        return 'Server Error';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.TIMEOUT:
        return 'Request Timeout';
      default:
        return 'Error Occurred';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
          {getErrorIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{getErrorTitle()}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {error.retryable ? 'This can be retried automatically.' : 'Please try again later.'}
            </p>
          </div>
          <button
            onClick={() => dismissError(notification.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        
        {error.retryable && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryError(notification.id)}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Offline Indicator Component
function OfflineIndicator() {
  const { isOnline, lastOnlineCheck } = useErrorRecovery();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else if (showOfflineMessage && lastOnlineCheck) {
      // Show success message when coming back online
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage, lastOnlineCheck]);

  if (isOnline && !showOfflineMessage) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
        ${isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-orange-500 text-white'
        }
      `}>
        {isOnline ? (
          <>
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}

// Generic Error Recovery Component
interface ErrorRecoveryProps {
  error: Error | AppException;
  onRetry?: () => void;
  onDismiss?: () => void;
  level?: 'component' | 'section' | 'page';
  showDetails?: boolean;
  fallback?: ReactNode;
  retryAttempts?: number;
  autoRetry?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  onDismiss,
  level = 'component',
  showDetails = false,
  fallback,
  retryAttempts = 3,
  autoRetry = false
}: ErrorRecoveryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);

  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  const canRetry = appException.retryable && retryCount < retryAttempts;
  const shouldAutoRetry = autoRetry && canRetry && !lastRetryTime;

  useEffect(() => {
    if (shouldAutoRetry) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000); // Auto retry after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [shouldAutoRetry]);

  const handleRetry = async () => {
    if (!canRetry || isRetrying) return;

    setIsRetrying(true);
    setLastRetryTime(new Date());
    
    try {
      if (onRetry) {
        await onRetry();
        setRetryCount(0);
      }
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    switch (appException.type) {
      case ErrorType.NETWORK:
        return <Wifi className="h-8 w-8 text-blue-500" />;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DEPENDENCY:
        return <Database className="h-8 w-8 text-orange-500" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <Shield className="h-8 w-8 text-red-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    }
  };

  if (level === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-lg w-full">
          <div className="mb-6">
            {getErrorIcon()}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {appException.type === ErrorType.NETWORK ? 'Connection Problem' :
               appException.type === ErrorType.SERVER_ERROR ? 'Server Error' :
               appException.type === ErrorType.AUTHENTICATION ? 'Sign In Required' :
               appException.type === ErrorType.AUTHORIZATION ? 'Access Denied' :
               appException.type === ErrorType.NOT_FOUND ? 'Not Found' :
               appException.type === ErrorType.TIMEOUT ? 'Request Timeout' :
               'Something went wrong'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {appException.message}
            </p>
            {appException.retryable && (
              <p className="text-sm text-muted-foreground">
                This issue can be resolved by trying again.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : `Try Again (${retryCount}/${retryAttempts})`}
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>

          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left border rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify({
                  id: appException.id,
                  type: appException.type,
                  message: appException.message,
                  stack: appException.stack,
                  retryable: appException.retryable
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (level === 'section') {
    return (
      <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-center gap-3 mb-4">
          {getErrorIcon()}
          <div>
            <h3 className="font-semibold text-foreground">Error Loading Content</h3>
            <p className="text-sm text-muted-foreground">{appException.message}</p>
          </div>
        </div>
        {canRetry && (
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
      </div>
    );
  }

  // Component level
  return (
    <div className="p-4 border border-destructive/20 rounded bg-destructive/5">
      <div className="flex items-center gap-2 mb-2">
        {getErrorIcon()}
        <p className="text-sm text-destructive font-medium">Error</p>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{appException.message}</p>
      {canRetry && (
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  );
}

// Network Status Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

// Graceful Degradation Helper
export class GracefulDegradation {
  private static fallbacks = new Map<string, () => any>();

  static register(key: string, fallback: () => any) {
    this.fallbacks.set(key, fallback);
  }

  static execute<T>(key: string, primary: () => T, fallback?: () => T): T | null {
    try {
      return primary();
    } catch (error) {
      console.warn(`Primary operation failed for ${key}, using fallback:`, error);
      
      const registeredFallback = this.fallbacks.get(key);
      if (registeredFallback) {
        return registeredFallback();
      }
      
      if (fallback) {
        return fallback();
      }
      
      return null;
    }
  }

  static async executeAsync<T>(key: string, primary: () => Promise<T>, fallback?: () => T): Promise<T | null> {
    try {
      return await primary();
    } catch (error) {
      console.warn(`Primary async operation failed for ${key}, using fallback:`, error);
      
      const registeredFallback = this.fallbacks.get(key);
      if (registeredFallback) {
        return registeredFallback();
      }
      
      if (fallback) {
        return fallback();
      }
      
      return null;
    }
  }
}

// Error Recovery Configuration
export const ERROR_RECOVERY_CONFIG = {
  maxRetryAttempts: 3,
  baseRetryDelay: 1000,
  maxRetryDelay: 10000,
  autoRetryDelay: 2000,
  showErrorNotifications: true,
  enableOfflineDetection: true,
  enablePerformanceTracking: true
};

// Default Error Recovery Components
export const DefaultErrorComponents = {
  SimpleError: ({ error }: { error: Error }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p className="text-red-800">An error occurred: {error.message}</p>
    </div>
  ),
  
  NetworkError: ({ onRetry }: { onRetry?: () => void }) => (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center gap-2 mb-2">
        <Wifi className="h-4 w-4 text-blue-600" />
        <p className="text-blue-800 font-medium">Connection Problem</p>
      </div>
      <p className="text-blue-700 mb-3">Please check your internet connection and try again.</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
};