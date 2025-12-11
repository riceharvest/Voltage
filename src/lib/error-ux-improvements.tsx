/**
 * User Experience Improvements for Error Handling
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  X, 
  RefreshCw, 
  Bug, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Copy,
  Download,
  ExternalLink,
  Clock,
  Wifi,
  Database,
  Shield
} from 'lucide-react';
import { AppException, ErrorType, ErrorSeverity } from '@/lib/error-handling';
import { errorMonitor } from '@/lib/error-monitoring';

// Toast/Notification System
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  timestamp: Date;
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'default' | 'destructive' | 'outline';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showErrorToast: (error: Error | AppException, options?: Partial<Toast>) => void;
  showSuccessToast: (message: string, title?: string) => void;
  showInfoToast: (message: string, title?: string) => void;
  showWarningToast: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toastData: Omit<Toast, 'id' | 'timestamp'>) => {
    const toast: Toast = {
      ...toastData,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      duration: toastData.duration ?? 5000
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const showErrorToast = (error: Error | AppException, options: Partial<Toast> = {}) => {
    const message = error instanceof AppException ? error.message : error.message;
    const title = options.title || getErrorTitle(error);
    
    addToast({
      type: 'error',
      title,
      message,
      persistent: options.persistent || false,
      actions: [
        ...(options.actions || []),
        {
          label: 'Retry',
          action: () => {
            if (error instanceof AppException && error.context?.retryOperation) {
              error.context.retryOperation().catch(console.error);
            }
            removeToast(`toast_${Date.now()}`);
          },
          style: 'default'
        },
        {
          label: 'Report',
          action: () => {
            copyErrorToClipboard(error);
            removeToast(`toast_${Date.now()}`);
          },
          style: 'outline'
        }
      ]
    });
  };

  const showSuccessToast = (message: string, title: string = 'Success') => {
    addToast({
      type: 'success',
      title,
      message
    });
  };

  const showInfoToast = (message: string, title: string = 'Information') => {
    addToast({
      type: 'info',
      title,
      message
    });
  };

  const showWarningToast = (message: string, title: string = 'Warning') => {
    addToast({
      type: 'warning',
      title,
      message
    });
  };

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showErrorToast,
    showSuccessToast,
    showInfoToast,
    showWarningToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
    }
  };

  return (
    <Card className={`animate-in slide-in-from-top-2 ${getBorderColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
            
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {toast.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.style || 'default'}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Error Feedback System
interface ErrorFeedback {
  id: string;
  errorId: string;
  userId?: string;
  helpful: boolean;
  comment?: string;
  email?: string;
  timestamp: Date;
  resolved: boolean;
}

interface ErrorFeedbackContextType {
  feedback: ErrorFeedback[];
  submitFeedback: (errorId: string, feedback: Omit<ErrorFeedback, 'id' | 'timestamp' | 'resolved'>) => void;
  getFeedbackForError: (errorId: string) => ErrorFeedback[];
  getAllFeedback: () => ErrorFeedback[];
  markAsResolved: (feedbackId: string) => void;
}

const ErrorFeedbackContext = createContext<ErrorFeedbackContextType | undefined>(undefined);

export function useErrorFeedback() {
  const context = useContext(ErrorFeedbackContext);
  if (!context) {
    throw new Error('useErrorFeedback must be used within ErrorFeedbackProvider');
  }
  return context;
}

export function ErrorFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<ErrorFeedback[]>([]);

  const submitFeedback = (
    errorId: string, 
    feedbackData: Omit<ErrorFeedback, 'id' | 'timestamp' | 'resolved'>
  ) => {
    const newFeedback: ErrorFeedback = {
      ...feedbackData,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorId,
      timestamp: new Date(),
      resolved: false
    };

    setFeedback(prev => [...prev, newFeedback]);
    
    // Log to monitoring system
    console.log('Error feedback submitted:', newFeedback);
  };

  const getFeedbackForError = (errorId: string): ErrorFeedback[] => {
    return feedback.filter(f => f.errorId === errorId);
  };

  const getAllFeedback = (): ErrorFeedback[] => {
    return feedback.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const markAsResolved = (feedbackId: string) => {
    setFeedback(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, resolved: true } : f
    ));
  };

  const contextValue: ErrorFeedbackContextType = {
    feedback,
    submitFeedback,
    getFeedbackForError,
    getAllFeedback,
    markAsResolved
  };

  return (
    <ErrorFeedbackContext.Provider value={contextValue}>
      {children}
    </ErrorFeedbackContext.Provider>
  );
}

// Error Feedback Component
interface ErrorFeedbackWidgetProps {
  error: Error | AppException;
  className?: string;
}

export function ErrorFeedbackWidget({ error, className = '' }: ErrorFeedbackWidgetProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitFeedback } = useErrorFeedback();
  const { showSuccessToast } = useToast();

  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  const handleFeedbackSubmit = async () => {
    if (helpful === null) return;

    setIsSubmitting(true);
    
    try {
      submitFeedback(appException.id, {
        helpful,
        comment: comment.trim() || undefined,
        email: email.trim() || undefined
      });

      showSuccessToast('Thank you for your feedback!', 'Feedback Submitted');
      setShowFeedbackForm(false);
      setComment('');
      setEmail('');
      setHelpful(null);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showFeedbackForm) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <h4 className="font-semibold mb-3">Was this error message helpful?</h4>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHelpful(true);
                  setShowFeedbackForm(true);
                }}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHelpful(false);
                  setShowFeedbackForm(true);
                }}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                No
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Help us improve</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">How can we improve this error message?</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what was confusing or missing..."
            className="w-full mt-1 p-2 border rounded-md resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full mt-1 p-2 border rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-1">
            We'll only use this to follow up on your feedback.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleFeedbackSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFeedbackForm(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Error Details Modal
interface ErrorDetailsModalProps {
  error: Error | AppException;
  isOpen: boolean;
  onClose: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

export function ErrorDetailsModal({ 
  error, 
  isOpen, 
  onClose, 
  onCopy, 
  onDownload 
}: ErrorDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'technical' | 'context'>('summary');
  
  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  if (!isOpen) return null;

  const getErrorIcon = () => {
    switch (appException.type) {
      case ErrorType.NETWORK:
        return <Wifi className="h-6 w-6 text-blue-500" />;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DEPENDENCY:
        return <Database className="h-6 w-6 text-orange-500" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <Shield className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {getErrorIcon()}
            <div>
              <CardTitle>Error Details</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {appException.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {onCopy && (
              <Button variant="outline" size="sm" onClick={onCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            {[
              { key: 'summary', label: 'Summary' },
              { key: 'technical', label: 'Technical' },
              { key: 'context', label: 'Context' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab ContentTab === 'summary */}
          {active' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Error Type</h4>
                <Badge variant="outline">{appException.type}</Badge>
              </div>
              
              <div>
                <h4 className="font-semibold">Severity</h4>
                <Badge variant={
                  appException.toError().severity === ErrorSeverity.CRITICAL ? 'destructive' :
                  appException.toError().severity === ErrorSeverity.HIGH ? 'default' :
                  appException.toError().severity === ErrorSeverity.MEDIUM ? 'secondary' :
                  'outline'
                }>
                  {appException.toError().severity}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold">Message</h4>
                <p className="text-sm bg-muted p-3 rounded">{appException.message}</p>
              </div>

              <div>
                <h4 className="font-semibold">Recovery Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${appException.retryable ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm">
                      {appException.retryable ? 'This error can be retried automatically' : 'This error cannot be retried'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${appException.recoverable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      {appException.recoverable ? 'User can recover from this error' : 'System recovery may be required'}
                    </span>
                  </div>
                </div>
              </div>

              <ErrorFeedbackWidget error={error} />
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Error ID</h4>
                <p className="text-sm font-mono bg-muted p-2 rounded">{appException.id}</p>
              </div>

              <div>
                <h4 className="font-semibold">Status Code</h4>
                <p className="text-sm font-mono bg-muted p-2 rounded">{appException.statusCode}</p>
              </div>

              {appException.code && (
                <div>
                  <h4 className="font-semibold">Error Code</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{appException.code}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold">Stack Trace</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                  {appException.stack || 'No stack trace available'}
                </pre>
              </div>

              {appException.cause && (
                <div>
                  <h4 className="font-semibold">Caused By</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {appException.cause.stack || appException.cause.message}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'context' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Timestamp</h4>
                <p className="text-sm">{appException.toError().timestamp.toISOString()}</p>
              </div>

              {appException.context && Object.keys(appException.context).length > 0 && (
                <div>
                  <h4 className="font-semibold">Additional Context</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(appException.context, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="font-semibold">Browser Information</h4>
                <div className="space-y-2 text-sm">
                  <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                  <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
                  <div>Viewport: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Error Logging Utilities
export function copyErrorToClipboard(error: Error | AppException): void {
  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  const errorData = {
    id: appException.id,
    type: appException.type,
    message: appException.message,
    code: appException.code,
    statusCode: appException.statusCode,
    severity: appException.toError().severity,
    stack: appException.stack,
    context: appException.context,
    timestamp: appException.toError().timestamp.toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2))
      .then(() => {
        console.log('Error details copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  }
}

export function downloadErrorReport(error: Error | AppException): void {
  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  const errorData = {
    id: appException.id,
    type: appException.type,
    message: appException.message,
    code: appException.code,
    statusCode: appException.statusCode,
    severity: appException.toError().severity,
    stack: appException.stack,
    context: appException.context,
    timestamp: appException.toError().timestamp.toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }
  };

  const blob = new Blob([JSON.stringify(errorData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `error-report-${appException.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper functions
function getErrorTitle(error: Error | AppException): string {
  if (error instanceof AppException) {
    switch (error.type) {
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
        return 'Error Occurred';
    }
  }
  return 'Error Occurred';
}

// Main Error UX Provider
export function ErrorUXProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ErrorFeedbackProvider>
        {children}
      </ErrorFeedbackProvider>
    </ToastProvider>
  );
}

// Hook for enhanced error handling with UX
export function useEnhancedErrorHandling() {
  const { showErrorToast, showSuccessToast } = useToast();
  const { recordOperationResult } = errorMonitor;

  const handleError = async (
    error: Error | AppException,
    context?: Record<string, any>,
    options?: {
      showToast?: boolean;
      recordMetrics?: boolean;
      operationName?: string;
    }
  ) => {
    const { showToast = true, recordMetrics = true, operationName } = options || {};

    // Record performance metrics if operation name provided
    if (recordMetrics && operationName) {
      recordOperationResult(operationName, 0, true);
    }

    // Show toast notification
    if (showToast) {
      showErrorToast(error);
    }

    // Log to monitoring system
    const appException = error instanceof AppException ? error : 
      AppException.serverError(error.message, { originalError: error, ...context });

    // This would integrate with the error monitoring system
    console.error('Enhanced error handling:', appException);
  };

  const handleSuccess = (
    message: string,
    operationName?: string,
    context?: Record<string, any>
  ) => {
    // Record performance metrics if operation name provided
    if (operationName) {
      recordOperationResult(operationName, 0, false);
    }

    showSuccessToast(message);
  };

  return {
    handleError,
    handleSuccess
  };
}

// Error Recovery Button Component
interface ErrorRecoveryButtonProps {
  error: Error | AppException;
  onRetry?: () => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}

export function ErrorRecoveryButton({ 
  error, 
  onRetry, 
  size = 'default',
  variant = 'default',
  className = ''
}: ErrorRecoveryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const appException = error instanceof AppException ? error : 
    AppException.serverError(error.message, { originalError: error });

  const canRetry = appException.retryable;

  if (!canRetry) {
    return null;
  }

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    
    try {
      if (onRetry) {
        await onRetry();
      } else if (appException.context?.retryOperation) {
        await appException.context.retryOperation();
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isRetrying}
      size={size}
      variant={variant}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : 'Try Again'}
    </Button>
  );
}