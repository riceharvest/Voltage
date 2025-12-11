/**
 * Comprehensive Feature Flag System
 * 
 * Supports progressive rollout, A/B testing, regional deployment, and emergency controls
 */

import { useFeatureFlag } from './use-feature-flag';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetAudience: {
    regions: string[];
    userSegments: string[];
    environments: string[];
  };
  dependencies: string[]; // Other feature flags this depends on
  schedule?: {
    startDate?: string;
    endDate?: string;
  };
  variants?: {
    name: string;
    weight: number;
    config?: Record<string, any>;
  }[];
  emergencyDisable?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FeatureFlagEvaluation {
  feature: string;
  enabled: boolean;
  variant?: string;
  config?: Record<string, any>;
  reason: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  featureFlag: string;
  variants: {
    name: string;
    weight: number; // 0-100
    config?: Record<string, any>;
  }[];
  trafficSplit: number; // 0-100 percentage of users in test
  duration: number; // days
  primaryMetric: string;
  successCriteria: {
    improvement: number; // percentage
    confidence: number; // 0-100
  };
  regions: string[];
  userSegments: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  results?: {
    variant: string;
    metric: number;
    confidence: number;
    significance: boolean;
  }[];
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluations: FeatureFlagEvaluation[] = [];
  private abTests: Map<string, ABTestConfig> = new Map();
  private readonly storageKey = 'feature-flags-config';
  private readonly evaluationHistoryKey = 'feature-flag-evaluations';
  
  private constructor() {
    this.initializeDefaultFlags();
    this.loadFromStorage();
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'global-soda-platform',
        name: 'Global Soda Platform Migration',
        description: 'Enable access to the expanded soda platform with classic soda recipes',
        enabled: false,
        rolloutPercentage: 0,
        targetAudience: {
          regions: ['US', 'EU', 'APAC'],
          userSegments: ['all'],
          environments: ['development', 'staging', 'production']
        },
        dependencies: [],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
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
        createdBy: 'system'
      },
      {
        key: 'premade-syrup-marketplace',
        name: 'Premade Syrup Marketplace',
        description: 'Enable commercial syrup marketplace with SodaStream, Torani, etc.',
        enabled: false,
        rolloutPercentage: 0,
        targetAudience: {
          regions: ['US', 'EU'],
          userSegments: ['all'],
          environments: ['production']
        },
        dependencies: ['global-soda-platform'],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        key: 'enhanced-calculator',
        name: 'Enhanced Calculator Features',
        description: 'Enable advanced calculator with hybrid recipes and cost analysis',
        enabled: true,
        rolloutPercentage: 100,
        targetAudience: {
          regions: ['US', 'EU', 'APAC'],
          userSegments: ['all'],
          environments: ['development', 'staging', 'production']
        },
        dependencies: [],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        key: 'regional-compliance',
        name: 'Regional Compliance System',
        description: 'Enable region-specific regulatory compliance and safety validation',
        enabled: true,
        rolloutPercentage: 100,
        targetAudience: {
          regions: ['US', 'EU', 'APAC'],
          userSegments: ['all'],
          environments: ['production']
        },
        dependencies: [],
        emergencyDisable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const flags = JSON.parse(stored);
        Object.keys(flags).forEach(key => {
          this.flags.set(key, flags[key]);
        });
      }
    } catch (error) {
      console.error('Failed to load feature flags from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const flagsObject: Record<string, FeatureFlag> = {};
      this.flags.forEach((flag, key) => {
        flagsObject[key] = flag;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(flagsObject));
    } catch (error) {
      console.error('Failed to save feature flags to storage:', error);
    }
  }

  public evaluateFlag(
    flagKey: string,
    userId?: string,
    sessionId?: string,
    userRegion?: string,
    userSegment = 'all',
    environment = 'development'
  ): FeatureFlagEvaluation {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'flag_not_found',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check if flag is emergency disabled
    if (flag.emergencyDisable) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'emergency_disabled',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check dependencies
    for (const depKey of flag.dependencies) {
      const depEval = this.evaluateFlag(depKey, userId, sessionId, userRegion, userSegment, environment);
      if (!depEval.enabled) {
        return {
          feature: flagKey,
          enabled: false,
          reason: 'dependency_not_met',
          timestamp: new Date().toISOString(),
          userId,
          sessionId
        };
      }
    }

    // Check schedule
    const now = new Date();
    if (flag.schedule?.startDate && now < new Date(flag.schedule.startDate)) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'not_started',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    if (flag.schedule?.endDate && now > new Date(flag.schedule.endDate)) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'expired',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check environment
    if (!flag.targetAudience.environments.includes(environment)) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'environment_restricted',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check region
    if (userRegion && !flag.targetAudience.regions.includes(userRegion)) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'region_restricted',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check user segment
    if (!flag.targetAudience.userSegments.includes(userSegment)) {
      return {
        feature: flagKey,
        enabled: false,
        reason: 'segment_restricted',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(userId || sessionId || 'anonymous');
      const userPercentage = userHash % 100;
      
      if (userPercentage >= flag.rolloutPercentage) {
        return {
          feature: flagKey,
          enabled: false,
          reason: 'rollout_percentage',
          timestamp: new Date().toISOString(),
          userId,
          sessionId
        };
      }
    }

    // Determine variant if available
    let variant: string | undefined;
    let config: Record<string, any> | undefined;

    if (flag.variants && flag.variants.length > 0) {
      const userHash = this.getUserHash(userId || sessionId || 'anonymous');
      const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
      let currentWeight = userHash % totalWeight;

      for (const variantOption of flag.variants) {
        if (currentWeight < variantOption.weight) {
          variant = variantOption.name;
          config = variantOption.config;
          break;
        }
        currentWeight -= variantOption.weight;
      }
    }

    const evaluation: FeatureFlagEvaluation = {
      feature: flagKey,
      enabled: flag.enabled,
      variant,
      config,
      reason: flag.enabled ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString(),
      userId,
      sessionId
    };

    // Store evaluation for analytics
    this.evaluations.push(evaluation);
    if (this.evaluations.length > 1000) {
      this.evaluations = this.evaluations.slice(-500); // Keep last 500 evaluations
    }

    return evaluation;
  }

  private getUserHash(userIdentifier: string): number {
    let hash = 0;
    for (let i = 0; i < userIdentifier.length; i++) {
      const char = userIdentifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  public createOrUpdateFlag(flag: FeatureFlag): void {
    flag.updatedAt = new Date().toISOString();
    this.flags.set(flag.key, flag);
    this.saveToStorage();
  }

  public getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public deleteFlag(key: string): void {
    this.flags.delete(key);
    this.saveToStorage();
  }

  public emergencyDisableFlag(key: string, reason?: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.emergencyDisable = true;
      flag.updatedAt = new Date().toISOString();
      this.saveToStorage();
      console.warn(`Feature flag '${key}' emergency disabled: ${reason || 'No reason provided'}`);
    }
  }

  public enableFlag(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = true;
      flag.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public disableFlag(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = false;
      flag.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public setRolloutPercentage(key: string, percentage: number): void {
    const flag = this.flags.get(key);
    if (flag && percentage >= 0 && percentage <= 100) {
      flag.rolloutPercentage = percentage;
      flag.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // A/B Testing Methods
  public createABTest(test: ABTestConfig): void {
    this.abTests.set(test.testId, test);
  }

  public evaluateABTest(testId: string, userId?: string, sessionId?: string): FeatureFlagEvaluation | null {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    const flagEval = this.evaluateFlag(test.featureFlag, userId, sessionId);
    if (!flagEval.enabled) {
      return flagEval;
    }

    // Determine if user is in test traffic
    const userHash = this.getUserHash(userId || sessionId || 'anonymous');
    const userPercentage = userHash % 100;

    if (userPercentage >= test.trafficSplit) {
      return {
        feature: test.featureFlag,
        enabled: false,
        reason: 'ab_test_traffic_split',
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      };
    }

    // Assign variant
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    let currentWeight = userHash % totalWeight;

    for (const variant of test.variants) {
      if (currentWeight < variant.weight) {
        return {
          feature: test.featureFlag,
          enabled: true,
          variant: variant.name,
          config: variant.config,
          reason: 'ab_test_variant_assigned',
          timestamp: new Date().toISOString(),
          userId,
          sessionId
        };
      }
      currentWeight -= variant.weight;
    }

    return flagEval;
  }

  public getABTestResults(testId: string): ABTestConfig | undefined {
    return this.abTests.get(testId);
  }

  public getAllABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  public updateABTestStatus(testId: string, status: ABTestConfig['status']): void {
    const test = this.abTests.get(testId);
    if (test) {
      test.status = status;
      if (status === 'running' && !test.startDate) {
        test.startDate = new Date().toISOString();
      } else if (status === 'completed' && !test.endDate) {
        test.endDate = new Date().toISOString();
      }
    }
  }

  // Analytics and Reporting
  public getEvaluationAnalytics(featureKey?: string): {
    totalEvaluations: number;
    enabledCount: number;
    disabledCount: number;
    variantDistribution: Record<string, number>;
    reasonDistribution: Record<string, number>;
  } {
    const relevantEvaluations = featureKey 
      ? this.evaluations.filter(e => e.feature === featureKey)
      : this.evaluations;

    const analytics = {
      totalEvaluations: relevantEvaluations.length,
      enabledCount: relevantEvaluations.filter(e => e.enabled).length,
      disabledCount: relevantEvaluations.filter(e => !e.enabled).length,
      variantDistribution: {} as Record<string, number>,
      reasonDistribution: {} as Record<string, number>
    };

    relevantEvaluations.forEach(eval => {
      // Count variants
      if (eval.variant) {
        analytics.variantDistribution[eval.variant] = 
          (analytics.variantDistribution[eval.variant] || 0) + 1;
      }

      // Count reasons
      analytics.reasonDistribution[eval.reason] = 
        (analytics.reasonDistribution[eval.reason] || 0) + 1;
    });

    return analytics;
  }

  public exportConfiguration(): string {
    return JSON.stringify({
      flags: Object.fromEntries(this.flags),
      abTests: Object.fromEntries(this.abTests),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public importConfiguration(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      
      if (config.flags) {
        Object.keys(config.flags).forEach(key => {
          this.flags.set(key, config.flags[key]);
        });
      }

      if (config.abTests) {
        Object.keys(config.abTests).forEach(key => {
          this.abTests.set(key, config.abTests[key]);
        });
      }

      this.saveToStorage();
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }

  // Migration Helpers
  public async performProgressiveRollout(
    flagKey: string,
    targetPercentage: number,
    incrementPercentage = 10,
    intervalMs = 300000, // 5 minutes
    healthCheck?: () => Promise<boolean>
  ): Promise<void> {
    const flag = this.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    const currentPercentage = flag.rolloutPercentage;
    
    for (let percentage = currentPercentage; percentage <= targetPercentage; percentage += incrementPercentage) {
      this.setRolloutPercentage(flagKey, Math.min(percentage, targetPercentage));
      
      console.log(`Rolled out '${flagKey}' to ${Math.min(percentage, targetPercentage)}%`);
      
      // Wait before next increment
      if (percentage < targetPercentage) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        
        // Perform health check if provided
        if (healthCheck) {
          const isHealthy = await healthCheck();
          if (!isHealthy) {
            console.warn(`Health check failed at ${percentage}%, stopping rollout`);
            break;
          }
        }
      }
    }
  }

  public validateMigrationReadiness(): {
    isReady: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if critical flags are properly configured
    const criticalFlags = ['global-soda-platform', 'amazon-regional-integration'];
    
    criticalFlags.forEach(flagKey => {
      const flag = this.getFlag(flagKey);
      if (!flag) {
        issues.push(`Critical feature flag '${flagKey}' is missing`);
      } else if (flag.rolloutPercentage < 100 && flag.enabled) {
        recommendations.push(`Consider increasing rollout percentage for '${flagKey}'`);
      }
    });

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkDependencies = (flagKey: string): boolean => {
      if (recursionStack.has(flagKey)) {
        issues.push(`Circular dependency detected involving '${flagKey}'`);
        return false;
      }
      if (visited.has(flagKey)) {
        return true;
      }

      visited.add(flagKey);
      recursionStack.add(flagKey);

      const flag = this.getFlag(flagKey);
      if (flag) {
        for (const dep of flag.dependencies) {
          if (!checkDependencies(dep)) {
            return false;
          }
        }
      }

      recursionStack.delete(flagKey);
      return true;
    };

    this.flags.forEach((_, key) => {
      if (!visited.has(key)) {
        checkDependencies(key);
      }
    });

    return {
      isReady: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();

// React Hook for using feature flags
export function useFeatureFlagEvaluation(
  flagKey: string,
  userId?: string,
  sessionId?: string,
  userRegion?: string
): FeatureFlagEvaluation {
  return useFeatureFlag(
    flagKey,
    featureFlagManager,
    userId,
    sessionId,
    userRegion
  );
}