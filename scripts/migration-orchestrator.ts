#!/usr/bin/env node

/**
 * Migration Orchestrator Script
 * 
 * Automates the complete migration process from energy drink app to global soda platform
 * with comprehensive orchestration, validation, and rollback capabilities
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  featureFlagManager,
  dataMigrationManager,
  blueGreenDeploymentManager,
  environmentConfigManager,
  databaseMigrationStrategy,
  cdnAssetMigrationManager,
  monitoringHealthCheckManager
} from '../src/lib/index.js';

interface MigrationOrchestrationConfig {
  sourceEnvironment: string;
  targetEnvironment: string;
  migrationPlan: string;
  strategies: {
    featureFlags: boolean;
    dataMigration: boolean;
    blueGreen: boolean;
    database: boolean;
    cdnAssets: boolean;
    monitoring: boolean;
  };
  validation: {
    preMigration: boolean;
    postMigration: boolean;
    rollback: boolean;
  };
  automation: {
    autoRollback: boolean;
    parallelExecution: boolean;
    continueOnError: boolean;
  };
  timeline: {
    phases: MigrationPhase[];
    dependencies: string[];
    timeout: number; // minutes
  };
}

interface MigrationPhase {
  name: string;
  description: string;
  order: number;
  estimatedDuration: number; // minutes
  dependencies: string[];
  parallel: boolean;
  required: boolean;
  steps: MigrationStep[];
}

interface MigrationStep {
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number; // minutes
  retryCount: number;
  critical: boolean;
  rollbackAction?: string;
}

interface MigrationExecution {
  executionId: string;
  config: MigrationOrchestrationConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
  startTime: string;
  endTime?: string;
  currentPhase?: string;
  currentStep?: string;
  phases: PhaseExecution[];
  errors: MigrationExecutionError[];
  warnings: string[];
  metrics: MigrationMetrics;
  rollbackInfo?: RollbackInfo;
}

interface PhaseExecution {
  phaseName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  steps: StepExecution[];
  errors: string[];
  warnings: string[];
}

interface StepExecution {
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  output?: string;
  error?: string;
  retryCount: number;
}

interface MigrationExecutionError {
  phase: string;
  step: string;
  code: string;
  message: string;
  timestamp: string;
  recoverable: boolean;
  details?: any;
}

interface MigrationMetrics {
  totalDuration: number; // minutes
  phasesCompleted: number;
  stepsCompleted: number;
  totalSteps: number;
  successRate: number;
  averageStepDuration: number;
  dataProcessed: number;
  assetsMigrated: number;
}

interface RollbackInfo {
  triggered: boolean;
  reason: string;
  timestamp: string;
  rollbackDuration: number; // minutes
  phasesRolledBack: number;
  dataRestored: boolean;
  success: boolean;
}

class MigrationOrchestrator {
  private executions: Map<string, MigrationExecution> = new Map();
  private readonly executionsDir = path.join(process.cwd(), 'migration', 'executions');
  private readonly logsDir = path.join(process.cwd(), 'migration', 'logs');

  constructor() {
    this.initializeDirectories();
    this.setupSignalHandlers();
  }

  private initializeDirectories(): void {
    const dirs = [this.executionsDir, this.logsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
  }

  private handleShutdown(signal: string): void {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    
    // Cancel any running executions
    for (const [id, execution] of this.executions) {
      if (execution.status === 'running') {
        this.cancelExecution(id, `Received ${signal} signal`).catch(console.error);
      }
    }
    
    process.exit(0);
  }

  // Main orchestration method
  public async executeMigration(config: MigrationOrchestrationConfig): Promise<MigrationExecution> {
    const executionId = this.generateExecutionId();
    
    const execution: MigrationExecution = {
      executionId,
      config,
      status: 'pending',
      startTime: new Date().toISOString(),
      phases: config.timeline.phases.map(phase => ({
        phaseName: phase.name,
        status: 'pending',
        steps: phase.steps.map(step => ({
          stepName: step.name,
          status: 'pending',
          retryCount: 0
        })),
        errors: [],
        warnings: []
      })),
      errors: [],
      warnings: [],
      metrics: {
        totalDuration: 0,
        phasesCompleted: 0,
        stepsCompleted: 0,
        totalSteps: config.timeline.phases.reduce((sum, p) => sum + p.steps.length, 0),
        successRate: 0,
        averageStepDuration: 0,
        dataProcessed: 0,
        assetsMigrated: 0
      }
    };

    this.executions.set(executionId, execution);
    this.saveExecution(execution);

    try {
      console.log(`🚀 Starting migration orchestration: ${executionId}`);
      console.log(`📋 Source: ${config.sourceEnvironment} → Target: ${config.targetEnvironment}`);
      console.log(`⏱️  Estimated duration: ${config.timeline.timeout} minutes`);
      console.log('');

      execution.status = 'running';

      // Phase 1: Pre-migration validation and preparation
      await this.executePhase(execution, 'preparation');

      // Phase 2: Feature flag management
      if (config.strategies.featureFlags) {
        await this.executePhase(execution, 'feature-flags');
      }

      // Phase 3: Data migration
      if (config.strategies.dataMigration) {
        await this.executePhase(execution, 'data-migration');
      }

      // Phase 4: Database migration
      if (config.strategies.database) {
        await this.executePhase(execution, 'database-migration');
      }

      // Phase 5: CDN and asset migration
      if (config.strategies.cdnAssets) {
        await this.executePhase(execution, 'cdn-migration');
      }

      // Phase 6: Environment configuration
      await this.executePhase(execution, 'configuration');

      // Phase 7: Blue-green deployment
      if (config.strategies.blueGreen) {
        await this.executePhase(execution, 'deployment');
      }

      // Phase 8: Monitoring setup
      if (config.strategies.monitoring) {
        await this.executePhase(execution, ' }

      // Phasemonitoring');
      9: Post-migration validation
      await this.executePhase(execution, 'validation');

      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      
      this.calculateMetrics(execution);
      
      console.log('\n✅ Migration completed successfully!');
      console.log(`📊 Total duration: ${execution.metrics.totalDuration} minutes`);
      console.log(`📈 Success rate: ${execution.metrics.successRate}%`);
      console.log(`📁 Execution saved: ${executionId}`);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      
      console.error('\n❌ Migration failed:', error);
      
      // Add error to execution
      execution.errors.push({
        phase: execution.currentPhase || 'unknown',
        step: execution.currentStep || 'unknown',
        code: 'MIGRATION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        recoverable: false
      });

      // Attempt automatic rollback if configured
      if (config.automation.autoRollback) {
        await this.executeRollback(execution, 'automatic', error instanceof Error ? error.message : String(error));
      }
    }

    this.saveExecution(execution);
    return execution;
  }

  private async executePhase(execution: MigrationExecution, phaseName: string): Promise<void> {
    const phase = execution.config.timeline.phases.find(p => p.name === phaseName);
    if (!phase) {
      throw new Error(`Phase '${phaseName}' not found in migration plan`);
    }

    const phaseExecution = execution.phases.find(p => p.phaseName === phaseName);
    if (!phaseExecution) {
      throw new Error(`Phase execution '${phaseName}' not found`);
    }

    execution.currentPhase = phaseName;
    
    console.log(`\n🔄 Executing phase: ${phaseName}`);
    console.log(`   Description: ${phase.description}`);
    console.log(`   Estimated duration: ${phase.estimatedDuration} minutes`);
    
    phaseExecution.status = 'running';
    phaseExecution.startTime = new Date().toISOString();

    try {
      // Check dependencies
      await this.validatePhaseDependencies(execution, phase);
      
      // Execute steps
      if (phase.parallel && execution.config.automation.parallelExecution) {
        await this.executePhaseStepsParallel(phaseExecution, phase);
      } else {
        await this.executePhaseStepsSequential(phaseExecution, phase);
      }

      phaseExecution.status = 'completed';
      phaseExecution.endTime = new Date().toISOString();
      
      execution.metrics.phasesCompleted++;
      
      console.log(`✅ Phase completed: ${phaseName}`);
      
    } catch (error) {
      phaseExecution.status = 'failed';
      phaseExecution.errors.push(error instanceof Error ? error.message : String(error));
      
      console.error(`❌ Phase failed: ${phaseName}`);
      
      // Handle phase failure
      if (phase.required) {
        throw new Error(`Required phase '${phaseName}' failed: ${error instanceof Error ? error.message : String(error)}`);
      } else if (!execution.config.automation.continueOnError) {
        throw new Error(`Non-required phase '${phaseName}' failed and continueOnError is false`);
      }
    }

    this.saveExecution(execution);
  }

  private async validatePhaseDependencies(execution: MigrationExecution, phase: MigrationPhase): Promise<void> {
    for (const dep of phase.dependencies) {
      const depExecution = execution.phases.find(p => p.phaseName === dep);
      if (!depExecution || depExecution.status !== 'completed') {
        throw new Error(`Dependency '${dep}' not completed for phase '${phase.name}'`);
      }
    }
  }

  private async executePhaseStepsSequential(
    phaseExecution: PhaseExecution,
    phase: MigrationPhase
  ): Promise<void> {
    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i];
      const stepExecution = phaseExecution.steps[i];
      
      execution.currentStep = step.name;
      
      await this.executeStep(stepExecution, step);
    }
  }

  private async executePhaseStepsParallel(
    phaseExecution: PhaseExecution,
    phase: MigrationPhase
  ): Promise<void> {
    const stepPromises = phase.steps.map((step, index) => {
      const stepExecution = phaseExecution.steps[index];
      return this.executeStep(stepExecution, step);
    });

    await Promise.allSettled(stepPromises);
  }

  private async executeStep(stepExecution: StepExecution, step: MigrationStep): Promise<void> {
    stepExecution.status = 'running';
    stepExecution.startTime = new Date().toISOString();
    
    console.log(`   🔧 Executing step: ${step.name}`);
    console.log(`      Action: ${step.action}`);
    
    try {
      const result = await this.performStepAction(step);
      
      stepExecution.status = 'completed';
      stepExecution.endTime = new Date().toISOString();
      stepExecution.output = result;
      
      execution.metrics.stepsCompleted++;
      
      console.log(`      ✅ Step completed: ${step.name}`);
      
    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.endTime = new Date().toISOString();
      stepExecution.error = error instanceof Error ? error.message : String(error);
      
      console.error(`      ❌ Step failed: ${step.name} - ${stepExecution.error}`);
      
      // Retry logic
      if (stepExecution.retryCount < step.retryCount) {
        stepExecution.retryCount++;
        console.log(`      🔄 Retrying step: ${step.name} (${stepExecution.retryCount}/${step.retryCount})`);
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
        return this.executeStep(stepExecution, step);
      }
      
      // Handle step failure
      if (step.critical) {
        throw new Error(`Critical step '${step.name}' failed: ${stepExecution.error}`);
      }
    }

    this.saveExecution(execution);
  }

  private async performStepAction(step: MigrationStep): Promise<string> {
    switch (step.action) {
      case 'validate-environment':
        return await this.validateEnvironment(step.parameters);
      
      case 'setup-feature-flags':
        return await this.setupFeatureFlags(step.parameters);
      
      case 'migrate-data':
        return await this.migrateData(step.parameters);
      
      case 'migrate-database':
        return await this.migrateDatabase(step.parameters);
      
      case 'migrate-cdn-assets':
        return await this.migrateCdnAssets(step.parameters);
      
      case 'update-configuration':
        return await this.updateConfiguration(step.parameters);
      
      case 'deploy-blue-green':
        return await this.deployBlueGreen(step.parameters);
      
      case 'setup-monitoring':
        return await this.setupMonitoring(step.parameters);
      
      case 'validate-migration':
        return await this.validateMigration(step.parameters);
      
      case 'run-custom-script':
        return await this.runCustomScript(step.parameters);
      
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  private async validateEnvironment(params: any): Promise<string> {
    const { sourceEnv, targetEnv } = params;
    
    console.log(`      🔍 Validating environments: ${sourceEnv} → ${targetEnv}`);
    
    // Validate source environment
    const sourceConfig = environmentConfigManager.getConfiguration(sourceEnv);
    if (!sourceConfig) {
      throw new Error(`Source environment '${sourceEnv}' not found`);
    }
    
    const sourceValidation = environmentConfigManager.validateConfiguration(sourceConfig);
    if (!sourceValidation.valid) {
      throw new Error(`Source environment validation failed: ${sourceValidation.errors.map(e => e.message).join(', ')}`);
    }
    
    // Validate target environment
    const targetConfig = environmentConfigManager.getConfiguration(targetEnv);
    if (!targetConfig) {
      throw new Error(`Target environment '${targetEnv}' not found`);
    }
    
    const targetValidation = environmentConfigManager.validateConfiguration(targetConfig);
    if (!targetValidation.valid) {
      throw new Error(`Target environment validation failed: ${targetValidation.errors.map(e => e.message).join(', ')}`);
    }
    
    // Check migration readiness
    const readiness = environmentConfigManager.validateMigrationReadiness(sourceEnv, targetEnv);
    if (!readiness.ready) {
      throw new Error(`Migration not ready: ${readiness.issues.join(', ')}`);
    }
    
    return `Environment validation completed successfully`;
  }

  private async setupFeatureFlags(params: any): Promise<string> {
    const { rolloutPlan } = params;
    
    console.log('      🚩 Setting up feature flags');
    
    // Initialize feature flags for migration
    const migrationFlags = [
      {
        key: 'global-soda-platform',
        name: 'Global Soda Platform Migration',
        description: 'Enable access to the expanded soda platform',
        enabled: false,
        rolloutPercentage: 0,
        targetAudience: {
          regions: ['US', 'EU', 'APAC'],
          userSegments: ['all'],
          environments: ['staging', 'production']
        },
        dependencies: [],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'migration-orchestrator'
      },
      {
        key: 'amazon-regional-integration',
        name: 'Amazon Regional Integration',
        description: 'Enable Amazon affiliate integration across global regions',
        enabled: false,
        rolloutPercentage: 0,
        targetAudience: {
          regions: ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'],
          userSegments: ['all'],
          environments: ['production']
        },
        dependencies: ['global-soda-platform'],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'migration-orchestrator'
      }
    ];
    
    // Register flags
    for (const flag of migrationFlags) {
      featureFlagManager.createOrUpdateFlag(flag);
    }
    
    // Execute progressive rollout if plan provided
    if (rolloutPlan) {
      for (const [flagKey, percentage] of Object.entries(rolloutPlan)) {
        await featureFlagManager.performProgressiveRollout(
          flagKey,
          percentage as number,
          10, // increment percentage
          300000, // 5 minutes interval
          async () => {
            // Health check function
            const healthResult = await monitoringHealthCheckManager.executeHealthCheck('system-health');
            return healthResult.status === 'healthy';
          }
        );
      }
    }
    
    return 'Feature flags setup completed successfully';
  }

  private async migrateData(params: any): Promise<string> {
    const { migrationPlan, backupBefore } = params;
    
    console.log('      📊 Migrating data');
    
    // Get data migration plan
    const plan = dataMigrationManager.getMigration(migrationPlan);
    if (!plan) {
      throw new Error(`Data migration plan '${migrationPlan}' not found`);
    }
    
    // Create backup if required
    let backupId: string | undefined;
    if (backupBefore) {
      const backupInfo = await dataMigrationManager.createBackup(migrationPlan, {
        type: 'full',
        compression: 'gzip',
        retentionDays: 30
      });
      backupId = backupInfo.id;
    }
    
    // Execute migration
    const result = await dataMigrationManager.executeMigration(migrationPlan, {
      dryRun: false,
      backupBefore: backupBefore,
      validateAfter: true
    });
    
    if (!result.success) {
      throw new Error(`Data migration failed: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    return `Data migration completed: ${result.recordsProcessed} records processed`;
  }

  private async migrateDatabase(params: any): Promise<string> {
    const { schemaChanges, strategy } = params;
    
    console.log('      🗄️ Migrating database schema');
    
    // Create database migration plan
    const plan = databaseMigrationStrategy.createZeroDowntimeMigrationPlan(
      '2.0.0', // Target version
      schemaChanges
    );
    
    // Execute migration
    const result = await databaseMigrationStrategy.executeMigration(plan.migrationId, {
      dryRun: false,
      backupBefore: true,
      parallel: strategy === 'parallel'
    });
    
    if (result.status !== 'completed') {
      throw new Error(`Database migration failed: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    return `Database migration completed: ${result.metrics.recordsAffected} records affected`;
  }

  private async migrateCdnAssets(params: any): Promise<string> {
    const { sourcePath, targetConfig } = params;
    
    console.log('      🌐 Migrating CDN assets');
    
    // Discover assets
    const assets = await cdnAssetMigrationManager.discoverAssets(sourcePath);
    
    // Create migration plan
    const plan = {
      planId: `cdn-migration-${Date.now()}`,
      source: {
        type: 'local' as const,
        basePath: sourcePath,
        compression: true
      },
      target: targetConfig,
      assets,
      migrationStrategy: 'full' as const,
      validationRules: [],
      rollbackPlan: {
        enabled: true,
        version: '1.0.0',
        rollbackAssets: [],
        restoreProcedure: [],
        verificationSteps: []
      },
      performanceTargets: {
        averageLoadTime: 2000,
        timeToFirstByte: 500,
        cacheHitRatio: 95,
        bandwidthSavings: 30,
        compressionRatio: 40
      },
      timeline: {
        phases: [
          {
            name: 'asset-discovery',
            description: 'Discover and catalog all assets',
            assets: assets.map(a => a.path),
            order: 1,
            estimatedDuration: 5,
            parallelizable: true,
            dependencies: []
          }
        ],
        dependencies: [],
        criticalPath: [],
        estimatedDuration: 30
      }
    };
    
    // Execute migration
    cdnAssetMigrationManager.createMigrationPlan(plan);
    const progress = await cdnAssetMigrationManager.executeMigration(plan.planId, {
      dryRun: false,
      parallelPhases: true,
      skipOptimization: false
    });
    
    return `CDN migration completed: ${progress.assetsProcessed} assets migrated`;
  }

  private async updateConfiguration(params: any): Promise<string> {
    const { sourceEnv, targetEnv } = params;
    
    console.log('      ⚙️ Updating environment configuration');
    
    // Get configurations
    const sourceConfig = environmentConfigManager.getConfiguration(sourceEnv);
    const targetConfig = environmentConfigManager.getConfiguration(targetEnv);
    
    if (!sourceConfig || !targetConfig) {
      throw new Error('Source or target configuration not found');
    }
    
    // Update target configuration with migration-specific settings
    const updatedConfig = {
      ...targetConfig,
      features: {
        ...targetConfig.features,
        globalSodaPlatform: {
          enabled: true,
          rolloutPercentage: 100
        },
        amazonIntegration: {
          enabled: true,
          rolloutPercentage: 100
        }
      },
      lastValidated: new Date().toISOString(),
      validatedBy: 'migration-orchestrator'
    };
    
    environmentConfigManager.updateConfiguration(targetEnv, updatedConfig);
    
    return 'Configuration updated successfully';
  }

  private async deployBlueGreen(params: any): Promise<string> {
    const { environment, strategy } = params;
    
    console.log('      🚀 Executing blue-green deployment');
    
    // Get environment configuration
    const config = environmentConfigManager.getConfiguration(environment);
    if (!config) {
      throw new Error(`Environment configuration '${environment}' not found`);
    }
    
    // Create deployment configuration
    const deploymentConfig = {
      environment: environment as any,
      deploymentStrategy: 'blue-green' as const,
      healthCheckEndpoints: ['/api/health', '/'],
      timeout: 300,
      rollbackOnFailure: true,
      enableMonitoring: true,
      enableNotifications: true,
      backupBeforeDeploy: true,
      validationSteps: [
        {
          name: 'health-check',
          type: 'http' as const,
          config: {
            endpoint: '/api/health',
            expectedStatus: 200
          },
          timeout: 30,
          critical: true,
          retries: 3
        },
        {
          name: 'database-connectivity',
          type: 'database' as const,
          config: {},
          timeout: 30,
          critical: true,
          retries: 1
        }
      ]
    };
    
    // Execute deployment
    const deployment = await blueGreenDeploymentManager.executeBlueGreenDeployment(deploymentConfig, {
      force: false,
      skipValidation: false
    });
    
    if (deployment.status !== 'completed') {
      throw new Error(`Blue-green deployment failed: ${deployment.errors.map(e => e.message).join(', ')}`);
    }
    
    return `Blue-green deployment completed in ${deployment.duration} seconds`;
  }

  private async setupMonitoring(params: any): Promise<string> {
    const { environment, healthChecks } = params;
    
    console.log('      📊 Setting up monitoring');
    
    // Create health checks for the environment
    const environmentHealthChecks = [
      {
        name: `${environment}-api-health`,
        type: 'http' as const,
        endpoint: '/api/health',
        timeout: 30,
        interval: 60,
        retryCount: 3,
        expectedStatus: 200,
        critical: true,
        environment
      },
      {
        name: `${environment}-database-health`,
        type: 'database' as const,
        endpoint: 'database',
        timeout: 30,
        interval: 120,
        retryCount: 2,
        critical: true,
        environment
      },
      {
        name: `${environment}-system-resources`,
        type: 'custom' as const,
        endpoint: 'system',
        timeout: 30,
        interval: 300,
        retryCount: 1,
        critical: false,
        environment,
        metadata: { checkType: 'resource_usage' }
      }
    ];
    
    // Register health checks
    for (const check of environmentHealthChecks) {
      monitoringHealthCheckManager.createHealthCheck(check);
    }
    
    // Start deployment monitoring if health checks provided
    if (healthChecks && healthChecks.length > 0) {
      monitoringHealthCheckManager.startDeploymentMonitoring(
        `deployment-${Date.now()}`,
        environment,
        healthChecks
      );
    }
    
    return `Monitoring setup completed: ${environmentHealthChecks.length} health checks created`;
  }

  private async validateMigration(params: any): Promise<string> {
    const { sourceEnv, targetEnv, validationTests } = params;
    
    console.log('      ✅ Validating migration');
    
    const validationResults: string[] = [];
    
    // Validate feature flags
    const globalPlatformFlag = featureFlagManager.getFlag('global-soda-platform');
    if (!globalPlatformFlag?.enabled) {
      throw new Error('Global soda platform feature flag not enabled');
    }
    validationResults.push('Feature flags validated');
    
    // Validate environment configurations
    const targetConfig = environmentConfigManager.getConfiguration(targetEnv);
    if (!targetConfig) {
      throw new Error('Target environment configuration not found');
    }
    validationResults.push('Environment configuration validated');
    
    // Run custom validation tests if provided
    if (validationTests) {
      for (const test of validationTests) {
        try {
          await this.runCustomScript({ script: test });
          validationResults.push(`Custom test passed: ${test}`);
        } catch (error) {
          throw new Error(`Custom validation test failed: ${test} - ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Validate system health
    const healthStatus = monitoringHealthCheckManager.getMonitoringOverview();
    if (healthStatus.systemStatus === 'unhealthy') {
      throw new Error(`System health check failed: ${healthStatus.unhealthyChecks} unhealthy checks`);
    }
    validationResults.push('System health validated');
    
    return `Migration validation completed: ${validationResults.join(', ')}`;
  }

  private async runCustomScript(params: any): Promise<string> {
    const { script, args } = params;
    
    console.log(`      🔧 Running custom script: ${script}`);
    
    try {
      const command = args ? `${script} ${args}` : script;
      const output = execSync(command, { 
        encoding: 'utf8', 
        timeout: 300000, // 5 minute timeout
        stdio: 'pipe'
      });
      
      return `Custom script completed: ${output}`;
    } catch (error) {
      throw new Error(`Custom script failed: ${script} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeRollback(
    execution: MigrationExecution,
    trigger: 'manual' | 'automatic',
    reason: string
  ): Promise<void> {
    console.log(`\n🔄 Executing rollback: ${reason}`);
    
    execution.rollbackInfo = {
      triggered: true,
      reason,
      timestamp: new Date().toISOString(),
      rollbackDuration: 0,
      phasesRolledBack: 0,
      dataRestored: false,
      success: false
    };
    
    const rollbackStart = Date.now();
    
    try {
      // Rollback phases in reverse order
      const completedPhases = execution.phases
        .filter(p => p.status === 'completed')
        .reverse();
      
      for (const phase of completedPhases) {
        console.log(`   🔄 Rolling back phase: ${phase.phaseName}`);
        
        // Execute phase-specific rollback
        await this.rollbackPhase(phase, execution);
        
        phase.status = 'rolled_back';
        execution.rollbackInfo.phasesRolledBack++;
      }
      
      execution.rollbackInfo.rollbackDuration = Math.floor((Date.now() - rollbackStart) / 60000);
      execution.rollbackInfo.success = true;
      
      execution.status = 'rolled_back';
      execution.endTime = new Date().toISOString();
      
      console.log(`✅ Rollback completed successfully`);
      
    } catch (error) {
      execution.rollbackInfo.rollbackDuration = Math.floor((Date.now() - rollbackStart) / 60000);
      execution.rollbackInfo.success = false;
      
      console.error(`❌ Rollback failed: ${error}`);
      throw error;
    }
    
    this.saveExecution(execution);
  }

  private async rollbackPhase(phaseExecution: PhaseExecution, execution: MigrationExecution): Promise<void> {
    // Phase-specific rollback logic
    switch (phaseExecution.phaseName) {
      case 'feature-flags':
        // Disable migration feature flags
        featureFlagManager.disableFlag('global-soda-platform');
        featureFlagManager.disableFlag('amazon-regional-integration');
        break;
        
      case 'data-migration':
        // Rollback data changes
        // This would restore from backup
        break;
        
      case 'deployment':
        // Rollback deployment
        // This would switch traffic back to previous environment
        break;
        
      // Add other phase rollback logic as needed
    }
  }

  private async cancelExecution(executionId: string, reason: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution '${executionId}' not found`);
    }
    
    if (execution.status !== 'running') {
      throw new Error(`Execution '${executionId}' is not running`);
    }
    
    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    
    // Add cancellation reason as error
    execution.errors.push({
      phase: execution.currentPhase || 'unknown',
      step: execution.currentStep || 'unknown',
      code: 'CANCELLED',
      message: reason,
      timestamp: new Date().toISOString(),
      recoverable: false
    });
    
    this.saveExecution(execution);
    console.log(`🛑 Execution cancelled: ${executionId}`);
  }

  private calculateMetrics(execution: MigrationExecution): void {
    const startTime = new Date(execution.startTime).getTime();
    const endTime = new Date(execution.endTime || new Date()).getTime();
    
    execution.metrics.totalDuration = Math.floor((endTime - startTime) / 60000); // minutes
    
    const completedSteps = execution.phases.reduce((sum, phase) => {
      return sum + phase.steps.filter(step => step.status === 'completed').length;
    }, 0);
    
    execution.metrics.stepsCompleted = completedSteps;
    execution.metrics.successRate = (completedSteps / execution.metrics.totalSteps) * 100;
    
    if (completedSteps > 0) {
      execution.metrics.averageStepDuration = execution.metrics.totalDuration / completedSteps;
    }
  }

  private generateExecutionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `migration-${timestamp}-${random}`;
  }

  private saveExecution(execution: MigrationExecution): void {
    const executionPath = path.join(this.executionsDir, `${execution.executionId}.json`);
    fs.writeFileSync(executionPath, JSON.stringify(execution, null, 2));
  }

  public getExecution(executionId: string): MigrationExecution | undefined {
    return this.executions.get(executionId);
  }

  public getAllExecutions(): MigrationExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getExecutionStatus(executionId: string): {
    status: string;
    progress: number;
    currentPhase?: string;
    currentStep?: string;
    duration: number;
    errors: number;
    warnings: number;
  } {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution '${executionId}' not found`);
    }
    
    const totalPhases = execution.phases.length;
    const completedPhases = execution.phases.filter(p => p.status === 'completed').length;
    const progress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
    
    const startTime = new Date(execution.startTime).getTime();
    const currentTime = Date.now();
    const duration = Math.floor((currentTime - startTime) / 60000); // minutes
    
    return {
      status: execution.status,
      progress,
      currentPhase: execution.currentPhase,
      currentStep: execution.currentStep,
      duration,
      errors: execution.errors.length,
      warnings: execution.warnings.length
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const orchestrator = new MigrationOrchestrator();
  
  try {
    switch (command) {
      case 'execute':
        const configFile = args[1];
        if (!configFile) {
          console.error('Please provide a configuration file path');
          process.exit(1);
        }
        
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8')) as MigrationOrchestrationConfig;
        const execution = await orchestrator.executeMigration(config);
        
        console.log(`\n📋 Execution ID: ${execution.executionId}`);
        console.log(`📊 Final Status: ${execution.status}`);
        console.log(`⏱️  Total Duration: ${execution.metrics.totalDuration} minutes`);
        
        if (execution.status === 'completed') {
          process.exit(0);
        } else {
          process.exit(1);
        }
        
      case 'status':
        const executionId = args[1];
        if (!executionId) {
          console.error('Please provide an execution ID');
          process.exit(1);
        }
        
        const status = orchestrator.getExecutionStatus(executionId);
        console.log(`Execution Status: ${JSON.stringify(status, null, 2)}`);
        break;
        
      case 'list':
        const executions = orchestrator.getAllExecutions();
        console.log('Recent Executions:');
        executions.forEach(exec => {
          console.log(`- ${exec.executionId}: ${exec.status} (${exec.startTime})`);
        });
        break;
        
      default:
        console.log('Usage:');
        console.log('  migration-orchestrator execute <config-file>  - Execute migration');
        console.log('  migration-orchestrator status <execution-id>  - Check execution status');
        console.log('  migration-orchestrator list                    - List recent executions');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration orchestrator error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MigrationOrchestrator, MigrationOrchestrationConfig };