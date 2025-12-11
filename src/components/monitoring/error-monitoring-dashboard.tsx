/**
 * Error Monitoring and Alerting Dashboard
 * 
 * Comprehensive error tracking including:
 * - Real-time error detection and categorization
 * - User impact assessment and prioritization
 * - Automated alerting with escalation workflows
 * - Error pattern analysis and prevention
 * - Cross-platform error correlation
 * 
 * @author Global Platform Team
 * @version 3.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Bug, 
  Shield, 
  Clock,
  TrendingUp,
  Users,
  Globe,
  Server,
  Smartphone,
  Monitor,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { getConsentStatus } from '@/lib/gdpr';

interface ErrorEvent {
  id: string;
  type: 'javascript' | 'network' | 'api' | 'performance' | 'security' | 'user';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  region: string;
  device: string;
  browser: string;
  resolved: boolean;
  impact: {
    affectedUsers: number;
    affectedSessions: number;
    revenueImpact?: number;
  };
  context: {
    page: string;
    userAction?: string;
    previousUrl?: string;
    customData?: Record<string, any>;
  };
}

interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  errorType: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'high' | 'medium' | 'low';
  firstOccurrence: number;
  lastOccurrence: number;
  affectedUsers: number;
  resolution: {
    status: 'identified' | 'fixing' | 'resolved' | 'monitoring';
    assignee?: string;
    estimatedResolution?: number;
    actualResolution?: number;
  };
  prevention: string[];
}

interface AlertWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    errorType: string;
    severity: string;
    threshold: number;
    timeWindow: number; // minutes
  };
  actions: Array<{
    type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'auto_remediation';
    target: string;
    config: Record<string, any>;
  }>;
  escalation: {
    enabled: boolean;
    levels: Array<{
      delay: number; // minutes
      action: string;
      target: string;
    }>;
  };
  status: 'active' | 'paused' | 'testing';
}

interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byRegion: Record<string, number>;
  byDevice: Record<string, number>;
  resolved: number;
  avgResolutionTime: number;
  trend24h: number;
  topErrors: Array<{
    message: string;
    count: number;
    trend: number;
  }>;
}

export function ErrorMonitoringDashboard() {
  const [errorEvents, setErrorEvents] = useState<ErrorEvent[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [alertWorkflows, setAlertWorkflows] = useState<AlertWorkflow[]>([]);
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch error monitoring data
  const fetchErrorData = useCallback(async () => {
    if (!getConsentStatus().analytics) {
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call - in production, this would fetch from error monitoring system
      const mockErrorEvents: ErrorEvent[] = [
        {
          id: 'err-001',
          type: 'javascript',
          severity: 'critical',
          message: 'TypeError: Cannot read property \'map\' of undefined',
          stack: 'at RecipeList.render (RecipeList.jsx:45:12)',
          url: '/flavors',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: Date.now() - 300000, // 5 minutes ago
          sessionId: 'sess_12345',
          region: 'US',
          device: 'desktop',
          browser: 'Chrome',
          resolved: false,
          impact: {
            affectedUsers: 45,
            affectedSessions: 52,
            revenueImpact: 125.50
          },
          context: {
            page: '/flavors',
            userAction: 'recipe_filter',
            previousUrl: '/'
          }
        },
        {
          id: 'err-002',
          type: 'network',
          severity: 'high',
          message: 'Network request failed: timeout',
          url: '/api/amazon/availability',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          timestamp: Date.now() - 900000, // 15 minutes ago
          sessionId: 'sess_67890',
          region: 'EU',
          device: 'mobile',
          browser: 'Safari',
          resolved: true,
          impact: {
            affectedUsers: 23,
            affectedSessions: 28
          },
          context: {
            page: '/flavors/cola-kick',
            userAction: 'affiliate_check'
          }
        },
        {
          id: 'err-003',
          type: 'api',
          severity: 'medium',
          message: '500 Internal Server Error',
          url: '/api/calculator',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: Date.now() - 1800000, // 30 minutes ago
          sessionId: 'sess_11111',
          region: 'APAC',
          device: 'desktop',
          browser: 'Chrome',
          resolved: false,
          impact: {
            affectedUsers: 12,
            affectedSessions: 15
          },
          context: {
            page: '/calculator',
            userAction: 'calculate_recipe'
          }
        }
      ];

      const mockErrorPatterns: ErrorPattern[] = [
        {
          id: 'pattern-001',
          name: 'Recipe Loading Failures',
          description: 'Frequent failures when loading recipe data from API',
          errorType: 'javascript',
          frequency: 127,
          trend: 'increasing',
          impact: 'high',
          firstOccurrence: Date.now() - 86400000, // 1 day ago
          lastOccurrence: Date.now() - 300000, // 5 minutes ago
          affectedUsers: 89,
          resolution: {
            status: 'fixing',
            assignee: 'Backend Team',
            estimatedResolution: Date.now() + 3600000 // 1 hour
          },
          prevention: [
            'Implement better error handling for API failures',
            'Add fallback data for offline scenarios',
            'Improve retry logic with exponential backoff'
          ]
        },
        {
          id: 'pattern-002',
          name: 'Mobile Calculator Crashes',
          description: 'Calculator crashes on mobile devices during complex calculations',
          errorType: 'javascript',
          frequency: 45,
          trend: 'stable',
          impact: 'medium',
          firstOccurrence: Date.now() - 172800000, // 2 days ago
          lastOccurrence: Date.now() - 1800000, // 30 minutes ago
          affectedUsers: 34,
          resolution: {
            status: 'identified',
            assignee: 'Mobile Team'
          },
          prevention: [
            'Optimize memory usage for complex calculations',
            'Add input validation for edge cases',
            'Implement progress indicators for long calculations'
          ]
        },
        {
          id: 'pattern-003',
          name: 'Amazon API Timeouts',
          description: 'Timeout errors when fetching Amazon product data',
          errorType: 'network',
          frequency: 23,
          trend: 'decreasing',
          impact: 'low',
          firstOccurrence: Date.now() - 259200000, // 3 days ago
          lastOccurrence: Date.now() - 3600000, // 1 hour ago
          affectedUsers: 18,
          resolution: {
            status: 'resolved',
            actualResolution: Date.now() - 7200000 // 2 hours ago
          },
          prevention: [
            'Implement circuit breaker pattern',
            'Add request timeout configuration',
            'Cache frequently requested data'
          ]
        }
      ];

      const mockAlertWorkflows: AlertWorkflow[] = [
        {
          id: 'workflow-001',
          name: 'Critical Error Alert',
          description: 'Immediate alert for critical errors affecting user experience',
          trigger: {
            errorType: 'all',
            severity: 'critical',
            threshold: 5,
            timeWindow: 15
          },
          actions: [
            {
              type: 'email',
              target: 'dev-team@company.com',
              config: { template: 'critical_error' }
            },
            {
              type: 'slack',
              target: '#alerts',
              config: { channel: 'engineering-alerts' }
            },
            {
              type: 'pagerduty',
              target: 'oncall-engineer',
              config: { service: 'soda-platform' }
            }
          ],
          escalation: {
            enabled: true,
            levels: [
              {
                delay: 30,
                action: 'escalate_to_manager',
                target: 'engineering-manager@company.com'
              },
              {
                delay: 60,
                action: 'escalate_to_director',
                target: 'engineering-director@company.com'
              }
            ]
          },
          status: 'active'
        },
        {
          id: 'workflow-002',
          name: 'Pattern Detection Alert',
          description: 'Alert when error patterns are detected',
          trigger: {
            errorType: 'javascript',
            severity: 'high',
            threshold: 20,
            timeWindow: 60
          },
          actions: [
            {
              type: 'email',
              target: 'quality-team@company.com',
              config: { template: 'pattern_detected' }
            },
            {
              type: 'webhook',
              target: 'https://hooks.company.com/error-patterns',
              config: { method: 'POST' }
            }
          ],
          escalation: {
            enabled: false,
            levels: []
          },
          status: 'active'
        }
      ];

      const mockErrorMetrics: ErrorMetrics = {
        total: 342,
        byType: {
          javascript: 156,
          network: 89,
          api: 67,
          performance: 23,
          security: 5,
          user: 2
        },
        bySeverity: {
          critical: 12,
          high: 45,
          medium: 123,
          low: 162
        },
        byRegion: {
          US: 145,
          EU: 98,
          APAC: 67,
          Other: 32
        },
        byDevice: {
          mobile: 189,
          desktop: 123,
          tablet: 30
        },
        resolved: 289,
        avgResolutionTime: 45, // minutes
        trend24h: -12.5, // 12.5% decrease
        topErrors: [
          {
            message: 'TypeError: Cannot read property \'map\' of undefined',
            count: 45,
            trend: 15.2
          },
          {
            message: 'Network request timeout',
            count: 32,
            trend: -8.5
          },
          {
            message: '500 Internal Server Error',
            count: 28,
            trend: 5.1
          }
        ]
      };

      setErrorEvents(mockErrorEvents);
      setErrorPatterns(mockErrorPatterns);
      setAlertWorkflows(mockAlertWorkflows);
      setErrorMetrics(mockErrorMetrics);
    } catch (error) {
      console.error('Failed to fetch error monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrorData();

    if (autoRefresh) {
      const interval = setInterval(fetchErrorData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchErrorData, autoRefresh]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (trend < 0) return <TrendingUp className="h-4 w-4 text-green-600 transform rotate-180" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getResolutionStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fixing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'identified': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'monitoring': return <Activity className="h-4 w-4 text-purple-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredEvents = errorEvents.filter(event => {
    if (selectedSeverity !== 'all' && event.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && event.type !== selectedType) return false;
    if (searchQuery && !event.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!getConsentStatus().analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Analytics Consent Required
            </CardTitle>
            <CardDescription>
              Error monitoring dashboard requires analytics consent to function.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Error Monitoring & Alerting
          </h1>
          <p className="text-muted-foreground">
            Comprehensive error tracking, analysis, and automated alerting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "secondary"} className="cursor-pointer"
                 onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Badge>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading error monitoring data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Error Events</TabsTrigger>
            <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
            <TabsTrigger value="alerts">Alert Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Error Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                  <Bug className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{errorMetrics?.total || 0}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(errorMetrics?.trend24h || 0)}
                    <span className={errorMetrics && errorMetrics.trend24h < 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(errorMetrics?.trend24h || 0).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs 24h ago</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{errorMetrics?.bySeverity.critical || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Immediate attention required
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {errorMetrics ? Math.round((errorMetrics.resolved / errorMetrics.total) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {errorMetrics?.resolved || 0} resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{errorMetrics?.avgResolutionTime || 0}m</div>
                  <p className="text-xs text-muted-foreground">
                    {errorMetrics && errorMetrics.avgResolutionTime < 60 ? 'Excellent' : 
                     errorMetrics && errorMetrics.avgResolutionTime < 120 ? 'Good' : 'Needs Improvement'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Error Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Errors by Type</CardTitle>
                  <CardDescription>Distribution of error types across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errorMetrics && Object.entries(errorMetrics.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <Progress 
                            value={(count / errorMetrics.total) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Errors by Device</CardTitle>
                  <CardDescription>Error distribution across device types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errorMetrics && Object.entries(errorMetrics.byDevice).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device === 'mobile' ? <Smartphone className="h-4 w-4" /> : 
                           device === 'desktop' ? <Monitor className="h-4 w-4" /> : 
                           <Monitor className="h-4 w-4" />}
                          <span className="text-sm font-medium capitalize">{device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <Progress 
                            value={(count / errorMetrics.total) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Most Frequent Errors</CardTitle>
                <CardDescription>Errors occurring most frequently in the selected timeframe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorMetrics?.topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{error.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{error.count} occurrences</Badge>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(error.trend)}
                            <span className="text-xs text-muted-foreground">
                              {error.trend > 0 ? '+' : ''}{error.trend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Events List */}
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className={getSeverityColor(event.severity)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadgeVariant(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {event.type}
                        </Badge>
                        {event.resolved ? (
                          <Badge variant="default">Resolved</Badge>
                        ) : (
                          <Badge variant="destructive">Active</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <CardTitle className="text-base">{event.message}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">URL:</span>
                        <p className="text-muted-foreground">{event.url}</p>
                      </div>
                      <div>
                        <span className="font-medium">Region:</span>
                        <p className="text-muted-foreground">{event.region}</p>
                      </div>
                      <div>
                        <span className="font-medium">Device:</span>
                        <p className="text-muted-foreground">{event.device} - {event.browser}</p>
                      </div>
                      <div>
                        <span className="font-medium">Impact:</span>
                        <p className="text-muted-foreground">{event.impact.affectedUsers} users affected</p>
                      </div>
                    </div>
                    
                    {event.stack && (
                      <div className="mt-4 p-3 bg-black/5 rounded text-xs font-mono">
                        <span className="font-medium">Stack Trace:</span>
                        <pre className="mt-1 whitespace-pre-wrap">{event.stack}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {/* Error Patterns */}
            <div className="space-y-4">
              {errorPatterns.map((pattern) => (
                <Card key={pattern.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getResolutionStatusIcon(pattern.resolution.status)}
                        {pattern.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          pattern.impact === 'high' ? 'border-red-500 text-red-700' :
                          pattern.impact === 'medium' ? 'border-yellow-500 text-yellow-700' :
                          'border-green-500 text-green-700'
                        }>
                          {pattern.impact} impact
                        </Badge>
                        <Badge variant="outline">{pattern.frequency} occurrences</Badge>
                      </div>
                    </div>
                    <CardDescription>{pattern.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Pattern Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>First occurrence:</span>
                            <span>{new Date(pattern.firstOccurrence).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last occurrence:</span>
                            <span>{new Date(pattern.lastOccurrence).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Affected users:</span>
                            <span>{pattern.affectedUsers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Trend:</span>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(pattern.trend === 'increasing' ? 5 : pattern.trend === 'decreasing' ? -5 : 0)}
                              <span className="capitalize">{pattern.trend}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Resolution Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="capitalize">{pattern.resolution.status}</span>
                          </div>
                          {pattern.resolution.assignee && (
                            <div className="flex justify-between">
                              <span>Assignee:</span>
                              <span>{pattern.resolution.assignee}</span>
                            </div>
                          )}
                          {pattern.resolution.estimatedResolution && (
                            <div className="flex justify-between">
                              <span>ETA:</span>
                              <span>{new Date(pattern.resolution.estimatedResolution).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Prevention Measures</h4>
                      <ul className="text-sm space-y-1">
                        {pattern.prevention.map((measure, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {/* Alert Workflows */}
            <div className="space-y-4">
              {alertWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{workflow.name}</CardTitle>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <CardDescription>{workflow.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Trigger Conditions</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Error Type:</span>
                            <span className="capitalize">{workflow.trigger.errorType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Severity:</span>
                            <span className="capitalize">{workflow.trigger.severity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Threshold:</span>
                            <span>{workflow.trigger.threshold} errors</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time Window:</span>
                            <span>{workflow.trigger.timeWindow} minutes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="space-y-2">
                          {workflow.actions.map((action, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="capitalize">
                                {action.type}
                              </Badge>
                              <span>{action.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {workflow.escalation.enabled && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Escalation Levels</h4>
                        <div className="space-y-1 text-sm">
                          {workflow.escalation.levels.map((level, index) => (
                            <div key={index} className="flex justify-between">
                              <span>After {level.delay} minutes:</span>
                              <span>{level.action} → {level.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default ErrorMonitoringDashboard;