/**
 * Data Versioning and Migration Framework
 * 
 * Provides comprehensive data migration capabilities with versioning,
 * rollback mechanisms, and integrity validation
 */

import fs from 'fs';
import path from 'path';

export interface SchemaVersion {
  version: string;
  description: string;
  timestamp: string;
  appliedBy: string;
  checksum: string;
  dependencies: string[]; // Other versions this depends on
  migrations: Migration[];
  rollbackScript?: string;
  validationQueries: string[];
  estimatedDuration: number; // minutes
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresDowntime: boolean;
  backupRequired: boolean;
}

export interface Migration {
  id: string;
  type: 'schema' | 'data' | 'index' | 'constraint' | 'function' | 'procedure';
  description: string;
  sql: string;
  rollbackSql?: string;
  validationQuery?: string;
  timeout: number; // seconds
  batchSize?: number; // for bulk operations
  errorHandling: 'fail' | 'continue' | 'retry';
  dependencies?: string[]; // Other migrations this depends on
}

export interface DataValidationRule {
  name: string;
  description: string;
  type: 'integrity' | 'consistency' | 'referential' | 'business_rule';
  query: string;
  expectedResult: any;
  critical: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface MigrationResult {
  migrationId: string;
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  recordsProcessed: number;
  recordsAffected: number;
  errors: MigrationError[];
  warnings: string[];
  rollbackPoint?: string;
}

export interface MigrationError {
  code: string;
  message: string;
  details?: any;
  lineNumber?: number;
  stackTrace?: string;
}

export interface BackupInfo {
  id: string;
  version: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'schema_only' | 'data_only';
  size: number; // bytes
  compression: 'none' | 'gzip' | 'lz4' | 'zstd';
  location: string;
  checksum: string;
  retentionDays: number;
  createdBy: string;
  description?: string;
}

export class DataMigrationManager {
  private static instance: DataMigrationManager;
  private migrations: Map<string, SchemaVersion> = new Map();
  private migrationHistory: MigrationResult[] = [];
  private backups: BackupInfo[] = [];
  private readonly migrationsDir = path.join(process.cwd(), 'migrations');
  private readonly backupsDir = path.join(process.cwd(), 'backups');
  private readonly historyFile = path.join(process.cwd(), 'migration-history.json');

  private constructor() {
    this.initializeMigrationDirectory();
    this.loadMigrationHistory();
  }

  static getInstance(): DataMigrationManager {
    if (!DataMigrationManager.instance) {
      DataMigrationManager.instance = new DataMigrationManager();
    }
    return DataMigrationManager.instance;
  }

  private initializeMigrationDirectory(): void {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  private loadMigrationHistory(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        this.migrationHistory = data.history || [];
        this.backups = data.backups || [];
      }
    } catch (error) {
      console.error('Failed to load migration history:', error);
    }
  }

  private saveMigrationHistory(): void {
    try {
      const data = {
        history: this.migrationHistory,
        backups: this.backups,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save migration history:', error);
    }
  }

  // Migration Registration and Management
  public registerMigration(version: SchemaVersion): void {
    // Validate dependencies
    for (const dep of version.dependencies) {
      if (!this.migrations.has(dep)) {
        throw new Error(`Dependency '${dep}' not found for version '${version.version}'`);
      }
    }

    // Validate checksum
    const calculatedChecksum = this.calculateChecksum(version);
    if (calculatedChecksum !== version.checksum) {
      throw new Error(`Checksum mismatch for version '${version.version}'`);
    }

    this.migrations.set(version.version, version);
  }

  private calculateChecksum(version: SchemaVersion): string {
    const content = JSON.stringify({
      version: version.version,
      migrations: version.migrations,
      description: version.description
    });
    
    // Simple checksum calculation (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public getMigration(version: string): SchemaVersion | undefined {
    return this.migrations.get(version);
  }

  public getAllMigrations(): SchemaVersion[] {
    return Array.from(this.migrations.values()).sort((a, b) => 
      a.version.localeCompare(b.version)
    );
  }

  public getAppliedMigrations(): SchemaVersion[] {
    const appliedVersions = new Set(
      this.migrationHistory
        .filter(result => result.success)
        .map(result => this.findVersionByMigration(result.migrationId))
    );

    return this.getAllMigrations().filter(version => appliedVersions.has(version));
  }

  public getPendingMigrations(): SchemaVersion[] {
    const appliedVersions = new Set(
      this.migrationHistory
        .filter(result => result.success)
        .map(result => this.findVersionByMigration(result.migrationId))
    );

    return this.getAllMigrations().filter(version => !appliedVersions.has(version));
  }

  private findVersionByMigration(migrationId: string): string {
    for (const version of this.migrations.values()) {
      if (version.migrations.some(m => m.id === migrationId)) {
        return version.version;
      }
    }
    return '';
  }

  // Migration Execution
  public async executeMigration(
    version: string,
    options: {
      dryRun?: boolean;
      backupBefore?: boolean;
      validateAfter?: boolean;
      timeout?: number;
      batchSize?: number;
    } = {}
  ): Promise<MigrationResult> {
    const schemaVersion = this.migrations.get(version);
    if (!schemaVersion) {
      throw new Error(`Migration version '${version}' not found`);
    }

    const startTime = new Date().toISOString();
    const result: MigrationResult = {
      migrationId: version,
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      recordsProcessed: 0,
      recordsAffected: 0,
      errors: [],
      warnings: []
    };

    try {
      // Pre-migration checks
      await this.validatePreMigration(schemaVersion, options);

      // Create backup if required
      if (schemaVersion.backupRequired && !options.dryRun) {
        const backupInfo = await this.createBackup(version, options);
        result.rollbackPoint = backupInfo.id;
      }

      // Execute migrations in order
      for (const migration of schemaVersion.migrations) {
        const migrationResult = await this.executeSingleMigration(
          migration,
          schemaVersion,
          options
        );

        result.recordsProcessed += migrationResult.recordsProcessed;
        result.recordsAffected += migrationResult.recordsAffected;
        result.errors.push(...migrationResult.errors);
        result.warnings.push(...migrationResult.warnings);

        if (!migrationResult.success && migration.errorHandling === 'fail') {
          break;
        }
      }

      // Validate after migration
      if (options.validateAfter && !options.dryRun) {
        const validationErrors = await this.validateMigration(schemaVersion);
        result.errors.push(...validationErrors);
      }

      result.success = result.errors.length === 0;
      result.endTime = new Date().toISOString();
      result.duration = Math.floor(
        (new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 1000
      );

    } catch (error) {
      result.errors.push({
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined
      });
      result.endTime = new Date().toISOString();
    }

    // Record migration result
    if (!options.dryRun) {
      this.migrationHistory.push(result);
      this.saveMigrationHistory();
    }

    return result;
  }

  private async validatePreMigration(
    version: SchemaVersion,
    options: any
  ): Promise<void> {
    // Check dependencies
    for (const dep of version.dependencies) {
      const depApplied = this.migrationHistory.some(
        result => result.success && this.findVersionByMigration(result.migrationId) === dep
      );
      if (!depApplied) {
        throw new Error(`Dependency '${dep}' must be applied before '${version.version}'`);
      }
    }

    // Check if already applied
    const alreadyApplied = this.migrationHistory.some(
      result => result.success && this.findVersionByMigration(result.migrationId) === version.version
    );
    if (alreadyApplied && !options.force) {
      throw new Error(`Version '${version.version}' already applied`);
    }

    // Check resource availability
    await this.checkResourceAvailability(version);
  }

  private async checkResourceAvailability(version: SchemaVersion): Promise<void> {
    // Check disk space
    const stats = fs.statSync(this.backupsDir);
    // Add disk space validation logic

    // Check database connectivity
    // Add database connectivity check logic

    // Check for conflicting processes
    // Add process conflict check logic
  }

  private async executeSingleMigration(
    migration: Migration,
    version: SchemaVersion,
    options: any
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      migrationId: migration.id,
      success: false,
      startTime: new Date(startTime).toISOString(),
      endTime: '',
      duration: 0,
      recordsProcessed: 0,
      recordsAffected: 0,
      errors: [],
      warnings: []
    };

    try {
      if (options.dryRun) {
        // Simulate migration execution
        result.success = true;
        result.recordsProcessed = 1000; // Simulated
        result.recordsAffected = 500; // Simulated
      } else {
        // Execute actual migration
        await this.executeSQL(migration.sql, migration.timeout);
        result.success = true;
        result.recordsProcessed = 1000; // Would be determined by actual execution
        result.recordsAffected = 500; // Would be determined by actual execution
      }

      // Validate if query provided
      if (migration.validationQuery && !options.dryRun) {
        const validationResult = await this.executeQuery(migration.validationQuery);
        if (!validationResult.success) {
          result.warnings.push(`Validation failed: ${validationResult.error}`);
        }
      }

    } catch (error) {
      result.errors.push({
        code: 'MIGRATION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      // Execute rollback if available and migration failed
      if (migration.rollbackSql && !options.dryRun) {
        try {
          await this.executeSQL(migration.rollbackSql, migration.timeout);
        } catch (rollbackError) {
          result.errors.push({
            code: 'ROLLBACK_ERROR',
            message: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          });
        }
      }
    }

    result.endTime = new Date().toISOString();
    result.duration = Math.floor((Date.now() - startTime) / 1000);

    return result;
  }

  private async executeSQL(sql: string, timeout: number): Promise<void> {
    // In a real implementation, this would execute SQL against the database
    // For now, we'll simulate the execution
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        if (Math.random() > 0.95) {
          reject(new Error('Simulated SQL execution failure'));
        } else {
          resolve();
        }
      }, Math.random() * 1000 + 500); // 500-1500ms delay
    });
  }

  private async executeQuery(query: string): Promise<{ success: boolean; error?: string; data?: any }> {
    // Simulate query execution
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.1, // 90% success rate
          data: { count: Math.floor(Math.random() * 1000) },
          error: Math.random() > 0.9 ? 'Simulated validation error' : undefined
        });
      }, Math.random() * 500 + 100);
    });
  }

  // Validation and Integrity Checks
  public async validateMigration(version: SchemaVersion): Promise<MigrationError[]> {
    const errors: MigrationError[] = [];

    for (const query of version.validationQueries) {
      try {
        const result = await this.executeQuery(query);
        if (!result.success) {
          errors.push({
            code: 'VALIDATION_FAILED',
            message: `Validation query failed: ${result.error}`,
            details: { query, result }
          });
        }
      } catch (error) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          details: { query, error }
        });
      }
    }

    return errors;
  }

  public async runDataValidation(rules: DataValidationRule[]): Promise<{
    passed: number;
    failed: number;
    warnings: number;
    results: {
      rule: DataValidationRule;
      success: boolean;
      message: string;
      details?: any;
    }[];
  }> {
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      results: [] as any[]
    };

    for (const rule of rules) {
      try {
        const queryResult = await this.executeQuery(rule.query);
        const success = this.compareResults(queryResult.data, rule.expectedResult);

        results.results.push({
          rule,
          success,
          message: success ? 'Validation passed' : 'Validation failed',
          details: { actual: queryResult.data, expected: rule.expectedResult }
        });

        if (success) {
          results.passed++;
        } else if (rule.severity === 'warning') {
          results.warnings++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.results.push({
          rule,
          success: false,
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
        });
        results.failed++;
      }
    }

    return results;
  }

  private compareResults(actual: any, expected: any): boolean {
    if (typeof actual !== typeof expected) return false;
    if (typeof actual !== 'object') return actual === expected;
    
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;
    if (Array.isArray(actual)) {
      return actual.length === expected.length;
    }
    
    return Object.keys(expected).every(key => 
      actual[key] === expected[key]
    );
  }

  // Backup and Recovery
  public async createBackup(
    version: string,
    options: {
      type?: 'full' | 'incremental' | 'schema_only' | 'data_only';
      compression?: 'none' | 'gzip' | 'lz4' | 'zstd';
      retentionDays?: number;
    } = {}
  ): Promise<BackupInfo> {
    const backupId = `backup-${version}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const backupInfo: BackupInfo = {
      id: backupId,
      version,
      timestamp,
      type: options.type || 'full',
      size: 0,
      compression: options.compression || 'gzip',
      location: path.join(this.backupsDir, `${backupId}.sql`),
      checksum: '',
      retentionDays: options.retentionDays || 30,
      createdBy: 'migration-system',
      description: `Backup created before applying migration ${version}`
    };

    try {
      // In a real implementation, this would actually create the backup
      const backupContent = `-- Backup for version ${version}\n-- Created: ${timestamp}\n`;
      
      fs.writeFileSync(backupInfo.location, backupContent);
      
      const stats = fs.statSync(backupInfo.location);
      backupInfo.size = stats.size;
      backupInfo.checksum = this.calculateFileChecksum(backupInfo.location);

      this.backups.push(backupInfo);
      this.saveMigrationHistory();

      return backupInfo;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateFileChecksum(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf8');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  public async restoreFromBackup(backupId: string): Promise<MigrationResult> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup '${backupId}' not found`);
    }

    const startTime = new Date().toISOString();
    const result: MigrationResult = {
      migrationId: `restore-${backupId}`,
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      recordsProcessed: 0,
      recordsAffected: 0,
      errors: [],
      warnings: []
    };

    try {
      if (!fs.existsSync(backup.location)) {
        throw new Error(`Backup file not found: ${backup.location}`);
      }

      const backupContent = fs.readFileSync(backup.location, 'utf8');
      
      // Execute backup content as SQL
      await this.executeSQL(backupContent, 300); // 5 minute timeout
      
      result.success = true;
      result.recordsProcessed = 1000; // Simulated
      result.recordsAffected = 500; // Simulated
      
    } catch (error) {
      result.errors.push({
        code: 'RESTORE_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    result.endTime = new Date().toISOString();
    result.duration = Math.floor(
      (new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 1000
    );

    this.migrationHistory.push(result);
    this.saveMigrationHistory();

    return result;
  }

  public getBackupHistory(): BackupInfo[] {
    return [...this.backups].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Rollback Management
  public async rollbackMigration(version: string, reason: string): Promise<MigrationResult> {
    const schemaVersion = this.migrations.get(version);
    if (!schemaVersion || !schemaVersion.rollbackScript) {
      throw new Error(`Rollback not available for version '${version}'`);
    }

    const startTime = new Date().toISOString();
    const result: MigrationResult = {
      migrationId: `rollback-${version}`,
      success: false,
      startTime,
      endTime: '',
      duration: 0,
      recordsProcessed: 0,
      recordsAffected: 0,
      errors: [],
      warnings: [`Rollback initiated: ${reason}`]
    };

    try {
      // Create backup before rollback
      const backupInfo = await this.createBackup(`pre-rollback-${version}`);
      result.rollbackPoint = backupInfo.id;

      // Execute rollback script
      await this.executeSQL(schemaVersion.rollbackScript, 300);
      
      // Validate rollback
      const validationErrors = await this.validateMigration(schemaVersion);
      result.errors.push(...validationErrors);

      result.success = result.errors.length === 0;
      result.recordsProcessed = 1000; // Simulated
      result.recordsAffected = 500; // Simulated
      
    } catch (error) {
      result.errors.push({
        code: 'ROLLBACK_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    result.endTime = new Date().toISOString();
    result.duration = Math.floor(
      (new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 1000
    );

    this.migrationHistory.push(result);
    this.saveMigrationHistory();

    return result;
  }

  // Migration Planning and Dependencies
  public getMigrationPlan(targetVersion: string): {
    migrations: SchemaVersion[];
    totalDuration: number;
    riskLevel: string;
    downtimeRequired: boolean;
    backupRequired: boolean;
    dependencies: string[];
    criticalPath: string[];
  } {
    const target = this.migrations.get(targetVersion);
    if (!target) {
      throw new Error(`Target version '${targetVersion}' not found`);
    }

    const plan = {
      migrations: [] as SchemaVersion[],
      totalDuration: 0,
      riskLevel: 'low' as const,
      downtimeRequired: false,
      backupRequired: false,
      dependencies: [] as string[],
      criticalPath: [] as string[]
    };

    // Build dependency graph
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const buildPlan = (version: SchemaVersion): boolean => {
      if (recursionStack.has(version.version)) {
        throw new Error(`Circular dependency detected: ${version.version}`);
      }
      if (visited.has(version.version)) {
        return true;
      }

      visited.add(version.version);
      recursionStack.add(version.version);

      // Process dependencies first
      for (const dep of version.dependencies) {
        const depVersion = this.migrations.get(dep);
        if (depVersion && !buildPlan(depVersion)) {
          return false;
        }
      }

      recursionStack.delete(version.version);
      
      // Add to plan
      if (!plan.migrations.includes(version)) {
        plan.migrations.push(version);
        plan.totalDuration += version.estimatedDuration;
        plan.downtimeRequired = plan.downtimeRequired || version.requiresDowntime;
        plan.backupRequired = plan.backupRequired || version.backupRequired;
        
        if (version.riskLevel === 'critical') {
          plan.riskLevel = 'critical';
        } else if (version.riskLevel === 'high' && plan.riskLevel !== 'critical') {
          plan.riskLevel = 'high';
        }
      }

      return true;
    };

    buildPlan(target);

    // Calculate dependencies
    plan.dependencies = target.dependencies;
    
    // Determine critical path (longest chain)
    plan.criticalPath = this.calculateCriticalPath(target);

    return plan;
  }

  private calculateCriticalPath(version: SchemaVersion): string[] {
    const path: string[] = [];
    const visited = new Set<string>();

    const buildPath = (v: SchemaVersion): void => {
      if (visited.has(v.version)) return;
      visited.add(v.version);

      for (const dep of v.dependencies) {
        const depVersion = this.migrations.get(dep);
        if (depVersion) {
          buildPath(depVersion);
        }
      }

      path.push(v.version);
    };

    buildPath(version);
    return path;
  }

  // Monitoring and Reporting
  public getMigrationStatus(): {
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    failedMigrations: number;
    recentMigrations: MigrationResult[];
    averageDuration: number;
    successRate: number;
  } {
    const allMigrations = this.getAllMigrations();
    const applied = this.getAppliedMigrations();
    const pending = this.getPendingMigrations();
    const failed = this.migrationHistory.filter(r => !r.success);

    const recentMigrations = this.migrationHistory
      .slice(-10)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const averageDuration = this.migrationHistory.length > 0
      ? this.migrationHistory.reduce((sum, r) => sum + r.duration, 0) / this.migrationHistory.length
      : 0;

    const successRate = this.migrationHistory.length > 0
      ? (this.migrationHistory.filter(r => r.success).length / this.migrationHistory.length) * 100
      : 100;

    return {
      totalMigrations: allMigrations.length,
      appliedMigrations: applied.length,
      pendingMigrations: pending.length,
      failedMigrations: failed.length,
      recentMigrations,
      averageDuration,
      successRate
    };
  }

  public exportMigrationHistory(): string {
    return JSON.stringify({
      migrations: this.migrationHistory,
      backups: this.backups,
      currentStatus: this.getMigrationStatus(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const dataMigrationManager = DataMigrationManager.getInstance();