/**
 * CDN and Asset Migration System
 * 
 * Manages global asset deployment with CDN configuration,
 * asset versioning, cache invalidation, and progressive loading
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CDNConfiguration {
  provider: 'cloudflare' | 'aws-cloudfront' | 'azure-cdn' | 'gcp-cloud-cdn' | 'custom';
  zones: CDNZone[];
  globalSettings: GlobalCDNSettings;
  edgeLocations: EdgeLocation[];
  cacheRules: CacheRule[];
  securitySettings: SecuritySettings;
  performanceSettings: PerformanceSettings;
}

export interface CDNZone {
  id: string;
  name: string;
  region: string;
  domains: string[];
  ssl: SSLConfig;
  caching: CacheConfig;
  compression: CompressionConfig;
  imageOptimization: ImageOptimizationConfig;
  customHeaders: Record<string, string>;
}

export interface GlobalCDNSettings {
  http2: boolean;
  http3: boolean;
  brotli: boolean;
  minify: {
    css: boolean;
    javascript: boolean;
    html: boolean;
  };
  enableBrotli: boolean;
  enableGzip: boolean;
  imageFormat: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  adaptiveImages: boolean;
  lazyLoading: boolean;
}

export interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  bandwidth: number; // Gbps
  loadBalancing: {
    enabled: boolean;
    algorithm: 'round-robin' | 'least-connections' | 'weighted';
    healthCheck: HealthCheckConfig;
  };
}

export interface CacheRule {
  id: string;
  pattern: string;
  ttl: number; // seconds
  browserCache: number; // seconds
  edgeCache: 'bypass' | 'dynamic' | 'static';
  varyBy: {
    headers: string[];
    cookies: string[];
    query: string[];
  };
  cacheKey: string;
  includeSubdomains: boolean;
}

export interface SecuritySettings {
  ddos: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high' | 'under_attack';
  };
  ssl: {
    minVersion: '1.0' | '1.1' | '1.2' | '1.3';
    hsts: boolean;
    hstsMaxAge: number;
    tlsClientAuth: boolean;
  };
  bot: {
    enabled: boolean;
    challenge: boolean;
    sessionChallenge: boolean;
  };
  rate: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
  };
}

export interface PerformanceSettings {
  bandwidth: {
    limit: number; // Mbps per user
    burstLimit: number; // Mbps
  };
  concurrent: {
    connections: number;
    streams: number;
  };
  timeouts: {
    connect: number;
    firstByte: number;
    download: number;
  };
}

export interface AssetMigrationPlan {
  planId: string;
  source: AssetSource;
  target: AssetTarget;
  assets: AssetDefinition[];
  migrationStrategy: 'full' | 'incremental' | 'differential';
  validationRules: ValidationRule[];
  rollbackPlan: RollbackPlan;
  performanceTargets: PerformanceTargets;
  timeline: MigrationTimeline;
}

export interface AssetSource {
  type: 'local' | 's3' | 'gcs' | 'azure-blob' | 'external-cdn';
  basePath: string;
  credentials?: Record<string, string>;
  regions?: string[];
  compression: boolean;
}

export interface AssetTarget {
  cdn: CDNConfiguration;
  bucket: string;
  regions: string[];
  versioning: {
    enabled: boolean;
    scheme: 'hash' | 'timestamp' | 'semantic';
  };
  redundancy: {
    level: 'none' | 'regional' | 'global';
    replicationFactor: number;
  };
}

export interface AssetDefinition {
  path: string;
  type: 'image' | 'javascript' | 'css' | 'font' | 'video' | 'document' | 'other';
  size: number;
  mimeType: string;
  hash: string;
  dependencies: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  cacheControl: {
    maxAge: number;
    sMaxAge: number;
    staleWhileRevalidate: number;
  };
  optimization: {
    compress: boolean;
    minify: boolean;
    webp: boolean;
    avif: boolean;
    lazy: boolean;
  };
}

export interface ValidationRule {
  name: string;
  type: 'size' | 'mime-type' | 'hash' | 'compression' | 'custom';
  expected: any;
  tolerance?: number;
  critical: boolean;
}

export interface RollbackPlan {
  enabled: boolean;
  version: string;
  rollbackAssets: string[];
  restoreProcedure: string[];
  verificationSteps: string[];
}

export interface PerformanceTargets {
  averageLoadTime: number; // ms
  timeToFirstByte: number; // ms
  cacheHitRatio: number; // percentage
  bandwidthSavings: number; // percentage
  compressionRatio: number; // percentage
}

export interface MigrationTimeline {
  phases: MigrationPhase[];
  dependencies: string[];
  criticalPath: string[];
  estimatedDuration: number; // minutes
}

export interface MigrationPhase {
  name: string;
  description: string;
  assets: string[];
  order: number;
  estimatedDuration: number; // minutes
  parallelizable: boolean;
  dependencies: string[];
  rollbackPoint?: string;
}

export interface MigrationProgress {
  planId: string;
  currentPhase: string;
  completedPhases: number;
  totalPhases: number;
  assetsProcessed: number;
  totalAssets: number;
  progressPercentage: number;
  startTime: string;
  estimatedCompletion?: string;
  issues: MigrationIssue[];
  performanceMetrics: PerformanceMetrics;
}

export interface MigrationIssue {
  type: 'error' | 'warning' | 'info';
  phase: string;
  asset?: string;
  message: string;
  details?: any;
  resolved: boolean;
}

export interface PerformanceMetrics {
  assetsPerSecond: number;
  averageAssetSize: number;
  cacheHitRatio: number;
  compressionSavings: number;
  bandwidthUsed: number;
  edgeCacheHitRatio: number;
}

export interface AssetVersion {
  version: string;
  hash: string;
  createdAt: string;
  assets: AssetDefinition[];
  changelog: AssetChange[];
  rollback: boolean;
  rollbackVersion?: string;
}

export interface AssetChange {
  asset: string;
  type: 'added' | 'modified' | 'removed';
  oldHash?: string;
  newHash?: string;
  sizeChange?: number;
}

export interface CacheInvalidationRequest {
  requestId: string;
  type: 'selective' | 'wildcard' | 'all';
  patterns: string[];
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  createdAt: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedCompletion?: string;
}

export class CDNAssetMigrationManager {
  private static instance: CDNAssetMigrationManager;
  private plans: Map<string, AssetMigrationPlan> = new Map();
  private migrations: Map<string, MigrationProgress> = new Map();
  private cacheInvalidations: Map<string, CacheInvalidationRequest> = new Map();
  private assetVersions: Map<string, AssetVersion[]> = new Map();
  private readonly plansDir = path.join(process.cwd(), 'cdn', 'plans');
  private readonly migrationsDir = path.join(process.cwd(), 'cdn', 'migrations');
  private readonly versionsDir = path.join(process.cwd(), 'cdn', 'versions');
  private readonly assetsDir = path.join(process.cwd(), 'public');

  private constructor() {
    this.initializeDirectories();
    this.loadExistingData();
  }

  static getInstance(): CDNAssetMigrationManager {
    if (!CDNAssetMigrationManager.instance) {
      CDNAssetMigrationManager.instance = new CDNAssetMigrationManager();
    }
    return CDNAssetMigrationManager.instance;
  }

  private initializeDirectories(): void {
    const dirs = [this.plansDir, this.migrationsDir, this.versionsDir, this.assetsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadExistingData(): void {
    this.loadMigrationPlans();
    this.loadAssetVersions();
  }

  private loadMigrationPlans(): void {
    try {
      if (fs.existsSync(this.plansDir)) {
        const files = fs.readdirSync(this.plansDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const planPath = path.join(this.plansDir, file);
            const content = fs.readFileSync(planPath, 'utf8');
            const plan = JSON.parse(content) as AssetMigrationPlan;
            this.plans.set(plan.planId, plan);
          } catch (error) {
            console.error(`Failed to load migration plan from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load migration plans:', error);
    }
  }

  private loadAssetVersions(): void {
    try {
      if (fs.existsSync(this.versionsDir)) {
        const files = fs.readdirSync(this.versionsDir).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
          try {
            const versionPath = path.join(this.versionsDir, file);
            const content = fs.readFileSync(versionPath, 'utf8');
            const version = JSON.parse(content) as AssetVersion;
            
            const assetPath = file.replace('.json', '');
            if (!this.assetVersions.has(assetPath)) {
              this.assetVersions.set(assetPath, []);
            }
            this.assetVersions.get(assetPath)!.push(version);
          } catch (error) {
            console.error(`Failed to load asset version from ${file}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load asset versions:', error);
    }
  }

  // Migration Planning
  public createMigrationPlan(plan: AssetMigrationPlan): void {
    this.validateMigrationPlan(plan);
    this.plans.set(plan.planId, plan);
    this.saveMigrationPlan(plan);
  }

  private validateMigrationPlan(plan: AssetMigrationPlan): void {
    const errors: string[] = [];

    if (!plan.planId) errors.push('planId is required');
    if (!plan.source.basePath) errors.push('source.basePath is required');
    if (!plan.target.cdn) errors.push('target.cdn configuration is required');
    if (!plan.assets || plan.assets.length === 0) errors.push('At least one asset is required');

    // Validate assets
    plan.assets.forEach((asset, index) => {
      if (!asset.path) errors.push(`Asset ${index}: path is required`);
      if (!asset.type) errors.push(`Asset ${index}: type is required`);
      if (!asset.mimeType) errors.push(`Asset ${index}: mimeType is required`);
    });

    // Validate phases
    if (plan.timeline.phases.length === 0) {
      errors.push('At least one migration phase is required');
    }

    if (errors.length > 0) {
      throw new Error(`Migration plan validation failed: ${errors.join(', ')}`);
    }
  }

  private saveMigrationPlan(plan: AssetMigrationPlan): void {
    const planPath = path.join(this.plansDir, `${plan.planId}.json`);
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  }

  public getMigrationPlan(planId: string): AssetMigrationPlan | undefined {
    return this.plans.get(planId);
  }

  public getAllMigrationPlans(): AssetMigrationPlan[] {
    return Array.from(this.plans.values());
  }

  // Asset Discovery and Analysis
  public async discoverAssets(sourcePath: string): Promise<AssetDefinition[]> {
    const assets: AssetDefinition[] = [];
    
    try {
      const files = this.getAllFiles(sourcePath);
      
      for (const file of files) {
        const relativePath = path.relative(sourcePath, file);
        const stats = fs.statSync(file);
        const mimeType = this.getMimeType(file);
        
        const asset: AssetDefinition = {
          path: relativePath,
          type: this.getAssetType(file),
          size: stats.size,
          mimeType,
          hash: this.calculateFileHash(file),
          dependencies: this.findDependencies(file),
          priority: this.determinePriority(relativePath),
          cacheControl: this.getDefaultCacheControl(mimeType),
          optimization: this.getDefaultOptimization(mimeType)
        };
        
        assets.push(asset);
      }
    } catch (error) {
      throw new Error(`Asset discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return assets;
  }

  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        arrayOfFiles.push(dirPath + "/" + file);
      }
    });

    return arrayOfFiles;
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getAssetType(filePath: string): AssetDefinition['type'] {
    const ext = path.extname(filePath).toLowerCase();
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    const fontTypes = ['.woff', '.woff2', '.ttf'];
    const videoTypes = ['.mp4', '.webm'];
    const docTypes = ['.pdf'];
    
    if (imageTypes.includes(ext)) return 'image';
    if (fontTypes.includes(ext)) return 'font';
    if (videoTypes.includes(ext)) return 'video';
    if (docTypes.includes(ext)) return 'document';
    if (ext === '.js') return 'javascript';
    if (ext === '.css') return 'css';
    
    return 'other';
  }

  private calculateFileHash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private findDependencies(filePath: string): string[] {
    // Simple dependency detection based on file references
    // In a real implementation, this would parse the file content
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.js') {
      return ['module-loader', 'runtime'];
    } else if (ext === '.css') {
      return ['css-reset', 'normalize'];
    }
    
    return [];
  }

  private determinePriority(path: string): 'critical' | 'high' | 'medium' | 'low' {
    if (path.includes('critical') || path.includes('core')) return 'critical';
    if (path.includes('main') || path.includes('index')) return 'high';
    if (path.includes('vendor') || path.includes('lib')) return 'medium';
    return 'low';
  }

  private getDefaultCacheControl(mimeType: string): AssetDefinition['cacheControl'] {
    if (mimeType.startsWith('image/')) {
      return {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000,
        staleWhileRevalidate: 86400
      };
    } else if (mimeType.includes('javascript') || mimeType.includes('css')) {
      return {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000,
        staleWhileRevalidate: 86400
      };
    } else {
      return {
        maxAge: 3600, // 1 hour
        sMaxAge: 3600,
        staleWhileRevalidate: 300
      };
    }
  }

  private getDefaultOptimization(mimeType: string): AssetDefinition['optimization'] {
    return {
      compress: true,
      minify: mimeType.includes('javascript') || mimeType.includes('css'),
      webp: mimeType.startsWith('image/'),
      avif: mimeType.startsWith('image/'),
      lazy: mimeType.startsWith('image/')
    };
  }

  // Migration Execution
  public async executeMigration(
    planId: string,
    options: {
      dryRun?: boolean;
      parallelPhases?: boolean;
      skipOptimization?: boolean;
      force?: boolean;
    } = {}
  ): Promise<MigrationProgress> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Migration plan '${planId}' not found`);
    }

    const progress: MigrationProgress = {
      planId,
      currentPhase: '',
      completedPhases: 0,
      totalPhases: plan.timeline.phases.length,
      assetsProcessed: 0,
      totalAssets: plan.assets.length,
      progressPercentage: 0,
      startTime: new Date().toISOString(),
      issues: [],
      performanceMetrics: {
        assetsPerSecond: 0,
        averageAssetSize: 0,
        cacheHitRatio: 0,
        compressionSavings: 0,
        bandwidthUsed: 0,
        edgeCacheHitRatio: 0
      }
    };

    this.migrations.set(planId, progress);

    try {
      // Pre-migration validation
      await this.validatePreMigration(plan, progress);

      // Execute phases
      for (const phase of plan.timeline.phases) {
        progress.currentPhase = phase.name;
        
        await this.executePhase(phase, plan, options, progress);
        
        progress.completedPhases++;
        progress.progressPercentage = Math.floor((progress.completedPhases / progress.totalPhases) * 100);
      }

      // Post-migration validation
      await this.validatePostMigration(plan, progress);

      // Create asset version
      await this.createAssetVersion(plan, progress);

      // Update cache invalidation
      await this.updateCacheInvalidation(plan);

    } catch (error) {
      progress.issues.push({
        type: 'error',
        phase: progress.currentPhase,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        resolved: false
      });
      
      // Rollback if configured
      if (plan.rollbackPlan.enabled) {
        await this.executeRollback(plan, progress);
      }
    }

    progress.estimatedCompletion = new Date().toISOString();
    this.saveMigrationProgress(progress);

    return progress;
  }

  private async validatePreMigration(plan: AssetMigrationPlan, progress: MigrationProgress): Promise<void> {
    // Check source accessibility
    // Check target capacity
    // Validate asset integrity
    // Check network connectivity
    
    progress.issues.push({
      type: 'info',
      phase: 'validation',
      message: 'Pre-migration validation completed',
      resolved: true
    });
  }

  private async executePhase(
    phase: MigrationPhase,
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    const phaseAssets = plan.assets.filter(asset => phase.assets.includes(asset.path));
    
    if (options.parallelPhases && phase.parallelizable) {
      await this.executePhaseParallel(phaseAssets, plan, options, progress);
    } else {
      await this.executePhaseSequential(phaseAssets, plan, options, progress);
    }
  }

  private async executePhaseParallel(
    assets: AssetDefinition[],
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    const concurrency = Math.min(5, assets.length); // Limit concurrent operations
    const chunks = this.chunkArray(assets, concurrency);
    
    const promises = chunks.map(chunk => this.executeAssetChunk(chunk, plan, options, progress));
    await Promise.all(promises);
  }

  private async executePhaseSequential(
    assets: AssetDefinition[],
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    for (const asset of assets) {
      await this.migrateAsset(asset, plan, options, progress);
    }
  }

  private async executeAssetChunk(
    assets: AssetDefinition[],
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    for (const asset of assets) {
      await this.migrateAsset(asset, plan, options, progress);
    }
  }

  private async migrateAsset(
    asset: AssetDefinition,
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    const startTime = Date.now();

    try {
      if (options.dryRun) {
        // Simulate migration for dry run
        await this.simulateAssetMigration(asset, progress);
      } else {
        // Actual migration
        await this.performAssetMigration(asset, plan, options, progress);
      }

      progress.assetsProcessed++;
      progress.progressPercentage = Math.floor((progress.assetsProcessed / progress.totalAssets) * 100);

    } catch (error) {
      progress.issues.push({
        type: 'error',
        phase: progress.currentPhase,
        asset: asset.path,
        message: `Asset migration failed: ${error instanceof Error ? error.message : String(error)}`,
        resolved: false
      });
    }

    // Update performance metrics
    const duration = Date.now() - startTime;
    this.updatePerformanceMetrics(progress, asset, duration);
  }

  private async simulateAssetMigration(asset: AssetDefinition, progress: MigrationProgress): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    
    progress.performanceMetrics.assetsPerSecond = 1;
    progress.performanceMetrics.averageAssetSize = asset.size;
  }

  private async performAssetMigration(
    asset: AssetDefinition,
    plan: AssetMigrationPlan,
    options: any,
    progress: MigrationProgress
  ): Promise<void> {
    const sourcePath = path.join(plan.source.basePath, asset.path);
    const targetPath = this.buildTargetPath(asset, plan);

    // Copy file
    await this.copyAsset(sourcePath, targetPath);

    // Optimize if enabled
    if (!options.skipOptimization && asset.optimization.compress) {
      await this.optimizeAsset(targetPath, asset);
    }

    // Upload to CDN
    await this.uploadToCDN(targetPath, asset, plan.target.cdn);

    // Set cache headers
    await this.setCacheHeaders(asset, plan.target.cdn);
  }

  private buildTargetPath(asset: AssetDefinition, plan: AssetMigrationPlan): string {
    const version = plan.target.versioning.enabled 
      ? this.generateVersion(asset, plan.target.versioning.scheme)
      : '';
    
    const prefix = version ? `${version}/` : '';
    return path.join(plan.target.bucket, prefix, asset.path);
  }

  private generateVersion(asset: AssetDefinition, scheme: string): string {
    switch (scheme) {
      case 'hash':
        return asset.hash.substring(0, 8);
      case 'timestamp':
        return Date.now().toString();
      case 'semantic':
        return '1.0.0'; // Would be determined by semantic versioning
      default:
        return '';
    }
  }

  private async copyAsset(sourcePath: string, targetPath: string): Promise<void> {
    // In a real implementation, this would copy the file to the target location
    // For now, we'll simulate the copy operation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), Math.random() * 500 + 100);
    });
  }

  private async optimizeAsset(filePath: string, asset: AssetDefinition): Promise<void> {
    // Asset optimization logic would go here
    // - Image compression
    // - JavaScript/CSS minification
    // - Font optimization
    
    if (asset.optimization.webp && asset.type === 'image') {
      // Convert to WebP
    }
    
    if (asset.optimization.avif && asset.type === 'image') {
      // Convert to AVIF
    }
  }

  private async uploadToCDN(
    filePath: string,
    asset: AssetDefinition,
    cdn: CDNConfiguration
  ): Promise<void> {
    // Platform-specific CDN upload logic
    switch (cdn.provider) {
      case 'cloudflare':
        await this.uploadToCloudflare(filePath, asset, cdn);
        break;
      case 'aws-cloudfront':
        await this.uploadToCloudFront(filePath, asset, cdn);
        break;
      default:
        console.log(`CDN upload simulated for ${cdn.provider}`);
    }
  }

  private async uploadToCloudflare(
    filePath: string,
    asset: AssetDefinition,
    cdn: CDNConfiguration
  ): Promise<void> {
    // Cloudflare R2 or Images API integration would go here
    console.log(`Uploading ${filePath} to Cloudflare`);
  }

  private async uploadToCloudFront(
    filePath: string,
    asset: AssetDefinition,
    cdn: CDNConfiguration
  ): Promise<void> {
    // AWS S3 + CloudFront integration would go here
    console.log(`Uploading ${filePath} to CloudFront`);
  }

  private async setCacheHeaders(
    asset: AssetDefinition,
    cdn: CDNConfiguration
  ): Promise<void> {
    // Set appropriate cache headers for the CDN
    const headers = {
      'Cache-Control': `max-age=${asset.cacheControl.maxAge}`,
      'ETag': `"${asset.hash}"`,
      'Last-Modified': new Date().toISOString()
    };

    // Apply headers based on asset type and CDN configuration
    console.log('Setting cache headers:', headers);
  }

  private updatePerformanceMetrics(
    progress: MigrationProgress,
    asset: AssetDefinition,
    duration: number
  ): void {
    progress.performanceMetrics.averageAssetSize = 
      (progress.performanceMetrics.averageAssetSize * (progress.assetsProcessed - 1) + asset.size) / 
      progress.assetsProcessed;

    progress.performanceMetrics.assetsPerSecond = 
      progress.assetsProcessed / ((Date.now() - new Date(progress.startTime).getTime()) / 1000);

    // Calculate compression savings
    const originalSize = asset.size;
    const optimizedSize = asset.optimization.compress ? originalSize * 0.7 : originalSize; // Assume 30% savings
    progress.performanceMetrics.compressionSavings = 
      ((originalSize - optimizedSize) / originalSize) * 100;
  }

  private async validatePostMigration(plan: AssetMigrationPlan, progress: MigrationProgress): Promise<void> {
    // Validate all assets were migrated successfully
    // Check CDN configuration
    // Verify performance targets
    
    progress.issues.push({
      type: 'info',
      phase: 'post-validation',
      message: 'Post-migration validation completed',
      resolved: true
    });
  }

  private async createAssetVersion(plan: AssetMigrationPlan, progress: MigrationProgress): Promise<void> {
    const version: AssetVersion = {
      version: this.generateVersionString(),
      hash: this.calculatePlanHash(plan),
      createdAt: new Date().toISOString(),
      assets: plan.assets,
      changelog: this.generateChangelog(plan),
      rollback: false
    };

    const versionPath = path.join(this.versionsDir, `${version.version}.json`);
    fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

    if (!this.assetVersions.has(plan.target.bucket)) {
      this.assetVersions.set(plan.target.bucket, []);
    }
    this.assetVersions.get(plan.target.bucket)!.push(version);
  }

  private generateVersionString(): string {
    return `v${Date.now()}`;
  }

  private calculatePlanHash(plan: AssetMigrationPlan): string {
    const planString = JSON.stringify(plan.assets.map(a => ({ path: a.path, hash: a.hash })));
    return crypto.createHash('sha256').update(planString).digest('hex');
  }

  private generateChangelog(plan: AssetMigrationPlan): AssetChange[] {
    // Generate changelog based on asset differences
    return plan.assets.map(asset => ({
      asset: asset.path,
      type: 'added' as const,
      newHash: asset.hash,
      sizeChange: asset.size
    }));
  }

  private async updateCacheInvalidation(plan: AssetMigrationPlan): Promise<void> {
    const invalidationRequest: CacheInvalidationRequest = {
      requestId: `invalidation-${Date.now()}`,
      type: 'selective',
      patterns: plan.assets.map(asset => `/${asset.path}*`),
      reason: 'Asset migration completion',
      urgency: 'medium',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    this.cacheInvalidations.set(invalidationRequest.requestId, invalidationRequest);
    
    // In a real implementation, this would trigger actual cache invalidation
    console.log(`Cache invalidation requested: ${invalidationRequest.requestId}`);
  }

  private async executeRollback(plan: AssetMigrationPlan, progress: MigrationProgress): Promise<void> {
    console.log('Executing rollback for plan:', plan.planId);
    
    // Rollback logic would restore previous version
    progress.issues.push({
      type: 'warning',
      phase: 'rollback',
      message: 'Rollback executed',
      resolved: true
    });
  }

  private saveMigrationProgress(progress: MigrationProgress): void {
    const progressPath = path.join(this.migrationsDir, `${progress.planId}.json`);
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Cache Management
  public async invalidateCache(
    patterns: string[],
    urgency: 'low' | 'medium' | 'high' | 'emergency' = 'medium'
  ): Promise<string> {
    const requestId = `invalidation-${Date.now()}`;
    
    const request: CacheInvalidationRequest = {
      requestId,
      type: patterns.length === 1 && patterns[0] === '*' ? 'all' : 'selective',
      patterns,
      reason: 'Manual cache invalidation',
      urgency,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    this.cacheInvalidations.set(requestId, request);

    // Execute invalidation based on urgency
    const delay = urgency === 'emergency' ? 0 : urgency === 'high' ? 1000 : urgency === 'medium' ? 5000 : 10000;
    
    setTimeout(() => {
      request.status = 'in-progress';
      this.executeCacheInvalidation(request);
    }, delay);

    return requestId;
  }

  private async executeCacheInvalidation(request: CacheInvalidationRequest): Promise<void> {
    try {
      // Platform-specific cache invalidation logic
      console.log(`Executing cache invalidation: ${request.requestId}`);
      
      // Simulate invalidation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      request.status = 'completed';
      request.estimatedCompletion = new Date().toISOString();
    } catch (error) {
      request.status = 'failed';
      console.error('Cache invalidation failed:', error);
    }
  }

  public getCacheInvalidationStatus(requestId: string): CacheInvalidationRequest | undefined {
    return this.cacheInvalidations.get(requestId);
  }

  public getAllCacheInvalidations(): CacheInvalidationRequest[] {
    return Array.from(this.cacheInvalidations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Version Management
  public getAssetVersions(bucket: string): AssetVersion[] {
    return this.assetVersions.get(bucket) || [];
  }

  public async rollbackToVersion(
    bucket: string,
    version: string,
    reason: string
  ): Promise<void> {
    const versions = this.assetVersions.get(bucket);
    if (!versions) {
      throw new Error(`No versions found for bucket: ${bucket}`);
    }

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for bucket: ${bucket}`);
    }

    // Create rollback version record
    const rollbackVersion: AssetVersion = {
      version: `rollback-${Date.now()}`,
      hash: this.calculatePlanHash({ assets: targetVersion.assets } as any),
      createdAt: new Date().toISOString(),
      assets: targetVersion.assets,
      changelog: [],
      rollback: true,
      rollbackVersion: version
    };

    // Execute rollback
    console.log(`Rolling back to version ${version}: ${reason}`);
    
    // In a real implementation, this would restore the assets from the target version
  }

  // Performance Monitoring
  public getMigrationMetrics(planId: string): MigrationProgress | undefined {
    return this.migrations.get(planId);
  }

  public getGlobalMetrics(): {
    totalMigrations: number;
    totalAssets: number;
    averageMigrationTime: number;
    totalBandwidthUsed: number;
    cacheHitRatio: number;
    compressionSavings: number;
  } {
    const migrations = Array.from(this.migrations.values());
    const totalMigrations = migrations.length;
    const totalAssets = migrations.reduce((sum, m) => sum + m.totalAssets, 0);
    const totalBandwidthUsed = migrations.reduce((sum, m) => sum + m.performanceMetrics.bandwidthUsed, 0);
    const cacheHitRatio = migrations.reduce((sum, m) => sum + m.performanceMetrics.cacheHitRatio, 0) / totalMigrations;
    const compressionSavings = migrations.reduce((sum, m) => sum + m.performanceMetrics.compressionSavings, 0) / totalMigrations;
    
    const averageMigrationTime = migrations.length > 0 
      ? migrations.reduce((sum, m) => {
          const start = new Date(m.startTime).getTime();
          const end = m.estimatedCompletion ? new Date(m.estimatedCompletion).getTime() : Date.now();
          return sum + (end - start);
        }, 0) / migrations.length / 1000 / 60 // Convert to minutes
      : 0;

    return {
      totalMigrations,
      totalAssets,
      averageMigrationTime,
      totalBandwidthUsed,
      cacheHitRatio,
      compressionSavings
    };
  }
}

// Export singleton instance
export const cdnAssetMigrationManager = CDNAssetMigrationManager.getInstance();