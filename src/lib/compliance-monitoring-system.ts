/**
 * Compliance Monitoring and Reporting System
 * 
 * Comprehensive system for monitoring compliance across all jurisdictions,
 * automated reporting, and real-time alerting for compliance violations.
 * 
 * Features:
 * - Real-time compliance monitoring
 * - Automated compliance reporting
 * - Multi-jurisdictional compliance tracking
 * - Compliance violation alerting
 * - Audit trail management
 * - Regulatory change impact assessment
 */

import { regulatoryComplianceEngine } from './regulatory-compliance-engine';
import { getLegalComplianceFramework, generateComplianceChecklist } from './legal-compliance';
import { getRegionalCompliance, getComplianceScore } from './regional-compliance';
import { getSupportedLegalRegions } from './legal-compliance';

export interface ComplianceMonitoringConfig {
  entities: Array<{
    type: 'recipe' | 'product' | 'ingredient' | 'process';
    id: string;
    name: string;
  }>;
  jurisdictions: string[];
  monitoringFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  alertThresholds: {
    violationCount: number;
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceScore: number;
  };
  reportingSchedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'dashboard' | 'api';
  };
}

export interface ComplianceStatus {
  overall: {
    score: number;
    status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'pending-review';
    lastUpdated: string;
    nextReview: string;
  };
  byJurisdiction: Record<string, {
    score: number;
    status: string;
    violations: number;
    warnings: number;
    lastChecked: string;
  }>;
  byCategory: Record<string, {
    score: number;
    status: string;
    issues: number;
  }>;
  violations: Array<{
    id: string;
    jurisdiction: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    entity: string;
    deadline: string;
    status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
    assignedTo: string;
  }>;
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
    period: string;
    keyFactors: string[];
  };
}

export interface ComplianceAlert {
  id: string;
  type: 'violation' | 'warning' | 'deadline' | 'update' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  jurisdiction: string;
  category: string;
  entity: string;
  createdAt: string;
  acknowledged: boolean;
  resolved: boolean;
  dueDate?: string;
  actions: string[];
  escalation?: {
    level: number;
    nextEscalation: string;
    recipients: string[];
  };
}

export interface ComplianceReport {
  id: string;
  type: 'executive' | 'technical' | 'regulatory' | 'audit' | 'trend';
  title: string;
  period: {
    startDate: string;
    endDate: string;
  };
  jurisdictions: string[];
  summary: {
    overallScore: number;
    totalEntities: number;
    compliantEntities: number;
    nonCompliantEntities: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
  };
  findings: Array<{
    area: string;
    status: string;
    issues: string[];
    recommendations: string[];
  }>;
  actionItems: Array<{
    id: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  trends: Array<{
    metric: string;
    direction: 'improving' | 'stable' | 'declining';
    change: number;
    significance: 'low' | 'medium' | 'high';
  }>;
  generatedAt: string;
  generatedBy: string;
}

export class ComplianceMonitoringSystem {
  private monitoringConfigs: Map<string, ComplianceMonitoringConfig> = new Map();
  private activeMonitors: Map<string, MonitorStatus> = new Map();
  private alerts: Map<string, ComplianceAlert> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();

  constructor() {
    this.initializeDefaultMonitoring();
    this.startBackgroundMonitoring();
  }

  /**
   * Start comprehensive compliance monitoring for entities
   */
  async startMonitoring(config: ComplianceMonitoringConfig): Promise<{
    monitorId: string;
    status: 'active' | 'paused' | 'stopped';
    configuration: ComplianceMonitoringConfig;
    initialStatus: ComplianceStatus;
  }> {
    const monitorId = this.generateMonitorId();
    
    try {
      // Validate configuration
      this.validateMonitoringConfig(config);
      
      // Store configuration
      this.monitoringConfigs.set(monitorId, config);
      
      // Perform initial compliance check
      const initialStatus = await this.performInitialComplianceCheck(config);
      
      // Set up monitoring intervals
      this.scheduleMonitoring(monitorId, config);
      
      // Start real-time monitoring if configured
      if (config.monitoringFrequency === 'realtime') {
        this.startRealtimeMonitoring(monitorId, config);
      }
      
      const monitorStatus: MonitorStatus = {
        id: monitorId,
        status: 'active',
        startedAt: new Date().toISOString(),
        lastCheck: new Date().toISOString(),
        config: config,
        nextCheck: this.calculateNextCheck(config.monitoringFrequency)
      };
      
      this.activeMonitors.set(monitorId, monitorStatus);
      
      return {
        monitorId,
        status: 'active',
        configuration: config,
        initialStatus
      };
      
    } catch (error) {
      throw new Error(`Failed to start monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time compliance status
   */
  async getComplianceStatus(monitorId?: string): Promise<ComplianceStatus> {
    const monitorIds = monitorId ? [monitorId] : Array.from(this.activeMonitors.keys());
    
    // Aggregate status across all active monitors
    const aggregatedStatus: ComplianceStatus = {
      overall: {
        score: 0,
        status: 'compliant',
        lastUpdated: new Date().toISOString(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      byJurisdiction: {},
      byCategory: {},
      violations: [],
      trends: {
        direction: 'stable',
        change: 0,
        period: '30 days',
        keyFactors: []
      }
    };
    
    let totalScore = 0;
    let monitorCount = 0;
    
    for (const id of monitorIds) {
      const monitor = this.activeMonitors.get(id);
      if (!monitor || monitor.status !== 'active') continue;
      
      monitorCount++;
      
      // Get status for each jurisdiction
      for (const jurisdiction of monitor.config.jurisdictions) {
        const jurisdictionScore = await this.getJurisdictionComplianceScore(jurisdiction, monitor.config);
        aggregatedStatus.byJurisdiction[jurisdiction] = {
          score: jurisdictionScore,
          status: jurisdictionScore >= 95 ? 'compliant' : jurisdictionScore >= 80 ? 'partially-compliant' : 'non-compliant',
          violations: await this.getJurisdictionViolationCount(jurisdiction, monitor.config),
          warnings: await this.getJurisdictionWarningCount(jurisdiction, monitor.config),
          lastChecked: monitor.lastCheck
        };
        
        totalScore += jurisdictionScore;
      }
      
      // Get violations
      const violations = await this.getActiveViolations(monitor.config);
      aggregatedStatus.violations.push(...violations);
    }
    
    // Calculate overall score
    aggregatedStatus.overall.score = monitorCount > 0 ? totalScore / monitorCount : 0;
    aggregatedStatus.overall.status = aggregatedStatus.overall.score >= 95 ? 'compliant' : 
                                     aggregatedStatus.overall.score >= 80 ? 'partially-compliant' : 'non-compliant';
    
    return aggregatedStatus;
  }

  /**
   * Get active compliance alerts
   */
  async getActiveAlerts(monitorId?: string, severity?: string): Promise<ComplianceAlert[]> {
    let alerts = Array.from(this.alerts.values());
    
    // Filter by monitor if specified
    if (monitorId) {
      const monitor = this.activeMonitors.get(monitorId);
      if (monitor) {
        // Filter alerts relevant to this monitor's entities and jurisdictions
        alerts = alerts.filter(alert => 
          monitor.config.jurisdictions.includes(alert.jurisdiction)
        );
      }
    }
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Only return unresolved alerts
    alerts = alerts.filter(alert => !alert.resolved);
    
    // Sort by severity and date
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Generate compliance report
   */
  async generateReport(request: {
    type: 'executive' | 'technical' | 'regulatory' | 'audit' | 'trend';
    monitorId?: string;
    jurisdictions: string[];
    period: { startDate: string; endDate: string };
    format: 'pdf' | 'excel' | 'dashboard' | 'api';
    includeTrends: boolean;
    includeRecommendations: boolean;
  }): Promise<ComplianceReport> {
    const reportId = this.generateReportId();
    
    try {
      // Get compliance data for the period
      const status = await this.getComplianceStatus(request.monitorId);
      const violations = await this.getViolationsInPeriod(request.period, request.jurisdictions);
      const trends = request.includeTrends ? await this.calculateTrends(request.period, request.jurisdictions) : [];
      
      // Generate findings
      const findings = await this.generateFindings(request, status, violations);
      
      // Generate action items
      const actionItems = await this.generateActionItems(violations, status);
      
      const report: ComplianceReport = {
        id: reportId,
        type: request.type,
        title: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Compliance Report`,
        period: request.period,
        jurisdictions: request.jurisdictions,
        summary: {
          overallScore: status.overall.score,
          totalEntities: await this.getTotalEntityCount(request.monitorId),
          compliantEntities: await this.getCompliantEntityCount(request.monitorId),
          nonCompliantEntities: await this.getNonCompliantEntityCount(request.monitorId),
          criticalViolations: violations.filter(v => v.severity === 'critical').length,
          highViolations: violations.filter(v => v.severity === 'high').length,
          mediumViolations: violations.filter(v => v.severity === 'medium').length,
          lowViolations: violations.filter(v => v.severity === 'low').length
        },
        findings,
        actionItems,
        trends,
        generatedAt: new Date().toISOString(),
        generatedBy: 'compliance-monitoring-system'
      };
      
      // Store report
      this.reports.set(reportId, report);
      
      return report;
      
    } catch (error) {
      throw new Error(`Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Acknowledge compliance alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }
    
    alert.acknowledged = true;
    alert.actions.push(`Acknowledged by ${acknowledgedBy}${notes ? `: ${notes}` : ''}`);
    this.alerts.set(alertId, alert);
    
    // Log acknowledgment
    await this.logComplianceActivity('alert-acknowledged', {
      alertId,
      acknowledgedBy,
      notes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resolve compliance alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }
    
    alert.resolved = true;
    alert.actions.push(`Resolved by ${resolvedBy}${resolution ? `: ${resolution}` : ''}`);
    this.alerts.set(alertId, alert);
    
    // Log resolution
    await this.logComplianceActivity('alert-resolved', {
      alertId,
      resolvedBy,
      resolution,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get compliance dashboard data
   */
  async getDashboardData(monitorId?: string): Promise<{
    overview: {
      totalMonitors: number;
      activeMonitors: number;
      overallComplianceScore: number;
      criticalAlerts: number;
      pendingActions: number;
    };
    jurisdictionScores: Array<{
      jurisdiction: string;
      score: number;
      status: string;
      trend: 'improving' | 'stable' | 'declining';
    }>;
    violationTrends: Array<{
      period: string;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }>;
    topViolations: Array<{
      category: string;
      count: number;
      severity: string;
    }>;
    recentAlerts: ComplianceAlert[];
  }> {
    const overview = {
      totalMonitors: this.monitoringConfigs.size,
      activeMonitors: Array.from(this.activeMonitors.values()).filter(m => m.status === 'active').length,
      overallComplianceScore: 0,
      criticalAlerts: 0,
      pendingActions: 0
    };
    
    // Calculate overall compliance score
    const status = await this.getComplianceStatus(monitorId);
    overview.overallComplianceScore = status.overall.score;
    
    // Count critical alerts
    const activeAlerts = await this.getActiveAlerts(monitorId);
    overview.criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    
    // Count pending actions
    overview.pendingActions = status.violations.filter(v => v.status === 'open').length;
    
    // Get jurisdiction scores
    const jurisdictionScores = Object.entries(status.byJurisdiction).map(([jurisdiction, data]) => ({
      jurisdiction,
      score: data.score,
      status: data.status,
      trend: 'stable' as const // Would be calculated from historical data
    }));
    
    // Get violation trends (simplified - would use historical data)
    const violationTrends = [
      {
        period: 'Current Month',
        critical: status.violations.filter(v => v.severity === 'critical').length,
        high: status.violations.filter(v => v.severity === 'high').length,
        medium: status.violations.filter(v => v.severity === 'medium').length,
        low: status.violations.filter(v => v.severity === 'low').length
      }
    ];
    
    // Get top violations by category
    const violationByCategory = status.violations.reduce((acc, violation) => {
      if (!acc[violation.category]) {
        acc[violation.category] = { count: 0, severity: violation.severity };
      }
      acc[violation.category].count++;
      return acc;
    }, {} as Record<string, { count: number; severity: string }>);
    
    const topViolations = Object.entries(violationByCategory).map(([category, data]) => ({
      category,
      count: data.count,
      severity: data.severity
    })).sort((a, b) => b.count - a.count);
    
    return {
      overview,
      jurisdictionScores,
      violationTrends,
      topViolations,
      recentAlerts: activeAlerts.slice(0, 10)
    };
  }

  // Private helper methods

  private validateMonitoringConfig(config: ComplianceMonitoringConfig): void {
    if (!config.entities || config.entities.length === 0) {
      throw new Error('At least one entity must be specified for monitoring');
    }
    
    if (!config.jurisdictions || config.jurisdictions.length === 0) {
      throw new Error('At least one jurisdiction must be specified for monitoring');
    }
    
    if (config.alertThresholds.complianceScore < 0 || config.alertThresholds.complianceScore > 100) {
      throw new Error('Compliance score threshold must be between 0 and 100');
    }
  }

  private async performInitialComplianceCheck(config: ComplianceMonitoringConfig): Promise<ComplianceStatus> {
    // Perform comprehensive compliance check
    const results = await regulatoryComplianceEngine.performComplianceCheck({
      entityType: 'recipe',
      entityId: 'all',
      entityData: {},
      jurisdictions: config.jurisdictions
    });
    
    // Convert results to status format
    return {
      overall: {
        score: results.score,
        status: results.overallStatus,
        lastUpdated: new Date().toISOString(),
        nextReview: results.nextReview
      },
      byJurisdiction: results.complianceByJurisdiction,
      byCategory: results.complianceByCategory,
      violations: results.violations.map(v => ({
        id: v.id,
        jurisdiction: v.requirement,
        category: 'safety',
        severity: v.severity,
        description: v.description,
        entity: 'recipe',
        deadline: v.deadline,
        status: v.status,
        assignedTo: 'compliance-team'
      })),
      trends: {
        direction: 'stable',
        change: 0,
        period: '30 days',
        keyFactors: []
      }
    };
  }

  private scheduleMonitoring(monitorId: string, config: ComplianceMonitoringConfig): void {
    const intervals = {
      realtime: 60000,    // 1 minute
      hourly: 3600000,    // 1 hour
      daily: 86400000,    // 24 hours
      weekly: 604800000   // 7 days
    };
    
    const interval = intervals[config.monitoringFrequency];
    if (interval) {
      setInterval(async () => {
        await this.performScheduledCheck(monitorId);
      }, interval);
    }
  }

  private startRealtimeMonitoring(monitorId: string, config: ComplianceMonitoringConfig): void {
    // Real-time monitoring would use webhooks, event streams, etc.
    // For now, we'll simulate with frequent checks
    setInterval(async () => {
      await this.performScheduledCheck(monitorId);
    }, 60000); // 1 minute
  }

  private async performScheduledCheck(monitorId: string): Promise<void> {
    const monitor = this.activeMonitors.get(monitorId);
    if (!monitor || monitor.status !== 'active') return;
    
    try {
      // Perform compliance check
      const status = await this.getComplianceStatus(monitorId);
      
      // Check for violations and generate alerts
      await this.checkForViolations(monitor, status);
      
      // Update monitor status
      monitor.lastCheck = new Date().toISOString();
      monitor.nextCheck = this.calculateNextCheck(monitor.config.monitoringFrequency);
      
      this.activeMonitors.set(monitorId, monitor);
      
    } catch (error) {
      await this.logComplianceActivity('monitoring-error', {
        monitorId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async checkForViolations(monitor: MonitorStatus, status: ComplianceStatus): Promise<void> {
    const config = monitor.config;
    
    // Check compliance score threshold
    if (status.overall.score < config.alertThresholds.complianceScore) {
      await this.createAlert({
        type: 'warning',
        severity: status.overall.score < 50 ? 'critical' : 'high',
        title: 'Compliance Score Below Threshold',
        message: `Overall compliance score (${status.overall.score}) is below threshold (${config.alertThresholds.complianceScore})`,
        jurisdiction: 'global',
        category: 'overall',
        entity: 'system',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        actions: ['Review compliance status', 'Identify root causes', 'Implement corrective measures']
      });
    }
    
    // Check violation count threshold
    const violationCount = status.violations.filter(v => v.status === 'open').length;
    if (violationCount > config.alertThresholds.violationCount) {
      await this.createAlert({
        type: 'violation',
        severity: violationCount > 10 ? 'critical' : violationCount > 5 ? 'high' : 'medium',
        title: 'High Number of Active Violations',
        message: `${violationCount} active violations detected, exceeding threshold of ${config.alertThresholds.violationCount}`,
        jurisdiction: 'global',
        category: 'safety',
        entity: 'system',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        actions: ['Review all violations', 'Prioritize remediation', 'Assign responsible parties']
      });
    }
  }

  private async createAlert(alertData: Partial<ComplianceAlert>): Promise<void> {
    const alert: ComplianceAlert = {
      id: this.generateAlertId(),
      type: alertData.type || 'warning',
      severity: alertData.severity || 'medium',
      title: alertData.title || 'Compliance Alert',
      message: alertData.message || '',
      jurisdiction: alertData.jurisdiction || 'global',
      category: alertData.category || 'general',
      entity: alertData.entity || 'system',
      createdAt: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      dueDate: alertData.dueDate,
      actions: alertData.actions || [],
      escalation: {
        level: 1,
        nextEscalation: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        recipients: ['compliance-team@company.com']
      }
    };
    
    this.alerts.set(alert.id, alert);
  }

  private async getJurisdictionComplianceScore(jurisdiction: string, config: ComplianceMonitoringConfig): Promise<number> {
    try {
      const compliance = await getRegionalCompliance(jurisdiction);
      return compliance.complianceScore;
    } catch (error) {
      return 0;
    }
  }

  private async getJurisdictionViolationCount(jurisdiction: string, config: ComplianceMonitoringConfig): Promise<number> {
    // Simplified - would query actual violation data
    return Math.floor(Math.random() * 5);
  }

  private async getJurisdictionWarningCount(jurisdiction: string, config: ComplianceMonitoringConfig): Promise<number> {
    // Simplified - would query actual warning data
    return Math.floor(Math.random() * 3);
  }

  private async getActiveViolations(config: ComplianceMonitoringConfig): Promise<ComplianceStatus['violations']> {
    // Simplified - would query actual violation data
    return [
      {
        id: 'violation-001',
        jurisdiction: 'EU',
        category: 'caffeine-limits',
        severity: 'high',
        description: 'Caffeine content exceeds EU limit',
        entity: 'recipe-energy-blast',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        assignedTo: 'product-team'
      }
    ];
  }

  private async getTotalEntityCount(monitorId?: string): Promise<number> {
    if (monitorId) {
      const config = this.monitoringConfigs.get(monitorId);
      return config?.entities.length || 0;
    }
    return Array.from(this.monitoringConfigs.values()).reduce((sum, config) => sum + config.entities.length, 0);
  }

  private async getCompliantEntityCount(monitorId?: string): Promise<number> {
    // Simplified - would calculate actual compliant entity count
    return Math.floor(await this.getTotalEntityCount(monitorId) * 0.8);
  }

  private async getNonCompliantEntityCount(monitorId?: string): Promise<number> {
    const total = await this.getTotalEntityCount(monitorId);
    const compliant = await this.getCompliantEntityCount(monitorId);
    return total - compliant;
  }

  private async getViolationsInPeriod(period: { startDate: string; endDate: string }, jurisdictions: string[]): Promise<any[]> {
    // Simplified - would query actual violation data for the period
    return [];
  }

  private async calculateTrends(period: { startDate: string; endDate: string }, jurisdictions: string[]): Promise<any[]> {
    // Simplified - would calculate actual trends from historical data
    return [
      {
        metric: 'Compliance Score',
        direction: 'improving' as const,
        change: 5.2,
        significance: 'medium' as const
      }
    ];
  }

  private async generateFindings(request: any, status: ComplianceStatus, violations: any[]): Promise<any[]> {
    return [
      {
        area: 'Overall Compliance',
        status: status.overall.status,
        issues: violations.map(v => v.description),
        recommendations: ['Continue monitoring', 'Address remaining violations']
      }
    ];
  }

  private async generateActionItems(violations: any[], status: ComplianceStatus): Promise<any[]> {
    return violations.map(violation => ({
      id: `action-${violation.id}`,
      description: `Address ${violation.description}`,
      priority: violation.severity,
      assignedTo: violation.assignedTo || 'compliance-team',
      dueDate: violation.deadline,
      status: 'pending'
    }));
  }

  private calculateNextCheck(frequency: string): string {
    const now = new Date();
    const intervals = {
      realtime: 1,      // 1 minute
      hourly: 60,       // 60 minutes
      daily: 1440,      // 1440 minutes
      weekly: 10080     // 10080 minutes
    };
    
    const minutes = intervals[frequency as keyof typeof intervals] || 60;
    const nextCheck = new Date(now.getTime() + minutes * 60 * 1000);
    
    return nextCheck.toISOString();
  }

  private initializeDefaultMonitoring(): void {
    // Initialize with default monitoring for all supported jurisdictions
    const supportedRegions = getSupportedLegalRegions();
    
    const defaultConfig: ComplianceMonitoringConfig = {
      entities: [],
      jurisdictions: supportedRegions.map(r => r.code),
      monitoringFrequency: 'daily',
      alertThresholds: {
        violationCount: 3,
        severityLevel: 'medium',
        complianceScore: 80
      },
      reportingSchedule: {
        frequency: 'weekly',
        recipients: ['compliance-team@company.com'],
        format: 'dashboard'
      }
    };
    
    // Start default monitoring (but don't store it as it's a template)
    this.startMonitoring(defaultConfig).catch(error => {
      console.error('Failed to initialize default monitoring:', error);
    });
  }

  private startBackgroundMonitoring(): void {
    // Start background processes for compliance monitoring
    setInterval(() => {
      this.performBackgroundMaintenance().catch(error => {
        console.error('Background monitoring error:', error);
      });
    }, 3600000); // Every hour
  }

  private async performBackgroundMaintenance(): Promise<void> {
    // Clean up old alerts
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && new Date(alert.createdAt) < cutoffDate) {
        this.alerts.delete(alertId);
      }
    }
    
    // Clean up old reports
    for (const [reportId, report] of this.reports.entries()) {
      if (new Date(report.generatedAt) < cutoffDate) {
        this.reports.delete(reportId);
      }
    }
    
    // Log maintenance activity
    await this.logComplianceActivity('maintenance-completed', {
      timestamp: new Date().toISOString(),
      alertsCleaned: 0,
      reportsCleaned: 0
    });
  }

  private async logComplianceActivity(action: string, details: any): Promise<void> {
    // Log compliance activity for audit trail
    console.log(`[COMPLIANCE] ${action}:`, details);
  }

  private generateMonitorId(): string {
    return `MONITOR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateReportId(): string {
    return `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}

interface MonitorStatus {
  id: string;
  status: 'active' | 'paused' | 'stopped';
  startedAt: string;
  lastCheck: string;
  nextCheck: string;
  config: ComplianceMonitoringConfig;
}

// Export singleton instance
export const complianceMonitoringSystem = new ComplianceMonitoringSystem();