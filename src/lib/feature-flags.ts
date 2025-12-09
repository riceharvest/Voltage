/**
 * Feature Flag System for Gradual Rollouts
 *
 * This module provides a centralized feature flag system that allows for
 * gradual rollouts, A/B testing, and controlled feature releases.
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions?: {
    userId?: string[];
    environment?: string[];
    custom?: Record<string, any>;
  };
  metadata?: {
    description?: string;
    owner?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface FeatureFlagContext {
  userId?: string;
  environment?: string;
  custom?: Record<string, any>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private static instance: FeatureFlagManager;

  private constructor() {
    this.loadFlagsFromEnvironment();
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  /**
   * Load feature flags from environment variables
   * Format: FEATURE_FLAG_<NAME>=enabled:percentage:environments
   * Example: FEATURE_FLAG_NEW_CALCULATOR=true:50:production,staging
   */
  private loadFlagsFromEnvironment(): void {
    const envVars = Object.keys(process.env).filter(key =>
      key.startsWith('FEATURE_FLAG_')
    );

    envVars.forEach(envKey => {
      const flagName = envKey.replace('FEATURE_FLAG_', '').toLowerCase();
      const value = process.env[envKey];

      if (value) {
        try {
          const [enabled, percentage, environments] = value.split(':');
          const flag: FeatureFlag = {
            name: flagName,
            enabled: enabled === 'true',
            rolloutPercentage: parseInt(percentage) || 0,
            conditions: {
              environment: environments ? environments.split(',') : undefined
            }
          };
          this.flags.set(flagName, flag);
        } catch (error) {
          console.warn(`Invalid feature flag format for ${envKey}: ${value}`);
        }
      }
    });
  }

  /**
   * Check if a feature is enabled for the given context
   */
  isEnabled(flagName: string, context: FeatureFlagContext = {}): boolean {
    const flag = this.flags.get(flagName);

    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check environment conditions
    if (flag.conditions?.environment && context.environment) {
      if (!flag.conditions.environment.includes(context.environment)) {
        return false;
      }
    }

    // Check user-specific conditions
    if (flag.conditions?.userId && context.userId) {
      if (!flag.conditions.userId.includes(context.userId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(context.userId || 'anonymous');
      if (userHash > flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific feature flag
   */
  getFlag(flagName: string): FeatureFlag | undefined {
    return this.flags.get(flagName);
  }

  /**
   * Set or update a feature flag
   */
  setFlag(flag: FeatureFlag): void {
    flag.metadata = {
      ...flag.metadata,
      updatedAt: new Date().toISOString()
    };
    this.flags.set(flag.name, flag);
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagName: string): boolean {
    return this.flags.delete(flagName);
  }

  /**
   * Generate a consistent hash for user-based rollouts
   */
  private getUserHash(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get feature flag statistics
   */
  getStats(): { total: number; enabled: number; disabled: number } {
    const flags = Array.from(this.flags.values());
    return {
      total: flags.length,
      enabled: flags.filter(f => f.enabled).length,
      disabled: flags.filter(f => !f.enabled).length
    };
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagManager.getInstance();

// Helper functions for common use cases
export const isFeatureEnabled = (flagName: string, context?: FeatureFlagContext): boolean => {
  return featureFlags.isEnabled(flagName, context);
};

export const withFeatureFlag = <T>(
  flagName: string,
  enabledComponent: T,
  disabledComponent: T,
  context?: FeatureFlagContext
): T => {
  return isFeatureEnabled(flagName, context) ? enabledComponent : disabledComponent;
};