/**
 * Error Monitoring and Alerting System
 * Part of Production Readiness Improvements - Error Handling Enhancements
 */

import * as Sentry from '@sentry/nextjs';
import { AppError, ErrorSeverity, ErrorType, ErrorLogger } from './error-handling';

// Error Metrics Interface
export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByHour: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    type: ErrorType;
    severity: ErrorSeverity;
    lastOccurrence: Date;
  }>;
  recoveryRate: number;
  averageResolutionTime: number;
  errorTrend: 'increasing' | 'decreasing' | 'stable';
  healthScore: number; // 0-100, higher is better
}

// Alert Configuration
export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    errorRate: number; // errors per minute
    criticalErrors: number; // max critical errors per hour
    errorTypes: Partial<Record<ErrorType, number>>; // max errors per hour per type
    severity: Partial<Record<ErrorSeverity, number>>; // max errors per hour per severity
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  recipients: {
    emails: string[];
    slackChannels: string[];
    webhookUrls: string[];
  };
}

// Error Event Interface
export interface ErrorEvent {
  id: string;
  timestamp: Date;
  error: AppError;
  userId?: string;
  sessionId?: string;
  url: string;
  userAgent: string;
  context: Record<string, any>;
  resolved: boolean;
  resolutionTime?: Date;
  resolutionNote?: string;
}

// Real-time Error Monitor
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private metrics: ErrorMetrics;
  private events: ErrorEvent[] = [];
  private alertConfig: AlertConfig;
  private eventIdSet = new Set<string>();
  private lastAlertTime = new Map<string, Date>();
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.alertConfig = this.loadAlertConfig();
    this.startHealthChecks();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: Object.values(ErrorType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<ErrorType, number>),
      errorsBySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => ({ ...acc, [severity]: 0 }), {} as Record<ErrorSeverity, number>),
      errorsByHour: {},
      topErrors: [],
      recoveryRate: 0,
      averageResolutionTime: 0,
      errorTrend: 'stable',
      healthScore: 100
    };
  }

  private loadAlertConfig(): AlertConfig {
    return {
      enabled: process.env.NODE_ENV === 'production',
      thresholds: {
        errorRate: 10, // 10 errors per minute
        criticalErrors: 5, // 5 critical errors per hour
        errorTypes: {
          [ErrorType.SERVER_ERROR]: 20,
          [ErrorType.NETWORK]: 50,
          [ErrorType.DEPENDENCY]: 10
        },
        severity: {
          [ErrorSeverity.CRITICAL]: 5,
          [ErrorSeverity.HIGH]: 20,
          [ErrorSeverity.MEDIUM]: 50
        }
      },
      notifications: {
        email: process.env.NODE_ENV === 'production',
        slack: false,
        webhook: false
      },
      recipients: {
        emails: ['devops@example.com'],
        slackChannels: ['#alerts'],
        webhookUrls: []
      }
    };
  }

  // Record an error event
  recordError(error: AppError, context: Record<string, any> = {}): void {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Avoid duplicate events
    if (this.eventIdSet.has(eventId)) {
      return;
    }
    this.eventIdSet.add(eventId);

    const event: ErrorEvent = {
      id: eventId,
      timestamp: new Date(),
      error,
      context,
      url: context.url || '',
      userAgent: context.userAgent || '',
      userId: context.userId,
      sessionId: context.sessionId,
      resolved: false
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.checkAlerts(event);

    // Keep only recent events (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp.getTime() > oneDayAgo);

    // Clean up event ID set
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.eventIdSet.forEach(id => {
      const timestamp = parseInt(id.split('_')[1]);
      if (timestamp < oneHourAgo) {
        this.eventIdSet.delete(id);
      }
    });
  }

  private updateMetrics(event: ErrorEvent): void {
    const { error } = event;
    
    // Update basic counts
    this.metrics.totalErrors++;
    this.metrics.errorsByType[error.type]++;
    this.metrics.errorsBySeverity[error.severity]++;

    // Update hourly counts
    const hour = event.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    this.metrics.errorsByHour[hour] = (this.metrics.errorsByHour[hour] || 0) + 1;

    // Update top errors
    this.updateTopErrors(event);

    // Calculate recovery rate
    this.calculateRecoveryRate();

    // Calculate average resolution time
    this.calculateAverageResolutionTime();

    // Determine error trend
    this.determineErrorTrend();

    // Calculate health score
    this.calculateHealthScore();
  }

  private updateTopErrors(event: ErrorEvent): void {
    const existingError = this.metrics.topErrors.find(e => e.message === event.error.message);
    
    if (existingError) {
      existingError.count++;
      existingError.lastOccurrence = event.timestamp;
    } else {
      // Add new error to top errors
      this.metrics.topErrors.push({
        message: event.error.message,
        count: 1,
        type: event.error.type,
        severity: event.error.severity,
        lastOccurrence: event.timestamp
      });

      // Keep only top 10 errors
      this.metrics.topErrors.sort((a, b) => b.count - a.count);
      this.metrics.topErrors = this.metrics.topErrors.slice(0, 10);
    }
  }

  private calculateRecoveryRate(): void {
    const totalRecoverable = this.events.filter(e => e.error.recoverable).length;
    const recovered = this.events.filter(e => e.resolved).length;
    
    this.metrics.recoveryRate = totalRecoverable > 0 ? (recovered / totalRecoverable) * 100 : 100;
  }

  private calculateAverageResolutionTime(): void {
    const resolvedEvents = this.events.filter(e => e.resolved && e.resolutionTime);
    
    if (resolvedEvents.length === 0) {
      this.metrics.averageResolutionTime = 0;
      return;
    }

    const totalResolutionTime = resolvedEvents.reduce((sum, event) => {
      return sum + (event.resolutionTime!.getTime() - event.timestamp.getTime());
    }, 0);

    this.metrics.averageResolutionTime = totalResolutionTime / resolvedEvents.length;
  }

  private determineErrorTrend(): void {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);

    const recentErrors = this.events.filter(e => e.timestamp.getTime() > lastHour).length;
    const previousErrors = this.events.filter(e => {
      const time = e.timestamp.getTime();
      return time > twoHoursAgo && time <= lastHour;
    }).length;

    if (recentErrors > previousErrors * 1.5) {
      this.metrics.errorTrend = 'increasing';
    } else if (recentErrors < previousErrors * 0.5) {
      this.metrics.errorTrend = 'decreasing';
    } else {
      this.metrics.errorTrend = 'stable';
    }
  }

  private calculateHealthScore(): void {
    let score = 100;

    // Deduct points based on error rates
    const recentErrors = this.events.filter(e => 
      e.timestamp.getTime() > Date.now() - (60 * 60 * 1000)
    ).length;

    score -= Math.min(recentErrors * 2, 50); // Max 50 points deducted

    // Deduct points for critical errors
    const criticalErrors = this.events.filter(e => 
      e.error.severity === ErrorSeverity.CRITICAL && 
      e.timestamp.getTime() > Date.now() - (60 * 60 * 1000)
    ).length;

    score -= Math.min(criticalErrors * 10, 30); // Max 30 points deducted

    // Deduct points for low recovery rate
    if (this.metrics.recoveryRate < 80) {
      score -= (80 - this.metrics.recoveryRate) * 0.5;
    }

    this.metrics.healthScore = Math.max(0, Math.min(100, score));
  }

  private checkAlerts(event: ErrorEvent): void {
    if (!this.alertConfig.enabled) return;

    const { error } = event;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneMinuteAgo = new Date(now.getTime() - (60 * 1000));

    // Check error rate (per minute)
    const recentErrors = this.events.filter(e => e.timestamp > oneMinuteAgo).length;
    if (recentErrors > this.alertConfig.thresholds.errorRate) {
      this.triggerAlert('high_error_rate', `High error rate: ${recentErrors} errors in the last minute`);
    }

    // Check critical errors (per hour)
    const criticalErrors = this.events.filter(e => 
      e.error.severity === ErrorSeverity.CRITICAL && e.timestamp > oneHourAgo
    ).length;
    
    if (criticalErrors > this.alertConfig.thresholds.criticalErrors) {
      this.triggerAlert('critical_errors', `Too many critical errors: ${criticalErrors} in the last hour`);
    }

    // Check error type thresholds
    const typeThreshold = this.alertConfig.thresholds.errorTypes[error.type];
    if (typeThreshold) {
      const typeErrors = this.events.filter(e => 
        e.error.type === error.type && e.timestamp > oneHourAgo
      ).length;
      
      if (typeErrors > typeThreshold) {
        this.triggerAlert('error_type_threshold', `Too many ${error.type} errors: ${typeErrors} in the last hour`);
      }
    }

    // Check severity thresholds
    const severityThreshold = this.alertConfig.thresholds.severity[error.severity];
    if (severityThreshold) {
      const severityErrors = this.events.filter(e => 
        e.error.severity === error.severity && e.timestamp > oneHourAgo
      ).length;
      
      if (severityErrors > severityThreshold) {
        this.triggerAlert('severity_threshold', `Too many ${error.severity} errors: ${severityErrors} in the last hour`);
      }
    }
  }

  private triggerAlert(type: string, message: string): void {
    const now = new Date();
    const lastAlert = this.lastAlertTime.get(type);
    
    // Rate limit alerts (don't spam)
    if (lastAlert && now.getTime() - lastAlert.getTime() < (15 * 60 * 1000)) {
      return; // 15 minutes cooldown
    }

    this.lastAlertTime.set(type, now);

    // Send notifications
    if (this.alertConfig.notifications.email) {
      this.sendEmailAlert(type, message);
    }
    
    if (this.alertConfig.notifications.slack) {
      this.sendSlackAlert(type, message);
    }
    
    if (this.alertConfig.notifications.webhook) {
      this.sendWebhookAlert(type, message);
    }

    // Log alert
    console.warn(`[ALERT] ${type}: ${message}`);
  }

  private async sendEmailAlert(type: string, message: string): Promise<void> {
    // Implement email sending logic
    console.log(`Email alert: ${type} - ${message}`);
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
  }

  private async sendSlackAlert(type: string, message: string): Promise<void> {
    // Implement Slack webhook sending
    console.log(`Slack alert: ${type} - ${message}`);
    // This would integrate with Slack API
  }

  private async sendWebhookAlert(type: string, message: string): Promise<void> {
    // Implement webhook posting
    console.log(`Webhook alert: ${type} - ${message}`);
    // This would post to configured webhook URLs
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private performHealthCheck(): void {
    const healthScore = this.metrics.healthScore;
    
    if (healthScore < 50) {
      this.triggerAlert('low_health_score', `System health score is low: ${healthScore}`);
    }

    // Check for stuck errors (errors that haven't been resolved in a long time)
    const stuckErrors = this.events.filter(e => {
      const age = Date.now() - e.timestamp.getTime();
      return !e.resolved && age > (24 * 60 * 60 * 1000); // 24 hours
    });

    if (stuckErrors.length > 0) {
      this.triggerAlert('stuck_errors', `${stuckErrors.length} errors have been unresolved for over 24 hours`);
    }
  }

  // Public methods for accessing data
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getRecentEvents(limit: number = 50): ErrorEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getEventsByType(type: ErrorType): ErrorEvent[] {
    return this.events.filter(e => e.error.type === type);
  }

  getEventsBySeverity(severity: ErrorSeverity): ErrorEvent[] {
    return this.events.filter(e => e.error.severity === severity);
  }

  resolveEvent(eventId: string, resolutionNote?: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (event && !event.resolved) {
      event.resolved = true;
      event.resolutionTime = new Date();
      event.resolutionNote = resolutionNote;
      
      this.calculateRecoveryRate();
      this.calculateAverageResolutionTime();
      
      return true;
    }
    return false;
  }

  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Performance Monitoring Integration
export class ErrorPerformanceMonitor {
  private static operationMetrics = new Map<string, {
    totalOperations: number;
    failedOperations: number;
    averageDuration: number;
    lastExecution: Date;
    errorRate: number;
  }>();

  static startOperation(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordOperationResult(operationName, duration, false);
    };
  }

  static recordOperationResult(
    operationName: string, 
    duration: number, 
    failed: boolean
  ): void {
    const metrics = this.operationMetrics.get(operationName) || {
      totalOperations: 0,
      failedOperations: 0,
      averageDuration: 0,
      lastExecution: new Date(),
      errorRate: 0
    };

    metrics.totalOperations++;
    if (failed) {
      metrics.failedOperations++;
    }
    
    // Update average duration
    metrics.averageDuration = ((metrics.averageDuration * (metrics.totalOperations - 1)) + duration) / metrics.totalOperations;
    metrics.lastExecution = new Date();
    metrics.errorRate = (metrics.failedOperations / metrics.totalOperations) * 100;

    this.operationMetrics.set(operationName, metrics);
  }

  static getOperationMetrics(operationName: string) {
    return this.operationMetrics.get(operationName);
  }

  static getAllOperationMetrics() {
    return Object.fromEntries(this.operationMetrics);
  }
}

// Error Analytics
export class ErrorAnalytics {
  static generateReport(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): {
    summary: ErrorMetrics;
    trends: any;
    recommendations: string[];
  } {
    const monitor = ErrorMonitor.getInstance();
    const metrics = monitor.getMetrics();
    
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      summary: metrics,
      trends: this.calculateTrends(timeRange),
      recommendations
    };
  }

  private static generateRecommendations(metrics: ErrorMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.errorTrend === 'increasing') {
      recommendations.push('Error rate is increasing. Investigate recent deployments or system changes.');
    }

    if (metrics.recoveryRate < 80) {
      recommendations.push('Low error recovery rate. Consider improving retry mechanisms and fallback strategies.');
    }

    if (metrics.healthScore < 70) {
      recommendations.push('System health score is below acceptable threshold. Immediate attention required.');
    }

    const networkErrors = metrics.errorsByType[ErrorType.NETWORK];
    if (networkErrors > metrics.totalErrors * 0.3) {
      recommendations.push('High proportion of network errors. Check network infrastructure and external dependencies.');
    }

    const serverErrors = metrics.errorsByType[ErrorType.SERVER_ERROR];
    if (serverErrors > 10) {
      recommendations.push('Multiple server errors detected. Review server logs and system resources.');
    }

    if (metrics.averageResolutionTime > 30 * 60 * 1000) { // 30 minutes
      recommendations.push('Average error resolution time is too high. Improve monitoring and alerting systems.');
    }

    return recommendations;
  }

  private static calculateTrends(timeRange: string): any {
    // This would calculate actual trends based on historical data
    // For now, return placeholder data
    return {
      errorRateTrend: 'stable',
      topErrorTypes: ['network', 'validation', 'server_error'],
      resolutionTimeTrend: 'improving'
    };
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Utility functions for easy integration
export function recordError(error: AppError, context?: Record<string, any>): void {
  errorMonitor.recordError(error, context);
}

export function startPerformanceMonitor(operationName: string): () => void {
  return ErrorPerformanceMonitor.startOperation(operationName);
}

export function recordPerformanceResult(
  operationName: string, 
  duration: number, 
  failed: boolean = false
): void {
  ErrorPerformanceMonitor.recordOperationResult(operationName, duration, failed);
}

// Sentry Integration Enhancement
export function enhancedSentryCapture(
  error: Error | AppException,
  context: Record<string, any> = {}
): void {
  // Convert to AppError if needed
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

  // Record in our monitoring system
  recordError(appError, context);

  // Enhanced Sentry capture with additional context
  Sentry.withScope((scope) => {
    scope.setTag('errorType', appError.type);
    scope.setTag('severity', appError.severity);
    scope.setTag('recoverable', appError.recoverable.toString());
    scope.setTag('retryable', appError.retryable.toString());
    scope.setTag('errorId', appError.id);
    
    if (appError.context) {
      scope.setContext('errorContext', appError.context);
    }

    Sentry.captureException(error, {
      tags: {
        enhancedMonitoring: 'true',
        errorId: appError.id
      }
    });
  });
}