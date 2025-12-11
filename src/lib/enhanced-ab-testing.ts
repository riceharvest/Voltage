/**
 * Enhanced A/B Testing Framework
 * Integrates with feature flags and provides dynamic configuration capabilities
 * 
 * This enhanced version addresses the gaps identified in the audit:
 * - Integration with feature flag system
 * - Dynamic configuration loading
 * - Enhanced user targeting
 * - Statistical analysis foundation
 * - GDPR compliance maintained
 */

import { trackEvent } from './analytics';
import { featureFlags, FeatureFlagContext } from './feature-flags';

// Enhanced A/B Test interface that extends feature flags
export interface EnhancedABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  conversionGoals: string[];
  targeting: {
    userIds?: string[];
    countries?: string[];
    environments?: string[];
    custom?: Record<string, any>;
  };
  trafficAllocation: {
    percentage: number; // 0-100
    startDate: string;
    endDate?: string;
  };
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  // Integration with feature flags
  featureFlagName?: string;
  // Statistical tracking
  statistics?: {
    totalExposures: number;
    totalConversions: number;
    conversionRates: Record<string, number>;
  };
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  description?: string;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId?: string;
  assignedAt: string;
  isControl?: boolean;
}

export interface ABTestContext extends FeatureFlagContext {
  country?: string;
  customAttributes?: Record<string, any>;
}

// Configuration management
class ABTestConfigManager {
  private tests: Map<string, EnhancedABTest> = new Map();
  private assignments: Map<string, ABTestAssignment> = new Map();
  private static instance: ABTestConfigManager;

  private constructor() {
    this.loadDefaultTests();
  }

  static getInstance(): ABTestConfigManager {
    if (!ABTestConfigManager.instance) {
      ABTestConfigManager.instance = new ABTestConfigManager();
    }
    return ABTestConfigManager.instance;
  }

  /**
   * Load default test configurations
   * In production, this would load from database or configuration service
   */
  private loadDefaultTests(): void {
    const defaultTests: EnhancedABTest[] = [
      {
        id: 'calculator_layout_v2',
        name: 'Calculator Layout Enhancement',
        description: 'Test improved calculator interface design',
        status: 'running',
        variants: [
          { id: 'control', name: 'Current Layout', weight: 50, description: 'Existing calculator design' },
          { id: 'enhanced', name: 'Enhanced Layout', weight: 50, description: 'Improved UI with better spacing' }
        ],
        conversionGoals: ['calculator_completion', 'caffeine_calculation'],
        targeting: {
          environments: ['development', 'staging', 'production']
        },
        trafficAllocation: {
          percentage: 100,
          startDate: '2025-12-10T09:00:00.000Z'
        },
        metadata: {
          createdBy: 'system',
          createdAt: '2025-12-10T09:00:00.000Z',
          updatedAt: '2025-12-10T09:00:00.000Z'
        },
        featureFlagName: 'calculator_layout_test',
        statistics: {
          totalExposures: 0,
          totalConversions: 0,
          conversionRates: {}
        }
      },
      {
        id: 'flavor_display_format',
        name: 'Flavor Display Format Test',
        description: 'Test different flavor display layouts',
        status: 'running',
        variants: [
          { id: 'grid', name: 'Grid Layout', weight: 34, description: 'Card-based grid display' },
          { id: 'list', name: 'List Layout', weight: 33, description: 'Detailed list view' },
          { id: 'carousel', name: 'Carousel Layout', weight: 33, description: 'Swipeable carousel' }
        ],
        conversionGoals: ['flavor_selection', 'affiliate_click'],
        targeting: {
          environments: ['development', 'staging', 'production']
        },
        trafficAllocation: {
          percentage: 80,
          startDate: '2025-12-10T09:00:00.000Z'
        },
        metadata: {
          createdBy: 'system',
          createdAt: '2025-12-10T09:00:00.000Z',
          updatedAt: '2025-12-10T09:00:00.000Z'
        },
        featureFlagName: 'flavor_display_test',
        statistics: {
          totalExposures: 0,
          totalConversions: 0,
          conversionRates: {}
        }
      }
    ];

    defaultTests.forEach(test => {
      this.tests.set(test.id, test);
    });
  }

  /**
   * Get all active tests
   */
  getActiveTests(): EnhancedABTest[] {
    return Array.from(this.tests.values()).filter(test => 
      test.status === 'running' && this.isTestActive(test)
    );
  }

  /**
   * Check if test is currently active based on traffic allocation and timing
   */
  private isTestActive(test: EnhancedABTest): boolean {
    const now = new Date();
    const startDate = new Date(test.trafficAllocation.startDate);
    const endDate = test.trafficAllocation.endDate ? new Date(test.trafficAllocation.endDate) : null;

    // Check if within time window
    if (now < startDate) return false;
    if (endDate && now > endDate) return false;

    // Check traffic allocation percentage
    const hash = this.getUserHash('global');
    return hash < test.trafficAllocation.percentage;
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): EnhancedABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Create or update test configuration
   */
  setTest(test: EnhancedABTest): void {
    test.metadata.updatedAt = new Date().toISOString();
    this.tests.set(test.id, test);
  }

  /**
   * Generate consistent user hash for assignment
   */
  private getUserHash(identifier: string): number {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get user assignment for a specific test
   */
  getUserAssignment(testId: string, context: ABTestContext): ABTestAssignment | null {
    const test = this.getTest(testId);
    if (!test || test.status !== 'running') return null;

    // Check targeting conditions
    if (!this.checkTargeting(test, context)) return null;

    // Generate consistent assignment
    const identifier = context.userId || 'anonymous';
    const assignmentKey = `${testId}_${identifier}`;
    
    // Check if assignment already exists
    const existingAssignment = this.assignments.get(assignmentKey);
    if (existingAssignment) return existingAssignment;

    // Generate new assignment based on weighted distribution
    const hash = this.getUserHash(identifier + testId);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    
    let cumulativeWeight = 0;
    let assignedVariant = test.variants[0]; // fallback
    
    for (const variant of test.variants) {
      cumulativeWeight += (variant.weight / totalWeight) * 100;
      if (hash < cumulativeWeight) {
        assignedVariant = variant;
        break;
      }
    }

    const assignment: ABTestAssignment = {
      testId,
      variantId: assignedVariant.id,
      userId: context.userId,
      assignedAt: new Date().toISOString(),
      isControl: assignedVariant.id === 'control'
    };

    this.assignments.set(assignmentKey, assignment);
    
    // Update test statistics
    this.updateTestStatistics(testId, assignedVariant.id, 'exposure');
    
    return assignment;
  }

  /**
   * Check if user meets targeting criteria
   */
  private checkTargeting(test: EnhancedABTest, context: ABTestContext): boolean {
    // Check environment targeting
    if (test.targeting.environments && context.environment) {
      if (!test.targeting.environments.includes(context.environment)) {
        return false;
      }
    }

    // Check country targeting
    if (test.targeting.countries && context.country) {
      if (!test.targeting.countries.includes(context.country)) {
        return false;
      }
    }

    // Check user ID targeting
    if (test.targeting.userIds && context.userId) {
      if (!test.targeting.userIds.includes(context.userId)) {
        return false;
      }
    }

    // Check custom targeting
    if (test.targeting.custom && context.customAttributes) {
      for (const [key, value] of Object.entries(test.targeting.custom)) {
        if (context.customAttributes[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update test statistics
   */
  private updateTestStatistics(testId: string, variantId: string, eventType: 'exposure' | 'conversion'): void {
    const test = this.tests.get(testId);
    if (!test || !test.statistics) return;

    if (eventType === 'exposure') {
      test.statistics.totalExposures++;
    } else {
      test.statistics.totalConversions++;
    }

    // Update conversion rate for variant
    const variantExposures = this.getVariantExposures(testId, variantId);
    const variantConversions = this.getVariantConversions(testId, variantId);
    test.statistics.conversionRates[variantId] = variantExposures > 0 
      ? (variantConversions / variantExposures) * 100 
      : 0;
  }

  /**
   * Get variant exposure count (simplified tracking)
   */
  private getVariantExposures(testId: string, variantId: string): number {
    // In production, this would query a database
    // For now, return estimated value based on total exposures
    const test = this.tests.get(testId);
    if (!test?.statistics) return 0;
    
    const variantWeight = test.variants.find(v => v.id === variantId)?.weight || 1;
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    return Math.round(test.statistics.totalExposures * (variantWeight / totalWeight));
  }

  /**
   * Get variant conversion count (simplified tracking)
   */
  private getVariantConversions(testId: string, variantId: string): number {
    // In production, this would query a database
    const test = this.tests.get(testId);
    if (!test?.statistics?.conversionRates[variantId]) return 0;
    
    const exposures = this.getVariantExposures(testId, variantId);
    const rate = test.statistics.conversionRates[variantId] / 100;
    return Math.round(exposures * rate);
  }

  /**
   * Track test conversion event
   */
  trackConversion(testId: string, variantId: string, goal: string, context: ABTestContext): void {
    const test = this.getTest(testId);
    if (!test || !test.conversionGoals.includes(goal)) return;

    // Update statistics
    this.updateTestStatistics(testId, variantId, 'conversion');

    // Track with analytics (respecting GDPR consent)
    trackEvent({
      name: 'ab_test_conversion',
      properties: {
        test_id: testId,
        variant_id: variantId,
        goal: goal,
        user_id: context.userId,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance
export const abTestConfig = ABTestConfigManager.getInstance();

/**
 * Enhanced React hook for A/B testing with feature flag integration
 */
export function useEnhancedABTest(
  testId: string, 
  context: ABTestContext = {}
): ABTestAssignment | null {
  const assignment = abTestConfig.getUserAssignment(testId, context);

  // Track exposure when component mounts
  React.useEffect(() => {
    if (assignment) {
      trackEvent({
        name: 'ab_test_exposure',
        properties: {
          test_id: assignment.testId,
          variant_id: assignment.variantId,
          user_id: assignment.userId,
          timestamp: assignment.assignedAt
        }
      });
    }
  }, [assignment?.testId, assignment?.variantId]);

  return assignment;
}

/**
 * Get user's variant for a test with enhanced context
 */
export function getEnhancedVariant(
  testId: string, 
  context: ABTestContext = {}
): ABTestAssignment | null {
  return abTestConfig.getUserAssignment(testId, context);
}

/**
 * Track A/B test conversion with goal validation
 */
export function trackEnhancedABConversion(
  testId: string, 
  variantId: string, 
  goal: string, 
  context: ABTestContext = {}
): void {
  abTestConfig.trackConversion(testId, variantId, goal, context);
}

/**
 * Get all active tests for a user context
 */
export function getActiveTestsForContext(context: ABTestContext): EnhancedABTest[] {
  const activeTests = abTestConfig.getActiveTests();
  return activeTests.filter(test => abTestConfig.getTest(test.id));
}

/**
 * Statistical analysis utilities
 */
export class ABTestStatistics {
  /**
   * Calculate statistical significance using chi-square test
   */
  static calculateSignificance(
    controlConversions: number,
    controlTotal: number,
    variantConversions: number,
    variantTotal: number
  ): {
    isSignificant: boolean;
    pValue: number;
    confidence: number;
    lift: number;
  } {
    if (controlTotal === 0 || variantTotal === 0) {
      return {
        isSignificant: false,
        pValue: 1,
        confidence: 0,
        lift: 0
      };
    }

    const controlRate = controlConversions / controlTotal;
    const variantRate = variantConversions / variantTotal;
    const lift = ((variantRate - controlRate) / controlRate) * 100;

    // Simplified chi-square calculation
    const expectedControl = ((controlConversions + variantConversions) * controlTotal) / 
                           (controlTotal + variantTotal);
    const expectedVariant = ((controlConversions + variantConversions) * variantTotal) / 
                           (controlTotal + variantTotal);

    const chiSquare = 
      Math.pow(controlConversions - expectedControl, 2) / expectedControl +
      Math.pow(variantConversions - expectedVariant, 2) / expectedVariant;

    // Approximate p-value (in production, use proper statistical library)
    const pValue = chiSquare > 3.84 ? 0.05 : 0.1; // Simplified threshold
    const isSignificant = pValue < 0.05;
    const confidence = (1 - pValue) * 100;

    return {
      isSignificant,
      pValue,
      confidence,
      lift
    };
  }

  /**
   * Calculate required sample size for statistical power
   */
  static calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    significance: number = 0.05,
    power: number = 0.8
  ): number {
    // Simplified sample size calculation
    // In production, use proper statistical formulas
    const effect = baselineRate * (minimumDetectableEffect / 100);
    const pooledRate = (baselineRate + baselineRate + effect) / 2;
    
    return Math.ceil(
      16 * (pooledRate * (1 - pooledRate)) / Math.pow(effect, 2)
    );
  }
}

// Import React for hooks
import React from 'react';