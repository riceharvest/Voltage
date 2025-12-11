'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Bug, AlertCircle, Wifi, Database, Shield } from 'lucide-react';
import { AppException, ErrorType, ErrorSeverity, ErrorLogger, getErrorContext } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component' | 'api';
  context?: Record<string, any>;
  enableRetry?: boolean;
  enableFallback?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  errorInfo?: ErrorInfo;
  errorType?: ErrorType;
  isRetrying?: boolean;
  fallbackData?: any;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;
  private readonly maxRetries = 3;
  private retryCount = 0;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine error type based on error characteristics
    const errorType = this.determineErrorType(error);
    
    return { 
      hasError: true, 
      error, 
      errorId,
      errorType,
      isRetrying: false
    };
  }

  private static determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('server error') || message.includes('500')) {
      return ErrorType.SERVER_ERROR;
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorType.RATE_LIMIT;
    }
    
    return ErrorType.CLIENT_ERROR;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorContext = getErrorContext();
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enhanced error logging with comprehensive context
    const errorData = {
      errorId,
      error,
      errorInfo,
      level: this.props.level || 'component',
      context: {
        ...errorContext,
        ...this.props.context,
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level,
        retryCount: this.retryCount
      }
    };

    console.error('ErrorBoundary caught an error:', errorData);

    // Enhanced logging with error handling infrastructure
    ErrorLogger.log(error, errorData.context);

    // Enhanced Sentry integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope) => {
        scope.setTag('errorId', errorId);
        scope.setTag('errorBoundaryLevel', this.props.level || 'component');
        scope.setContext('errorBoundary', {
          errorId,
          level: this.props.level,
          context: this.props.context,
          retryCount: this.retryCount,
          componentStack: errorInfo.componentStack
        });
        scope.setContext('errorContext', errorData.context);
        
        (window as any).Sentry.captureException(error, {
          tags: {
            errorBoundary: 'true',
            errorBoundaryLevel: this.props.level || 'component'
          }
        });
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      alert('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    try {
      // Add delay to prevent rapid retries
      await new Promise(resolve => {
        this.retryTimeout = setTimeout(resolve, 1000 * this.retryCount);
      });

      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorId: undefined,
        errorInfo: undefined,
        isRetrying: false
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
      
      if (this.retryCount >= this.maxRetries) {
        alert('Retry failed. Please refresh the page.');
      }
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleReportError = () => {
    const errorContext = getErrorContext();
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString(),
      url: errorContext.url,
      userAgent: errorContext.userAgent,
      level: this.props.level,
      context: this.props.context,
      retryCount: this.retryCount,
      sessionId: errorContext.sessionId,
      errorType: this.state.errorType,
      componentStack: this.state.errorInfo?.componentStack
    };

    // Copy error details to clipboard
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          // Show success message
          const notification = document.createElement('div');
          notification.textContent = 'Error details copied to clipboard!';
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 9999;
            font-size: 14px;
          `;
          document.body.appendChild(notification);
          setTimeout(() => document.body.removeChild(notification), 3000);
        })
        .catch(() => {
          // Fallback to alert if clipboard API fails
          alert('Error details copied to clipboard. Please include this in your bug report.');
        });
    }
  };

  getErrorIcon() {
    switch (this.state.errorType) {
      case ErrorType.NETWORK:
        return <Wifi className="h-16 w-16 text-blue-500 mb-4" />;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DEPENDENCY:
        return <Database className="h-16 w-16 text-orange-500 mb-4" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <Shield className="h-16 w-16 text-red-500 mb-4" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-destructive mb-4" />;
    }
  }

  getErrorTitle() {
    switch (this.state.errorType) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
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
        return 'Something went wrong';
    }
  }

  getErrorMessage() {
    switch (this.state.errorType) {
      case ErrorType.NETWORK:
        return 'We couldn\'t connect to our servers. Please check your internet connection and try again.';
      case ErrorType.SERVER_ERROR:
        return 'Our servers are experiencing issues. We\'re working to fix this as quickly as possible.';
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to access this content.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to access this resource.';
      case ErrorType.NOT_FOUND:
        return 'The requested content could not be found.';
      case ErrorType.TIMEOUT:
        return 'The request took too long to complete. Please try again.';
      default:
        return 'An unexpected error occurred. Don\'t worry, your data is safe. Try the options below to get back on track.';
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback for different levels
      if (this.props.level === 'component' && this.props.fallback) {
        return this.props.fallback;
      }

      // Section-level error boundary (smaller UI)
      if (this.props.level === 'section') {
        return (
          <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-center gap-3 mb-4">
              {this.getErrorIcon()}
              <div>
                <h3 className="font-semibold text-foreground">{this.getErrorTitle()}</h3>
                <p className="text-sm text-muted-foreground">{this.getErrorMessage()}</p>
              </div>
            </div>
            {this.props.enableRetry !== false && (
              <Button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                size="sm"
                className="mb-2"
              >
                {this.state.isRetrying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}
            {this.state.errorId && (
              <p className="text-xs text-muted-foreground mt-2">
                ID: {this.state.errorId}
              </p>
            )}
          </div>
        );
      }

      // Page-level error boundary (full screen)
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-lg w-full">
            <div className="mb-6">
              {this.getErrorIcon()}
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {this.getErrorTitle()}
              </h1>
              <p className="text-muted-foreground mb-4">
                {this.getErrorMessage()}
              </p>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              {(this.props.enableRetry !== false) && (
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  {this.state.isRetrying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              <Button
                onClick={this.handleGoBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button
                onClick={this.handleReportError}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Bug className="h-4 w-4" />
                Report This Error
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left border rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <strong className="text-xs">Message:</strong>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-xs">Stack Trace:</strong>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorType && (
                    <div>
                      <strong className="text-xs">Error Type:</strong>
                      <p className="mt-1 text-xs bg-muted p-2 rounded">
                        {this.state.errorType}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;