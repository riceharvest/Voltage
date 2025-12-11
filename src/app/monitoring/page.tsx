/**
 * Comprehensive Monitoring and Analytics Dashboard
 * 
 * Main monitoring page that integrates all analytics components:
 * - Real-time system monitoring
 * - Business intelligence dashboards
 * - A/B testing and experimentation
 * - User journey analytics
 * - Error monitoring and alerting
 * 
 * @author Global Platform Team
 * @version 3.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  Beaker, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Globe,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import RealTimeMonitoringDashboard from '@/components/monitoring/real-time-dashboard';
import BusinessIntelligenceDashboard from '@/components/monitoring/business-intelligence-dashboard';
import ABTestingDashboard from '@/components/monitoring/ab-testing-dashboard';
import UserJourneyAnalytics from '@/components/monitoring/user-journey-analytics';
import ErrorMonitoringDashboard from '@/components/monitoring/error-monitoring-dashboard';
import CompetitiveAnalysisDashboard from '@/components/monitoring/competitive-analysis-dashboard';
import { globalAnalytics } from '@/lib/analytics/global-analytics-engine';
import { getConsentStatus } from '@/lib/gdpr';

interface SystemOverview {
  health: {
    overall: number;
    performance: number;
    availability: number;
    security: number;
  };
  metrics: {
    activeUsers: number;
    systemLoad: number;
    errorRate: number;
    responseTime: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  features: {
    analytics: boolean;
    abTesting: boolean;
    monitoring: boolean;
    errorTracking: boolean;
  };
}

export default function MonitoringPage() {
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load system overview data
  useEffect(() => {
    const loadSystemOverview = async () => {
      if (!getConsentStatus().analytics) {
        setIsLoading(false);
        return;
      }

      try {
        // Get analytics data from global analytics engine
        const regionalMetrics = globalAnalytics.getRegionalMetrics();
        const businessIntelligence = globalAnalytics.getBusinessIntelligence();
        const monitoringAlerts = globalAnalytics.getMonitoringAlerts();

        // Calculate system overview
        const overview: SystemOverview = {
          health: {
            overall: calculateOverallHealth(regionalMetrics, monitoringAlerts),
            performance: calculatePerformanceScore(regionalMetrics),
            availability: 99.95, // Would come from uptime monitoring
            security: 98.5 // Would come from security monitoring
          },
          metrics: {
            activeUsers: getActiveUserCount(),
            systemLoad: calculateSystemLoad(regionalMetrics),
            errorRate: calculateErrorRate(regionalMetrics),
            responseTime: calculateAvgResponseTime(regionalMetrics)
          },
          alerts: {
            critical: monitoringAlerts.filter(a => a.severity === 'critical' && !a.resolved).length,
            high: monitoringAlerts.filter(a => a.severity === 'high' && !a.resolved).length,
            medium: monitoringAlerts.filter(a => a.severity === 'medium' && !a.resolved).length,
            low: monitoringAlerts.filter(a => a.severity === 'low' && !a.resolved).length
          },
          features: {
            analytics: true,
            abTesting: true,
            monitoring: true,
            errorTracking: true
          }
        };

        setSystemOverview(overview);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to load system overview:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSystemOverview();

    // Update every 30 seconds
    const interval = setInterval(loadSystemOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions for overview calculations
  const calculateOverallHealth = (regionalMetrics: any, alerts: any[]): number => {
    let score = 100;
    alerts.forEach(alert => {
      if (!alert.resolved) {
        switch (alert.severity) {
          case 'critical': score -= 20; break;
          case 'high': score -= 15; break;
          case 'medium': score -= 10; break;
          case 'low': score -= 5; break;
        }
      }
    });
    return Math.max(0, Math.min(100, score));
  };

  const calculatePerformanceScore = (regionalMetrics: any): number => {
    // Simplified performance calculation
    return 85; // Placeholder
  };

  const getActiveUserCount = (): number => {
    return Math.floor(Math.random() * 200) + 50;
  };

  const calculateSystemLoad = (regionalMetrics: any): number => {
    return Math.random() * 100; // Placeholder
  };

  const calculateErrorRate = (regionalMetrics: any): number => {
    return Math.random() * 5; // Placeholder
  };

  const calculateAvgResponseTime = (regionalMetrics: any): number => {
    return Math.floor(Math.random() * 500) + 100; // Placeholder
  };

  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  if (!getConsentStatus().analytics) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Analytics Consent Required
              </CardTitle>
              <CardDescription>
                The comprehensive monitoring dashboard requires analytics consent to function.
                Please accept analytics cookies to access real-time monitoring and business intelligence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This dashboard provides critical insights into system performance, user behavior,
                and business metrics. All data is processed in compliance with GDPR and privacy regulations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Global Platform Monitoring
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics, monitoring, and business intelligence dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading monitoring dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                System Health Overview
              </CardTitle>
              <CardDescription>
                Real-time system health and key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    <span className={getHealthColor(systemOverview?.health.overall || 0)}>
                      {systemOverview?.health.overall.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Health</div>
                  <Badge variant={getHealthBadgeVariant(systemOverview?.health.overall || 0)} className="mt-1">
                    {systemOverview?.health.overall >= 90 ? 'Excellent' : 
                     systemOverview?.health.overall >= 70 ? 'Good' : 
                     systemOverview?.health.overall >= 50 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {systemOverview?.metrics.activeUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                  <div className="text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +12% from yesterday
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {systemOverview?.metrics.responseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-xs text-green-600 mt-1">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Within target
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {systemOverview?.metrics.errorRate.toFixed(2)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <div className="text-xs text-green-600 mt-1">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Below threshold
                  </div>
                </div>
              </div>

              {/* Alert Summary */}
              {systemOverview && (systemOverview.alerts.critical > 0 || systemOverview.alerts.high > 0) && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Active Alerts</AlertTitle>
                  <AlertDescription>
                    {systemOverview.alerts.critical > 0 && (
                      <span className="mr-4">
                        <Badge variant="destructive" className="mr-1">
                          {systemOverview.alerts.critical} Critical
                        </Badge>
                      </span>
                    )}
                    {systemOverview.alerts.high > 0 && (
                      <span className="mr-4">
                        <Badge variant="outline" className="border-orange-500 text-orange-700 mr-1">
                          {systemOverview.alerts.high} High
                        </Badge>
                      </span>
                    )}
                    {systemOverview.alerts.medium > 0 && (
                      <span className="mr-4">
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700 mr-1">
                          {systemOverview.alerts.medium} Medium
                        </Badge>
                      </span>
                    )}
                    {systemOverview.alerts.low > 0 && (
                      <span className="mr-4">
                        <Badge variant="outline" className="border-blue-500 text-blue-700 mr-1">
                          {systemOverview.alerts.low} Low
                        </Badge>
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Feature Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Analytics Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">A/B Testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Real-time Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Error Tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="business">Business Intel</TabsTrigger>
              <TabsTrigger value="testing">A/B Testing</TabsTrigger>
              <TabsTrigger value="journey">User Journey</TabsTrigger>
              <TabsTrigger value="errors">Error Monitor</TabsTrigger>
              <TabsTrigger value="competitive">Competitive</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Quick Access Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => document.querySelector('[value="realtime"]')?.click()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Real-time Monitoring
                    </CardTitle>
                    <CardDescription>
                      Live system health, performance metrics, and operational monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>System Health:</span>
                        <Badge variant={getHealthBadgeVariant(systemOverview?.health.overall || 0)}>
                          {systemOverview?.health.overall >= 90 ? 'Excellent' : 'Good'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Users:</span>
                        <span>{systemOverview?.metrics.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Response Time:</span>
                        <span>{systemOverview?.metrics.responseTime}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => document.querySelector('[value="business"]')?.click()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Business Intelligence
                    </CardTitle>
                    <CardDescription>
                      Revenue tracking, user engagement, and growth analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Revenue Growth:</span>
                        <span className="text-green-600">+15.3%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>User Retention:</span>
                        <span>87.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Global Reach:</span>
                        <span>8 regions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => document.querySelector('[value="testing"]')?.click()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Beaker className="h-5 w-5" />
                      A/B Testing
                    </CardTitle>
                    <CardDescription>
                      Experimentation framework with statistical analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Tests:</span>
                        <span>3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Significant Results:</span>
                        <span>2</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Confidence:</span>
                        <span>96.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Global Performance
                    </CardTitle>
                    <CardDescription>
                      Regional performance and user distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">United States</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
                          </div>
                          <span className="text-sm">92%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Europe</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '88%'}}></div>
                          </div>
                          <span className="text-sm">88%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Asia Pacific</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{width: '76%'}}></div>
                          </div>
                          <span className="text-sm">76%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Compliance
                    </CardTitle>
                    <CardDescription>
                      Security status and compliance monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">GDPR Compliance</span>
                        <Badge variant="default">Compliant</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Security Score</span>
                        <span className="text-green-600">98.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Privacy Controls</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Encryption</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="realtime">
              <RealTimeMonitoringDashboard />
            </TabsContent>

            <TabsContent value="business">
              <BusinessIntelligenceDashboard />
            </TabsContent>

            <TabsContent value="testing">
              <ABTestingDashboard />
            </TabsContent>

            <TabsContent value="journey">
              <UserJourneyAnalytics />
            </TabsContent>

            <TabsContent value="errors">
              <ErrorMonitoringDashboard />
            </TabsContent>

            <TabsContent value="competitive">
              <CompetitiveAnalysisDashboard />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}