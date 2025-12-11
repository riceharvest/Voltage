/**
 * Performance Analytics Service
 * 
 * Comprehensive analytics engine for tracking calculator performance,
 * user behavior patterns, feature adoption, optimization opportunities,
 * and real-time monitoring of system health.
 */

import { CalculatorAnalytics } from './enhanced-calculator-service';

/**
 * Analytics Event Interface
 */
export interface AnalyticsEvent {
  type: 'calculation' | 'feature_usage' | 'user_interaction' | 'error' | 'performance';
  timestamp: number;
  sessionId: string;
  userId?: string;
  data: any;
  metadata?: {
    userAgent: string;
    region: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browserInfo: string;
  };
}

/**
 * Performance Metrics Interface
 */
export interface PerformanceMetrics {
  responseTime: number;
  calculationAccuracy: number;
  userSatisfaction: number;
  errorRate: number;
  featureAdoption: Record<string, number>;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
  userFlow: {
    completionRate: number;
    abandonmentRate: number;
    averageSteps: number;
  };
}

/**
 * User Behavior Analysis Interface
 */
export interface UserBehaviorAnalysis {
  sessionPatterns: {
    averageSessionDuration: number;
    peakUsageHours: number[];
    devicePreferences: Record<string, number>;
    featureUsageFrequency: Record<string, number>;
  };
  conversionFunnel: {
    steps: Array<{
      step: string;
      completionRate: number;
      dropoffRate: number;
      averageTime: number;
    }>;
    overallConversion: number;
  };
  popularConfigurations: Array<{
    category: string;
    mode: string;
    frequency: number;
    satisfaction: number;
  }>;
  optimizationInsights: {
    performanceBottlenecks: string[];
    featureRequests: string[];
    usabilityIssues: string[];
    costOptimization: string[];
  };
}

/**
 * Real-time Monitoring Interface
 */
export interface RealTimeMonitoring {
  activeUsers: number;
  calculationsPerMinute: number;
  errorRate: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    lastUpdate: number;
  };
  featureUsage: Record<string, number>;
  performanceMetrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
}

/**
 * Analytics Report Interface
 */
export interface AnalyticsReport {
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalCalculations: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    overallSatisfaction: number;
    topFeatures: string[];
    errorRate: number;
  };
  detailed: {
    performanceMetrics: PerformanceMetrics;
    userBehavior: UserBehaviorAnalysis;
    featureAdoption: Record<string, number>;
    optimizationOpportunities: string[];
    recommendations: string[];
  };
  realTime: RealTimeMonitoring;
}

/**
 * Performance Analytics Service
 */
export class PerformanceAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetrics;
  private realTimeData: RealTimeMonitoring;
  private sessionData: Map<string, AnalyticsEvent[]> = new Map();
  private userSessions: Map<string, string[]> = new Map();

  constructor() {
    this.metrics = this.initializeMetrics();
    this.realTimeData = this.initializeRealTimeMonitoring();
    this.startRealTimeMonitoring();
  }

  /**
   * Track analytics event
   */
  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      metadata: {
        userAgent: navigator.userAgent,
        region: this.getUserRegion(),
        deviceType: this.getDeviceType(),
        browserInfo: this.getBrowserInfo(),
        ...event.metadata
      }
    };

    this.events.push(fullEvent);
    this.sessionData.set(event.sessionId, [
      ...(this.sessionData.get(event.sessionId) || []),
      fullEvent
    ]);

    // Update real-time data
    this.updateRealTimeData(fullEvent);

    // Store user sessions
    if (event.userId) {
      const userSessions = this.userSessions.get(event.userId) || [];
      if (!userSessions.includes(event.sessionId)) {
        userSessions.push(event.sessionId);
        this.userSessions.set(event.userId, userSessions);
      }
    }

    // Periodic cleanup to prevent memory issues
    if (this.events.length > 10000) {
      this.cleanupOldEvents();
    }
  }

  /**
   * Track calculator calculation
   */
  public trackCalculation(
    sessionId: string,
    userId: string | undefined,
    input: any,
    result: any,
    responseTime: number
  ): void {
    this.trackEvent({
      type: 'calculation',
      sessionId,
      userId,
      data: {
        input,
        result: {
          category: result.basic?.category,
          mode: input.mode,
          caffeine: result.basic?.caffeine,
          valid: result.basic?.valid,
          featuresUsed: this.getFeaturesUsed(result),
          cost: result.costAnalysis?.totalCost,
          region: input.region
        },
        responseTime,
        success: result.basic?.valid
      }
    });
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(
    sessionId: string,
    userId: string | undefined,
    feature: string,
    action: 'enable' | 'disable' | 'use' | 'complete',
    metadata?: any
  ): void {
    this.trackEvent({
      type: 'feature_usage',
      sessionId,
      userId,
      data: {
        feature,
        action,
        metadata
      }
    });
  }

  /**
   * Track user interaction
   */
  public trackUserInteraction(
    sessionId: string,
    userId: string | undefined,
    element: string,
    action: string,
    value?: any
  ): void {
    this.trackEvent({
      type: 'user_interaction',
      sessionId,
      userId,
      data: {
        element,
        action,
        value
      }
    });
  }

  /**
   * Track errors
   */
  public trackError(
    sessionId: string,
    userId: string | undefined,
    error: Error,
    context: string
  ): void {
    this.trackEvent({
      type: 'error',
      sessionId,
      userId,
      data: {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    sessionId: string,
    userId: string | undefined,
    metrics: {
      responseTime: number;
      resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
      };
      accuracy?: number;
    }
  ): void {
    this.trackEvent({
      type: 'performance',
      sessionId,
      userId,
      data: metrics
    });
  }

  /**
   * Generate comprehensive analytics report
   */
  public generateReport(periodHours: number = 24): AnalyticsReport {
    const cutoffTime = Date.now() - (periodHours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    return {
      period: {
        start: cutoffTime,
        end: Date.now()
      },
      summary: this.generateSummary(recentEvents),
      detailed: {
        performanceMetrics: this.calculatePerformanceMetrics(recentEvents),
        userBehavior: this.analyzeUserBehavior(recentEvents),
        featureAdoption: this.calculateFeatureAdoption(recentEvents),
        optimizationOpportunities: this.generateOptimizationOpportunities(recentEvents),
        recommendations: this.generateRecommendations(recentEvents)
      },
      realTime: this.realTimeData
    };
  }

  /**
   * Get real-time monitoring data
   */
  public getRealTimeData(): RealTimeMonitoring {
    return this.realTimeData;
  }

  /**
   * Get user behavior insights
   */
  public getUserBehaviorInsights(sessionId: string): any {
    const sessionEvents = this.sessionData.get(sessionId) || [];
    
    return {
      sessionDuration: this.calculateSessionDuration(sessionEvents),
      interactions: sessionEvents.filter(e => e.type === 'user_interaction').length,
      calculations: sessionEvents.filter(e => e.type === 'calculation').length,
      featuresUsed: this.getSessionFeaturesUsed(sessionEvents),
      path: this.reconstructUserPath(sessionEvents),
      satisfaction: this.estimateUserSatisfaction(sessionEvents)
    };
  }

  /**
   * Export analytics data
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      metrics: this.metrics,
      realTimeData: this.realTimeData,
      exportTimestamp: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      return this.convertToCSV(data);
    }
  }

  /**
   * Reset analytics data
   */
  public reset(): void {
    this.events = [];
    this.sessionData.clear();
    this.userSessions.clear();
    this.metrics = this.initializeMetrics();
    this.realTimeData = this.initializeRealTimeMonitoring();
  }

  // Private methods

  private initializeMetrics(): PerformanceMetrics {
    return {
      responseTime: 0,
      calculationAccuracy: 0,
      userSatisfaction: 0,
      errorRate: 0,
      featureAdoption: {},
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        network: 0
      },
      userFlow: {
        completionRate: 0,
        abandonmentRate: 0,
        averageSteps: 0
      }
    };
  }

  private initializeRealTimeMonitoring(): RealTimeMonitoring {
    return {
      activeUsers: 0,
      calculationsPerMinute: 0,
      errorRate: 0,
      systemHealth: {
        status: 'healthy',
        issues: [],
        lastUpdate: Date.now()
      },
      featureUsage: {},
      performanceMetrics: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      }
    };
  }

  private startRealTimeMonitoring(): void {
    // Update real-time data every 30 seconds
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 30000);
  }

  private updateRealTimeData(event: AnalyticsEvent): void {
    this.realTimeData.lastUpdate = Date.now();

    switch (event.type) {
      case 'calculation':
        this.realTimeData.calculationsPerMinute++;
        break;
      case 'error':
        this.realTimeData.errorRate++;
        break;
      case 'feature_usage':
        if (event.data.feature) {
          this.realTimeData.featureUsage[event.data.feature] = 
            (this.realTimeData.featureUsage[event.data.feature] || 0) + 1;
        }
        break;
    }
  }

  private updateRealTimeMetrics(): void {
    const recentEvents = this.events.filter(
      event => event.timestamp > Date.now() - 60000 // Last minute
    );

    const calculationEvents = recentEvents.filter(e => e.type === 'calculation');
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const performanceEvents = recentEvents.filter(e => e.type === 'performance');

    // Update calculations per minute
    this.realTimeData.calculationsPerMinute = calculationEvents.length;

    // Update error rate
    this.realTimeData.errorRate = recentEvents.length > 0 
      ? (errorEvents.length / recentEvents.length) * 100 
      : 0;

    // Update performance metrics
    if (performanceEvents.length > 0) {
      const responseTimes = performanceEvents
        .map(e => e.data.responseTime)
        .sort((a, b) => a - b);
      
      this.realTimeData.performanceMetrics.averageResponseTime = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      this.realTimeData.performanceMetrics.p95ResponseTime = 
        responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
      
      this.realTimeData.performanceMetrics.p99ResponseTime = 
        responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
    }

    // Check system health
    this.updateSystemHealth();
  }

  private updateSystemHealth(): void {
    const issues: string[] = [];

    if (this.realTimeData.errorRate > 10) {
      issues.push('High error rate detected');
    }

    if (this.realTimeData.performanceMetrics.averageResponseTime > 5000) {
      issues.push('High response times');
    }

    if (this.realTimeData.calculationsPerMinute < 1) {
      issues.push('Low usage detected');
    }

    this.realTimeData.systemHealth.issues = issues;
    this.realTimeData.systemHealth.status = issues.length > 2 ? 'critical' : 
                                           issues.length > 0 ? 'warning' : 'healthy';
  }

  private generateSummary(events: AnalyticsEvent[]): AnalyticsReport['summary'] {
    const calculationEvents = events.filter(e => e.type === 'calculation');
    const userEvents = events.filter(e => e.userId);
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));
    const errorEvents = events.filter(e => e.type === 'error');

    return {
      totalCalculations: calculationEvents.length,
      uniqueUsers: uniqueUsers.size,
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      overallSatisfaction: this.calculateOverallSatisfaction(events),
      topFeatures: this.getTopFeatures(events),
      errorRate: events.length > 0 ? (errorEvents.length / events.length) * 100 : 0
    };
  }

  private calculatePerformanceMetrics(events: AnalyticsEvent[]): PerformanceMetrics {
    const calculationEvents = events.filter(e => e.type === 'calculation');
    const performanceEvents = events.filter(e => e.type === 'performance');
    const errorEvents = events.filter(e => e.type === 'error');

    const responseTimes = performanceEvents.map(e => e.data.responseTime);
    const resourceUsage = performanceEvents.map(e => e.data.resourceUsage);

    return {
      responseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0,
      calculationAccuracy: this.calculateAccuracy(calculationEvents),
      userSatisfaction: this.calculateSatisfaction(events),
      errorRate: events.length > 0 ? (errorEvents.length / events.length) * 100 : 0,
      featureAdoption: this.calculateFeatureAdoption(events),
      resourceUtilization: this.calculateResourceUtilization(resourceUsage),
      userFlow: this.calculateUserFlow(events)
    };
  }

  private analyzeUserBehavior(events: AnalyticsEvent[]): UserBehaviorAnalysis {
    const sessions = new Map<string, AnalyticsEvent[]>();
    
    // Group events by session
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });

    const sessionDurations = Array.from(sessions.values())
      .map(sessionEvents => this.calculateSessionDuration(sessionEvents));

    return {
      sessionPatterns: {
        averageSessionDuration: sessionDurations.length > 0 
          ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
          : 0,
        peakUsageHours: this.calculatePeakUsageHours(events),
        devicePreferences: this.calculateDevicePreferences(events),
        featureUsageFrequency: this.calculateFeatureUsageFrequency(events)
      },
      conversionFunnel: this.calculateConversionFunnel(events),
      popularConfigurations: this.calculatePopularConfigurations(events),
      optimizationInsights: this.generateOptimizationInsights(events)
    };
  }

  private calculateFeatureAdoption(events: AnalyticsEvent[]): Record<string, number> {
    const featureEvents = events.filter(e => e.type === 'feature_usage' && e.data.action === 'use');
    const featureCounts: Record<string, number> = {};

    featureEvents.forEach(event => {
      const feature = event.data.feature;
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });

    return featureCounts;
  }

  private generateOptimizationOpportunities(events: AnalyticsEvent[]): string[] {
    const opportunities: string[] = [];
    
    // Analyze error patterns
    const errorEvents = events.filter(e => e.type === 'error');
    const commonErrors = this.groupBy(errorEvents, e => e.data.message)
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);
    
    if (commonErrors.length > 0) {
      opportunities.push(`Address top error: ${commonErrors[0][0].data.message} (${commonErrors[0].length} occurrences)`);
    }

    // Analyze performance bottlenecks
    const performanceEvents = events.filter(e => e.type === 'performance');
    const slowCalculations = performanceEvents.filter(e => e.data.responseTime > 5000);
    
    if (slowCalculations.length > performanceEvents.length * 0.1) {
      opportunities.push('Optimize calculation performance - more than 10% of calculations exceed 5 seconds');
    }

    // Analyze feature adoption
    const featureAdoption = this.calculateFeatureAdoption(events);
    const unusedFeatures = Object.keys(featureAdoption).filter(feature => featureAdoption[feature] < 10);
    
    if (unusedFeatures.length > 0) {
      opportunities.push(`Promote underused features: ${unusedFeatures.slice(0, 3).join(', ')}`);
    }

    return opportunities;
  }

  private generateRecommendations(events: AnalyticsEvent[]): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    const avgResponseTime = this.calculateAverageResponseTime(events);
    if (avgResponseTime > 3000) {
      recommendations.push('Consider implementing caching to improve response times');
    }

    // User experience recommendations
    const userFlow = this.calculateUserFlow(events);
    if (userFlow.abandonmentRate > 30) {
      recommendations.push('High abandonment rate detected - review user onboarding and interface design');
    }

    // Feature recommendations
    const featureAdoption = this.calculateFeatureAdoption(events);
    const topFeature = Object.entries(featureAdoption)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topFeature && topFeature[1] > 50) {
      recommendations.push(`Promote successful features: ${topFeature[0]} shows high engagement`);
    }

    return recommendations;
  }

  // Helper methods

  private getFeaturesUsed(result: any): string[] {
    const features: string[] = [];
    if (result.batchOptimization) features.push('batch-optimization');
    if (result.amazonIntegration) features.push('amazon-integration');
    if (result.regionalAdaptation) features.push('regional-adaptation');
    if (result.costAnalysis) features.push('cost-analysis');
    return features;
  }

  private getUserRegion(): string {
    // Simplified region detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Europe')) return 'EU';
    if (timezone.includes('America')) return 'US';
    if (timezone.includes('Asia')) return 'Asia';
    return 'Unknown';
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.events = this.events.filter(event => event.timestamp >= cutoffTime);
  }

  private calculateSessionDuration(sessionEvents: AnalyticsEvent[]): number {
    if (sessionEvents.length < 2) return 0;
    const sortedEvents = sessionEvents.sort((a, b) => a.timestamp - b.timestamp);
    return sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp;
  }

  private getSessionFeaturesUsed(sessionEvents: AnalyticsEvent[]): string[] {
    const featureEvents = sessionEvents.filter(e => e.type === 'feature_usage');
    return [...new Set(featureEvents.map(e => e.data.feature))];
  }

  private reconstructUserPath(sessionEvents: AnalyticsEvent[]): string[] {
    const interactionEvents = sessionEvents
      .filter(e => e.type === 'user_interaction')
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return interactionEvents.map(e => `${e.data.element}:${e.data.action}`);
  }

  private estimateUserSatisfaction(sessionEvents: AnalyticsEvent[]): number {
    // Simplified satisfaction estimation based on completion and error rates
    const calculationEvents = sessionEvents.filter(e => e.type === 'calculation');
    const errorEvents = sessionEvents.filter(e => e.type === 'error');
    
    if (calculationEvents.length === 0) return 0;
    
    const completionRate = calculationEvents.filter(e => e.data.success).length / calculationEvents.length;
    const errorRate = errorEvents.length / sessionEvents.length;
    
    return Math.max(0, (completionRate * 100) - (errorRate * 50));
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessions = new Map<string, AnalyticsEvent[]>();
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });

    const durations = Array.from(sessions.values())
      .map(sessionEvents => this.calculateSessionDuration(sessionEvents))
      .filter(duration => duration > 0);

    return durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;
  }

  private calculateOverallSatisfaction(events: AnalyticsEvent[]): number {
    const sessionIds = new Set(events.map(e => e.sessionId));
    const satisfactions = Array.from(sessionIds).map(sessionId => 
      this.estimateUserSatisfaction(events.filter(e => e.sessionId === sessionId))
    );

    return satisfactions.length > 0 
      ? satisfactions.reduce((sum, sat) => sum + sat, 0) / satisfactions.length 
      : 0;
  }

  private getTopFeatures(events: AnalyticsEvent[]): string[] {
    const featureAdoption = this.calculateFeatureAdoption(events);
    return Object.entries(featureAdoption)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature);
  }

  private calculateAccuracy(events: AnalyticsEvent[]): number {
    const calculationEvents = events.filter(e => e.type === 'calculation');
    const successfulCalculations = calculationEvents.filter(e => e.data.success);
    
    return calculationEvents.length > 0 
      ? (successfulCalculations.length / calculationEvents.length) * 100 
      : 100;
  }

  private calculateSatisfaction(events: AnalyticsEvent[]): number {
    return this.calculateOverallSatisfaction(events);
  }

  private calculateResourceUtilization(resourceUsage: any[]): PerformanceMetrics['resourceUtilization'] {
    if (resourceUsage.length === 0) {
      return { cpu: 0, memory: 0, network: 0 };
    }

    const avgCpu = resourceUsage.reduce((sum, usage) => sum + usage.cpu, 0) / resourceUsage.length;
    const avgMemory = resourceUsage.reduce((sum, usage) => sum + usage.memory, 0) / resourceUsage.length;
    const avgNetwork = resourceUsage.reduce((sum, usage) => sum + usage.network, 0) / resourceUsage.length;

    return { cpu: avgCpu, memory: avgMemory, network: avgNetwork };
  }

  private calculateUserFlow(events: AnalyticsEvent[]): PerformanceMetrics['userFlow'] {
    const sessions = new Map<string, AnalyticsEvent[]>();
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });

    const completedSessions = Array.from(sessions.values())
      .filter(sessionEvents => sessionEvents.some(e => e.type === 'calculation' && e.data.success));
    
    const totalSessions = sessions.size;
    const completionRate = totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0;
    const abandonmentRate = 100 - completionRate;
    
    const averageSteps = Array.from(sessions.values())
      .reduce((sum, sessionEvents) => sum + sessionEvents.length, 0) / totalSessions || 0;

    return {
      completionRate,
      abandonmentRate,
      averageSteps
    };
  }

  private calculatePeakUsageHours(events: AnalyticsEvent[]): number[] {
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private calculateDevicePreferences(events: AnalyticsEvent[]): Record<string, number> {
    const deviceCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.metadata?.deviceType) {
        deviceCounts[event.metadata.deviceType] = (deviceCounts[event.metadata.deviceType] || 0) + 1;
      }
    });

    return deviceCounts;
  }

  private calculateFeatureUsageFrequency(events: AnalyticsEvent[]): Record<string, number> {
    return this.calculateFeatureAdoption(events);
  }

  private calculateConversionFunnel(events: AnalyticsEvent[]): UserBehaviorAnalysis['conversionFunnel'] {
    // Simplified funnel analysis
    const steps = [
      { step: 'page_view', events: events.filter(e => e.data.element === 'page') },
      { step: 'category_select', events: events.filter(e => e.data.element === 'category') },
      { step: 'mode_select', events: events.filter(e => e.data.element === 'mode') },
      { step: 'flavor_select', events: events.filter(e => e.data.element === 'flavor') },
      { step: 'calculate', events: events.filter(e => e.type === 'calculation') }
    ];

    const funnelSteps = steps.map((step, index) => {
      const completionRate = steps[0].events.length > 0 
        ? (step.events.length / steps[0].events.length) * 100 
        : 0;
      
      const dropoffRate = index > 0 
        ? 100 - completionRate 
        : 0;

      return {
        step: step.step,
        completionRate,
        dropoffRate,
        averageTime: 0 // Would need timestamp analysis
      };
    });

    const overallConversion = funnelSteps[funnelSteps.length - 1].completionRate;

    return {
      steps: funnelSteps,
      overallConversion
    };
  }

  private calculatePopularConfigurations(events: AnalyticsEvent[]): Array<{category: string; mode: string; frequency: number; satisfaction: number}> {
    const configMap = new Map<string, {count: number; satisfaction: number}>();
    
    const calculationEvents = events.filter(e => e.type === 'calculation');
    
    calculationEvents.forEach(event => {
      const config = `${event.data.category}-${event.data.mode}`;
      const existing = configMap.get(config) || { count: 0, satisfaction: 0 };
      configMap.set(config, {
        count: existing.count + 1,
        satisfaction: existing.satisfaction + (event.data.success ? 100 : 0)
      });
    });

    return Array.from(configMap.entries())
      .map(([config, data]) => {
        const [category, mode] = config.split('-');
        return {
          category,
          mode,
          frequency: data.count,
          satisfaction: data.count > 0 ? data.satisfaction / data.count : 0
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private generateOptimizationInsights(events: AnalyticsEvent[]): UserBehaviorAnalysis['optimizationInsights'] {
    return {
      performanceBottlenecks: this.generateOptimizationOpportunities(events),
      featureRequests: this.generateFeatureRequests(events),
      usabilityIssues: this.generateUsabilityIssues(events),
      costOptimization: this.generateCostOptimizationSuggestions(events)
    };
  }

  private generateFeatureRequests(events: AnalyticsEvent[]): string[] {
    // Analyze usage patterns to suggest new features
    const featureUsage = this.calculateFeatureAdoption(events);
    const underservedFeatures = Object.entries(featureUsage)
      .filter(([, count]) => count < 20)
      .map(([feature]) => feature);
    
    return underservedFeatures.slice(0, 5);
  }

  private generateUsabilityIssues(events: AnalyticsEvent[]): string[] {
    const issues: string[] = [];
    
    // Analyze error patterns for usability issues
    const errorEvents = events.filter(e => e.type === 'error');
    const formErrors = errorEvents.filter(e => e.data.context?.includes('form') || e.data.context?.includes('validation'));
    
    if (formErrors.length > 5) {
      issues.push('High number of form validation errors detected');
    }
    
    // Analyze user flow abandonment
    const userFlow = this.calculateUserFlow(events);
    if (userFlow.abandonmentRate > 40) {
      issues.push('High user flow abandonment - interface may need simplification');
    }
    
    return issues;
  }

  private generateCostOptimizationSuggestions(events: AnalyticsEvent[]): string[] {
    const suggestions: string[] = [];
    
    // Analyze resource utilization
    const performanceEvents = events.filter(e => e.type === 'performance');
    const highCpuUsage = performanceEvents.filter(e => e.data.resourceUsage?.cpu > 80);
    
    if (highCpuUsage.length > performanceEvents.length * 0.1) {
      suggestions.push('Consider optimizing calculation algorithms to reduce CPU usage');
    }
    
    // Analyze memory usage patterns
    const highMemoryUsage = performanceEvents.filter(e => e.data.resourceUsage?.memory > 70);
    
    if (highMemoryUsage.length > performanceEvents.length * 0.1) {
      suggestions.push('Implement better memory management for large datasets');
    }
    
    return suggestions;
  }

  private calculateAverageResponseTime(events: AnalyticsEvent[]): number {
    const performanceEvents = events.filter(e => e.type === 'performance');
    const responseTimes = performanceEvents.map(e => e.data.responseTime);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): T[][] {
    const groups = new Map<string, T[]>();
    
    array.forEach(item => {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return Array.from(groups.values());
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - in real implementation, this would be more robust
    return JSON.stringify(data, null, 2);
  }
}