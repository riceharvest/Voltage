/**
 * Error Handling Enhancements Demonstration Page
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  Database, 
  Shield, 
  Clock,
  RefreshCw,
  Bug,
  BarChart3,
  MessageSquare,
  Copy,
  Download,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import ErrorBoundary from '@/components/error-boundary';
import { ErrorRecoveryProvider, ErrorUXProvider, useToast } from '@/lib/client-error-recovery';
import { ErrorUXProvider as ErrorUXProviderComponent, useEnhancedErrorHandling } from '@/lib/error-ux-improvements';
import { errorMonitor, ErrorMetrics } from '@/lib/error-monitoring';
import { AppException, ErrorType, ErrorSeverity } from '@/lib/error-handling';

// Demo configuration
const ERROR_TYPES = [
  { value: '', label: 'No Error (Success)', icon: CheckCircle, color: 'text-green-500' },
  { value: 'validation', label: 'Validation Error', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'not-found', label: 'Not Found Error', icon: XCircle, color: 'text-red-500' },
  { value: 'server-error', label: 'Server Error', icon: Database, color: 'text-orange-500' },
  { value: 'network', label: 'Network Error', icon: Wifi, color: 'text-blue-500' },
  { value: 'timeout', label: 'Timeout Error', icon: Clock, color: 'text-purple-500' },
  { value: 'unauthorized', label: 'Unauthorized Error', icon: Shield, color: 'text-red-600' },
  { value: 'rate-limit', label: 'Rate Limit Error', icon: RefreshCw, color: 'text-yellow-600' },
  { value: 'circuit-breaker', label: 'Circuit Breaker', icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'retry', label: 'Retry Mechanism', icon: RefreshCw, color: 'text-blue-600' }
];

// Main Demo Component
function ErrorHandlingDemo() {
  const [selectedError, setSelectedError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [autoTest, setAutoTest] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();
  const { handleError, handleSuccess } = useEnhancedErrorHandling();

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = errorMonitor.getMetrics();
      setMetrics(currentMetrics);
      setErrorCount(currentMetrics.totalErrors);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-test functionality
  useEffect(() => {
    if (autoTest && selectedError === '') {
      const testErrors = ERROR_TYPES.filter(e => e.value !== '');
      const currentError = testErrors[currentTestIndex % testErrors.length];
      
      const timer = setTimeout(() => {
        setSelectedError(currentError.value);
        setCurrentTestIndex(prev => prev + 1);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoTest, selectedError, currentTestIndex]);

  const makeRequest = async (errorType: string = selectedError) => {
    setIsLoading(true);
    setResponse(null);

    try {
      const startTime = Date.now();
      const params = new URLSearchParams();
      
      if (errorType) {
        params.set('error', errorType);
      }
      
      // Add some randomness to make it more realistic
      if (Math.random() < 0.3) {
        params.set('slow', 'true');
      }

      const response = await fetch(`/api/error-demo?${params.toString()}`);
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        setResponse({ ...data, duration });
        handleSuccess(`Request completed in ${duration}ms`, 'api-request');
        showSuccessToast('Request completed successfully!', 'Success');
      } else {
        const error = new Error(data.error?.message || 'Request failed');
        const appException = AppException.serverError(error.message, { 
          response: data,
          duration,
          errorType 
        });
        
        handleError(appException, { errorType, duration }, {
          operationName: 'demo-api-request',
          showToast: true
        });
        
        setResponse({ ...data, duration });
      }
    } catch (error) {
      console.error('Demo request failed:', error);
      
      const appException = error instanceof AppException 
        ? error 
        : AppException.serverError(error instanceof Error ? error.message : 'Unknown error');
      
      handleError(appException, { selectedError }, {
        operationName: 'demo-api-request',
        showToast: true
      });
      
      setResponse({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          type: 'network'
        },
        duration: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerClientError = (errorType: string) => {
    const errorMessages = {
      'component-error': 'This is a simulated component error',
      'network-error': 'Failed to load resource from network',
      'validation-error': 'Invalid input: please check your data',
      'permission-error': 'You do not have permission to perform this action'
    };

    const message = errorMessages[errorType as keyof typeof errorMessages] || 'Unknown client error';
    const error = new Error(message);
    
    // Throw error to trigger error boundary
    throw error;
  };

  const copyErrorToClipboard = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      showSuccessToast('Error data copied to clipboard!');
    } catch (error) {
      showErrorToast(new Error('Failed to copy to clipboard'));
    }
  };

  const downloadErrorReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      recentResponse: response,
      errorCount,
      testConfiguration: {
        selectedError,
        autoTest
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-handling-demo-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Error Handling Enhancements Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive demonstration of all 5 Error Handling Enhancements including enhanced error boundaries, 
          API error handling, client-side recovery, monitoring & alerting, and UX improvements.
        </p>
        
        {/* Status indicators */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Errors: {errorCount}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Health: {metrics?.healthScore || 100}%
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Trend: {metrics?.errorTrend || 'stable'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="api-testing" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api-testing">API Testing</TabsTrigger>
          <TabsTrigger value="error-boundaries">Error Boundaries</TabsTrigger>
          <TabsTrigger value="client-recovery">Client Recovery</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="ux-improvements">UX Features</TabsTrigger>
        </TabsList>

        {/* API Testing Tab */}
        <TabsContent value="api-testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                API Error Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ERROR_TYPES.map((error) => {
                  const Icon = error.icon;
                  return (
                    <Button
                      key={error.value}
                      variant={selectedError === error.value ? "default" : "outline"}
                      onClick={() => setSelectedError(error.value)}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Icon className={`h-6 w-6 ${error.color}`} />
                      <span className="text-sm">{error.label}</span>
                    </Button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => makeRequest()}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isLoading ? 'Testing...' : 'Test Selected Error'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setAutoTest(!autoTest)}
                  className="flex items-center gap-2"
                >
                  {autoTest ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  {autoTest ? 'Stop Auto Test' : 'Start Auto Test'}
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedError('');
                    setResponse(null);
                    setCurrentTestIndex(0);
                  }}
                >
                  Reset
                </Button>
              </div>

              {response && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Response</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyErrorToClipboard(response)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadErrorReport}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                    {response.duration && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Response time: {response.duration}ms
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Boundaries Tab */}
        <TabsContent value="error-boundaries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Component Level Error Boundary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This error boundary is configured for component-level errors with fallback UI.
                </p>
                
                <ErrorBoundary level="component" context={{ demoType: 'component' }}>
                  <div className="p-4 border rounded-lg">
                    <Button
                      onClick={() => triggerClientError('component-error')}
                      variant="outline"
                      className="w-full"
                    >
                      Trigger Component Error
                    </Button>
                  </div>
                </ErrorBoundary>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section Level Error Boundary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This error boundary handles section-level errors with recovery options.
                </p>
                
                <ErrorBoundary 
                  level="section" 
                  context={{ demoType: 'section' }}
                  enableRetry={true}
                >
                  <div className="p-4 border rounded-lg">
                    <Button
                      onClick={() => triggerClientError('network-error')}
                      variant="outline"
                      className="w-full"
                    >
                      Trigger Section Error
                    </Button>
                  </div>
                </ErrorBoundary>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Page Level Error Boundary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This would be a full-page error boundary (normally used in app layout).
              </p>
              <Button
                onClick={() => triggerClientError('validation-error')}
                variant="destructive"
              >
                Trigger Page Error (Simulated)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Recovery Tab */}
        <TabsContent value="client-recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client-Side Error Recovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Network Status</h4>
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${navigator.onLine ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-sm">{navigator.onLine ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Recovery Rate</h4>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">{metrics?.recoveryRate.toFixed(1) || 100}%</span>
                  </div>
                  <Progress value={metrics?.recoveryRate || 100} className="h-2" />
                </div>
              </div>

              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>Recovery Features Active</AlertTitle>
                <AlertDescription>
                  The system includes automatic retry mechanisms, offline detection, 
                  graceful degradation, and user-friendly error notifications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Errors</span>
                    <Badge variant="outline">{metrics?.totalErrors || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Health Score</span>
                    <Badge variant={metrics && metrics.healthScore > 70 ? "default" : "destructive"}>
                      {metrics?.healthScore || 100}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Trend</span>
                    <Badge variant="outline">{metrics?.errorTrend || 'stable'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics && Object.entries(metrics.errorsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Severity Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics && Object.entries(metrics.errorsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between text-sm">
                    <span className="capitalize">{severity}</span>
                    <Badge 
                      variant={
                        severity === 'critical' ? 'destructive' :
                        severity === 'high' ? 'default' :
                        'secondary'
                      }
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {metrics?.topErrors && metrics.topErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{error.message}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {error.type}
                          </Badge>
                          <Badge 
                            variant={
                              error.severity === 'critical' ? 'destructive' :
                              error.severity === 'high' ? 'default' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {error.severity}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* UX Features Tab */}
        <TabsContent value="ux-improvements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Toast Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Test the enhanced toast notification system with different types.
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    onClick={() => showSuccessToast('This is a success message!', 'Success')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Success
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={() => showErrorToast(new Error('This is an error message!'), { 
                      title: 'Custom Error' 
                    })}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Error
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={() => showWarningToast('This is a warning message!', 'Warning')}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Warning
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={() => showInfoToast('This is an info message!', 'Information')}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Info
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Users can provide feedback on error messages to improve UX.
                </p>
                
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertTitle>Feedback System</AlertTitle>
                  <AlertDescription>
                    Users can rate error messages as helpful/not helpful and provide comments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Error Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy error details to clipboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="text-sm">Download error report</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <span className="text-sm">Enhanced error logging</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main page component with all providers
export default function ErrorHandlingDemoPage() {
  return (
    <ErrorUXProviderComponent>
      <ErrorRecoveryProvider>
        <ErrorHandlingDemo />
      </ErrorRecoveryProvider>
    </ErrorUXProviderComponent>
  );
}