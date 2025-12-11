/**
 * Comprehensive Monitoring and Health Check Framework
 * 
 * Provides real-time deployment monitoring, health verification,
 * automated alerting, and performance assessment during migrations
 */

import fs from 'fs';
import path from 'path';

export interface HealthCheckConfig {
  name: string;
  type: 'http' | 'tcp' | 'database' | 'custom' | 'composite';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  timeout: number; // seconds
  interval: number; // seconds
  retryCount: number;
  expectedStatus?: number;
  expectedResponse?: any;
  headers?: Record<string, string>;
  body?: any;
  critical: boolean;
  environment: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  checkId: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime: number; // milliseconds
  timestamp: string;
  details: {
    statusCode?: number;
    message?: string;
    error?: string;
    metadata?: any;
  };
  performance: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
  };
}

export interface MonitoringAlert {
  alertId: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'availability' | 'performance' | 'security' | 'data' | 'deployment';
  condition: AlertCondition;
  notification: NotificationConfig;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  createdAt: string;
  triggeredAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface AlertCondition {
  type: 'threshold' | 'trend' | 'anomaly' | 'status_change';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  value: number | string;
  duration: number; // seconds
  comparison?: 'absolute' | 'percentage' | 'rate';
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  escalation: EscalationRule[];
  suppression?: {
    enabled: boolean;
    duration: number; // minutes
    conditions: string[];
  };
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty' | 'teams';
  enabled: boolean;
  config: {
    recipients?: string[];
    webhook?: string;
    channel?: string;
    template?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface EscalationRule {
  delay: number; // minutes
  channels: NotificationChannel[];
  conditions?: string[];
}

export interface MonitoringDashboard {
  dashboardId: string;
  name: string;
  description: string;
  environment: string;
  panels: DashboardPanel[];
  layout: 'grid' | 'rows' | 'columns';
  refreshInterval: number; // seconds
  timeRange: {
    from: string;
    to: string;
    default: string;
  };
  variables?: DashboardVariable[];
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPanel {
  panelId: string;
  title: string;
  type: 'chart' | 'stat' | 'table' | 'gauge' | 'log' | 'alert';
  query: string;
  visualization: ChartConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alerts?: AlertConfig[];
  thresholds?: ThresholdConfig[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'heatmap';
  colors?: string[];
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  axes: {
    x: AxisConfig;
    y: AxisConfig;
  };
}

export interface AxisConfig {
  label: string;
  min?: number;
  max?: number;
  format: 'number' | 'percentage' | 'duration' | 'bytes';
  scale: 'linear' | 'log';
}

export interface DashboardVariable {
  name: string;
  type: 'query' | 'custom' | 'interval';
  query?: string;
  values: string[];
  multiSelect: boolean;
  includeAll: boolean;
  default?: string | string[];
}

export interface AlertConfig {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne';
  value: number | string;
  color: 'red' | 'yellow' | 'green' | 'blue';
  fill: boolean;
  line: boolean;
}

export interface ThresholdConfig {
  field: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  color: string;
  fill: boolean;
}

export interface DeploymentMonitoring {
  deploymentId: string;
  environment: string;
  startTime: string;
  endTime?: string;
  status: 'monitoring' | 'completed' | 'failed' | 'cancelled';
  phase: string;
  progress: number; // 0-100
  healthChecks: HealthCheckResult[];
  metrics: DeploymentMetrics;
  alerts: MonitoringAlert[];
  performance: PerformanceMetrics;
  incidents: Incident[];
}

export interface DeploymentMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    transactionsPerSecond: number;
  };
  errorRate: {
    percentage: number;
    totalErrors: number;
    errorTypes: Record<string, number>;
  };
  availability: {
    uptime: number; // percentage
    incidents: number;
    mttr: number; // mean time to recovery in minutes
  };
  resources: {
    cpu: {
      usage: number; // percentage
      load: number;
    };
    memory: {
      used: number; // bytes
      available: number; // bytes
      usage: number; // percentage
    };
    disk: {
      used: number; // bytes
      available: number; // bytes
      usage: number; // percentage
    };
    network: {
      inbound: number; // bytes per second
      outbound: number; // bytes per second
    };
  };
}

export interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  userExperience: {
    bounceRate: number;
    sessionDuration: number;
    pagesPerSession: number;
  };
  business: {
    conversionRate: number;
    revenue: number;
    orders: number;
  };
}

export interface Incident {
  incidentId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  impact: {
    usersAffected: number;
    servicesAffected: string[];
    duration: number; // minutes
  };
  timeline: IncidentEvent[];
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IncidentEvent {
  timestamp: string;
  type: 'created' | 'acknowledged' | 'investigating' | 'update' | 'resolved' | 'closed';
  description: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringSystem {
  type: 'prometheus' | 'datadog' | 'newrelic' | 'cloudwatch' | 'custom';
  endpoints: {
    metrics: string;
    logs: string;
    traces: string;
    alerts: string;
  };
  credentials: Record<string, string>;
  configuration: {
    retention: number; // days
    scrapeInterval: number; // seconds
    queryTimeout: number; // seconds
  };
}

export class MonitoringHealthCheckManager {
  private static instance: MonitoringHealthCheckManager;
  private healthChecks: Map<string, HealthCheckConfig> = new Map();
  private alertRules: Map<string, MonitoringAlert> = new Map();
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private deploymentMonitorings: Map<string, DeploymentMonitoring> = new Map();
  private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();
  private alerts: Map<string, MonitoringAlert[]> = new Map();
  private monitoringSystem: MonitoringSystem;
  private readonly configDir = path.join(process.cwd(), 'monitoring');
  private readonly healthChecksDir = path.join(this.configDir, 'health-checks');
  private readonly alertsDir = path.join(this.configDir, 'alerts');
  private readonly dashboardsDir = path.join(this.configDir, 'dashboards');

  private constructor() {
    this.initializeDirectories();
    this.loadConfigurations();
    this.initializeMonitoringSystem();
    this.startHealthCheckScheduler();
  }

  static getInstance(): MonitoringHealthCheckManager {
    if (!MonitoringHealthCheckManager.instance) {
      MonitoringHealthCheckManager.instance = new MonitoringHealthCheckManager();
    }
    return MonitoringHealthCheckManager.instance;
  }

  private initializeDirectories(): void {
    const dirs = [this.configDir, this.healthChecksDir, this.alertsDir, this.dashboardsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadConfigurations(): void {
    this.loadHealthChecks();
    this.loadAlertRules();
    this.loadDashboards();
  }

  private loadHealthChecks(): void {
    try {
      if (fs.existsSync(this.healthChecksDir)) {
        const files = fs.readdirSync(this.healthChecksDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const checkPath = path.join(this.healthChecksDir, file);
            const content = fs.readFileSync(checkPath, 'utf8');
            const check = JSON.parse(content) as HealthCheckConfig;
            this.healthChecks.set(check.name, check);
          } catch (error) {
            console.error(`Failed to load health check from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load health checks:', error);
    }
  }

  private loadAlertRules(): void {
    try {
      if (fs.existsSync(this.alertsDir)) {
        const files = fs.readdirSync(this.alertsDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const alertPath = path.join(this.alertsDir, file);
            const content = fs.readFileSync(alertPath, 'utf8');
            const alert = JSON.parse(content) as MonitoringAlert;
            this.alertRules.set(alert.alertId, alert);
          } catch (error) {
            console.error(`Failed to load alert rule from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  }

  private loadDashboards(): void {
    try {
      if (fs.existsSync(this.dashboardsDir)) {
        const files = fs.readdirSync(this.dashboardsDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const dashboardPath = path.join(this.dashboardsDir, file);
            const content = fs.readFileSync(dashboardPath, 'utf8');
            const dashboard = JSON.parse(content) as MonitoringDashboard;
            this.dashboards.set(dashboard.dashboardId, dashboard);
          } catch (error) {
            console.error(`Failed to load dashboard from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    }
  }

  private initializeMonitoringSystem(): void {
    this.monitoringSystem = {
      type: 'prometheus',
      endpoints: {
        metrics: process.env.PROMETHEUS_URL || 'http://localhost:9090',
        logs: process.env.LOGS_URL || 'http://localhost:3100',
        traces: process.env.TRACES_URL || 'http://localhost:16686',
        alerts: process.env.ALERTS_URL || 'http://localhost:9093'
      },
      credentials: {
        username: process.env.MONITORING_USERNAME || '',
        password: process.env.MONITORING_PASSWORD || ''
      },
      configuration: {
        retention: 30,
        scrapeInterval: 15,
        queryTimeout: 30
      }
    };
  }

  private startHealthCheckScheduler(): void {
    // Start health check execution scheduler
    setInterval(() => {
      this.executeScheduledHealthChecks();
    }, 10000); // Check every 10 seconds
  }

  // Health Check Management
  public createHealthCheck(check: HealthCheckConfig): void {
    this.validateHealthCheck(check);
    this.healthChecks.set(check.name, check);
    this.saveHealthCheck(check);
  }

  private validateHealthCheck(check: HealthCheckConfig): void {
    const errors: string[] = [];

    if (!check.name) errors.push('name is required');
    if (!check.type) errors.push('type is required');
    if (!check.endpoint) errors.push('endpoint is required');
    if (check.timeout <= 0) errors.push('timeout must be positive');
    if (check.interval <= 0) errors.push('interval must be positive');
    if (check.retryCount < 0) errors.push('retryCount cannot be negative');

    if (errors.length > 0) {
      throw new Error(`Health check validation failed: ${errors.join(', ')}`);
    }
  }

  private saveHealthCheck(check: HealthCheckConfig): void {
    const checkPath = path.join(this.healthChecksDir, `${check.name}.json`);
    fs.writeFileSync(checkPath, JSON.stringify(check, null, 2));
  }

  public getHealthCheck(name: string): HealthCheckConfig | undefined {
    return this.healthChecks.get(name);
  }

  public getAllHealthChecks(): HealthCheckConfig[] {
    return Array.from(this.healthChecks.values());
  }

  public getHealthChecksByEnvironment(environment: string): HealthCheckConfig[] {
    return Array.from(this.healthChecks.values())
      .filter(check => check.environment === environment);
  }

  // Health Check Execution
  public async executeHealthCheck(name: string): Promise<HealthCheckResult> {
    const check = this.healthChecks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    const result: HealthCheckResult = {
      checkId: name,
      status: 'unknown',
      responseTime: 0,
      timestamp: new Date().toISOString(),
      details: {},
      performance: {}
    };

    try {
      // Execute based on check type
      switch (check.type) {
        case 'http':
          await this.executeHttpHealthCheck(check, result);
          break;
        case 'tcp':
          await this.executeTcpHealthCheck(check, result);
          break;
        case 'database':
          await this.executeDatabaseHealthCheck(check, result);
          break;
        case 'custom':
          await this.executeCustomHealthCheck(check, result);
          break;
        case 'composite':
          await this.executeCompositeHealthCheck(check, result);
          break;
        default:
          throw new Error(`Unknown health check type: ${check.type}`);
      }

      // Determine status
      result.status = this.determineHealthCheckStatus(result, check);

      // Collect performance metrics
      await this.collectPerformanceMetrics(result);

    } catch (error) {
      result.status = 'unhealthy';
      result.details.error = error instanceof Error ? error.message : String(error);
    }

    result.responseTime = Date.now() - startTime;
    this.saveHealthCheckResult(result);
    this.processHealthCheckAlerts(result);

    return result;
  }

  private async executeHttpHealthCheck(
    check: HealthCheckConfig,
    result: HealthCheckResult
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), check.timeout * 1000);

    try {
      const response = await fetch(check.endpoint, {
        method: check.method || 'GET',
        headers: {
          'User-Agent': 'HealthCheck-Monitor/1.0',
          ...check.headers
        },
        body: check.body ? JSON.stringify(check.body) : undefined,
        signal: controller.signal
      });

      result.details.statusCode = response.status;
      
      if (check.expectedStatus && response.status !== check.expectedStatus) {
        throw new Error(`Expected status ${check.expectedStatus}, got ${response.status}`);
      }

      // Check expected response if provided
      if (check.expectedResponse) {
        const responseData = await response.json();
        const isValid = this.validateResponse(responseData, check.expectedResponse);
        if (!isValid) {
          throw new Error('Response does not match expected format');
        }
        result.details.metadata = responseData;
      }

    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeTcpHealthCheck(
    check: HealthCheckConfig,
    result: HealthCheckResult
  ): Promise<void> {
    // Simulate TCP health check
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('TCP connection failed'));
        }
      }, Math.random() * 1000 + 100);
    });
  }

  private async executeDatabaseHealthCheck(
    check: HealthCheckConfig,
    result: HealthCheckResult
  ): Promise<void> {
    // Simulate database health check
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate
          resolve();
        } else {
          reject(new Error('Database connection failed'));
        }
      }, Math.random() * 500 + 50);
    });
  }

  private async executeCustomHealthCheck(
    check: HealthCheckConfig,
    result: HealthCheckResult
  ): Promise<void> {
    // Custom health check logic would be implemented here
    // For now, simulate execution
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 200 + 50);
    });
  }

  private async executeCompositeHealthCheck(
    check: HealthCheckConfig,
    result: HealthCheckResult
  ): Promise<void> {
    // Execute multiple health checks and combine results
    const subChecks = (check.metadata?.subChecks as string[]) || [];
    const results = await Promise.allSettled(
      subChecks.map(subCheck => this.executeHealthCheck(subCheck))
    );

    const failedChecks = results.filter(r => r.status === 'rejected');
    if (failedChecks.length > 0) {
      throw new Error(`${failedChecks.length} of ${subChecks.length} sub-checks failed`);
    }

    result.details.metadata = { subChecks: results.map(r => 
      r.status === 'fulfilled' ? r.value.status : 'failed'
    )};
  }

  private validateResponse(actual: any, expected: any): boolean {
    // Simple validation - in reality, this would be more sophisticated
    if (typeof expected === 'object' && expected !== null) {
      return Object.keys(expected).every(key => 
        actual.hasOwnProperty(key) && 
        this.validateResponse(actual[key], expected[key])
      );
    }
    return actual === expected;
  }

  private determineHealthCheckStatus(
    result: HealthCheckResult,
    check: HealthCheckConfig
  ): 'healthy' | 'unhealthy' | 'degraded' | 'unknown' {
    if (result.details.error) {
      return 'unhealthy';
    }

    if (result.responseTime > check.timeout * 1000) {
      return 'degraded';
    }

    if (check.expectedStatus && result.details.statusCode !== check.expectedStatus) {
      return 'unhealthy';
    }

    return 'healthy';
  }

  private async collectPerformanceMetrics(result: HealthCheckResult): Promise<void> {
    // Collect system performance metrics
    // In a real implementation, this would collect actual system metrics
    result.performance = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkLatency: Math.random() * 50 + 10
    };
  }

  private async executeScheduledHealthChecks(): Promise<void> {
    const now = Date.now();
    
    for (const check of this.healthChecks.values()) {
      const lastExecution = this.getLastHealthCheckExecution(check.name);
      const shouldExecute = !lastExecution || 
        (now - new Date(lastExecution).getTime()) >= check.interval * 1000;

      if (shouldExecute) {
        this.executeHealthCheck(check.name).catch(error => {
          console.error(`Scheduled health check failed for ${check.name}:`, error);
        });
      }
    }
  }

  private getLastHealthCheckExecution(checkName: string): string | null {
    const results = this.healthCheckResults.get(checkName);
    if (results && results.length > 0) {
      return results[results.length - 1].timestamp;
    }
    return null;
  }

  private saveHealthCheckResult(result: HealthCheckResult): void {
    if (!this.healthCheckResults.has(result.checkId)) {
      this.healthCheckResults.set(result.checkId, []);
    }
    
    const results = this.healthCheckResults.get(result.checkId)!;
    results.push(result);
    
    // Keep only last 1000 results
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
  }

  // Alert Management
  public createAlertRule(alert: MonitoringAlert): void {
    this.validateAlertRule(alert);
    this.alertRules.set(alert.alertId, alert);
    this.saveAlertRule(alert);
  }

  private validateAlertRule(alert: MonitoringAlert): void {
    const errors: string[] = [];

    if (!alert.alertId) errors.push('alertId is required');
    if (!alert.name) errors.push('name is required');
    if (!alert.condition.metric) errors.push('condition.metric is required');
    if (!alert.condition.operator) errors.push('condition.operator is required');
    if (alert.condition.value === undefined) errors.push('condition.value is required');
    if (!alert.notification.channels || alert.notification.channels.length === 0) {
      errors.push('At least one notification channel is required');
    }

    if (errors.length > 0) {
      throw new Error(`Alert rule validation failed: ${errors.join(', ')}`);
    }
  }

  private saveAlertRule(alert: MonitoringAlert): void {
    const alertPath = path.join(this.alertsDir, `${alert.alertId}.json`);
    fs.writeFileSync(alertPath, JSON.stringify(alert, null, 2));
  }

  private processHealthCheckAlerts(result: HealthCheckResult): void {
    // Check if any alert rules should be triggered
    for (const alert of this.alertRules.values()) {
      if (this.shouldTriggerAlert(alert, result)) {
        this.triggerAlert(alert, result);
      }
    }
  }

  private shouldTriggerAlert(alert: MonitoringAlert, result: HealthCheckResult): boolean {
    // Simple alert evaluation logic
    // In a real implementation, this would be more sophisticated
    
    if (alert.condition.metric === 'response_time') {
      const responseTime = result.responseTime;
      switch (alert.condition.operator) {
        case 'gt':
          return responseTime > Number(alert.condition.value);
        case 'lt':
          return responseTime < Number(alert.condition.value);
        default:
          return false;
      }
    }

    if (alert.condition.metric === 'status') {
      switch (alert.condition.operator) {
        case 'eq':
          return result.status === alert.condition.value;
        case 'ne':
          return result.status !== alert.condition.value;
        default:
          return false;
      }
    }

    return false;
  }

  private triggerAlert(alert: MonitoringAlert, result: HealthCheckResult): void {
    const triggeredAlert: MonitoringAlert = {
      ...alert,
      status: 'active',
      createdAt: new Date().toISOString(),
      triggeredAt: new Date().toISOString()
    };

    if (!this.alerts.has(alert.alertId)) {
      this.alerts.set(alert.alertId, []);
    }
    
    this.alerts.get(alert.alertId)!.push(triggeredAlert);
    
    // Send notifications
    this.sendNotifications(triggeredAlert);

    console.log(`Alert triggered: ${alert.name} - ${result.details.error || 'Health check failed'}`);
  }

  private async sendNotifications(alert: MonitoringAlert): Promise<void> {
    for (const channel of alert.notification.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel);
            break;
          default:
            console.log(`Notification channel ${channel.type} not implemented`);
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error);
      }
    }
  }

  private async sendEmailNotification(alert: MonitoringAlert, channel: NotificationChannel): Promise<void> {
    // Email notification implementation
    console.log(`Email notification sent for alert: ${alert.name}`);
  }

  private async sendSlackNotification(alert: MonitoringAlert, channel: NotificationChannel): Promise<void> {
    // Slack notification implementation
    console.log(`Slack notification sent for alert: ${alert.name}`);
  }

  private async sendWebhookNotification(alert: MonitoringAlert, channel: NotificationChannel): Promise<void> {
    // Webhook notification implementation
    if (channel.config.webhook) {
      try {
        await fetch(channel.config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: alert,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        throw new Error(`Webhook notification failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // Deployment Monitoring
  public startDeploymentMonitoring(
    deploymentId: string,
    environment: string,
    healthChecks: string[] = []
  ): DeploymentMonitoring {
    const monitoring: DeploymentMonitoring = {
      deploymentId,
      environment,
      startTime: new Date().toISOString(),
      status: 'monitoring',
      phase: 'initialization',
      progress: 0,
      healthChecks: [],
      metrics: this.getDefaultDeploymentMetrics(),
      alerts: [],
      performance: this.getDefaultPerformanceMetrics(),
      incidents: []
    };

    this.deploymentMonitorings.set(deploymentId, monitoring);

    // Execute initial health checks
    if (healthChecks.length > 0) {
      this.executeDeploymentHealthChecks(deploymentId, healthChecks);
    }

    // Start continuous monitoring
    this.startContinuousDeploymentMonitoring(deploymentId);

    return monitoring;
  }

  private async executeDeploymentHealthChecks(
    deploymentId: string,
    healthCheckNames: string[]
  ): Promise<void> {
    const monitoring = this.deploymentMonitorings.get(deploymentId);
    if (!monitoring) return;

    for (const checkName of healthCheckNames) {
      try {
        const result = await this.executeHealthCheck(checkName);
        monitoring.healthChecks.push(result);

        // Update monitoring status based on health check results
        this.updateMonitoringStatus(monitoring, result);
      } catch (error) {
        console.error(`Deployment health check failed for ${deploymentId}:`, error);
      }
    }
  }

  private updateMonitoringStatus(
    monitoring: DeploymentMonitoring,
    result: HealthCheckResult
  ): void {
    // Update monitoring metrics based on health check results
    if (result.status === 'unhealthy') {
      monitoring.progress = Math.min(monitoring.progress, 90); // Don't complete if unhealthy
    } else if (result.status === 'healthy') {
      monitoring.progress = Math.min(monitoring.progress + 10, 100);
      if (monitoring.progress === 100) {
        monitoring.status = 'completed';
        monitoring.endTime = new Date().toISOString();
      }
    }
  }

  private startContinuousDeploymentMonitoring(deploymentId: string): void {
    const interval = setInterval(async () => {
      const monitoring = this.deploymentMonitorings.get(deploymentId);
      if (!monitoring || monitoring.status !== 'monitoring') {
        clearInterval(interval);
        return;
      }

      // Update metrics continuously
      await this.updateDeploymentMetrics(monitoring);
      
      // Check for alerts
      this.checkDeploymentAlerts(monitoring);
      
    }, 30000); // Update every 30 seconds
  }

  private async updateDeploymentMetrics(monitoring: DeploymentMonitoring): Promise<void> {
    // Update deployment metrics with real-time data
    // In a real implementation, this would fetch actual metrics
    
    monitoring.metrics.responseTime = {
      p50: Math.random() * 100 + 50,
      p95: Math.random() * 200 + 100,
      p99: Math.random() * 500 + 200,
      average: Math.random() * 150 + 75
    };

    monitoring.metrics.throughput = {
      requestsPerSecond: Math.random() * 1000 + 500,
      transactionsPerSecond: Math.random() * 100 + 50
    };

    monitoring.metrics.errorRate = {
      percentage: Math.random() * 5,
      totalErrors: Math.floor(Math.random() * 10),
      errorTypes: {
        '4xx': Math.floor(Math.random() * 5),
        '5xx': Math.floor(Math.random() * 3)
      }
    };

    monitoring.metrics.resources = {
      cpu: {
        usage: Math.random() * 80 + 10,
        load: Math.random() * 2 + 0.5
      },
      memory: {
        used: Math.random() * 8 * 1024 * 1024 * 1024 + 2 * 1024 * 1024 * 1024, // 2-10 GB
        available: 16 * 1024 * 1024 * 1024, // 16 GB total
        usage: Math.random() * 60 + 20
      },
      disk: {
        used: Math.random() * 500 * 1024 * 1024 * 1024 + 100 * 1024 * 1024 * 1024, // 100-600 GB
        available: 1000 * 1024 * 1024 * 1024, // 1 TB total
        usage: Math.random() * 70 + 20
      },
      network: {
        inbound: Math.random() * 100 * 1024 * 1024 + 10 * 1024 * 1024, // 10-110 MB/s
        outbound: Math.random() * 50 * 1024 * 1024 + 5 * 1024 * 1024 // 5-55 MB/s
      }
    };
  }

  private checkDeploymentAlerts(monitoring: DeploymentMonitoring): void {
    // Check if any alert conditions are met
    for (const alert of this.alertRules.values()) {
      if (alert.category === 'deployment' && this.shouldTriggerDeploymentAlert(alert, monitoring)) {
        this.triggerAlert(alert, { status: 'unknown', responseTime: 0, timestamp: new Date().toISOString(), checkId: 'deployment', details: {} } as HealthCheckResult);
        monitoring.alerts.push(alert);
      }
    }
  }

  private shouldTriggerDeploymentAlert(alert: MonitoringAlert, monitoring: DeploymentMonitoring): boolean {
    // Deployment-specific alert logic
    if (alert.condition.metric === 'error_rate') {
      return monitoring.metrics.errorRate.percentage > Number(alert.condition.value);
    }
    
    if (alert.condition.metric === 'response_time') {
      return monitoring.metrics.responseTime.average > Number(alert.condition.value);
    }

    return false;
  }

  private getDefaultDeploymentMetrics(): DeploymentMetrics {
    return {
      responseTime: { p50: 0, p95: 0, p99: 0, average: 0 },
      throughput: { requestsPerSecond: 0, transactionsPerSecond: 0 },
      errorRate: { percentage: 0, totalErrors: 0, errorTypes: {} },
      availability: { uptime: 100, incidents: 0, mttr: 0 },
      resources: {
        cpu: { usage: 0, load: 0 },
        memory: { used: 0, available: 0, usage: 0 },
        disk: { used: 0, available: 0, usage: 0 },
        network: { inbound: 0, outbound: 0 }
      }
    };
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
      userExperience: { bounceRate: 0, sessionDuration: 0, pagesPerSession: 0 },
      business: { conversionRate: 0, revenue: 0, orders: 0 }
    };
  }

  // Dashboard Management
  public createDashboard(dashboard: MonitoringDashboard): void {
    this.validateDashboard(dashboard);
    this.dashboards.set(dashboard.dashboardId, dashboard);
    this.saveDashboard(dashboard);
  }

  private validateDashboard(dashboard: MonitoringDashboard): void {
    const errors: string[] = [];

    if (!dashboard.dashboardId) errors.push('dashboardId is required');
    if (!dashboard.name) errors.push('name is required');
    if (!dashboard.panels || dashboard.panels.length === 0) {
      errors.push('At least one panel is required');
    }

    if (errors.length > 0) {
      throw new Error(`Dashboard validation failed: ${errors.join(', ')}`);
    }
  }

  private saveDashboard(dashboard: MonitoringDashboard): void {
    const dashboardPath = path.join(this.dashboardsDir, `${dashboard.dashboardId}.json`);
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
  }

  // Status and Metrics
  public getHealthCheckStatus(name: string): {
    current: HealthCheckResult | null;
    history: HealthCheckResult[];
    trends: {
      status: 'improving' | 'stable' | 'degrading';
      responseTime: number;
      uptime: number;
    };
  } {
    const results = this.healthCheckResults.get(name) || [];
    const current = results.length > 0 ? results[results.length - 1] : null;
    
    // Calculate trends
    const recentResults = results.slice(-10);
    const healthyCount = recentResults.filter(r => r.status === 'healthy').length;
    const uptime = (healthyCount / recentResults.length) * 100;
    
    const responseTimes = recentResults.map(r => r.responseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentResults.length >= 5) {
      const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2));
      const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, r) => sum + r.responseTime, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + r.responseTime, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg * 0.9) trend = 'improving';
      else if (secondAvg > firstAvg * 1.1) trend = 'degrading';
    }

    return {
      current,
      history: results.slice(-100), // Last 100 results
      trends: {
        status: trend,
        responseTime: avgResponseTime,
        uptime
      }
    };
  }

  public getDeploymentMonitoring(deploymentId: string): DeploymentMonitoring | undefined {
    return this.deploymentMonitorings.get(deploymentId);
  }

  public getAllDeploymentsMonitoring(): DeploymentMonitoring[] {
    return Array.from(this.deploymentMonitorings.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getMonitoringOverview(): {
    totalHealthChecks: number;
    healthyChecks: number;
    unhealthyChecks: number;
    degradedChecks: number;
    activeAlerts: number;
    activeDeployments: number;
    systemStatus: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const allChecks = this.getAllHealthChecks();
    const healthCheckStatuses = allChecks.map(check => {
      const status = this.getHealthCheckStatus(check.name);
      return status.current?.status || 'unknown';
    });

    const healthy = healthCheckStatuses.filter(s => s === 'healthy').length;
    const unhealthy = healthCheckStatuses.filter(s => s === 'unhealthy').length;
    const degraded = healthCheckStatuses.filter(s => s === 'degraded').length;

    const allAlerts = Array.from(this.alerts.values()).flat();
    const activeAlerts = allAlerts.filter(a => a.status === 'active').length;

    const activeDeployments = Array.from(this.deploymentMonitorings.values())
      .filter(d => d.status === 'monitoring').length;

    let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthy > 0) systemStatus = 'unhealthy';
    else if (degraded > 0 || activeAlerts > 0) systemStatus = 'degraded';

    return {
      totalHealthChecks: allChecks.length,
      healthyChecks: healthy,
      unhealthyChecks: unhealthy,
      degradedChecks: degraded,
      activeAlerts,
      activeDeployments,
      systemStatus
    };
  }
}

// Export singleton instance
export const monitoringHealthCheckManager = MonitoringHealthCheckManager.getInstance();