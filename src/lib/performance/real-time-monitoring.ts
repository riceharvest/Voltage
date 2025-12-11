/**
 * Real-time Performance Monitoring System
 * Provides comprehensive performance tracking, alerting, and optimization for global scale
 */

import { cache } from '../cache';
import { logger } from '../logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  region?: string;
  endpoint?: string;
  userAgent?: string;
}

interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  duration: number;
}

interface MonitoringAlert {
  id: string;
  metric: string;
  level: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  region: string;
  resolved: boolean;
}

interface CoreWebVitals {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
  FMP: number; // First Meaningful Paint
}

interface UserExperienceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  domContentLoaded: number;
  resourceLoadTime: number;
  networkLatency: number;
  errorRate: number;
  userSatisfaction: number;
}

class RealTimePerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private alerts: Map<string, MonitoringAlert> = new Map();
  private webVitals: CoreWebVitals | null = null;
  private uxMetrics: UserExperienceMetrics | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alert: MonitoringAlert) => void)[] = [];

  private readonly defaultThresholds: PerformanceThreshold[] = [
    { metric: 'page_load_time', warning: 2000, critical: 5000, unit: 'ms', duration: 300000 },
    { metric: 'api_response_time', warning: 500, critical: 2000, unit: 'ms', duration: 180000 },
    { metric: 'memory_usage', warning: 80, critical: 95, unit: 'percent', duration: 600000 },
    { metric: 'cpu_usage', warning: 70, critical: 90, unit: 'percent', duration: 600000 },
    { metric: 'error_rate', warning: 1, critical: 5, unit: 'percent', duration: 300000 },
    { metric: 'cache_hit_rate', warning: 70, critical: 50, unit: 'percent', duration: 600000 },
    { metric: 'largest_contentful_paint', warning: 2500, critical: 4000, unit: 'ms', duration: 300000 },
    { metric: 'first_input_delay', warning: 100, critical: 300, unit: 'ms', duration: 300000 }
  ];

  constructor() {
    this.initializeThresholds();
    this.startRealTimeMonitoring();
    this.initializeCoreWebVitals();
  }

  // Core Web Vitals tracking
  initializeCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track First Contentful Paint
    this.observeMetric('FCP', (entries) => {
      const fcp = entries[0];
      this.recordMetric('largest_contentful_paint', fcp.startTime, 'ms');
    }, { entryTypes: ['paint'] });

    // Track Largest Contentful Paint
    this.observeMetric('LCP', (entries) => {
      const lcp = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lcp.startTime, 'ms');
    }, { entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay
    this.observeMetric('FID', (entries) => {
      const fid = entries[0];
      this.recordMetric('first_input_delay', fid.processingStart - fid.startTime, 'ms');
    }, { entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift
    this.observeMetric('CLS', (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('cumulative_layout_shift', clsValue, 'score');
    }, { entryTypes: ['layout-shift'] });

    // Track Time to First Byte
    this.measureTTFB();
  }

  private observeMetric(
    name: string,
    callback: (entries: PerformanceEntryList) => void,
    options?: PerformanceObserverInit
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe(options || {});
    } catch (error) {
      logger.warn(`Failed to observe metric: ${name}`, error);
    }
  }

  private measureTTFB(): void {
    // TTFB is measured from navigation start to first byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.recordMetric('time_to_first_byte', ttfb, 'ms');
    }
  }

  // Real-time metric recording
  recordMetric(name: string, value: number, unit: string, region?: string, endpoint?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      region,
      endpoint,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    // Store in memory for real-time analysis
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentMetrics = this.metrics.get(name)!.filter(m => m.timestamp > oneHourAgo);
    this.metrics.set(name, recentMetrics);

    // Check thresholds
    this.checkThresholds(name, value, region);

    // Store in cache for persistence
    this.cacheMetric(metric);
  }

  // Threshold monitoring and alerting
  private checkThresholds(metricName: string, value: number, region?: string): void {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) return;

    const regionKey = region || 'global';
    const alertKey = `${metricName}:${regionKey}`;
    
    let alertLevel: 'warning' | 'critical' | null = null;

    if (value >= threshold.critical) {
      alertLevel = 'critical';
    } else if (value >= threshold.warning) {
      alertLevel = 'warning';
    }

    if (alertLevel) {
      // Check if we already have an active alert for this metric
      const existingAlert = this.alerts.get(alertKey);
      
      if (!existingAlert || Date.now() - existingAlert.timestamp > threshold.duration) {
        // Create new alert
        const alert: MonitoringAlert = {
          id: alertKey,
          metric: metricName,
          level: alertLevel,
          message: `${metricName} ${alertLevel} threshold exceeded: ${value}${threshold.unit} (threshold: ${threshold.warning}${threshold.unit})`,
          value,
          threshold: threshold.warning,
          timestamp: Date.now(),
          region: regionKey,
          resolved: false
        };

        this.alerts.set(alertKey, alert);
        this.triggerAlert(alert);
      }
    } else {
      // Resolve existing alert if value is back to normal
      const existingAlert = this.alerts.get(alertKey);
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
        this.triggerAlertResolution(existingAlert);
      }
    }
  }

  private triggerAlert(alert: MonitoringAlert): void {
    logger.warn('Performance Alert Triggered', {
      alert,
      metrics: this.getRecentMetrics(alert.metric)
    });

    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Alert callback failed', error);
      }
    });

    // Send to external monitoring services
    this.sendAlertToExternalServices(alert);
  }

  private triggerAlertResolution(alert: MonitoringAlert): void {
    logger.info('Performance Alert Resolved', { alert });
    
    // Send resolution notification
    // In production, this would notify monitoring systems
  }

  private sendAlertToExternalServices(alert: MonitoringAlert): void {
    // In production, this would send alerts to:
    // - Slack/Teams
    // - PagerDuty
    // - Email
    // - External monitoring services
  }

  // User Experience Monitoring
  updateUserExperienceMetrics(metrics: Partial<UserExperienceMetrics>): void {
    this.uxMetrics = { ...this.uxMetrics, ...metrics } as UserExperienceMetrics;
    
    // Record individual metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        this.recordMetric(`ux_${key}`, value, this.getMetricUnit(key));
      }
    });

    // Calculate user satisfaction score
    this.calculateUserSatisfaction();
  }

  private calculateUserSatisfaction(): void {
    if (!this.uxMetrics) return;

    const { pageLoadTime, timeToInteractive, errorRate } = this.uxMetrics;
    
    // Simple satisfaction score calculation
    let score = 100;
    
    // Deduct points for slow load times
    if (pageLoadTime > 3000) score -= 20;
    else if (pageLoadTime > 2000) score -= 10;
    
    if (timeToInteractive > 5000) score -= 15;
    else if (timeToInteractive > 3000) score -= 8;
    
    // Deduct points for errors
    score -= Math.min(errorRate * 10, 50);
    
    this.uxMetrics.userSatisfaction = Math.max(0, score);
    
    // Record satisfaction metric
    this.recordMetric('user_satisfaction', this.uxMetrics.userSatisfaction, 'score');
  }

  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      pageLoadTime: 'ms',
      timeToInteractive: 'ms',
      domContentLoaded: 'ms',
      resourceLoadTime: 'ms',
      networkLatency: 'ms',
      errorRate: 'percent',
      userSatisfaction: 'score'
    };
    return units[metric] || 'ms';
  }

  // Regional performance comparison
  getRegionalPerformanceComparison(): any {
    const regions = new Set<string>();
    const regionMetrics: Record<string, Record<string, PerformanceMetric[]>> = {};

    // Collect metrics by region
    this.metrics.forEach((metrics, metricName) => {
      metrics.forEach(metric => {
        if (metric.region) {
          regions.add(metric.region);
          if (!regionMetrics[metric.region]) {
            regionMetrics[metric.region] = {};
          }
          if (!regionMetrics[metric.region][metricName]) {
            regionMetrics[metric.region][metricName] = [];
          }
          regionMetrics[metric.region][metricName].push(metric);
        }
      });
    });

    // Calculate averages per region
    const comparison: Record<string, any> = {};
    
    regions.forEach(region => {
      comparison[region] = {};
      
      Object.entries(regionMetrics[region]).forEach(([metricName, metrics]) => {
        const average = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        comparison[region][metricName] = {
          average: Math.round(average * 100) / 100,
          count: metrics.length,
          latest: metrics[metrics.length - 1]?.value
        };
      });
    });

    return comparison;
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze recent metrics
    const recentMetrics = this.getRecentMetrics('page_load_time');
    if (recentMetrics.length > 10) {
      const avgLoadTime = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      
      if (avgLoadTime > 3000) {
        recommendations.push('Consider implementing more aggressive caching strategies to reduce page load times');
        recommendations.push('Optimize images and implement lazy loading for better performance');
      }
    }

    // Check cache hit rates
    const cacheMetrics = this.getRecentMetrics('cache_hit_rate');
    if (cacheMetrics.length > 5) {
      const avgHitRate = cacheMetrics.reduce((sum, m) => sum + m.value, 0) / cacheMetrics.length;
      
      if (avgHitRate < 80) {
        recommendations.push('Review cache configuration to improve hit rates');
        recommendations.push('Consider implementing cache warming strategies for critical data');
      }
    }

    // Check error rates
    const errorMetrics = this.getRecentMetrics('error_rate');
    if (errorMetrics.length > 5) {
      const avgErrorRate = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length;
      
      if (avgErrorRate > 2) {
        recommendations.push('Investigate and resolve high error rates affecting user experience');
        recommendations.push('Implement better error handling and fallback mechanisms');
      }
    }

    // Check Core Web Vitals
    const lcpMetrics = this.getRecentMetrics('largest_contentful_paint');
    if (lcpMetrics.length > 3) {
      const avgLCP = lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length;
      
      if (avgLCP > 2500) {
        recommendations.push('Optimize Largest Contentful Paint by improving server response times and resource loading');
      }
    }

    return recommendations;
  }

  // Real-time monitoring lifecycle
  private startRealTimeMonitoring(): void {
    // Monitor system metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlertStatus();
      this.cleanupOldMetrics();
    }, 30000);

    // Generate performance reports every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  private collectSystemMetrics(): void {
    if (typeof window === 'undefined') return;

    // Memory usage
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      this.recordMetric('memory_usage', memoryUsage, 'percent');
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.navigationStart, 'ms');
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.navigationStart, 'ms');
    }

    // Network information (if available)
    const connection = (navigator as any).connection;
    if (connection) {
      this.recordMetric('network_latency', connection.rtt || 0, 'ms');
    }
  }

  private checkAlertStatus(): void {
    // Check if any alerts need to be escalated or resolved
    this.alerts.forEach((alert, key) => {
      if (!alert.resolved) {
        const threshold = this.thresholds.get(alert.metric);
        if (threshold) {
          const timeSinceAlert = Date.now() - alert.timestamp;
          if (timeSinceAlert > threshold.duration * 2) {
            // Escalate critical alerts
            if (alert.level === 'critical') {
              this.escalateAlert(alert);
            }
          }
        }
      }
    });
  }

  private escalateAlert(alert: MonitoringAlert): void {
    logger.error('Performance Alert Escalated', { alert });
    // In production, this would trigger high-priority notifications
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - 86400000;
    
    this.metrics.forEach((metrics, key) => {
      const recentMetrics = metrics.filter(m => m.timestamp > oneDayAgo);
      if (recentMetrics.length !== metrics.length) {
        this.metrics.set(key, recentMetrics);
      }
    });
  }

  private generatePerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      recentRecommendations: this.getOptimizationRecommendations(),
      regionalComparison: this.getRegionalPerformanceComparison(),
      coreWebVitals: this.webVitals,
      userExperience: this.uxMetrics
    };

    logger.info('Performance Report Generated', report);
    
    // Store report for historical analysis
    this.storePerformanceReport(report);
  }

  private storePerformanceReport(report: any): void {
    const reportKey = `performance_report:${Date.now()}`;
    cache.set(reportKey, report, 86400); // Store for 24 hours
  }

  // Utility methods
  private getRecentMetrics(metricName: string): PerformanceMetric[] {
    const oneHourAgo = Date.now() - 3600000;
    return (this.metrics.get(metricName) || [])
      .filter(m => m.timestamp > oneHourAgo)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private async cacheMetric(metric: PerformanceMetric): Promise<void> {
    const key = `metrics:${metric.name}:${metric.timestamp}`;
    await cache.set(key, metric, 3600); // Cache for 1 hour
  }

  private initializeThresholds(): void {
    this.defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold);
    });
  }

  // Public API
  registerAlertCallback(callback: (alert: MonitoringAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  getPerformanceSummary(): any {
    return {
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      recentMetrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([name, metrics]) => [
          name,
          metrics.slice(-10) // Last 10 metrics
        ])
      ),
      recommendations: this.getOptimizationRecommendations(),
      coreWebVitals: this.webVitals,
      userExperience: this.uxMetrics,
      regionalComparison: this.getRegionalPerformanceComparison()
    };
  }

  updateThreshold(metric: string, threshold: Partial<PerformanceThreshold>): void {
    const existing = this.thresholds.get(metric);
    if (existing) {
      this.thresholds.set(metric, { ...existing, ...threshold });
    }
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.alertCallbacks = [];
  }
}

// Export singleton instance
export const performanceMonitor = new RealTimePerformanceMonitor();

export default RealTimePerformanceMonitor;
export type { PerformanceMetric, MonitoringAlert, CoreWebVitals, UserExperienceMetrics };