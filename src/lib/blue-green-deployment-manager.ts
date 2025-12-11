/**
 * Enhanced Blue-Green Deployment Pipeline Manager
 * 
 * Provides comprehensive zero-downtime deployment with automated rollback,
 * health verification, and monitoring integration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  deploymentStrategy: 'blue-green' | 'canary' | 'rolling';
  healthCheckEndpoints: string[];
  timeout: number; // seconds
  rollbackOnFailure: boolean;
  enableMonitoring: boolean;
  enableNotifications: boolean;
  backupBeforeDeploy: boolean;
  validationSteps: ValidationStep[];
  customScripts?: {
    preDeploy?: string;
    postDeploy?: string;
    preRollback?: string;
    postRollback?: string;
  };
}

export interface ValidationStep {
  name: string;
  type: 'http' | 'command' | 'file' | 'database' | 'custom';
  config: any;
  timeout: number;
  critical: boolean;
  retries: number;
}

export interface DeploymentStatus {
  deploymentId: string;
  environment: string;
  status: 'pending' | 'deploying' | 'validating' | 'switching' | 'completed' | 'failed' | 'rolled_back';
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  currentEnvironment: 'blue' | 'green' | 'unknown';
  targetEnvironment: 'blue' | 'green' | 'unknown';
  validationResults: ValidationResult[];
  errors: DeploymentError[];
  warnings: string[];
  rollbackInfo?: RollbackInfo;
  metadata: Record<string, any>;
}

export interface ValidationResult {
  stepName: string;
  success: boolean;
  duration: number; // milliseconds
  error?: string;
  output?: string;
}

export interface DeploymentError {
  code: string;
  message: string;
  timestamp: string;
  details?: any;
  stack?: string;
}

export interface RollbackInfo {
  reason: string;
  trigger: 'manual' | 'automatic' | 'validation_failed' | 'health_check_failed';
  targetVersion: string;
  rollbackDuration: number; // seconds
  dataRestored: boolean;
}

export interface EnvironmentState {
  environment: string;
  currentVersion: string;
  currentDeployment: 'blue' | 'green';
  lastDeploymentTime: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  activeUsers: number;
  performance: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export class BlueGreenDeploymentManager {
  private static instance: BlueGreenDeploymentManager;
  private deployments: Map<string, DeploymentStatus> = new Map();
  private environmentStates: Map<string, EnvironmentState> = new Map();
  private readonly deploymentsDir = path.join(process.cwd(), 'deployments');
  private readonly stateFile = path.join(process.cwd(), 'deployment-state.json');

  private constructor() {
    this.initializeDirectories();
    this.loadDeploymentState();
  }

  static getInstance(): BlueGreenDeploymentManager {
    if (!BlueGreenDeploymentManager.instance) {
      BlueGreenDeploymentManager.instance = new BlueGreenDeploymentManager();
    }
    return BlueGreenDeploymentManager.instance;
  }

  private initializeDirectories(): void {
    if (!fs.existsSync(this.deploymentsDir)) {
      fs.mkdirSync(this.deploymentsDir, { recursive: true });
    }
  }

  private loadDeploymentState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        if (data.environments) {
          Object.keys(data.environments).forEach(env => {
            this.environmentStates.set(env, data.environments[env]);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load deployment state:', error);
    }
  }

  private saveDeploymentState(): void {
    try {
      const data = {
        environments: Object.fromEntries(this.environmentStates),
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save deployment state:', error);
    }
  }

  // Deployment Execution
  public async executeBlueGreenDeployment(
    config: DeploymentConfig,
    options: {
      version?: string;
      force?: boolean;
      skipValidation?: boolean;
      customTimeout?: number;
    } = {}
  ): Promise<DeploymentStatus> {
    const deploymentId = this.generateDeploymentId();
    const startTime = new Date().toISOString();
    
    const deployment: DeploymentStatus = {
      deploymentId,
      environment: config.environment,
      status: 'pending',
      startTime,
      duration: 0,
      currentEnvironment: this.getCurrentEnvironment(config.environment),
      targetEnvironment: this.getTargetEnvironment(config.environment),
      validationResults: [],
      errors: [],
      warnings: [],
      metadata: {
        version: options.version || 'latest',
        force: options.force || false,
        skipValidation: options.skipValidation || false
      }
    };

    this.deployments.set(deploymentId, deployment);

    try {
      deployment.status = 'deploying';
      
      // Pre-deployment validation
      await this.validatePreDeployment(config, deployment);
      
      // Create backup if required
      if (config.backupBeforeDeploy) {
        await this.createDeploymentBackup(deployment);
      }

      // Deploy to target environment
      const targetEnv = deployment.targetEnvironment;
      await this.deployToEnvironment(config, targetEnv, options);

      // Run validation steps
      if (!options.skipValidation) {
        deployment.status = 'validating';
        await this.runValidationSteps(config, deployment);
      }

      // Switch traffic
      deployment.status = 'switching';
      await this.switchTraffic(config, deployment);

      // Post-deployment validation
      await this.validatePostDeployment(config, deployment);

      deployment.status = 'completed';
      deployment.endTime = new Date().toISOString();
      
      // Update environment state
      await this.updateEnvironmentState(config.environment, deployment);

    } catch (error) {
      deployment.status = 'failed';
      deployment.errors.push({
        code: 'DEPLOYMENT_FAILED',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Attempt automatic rollback
      if (config.rollbackOnFailure) {
        await this.executeRollback(deployment, 'automatic', error instanceof Error ? error.message : String(error));
      }

      deployment.endTime = new Date().toISOString();
    }

    deployment.duration = Math.floor(
      (new Date(deployment.endTime).getTime() - new Date(deployment.startTime).getTime()) / 1000
    );

    this.saveDeploymentState();
    return deployment;
  }

  private generateDeploymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `deploy-${timestamp}-${random}`;
  }

  private getCurrentEnvironment(environment: string): 'blue' | 'green' | 'unknown' {
    const state = this.environmentStates.get(environment);
    return state?.currentDeployment || 'unknown';
  }

  private getTargetEnvironment(environment: string): 'blue' | 'green' {
    const current = this.getCurrentEnvironment(environment);
    return current === 'blue' ? 'green' : 'blue';
  }

  private async validatePreDeployment(config: DeploymentConfig, deployment: DeploymentStatus): Promise<void> {
    // Check if deployment is already in progress
    const activeDeployments = Array.from(this.deployments.values())
      .filter(d => d.environment === config.environment && 
                  ['pending', 'deploying', 'validating', 'switching'].includes(d.status));
    
    if (activeDeployments.length > 0 && !deployment.metadata.force) {
      throw new Error(`Deployment already in progress for environment ${config.environment}`);
    }

    // Check environment health
    const envState = this.environmentStates.get(config.environment);
    if (envState?.healthStatus === 'unhealthy' && !deployment.metadata.force) {
      throw new Error(`Environment ${config.environment} is unhealthy. Force deployment required.`);
    }

    // Run pre-deployment custom script
    if (config.customScripts?.preDeploy) {
      await this.executeCustomScript(config.customScripts.preDeploy, 'pre-deploy');
    }
  }

  private async createDeploymentBackup(deployment: DeploymentStatus): Promise<void> {
    try {
      const backupId = `backup-${deployment.deploymentId}`;
      // In a real implementation, this would create actual backups
      console.log(`Creating backup: ${backupId}`);
      
      deployment.metadata.backupId = backupId;
    } catch (error) {
      deployment.warnings.push(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deployToEnvironment(
    config: DeploymentConfig,
    targetEnvironment: 'blue' | 'green',
    options: any
  ): Promise<void> {
    try {
      // Enhanced deployment logic with environment-specific configurations
      const deploymentCommand = this.buildDeploymentCommand(config, targetEnvironment);
      
      console.log(`Deploying to ${config.environment}-${targetEnvironment}...`);
      
      // Execute deployment with timeout
      await this.executeCommandWithTimeout(
        deploymentCommand,
        options.customTimeout || config.timeout
      );

      // Wait for deployment to be ready
      await this.waitForDeployment(config, targetEnvironment);

    } catch (error) {
      throw new Error(`Deployment to ${config.environment}-${targetEnvironment} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildDeploymentCommand(config: DeploymentConfig, environment: 'blue' | 'green'): string {
    // Build platform-specific deployment command
    switch (process.env.DEPLOYMENT_PLATFORM) {
      case 'vercel':
        return `npx vercel deploy --prod=false --alias ${config.environment}-${environment}`;
      case 'aws':
        return `aws s3 sync ./build s3://${config.environment}-${environment}-bucket`;
      case 'kubernetes':
        return `kubectl apply -f k8s/${config.environment}-${environment}.yaml`;
      default:
        return `echo "No deployment platform configured"`;
    }
  }

  private async executeCommandWithTimeout(command: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeout} seconds`));
      }, timeout * 1000);

      try {
        execSync(command, { stdio: 'inherit' });
        clearTimeout(timeoutHandle);
        resolve();
      } catch (error) {
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  private async waitForDeployment(config: DeploymentConfig, environment: 'blue' | 'green'): Promise<void> {
    const maxRetries = 30;
    const retryDelay = 10000; // 10 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const isHealthy = await this.checkEnvironmentHealth(config, environment);
        if (isHealthy) {
          console.log(`Environment ${config.environment}-${environment} is healthy`);
          return;
        }
      } catch (error) {
        console.log(`Health check failed, retrying... (${i + 1}/${maxRetries})`);
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(`Environment ${config.environment}-${environment} did not become healthy within timeout`);
  }

  private async checkEnvironmentHealth(config: DeploymentConfig, environment: 'blue' | 'green'): Promise<boolean> {
    const baseUrl = this.getEnvironmentUrl(config.environment, environment);
    
    for (const endpoint of config.healthCheckEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'Deployment-Health-Check' },
          signal: AbortSignal.timeout(5000) // 5 second timeout per check
        });
        
        if (!response.ok) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  private getEnvironmentUrl(environment: string, deployment: 'blue' | 'green'): string {
    // Return environment-specific URL
    const baseUrls = {
      development: 'http://localhost:3000',
      staging: `https://${environment}-staging.vercel.app`,
      production: `https://${environment}-production.vercel.app`
    };
    
    return baseUrls[environment as keyof typeof baseUrls] || baseUrls.development;
  }

  private async runValidationSteps(config: DeploymentConfig, deployment: DeploymentStatus): Promise<void> {
    for (const step of config.validationSteps) {
      const startTime = Date.now();
      
      try {
        const result = await this.executeValidationStep(step, config, deployment);
        const duration = Date.now() - startTime;

        deployment.validationResults.push({
          stepName: step.name,
          success: result.success,
          duration,
          error: result.error,
          output: result.output
        });

        if (!result.success && step.critical) {
          throw new Error(`Critical validation step '${step.name}' failed: ${result.error}`);
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        
        deployment.validationResults.push({
          stepName: step.name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error)
        });

        if (step.critical) {
          throw error;
        }
      }
    }
  }

  private async executeValidationStep(
    step: ValidationStep,
    config: DeploymentConfig,
    deployment: DeploymentStatus
  ): Promise<{ success: boolean; error?: string; output?: string }> {
    const targetUrl = this.getEnvironmentUrl(config.environment, deployment.targetEnvironment);

    switch (step.type) {
      case 'http':
        return this.validateHttpEndpoint(step, targetUrl);
      
      case 'command':
        return this.validateCommand(step);
      
      case 'file':
        return this.validateFile(step, targetUrl);
      
      case 'database':
        return this.validateDatabase(step);
      
      case 'custom':
        return this.validateCustom(step);
      
      default:
        return { success: false, error: `Unknown validation type: ${step.type}` };
    }
  }

  private async validateHttpEndpoint(step: ValidationStep, baseUrl: string): Promise<{ success: boolean; error?: string; output?: string }> {
    try {
      const response = await fetch(`${baseUrl}${step.config.endpoint}`, {
        method: step.config.method || 'GET',
        headers: step.config.headers || {},
        signal: AbortSignal.timeout(step.timeout * 1000)
      });

      const success = response.ok && 
        (!step.config.expectedStatus || response.status === step.config.expectedStatus);

      return {
        success,
        output: `HTTP ${response.status}`,
        error: success ? undefined : `Expected status ${step.config.expectedStatus}, got ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: `HTTP validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async validateCommand(step: ValidationStep): Promise<{ success: boolean; error?: string; output?: string }> {
    try {
      const output = execSync(step.config.command, { 
        encoding: 'utf8',
        timeout: step.timeout * 1000 
      });
      
      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: `Command failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async validateFile(step: ValidationStep, baseUrl: string): Promise<{ success: boolean; error?: string; output?: string }> {
    try {
      const response = await fetch(`${baseUrl}${step.config.path}`);
      const content = await response.text();
      
      const success = step.config.expectedContent 
        ? content.includes(step.config.expectedContent)
        : response.ok;

      return {
        success,
        output: `File size: ${content.length} bytes`,
        error: success ? undefined : 'File content validation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: `File validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async validateDatabase(step: ValidationStep): Promise<{ success: boolean; error?: string; output?: string }> {
    // Placeholder for database validation
    return {
      success: true,
      output: 'Database validation simulated'
    };
  }

  private async validateCustom(step: ValidationStep): Promise<{ success: boolean; error?: string; output?: string }> {
    // Placeholder for custom validation
    return {
      success: true,
      output: 'Custom validation simulated'
    };
  }

  private async switchTraffic(config: DeploymentConfig, deployment: DeploymentStatus): Promise<void> {
    const fromEnv = deployment.currentEnvironment;
    const toEnv = deployment.targetEnvironment;

    console.log(`Switching traffic from ${config.environment}-${fromEnv} to ${config.environment}-${toEnv}`);

    try {
      // Update DNS or load balancer configuration
      await this.updateTrafficRouting(config, fromEnv, toEnv);
      
      // Wait for traffic switch to propagate
      await this.waitForTrafficSwitch(config, toEnv);
      
      console.log(`Traffic successfully switched to ${config.environment}-${toEnv}`);
    } catch (error) {
      throw new Error(`Traffic switch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateTrafficRouting(
    config: DeploymentConfig,
    fromEnv: 'blue' | 'green',
    toEnv: 'blue' | 'green'
  ): Promise<void> {
    // Platform-specific traffic routing logic
    switch (process.env.DEPLOYMENT_PLATFORM) {
      case 'vercel':
        await this.updateVercelAlias(config.environment, toEnv);
        break;
      case 'aws':
        await this.updateCloudFront(config.environment, toEnv);
        break;
      case 'kubernetes':
        await this.updateKubernetesService(config.environment, toEnv);
        break;
      default:
        console.log('No traffic routing platform configured');
    }
  }

  private async updateVercelAlias(environment: string, deployment: 'blue' | 'green'): Promise<void> {
    const alias = `${environment}-${deployment}`;
    const domain = `${environment}.energy-drink-app.com`;
    
    try {
      execSync(`npx vercel alias set ${alias} ${domain} --token ${process.env.VERCEL_TOKEN}`);
    } catch (error) {
      throw new Error(`Vercel alias update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateCloudFront(environment: string, deployment: 'blue' | 'green'): Promise<void> {
    // Placeholder for CloudFront distribution update
    console.log(`CloudFront distribution update simulated for ${environment}-${deployment}`);
  }

  private async updateKubernetesService(environment: string, deployment: 'blue' | 'green'): Promise<void> {
    try {
      execSync(`kubectl patch service ${environment}-service -p '{"spec":{"selector":{"version":"' + deployment + '"}}'`);
    } catch (error) {
      throw new Error(`Kubernetes service update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async waitForTrafficSwitch(config: DeploymentConfig, targetEnv: 'blue' | 'green'): Promise<void> {
    const maxRetries = 20;
    const retryDelay = 5000; // 5 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const isRoutingCorrect = await this.verifyTrafficRouting(config, targetEnv);
        if (isRoutingCorrect) {
          return;
        }
      } catch (error) {
        console.log(`Traffic verification failed, retrying... (${i + 1}/${maxRetries})`);
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Traffic switch verification failed after maximum retries');
  }

  private async verifyTrafficRouting(config: DeploymentConfig, expectedEnv: 'blue' | 'green'): Promise<boolean> {
    const response = await fetch(this.getEnvironmentUrl(config.environment, expectedEnv));
    return response.ok;
  }

  private async validatePostDeployment(config: DeploymentConfig, deployment: DeploymentStatus): Promise<void> {
    // Run post-deployment custom script
    if (config.customScripts?.postDeploy) {
      await this.executeCustomScript(config.customScripts.postDeploy, 'post-deploy');
    }

    // Update environment state
    await this.updateEnvironmentState(config.environment, deployment);
  }

  private async executeCustomScript(scriptPath: string, phase: string): Promise<void> {
    try {
      if (fs.existsSync(scriptPath)) {
        execSync(`node ${scriptPath} ${phase}`, { stdio: 'inherit' });
      }
    } catch (error) {
      throw new Error(`Custom ${phase} script failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateEnvironmentState(environment: string, deployment: DeploymentStatus): Promise<void> {
    const state: EnvironmentState = {
      environment,
      currentVersion: deployment.metadata.version,
      currentDeployment: deployment.targetEnvironment,
      lastDeploymentTime: new Date().toISOString(),
      healthStatus: 'healthy',
      activeUsers: 0,
      performance: {
        responseTime: 0,
        errorRate: 0,
        throughput: 0
      }
    };

    this.environmentStates.set(environment, state);
    this.saveDeploymentState();
  }

  // Rollback Management
  public async executeRollback(
    deployment: DeploymentStatus,
    trigger: 'manual' | 'automatic' | 'validation_failed' | 'health_check_failed',
    reason: string
  ): Promise<void> {
    try {
      deployment.status = 'rolled_back';
      
      const rollbackInfo: RollbackInfo = {
        reason,
        trigger,
        targetVersion: this.getPreviousVersion(deployment.environment),
        rollbackDuration: 0,
        dataRestored: false
      };

      const rollbackStart = Date.now();

      // Run pre-rollback custom script
      const config = await this.getDeploymentConfig(deployment.environment);
      if (config?.customScripts?.preRollback) {
        await this.executeCustomScript(config.customScripts.preRollback, 'pre-rollback');
      }

      // Switch traffic back
      const targetEnv = deployment.currentEnvironment;
      await this.switchTraffic(config!, deployment);
      
      // Validate rollback
      await this.waitForTrafficSwitch(config!, targetEnv);

      rollbackInfo.rollbackDuration = Math.floor((Date.now() - rollbackStart) / 1000);
      
      // Run post-rollback custom script
      if (config?.customScripts?.postRollback) {
        await this.executeCustomScript(config.customScripts.postRollback, 'post-rollback');
      }

      deployment.rollbackInfo = rollbackInfo;
      deployment.endTime = new Date().toISOString();

      console.log(`Rollback completed: ${reason}`);

    } catch (error) {
      deployment.errors.push({
        code: 'ROLLBACK_FAILED',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getPreviousVersion(environment: string): string {
    const state = this.environmentStates.get(environment);
    // In a real implementation, this would query version history
    return state?.currentVersion || 'previous';
  }

  private async getDeploymentConfig(environment: string): Promise<DeploymentConfig | null> {
    // In a real implementation, this would load from configuration files
    return {
      environment: environment as any,
      deploymentStrategy: 'blue-green',
      healthCheckEndpoints: ['/api/health', '/'],
      timeout: 300,
      rollbackOnFailure: true,
      enableMonitoring: true,
      enableNotifications: true,
      backupBeforeDeploy: true,
      validationSteps: []
    };
  }

  // Monitoring and Status
  public getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  public getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getEnvironmentStatus(environment: string): EnvironmentState | undefined {
    return this.environmentStates.get(environment);
  }

  public getDeploymentMetrics(): {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDuration: number;
    successRate: number;
    rollbackRate: number;
  } {
    const allDeployments = this.getAllDeployments();
    const successful = allDeployments.filter(d => d.status === 'completed');
    const failed = allDeployments.filter(d => d.status === 'failed');
    const rolledBack = allDeployments.filter(d => d.status === 'rolled_back');

    const averageDuration = allDeployments.length > 0
      ? allDeployments.reduce((sum, d) => sum + d.duration, 0) / allDeployments.length
      : 0;

    return {
      totalDeployments: allDeployments.length,
      successfulDeployments: successful.length,
      failedDeployments: failed.length,
      averageDuration,
      successRate: allDeployments.length > 0 ? (successful.length / allDeployments.length) * 100 : 0,
      rollbackRate: allDeployments.length > 0 ? (rolledBack.length / allDeployments.length) * 100 : 0
    };
  }

  // Health Monitoring
  public async performHealthCheck(environment: string): Promise<{
    healthy: boolean;
    responseTime: number;
    errorRate: number;
    issues: string[];
  }> {
    const state = this.environmentStates.get(environment);
    if (!state) {
      return {
        healthy: false,
        responseTime: 0,
        errorRate: 100,
        issues: ['Environment state not found']
      };
    }

    const issues: string[] = [];
    let totalResponseTime = 0;
    let errorCount = 0;
    const totalChecks = 5;

    // Perform health checks
    for (let i = 0; i < totalChecks; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch(this.getEnvironmentUrl(environment, state.currentDeployment));
        const responseTime = Date.now() - startTime;

        totalResponseTime += responseTime;

        if (!response.ok) {
          errorCount++;
          issues.push(`Health check ${i + 1} failed with status ${response.status}`);
        }
      } catch (error) {
        errorCount++;
        issues.push(`Health check ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const averageResponseTime = totalResponseTime / totalChecks;
    const errorRate = (errorCount / totalChecks) * 100;
    const healthy = errorRate === 0 && averageResponseTime < 2000; // 2 second threshold

    // Update state
    state.healthStatus = healthy ? 'healthy' : 'unhealthy';
    state.performance = {
      responseTime: averageResponseTime,
      errorRate,
      throughput: 0 // Would be calculated from actual metrics
    };

    this.environmentStates.set(environment, state);
    this.saveDeploymentState();

    return {
      healthy,
      responseTime: averageResponseTime,
      errorRate,
      issues
    };
  }
}

// Export singleton instance
export const blueGreenDeploymentManager = BlueGreenDeploymentManager.getInstance();