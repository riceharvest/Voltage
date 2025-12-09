import { trackEvent } from './analytics';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // Relative weight for distribution (e.g., 1 for equal distribution)
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  enabled: boolean;
}

/**
 * Active A/B tests configuration
 * In production, this could be loaded from a database or configuration service
 */
const ACTIVE_TESTS: ABTest[] = [
  {
    id: 'calculator_layout',
    name: 'Calculator Layout Test',
    enabled: true,
    variants: [
      { id: 'original', name: 'Original Layout', weight: 1 },
      { id: 'compact', name: 'Compact Layout', weight: 1 },
      { id: 'expanded', name: 'Expanded Layout', weight: 1 }
    ]
  },
  {
    id: 'flavor_recommendations',
    name: 'Flavor Recommendations Display',
    enabled: true,
    variants: [
      { id: 'grid', name: 'Grid View', weight: 1 },
      { id: 'list', name: 'List View', weight: 1 },
      { id: 'carousel', name: 'Carousel View', weight: 1 }
    ]
  }
];

/**
 * Get a consistent variant for a user based on their ID or session
 * Uses a simple hash-based distribution to ensure consistent assignment
 */
export function getVariantForUser(testId: string, userId?: string): string | null {
  const test = ACTIVE_TESTS.find(t => t.id === testId && t.enabled);
  if (!test) return null;

  // Use userId if available, otherwise use session-based identifier
  const identifier = userId || getSessionIdentifier();

  // Simple hash function for consistent distribution
  const hash = simpleHash(identifier + testId);
  const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);

  let cumulativeWeight = 0;
  for (const variant of test.variants) {
    cumulativeWeight += variant.weight;
    if (hash % totalWeight < cumulativeWeight) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return test.variants[0]?.id || null;
}

/**
 * Get session identifier for consistent A/B test assignment
 */
function getSessionIdentifier(): string {
  if (typeof window === 'undefined') return 'server';

  // Try to get from localStorage first
  let sessionId = localStorage.getItem('ab_test_session');
  if (!sessionId) {
    // Generate a new session ID
    sessionId = generateSessionId();
    localStorage.setItem('ab_test_session', sessionId);
  }

  return sessionId;
}

/**
 * Generate a unique session identifier
 */
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Simple hash function for consistent distribution
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Track A/B test exposure (when a user sees a variant)
 */
export function trackABTestExposure(testId: string, variantId: string): void {
  trackEvent({
    name: 'ab_test_exposure',
    properties: {
      test_id: testId,
      variant_id: variantId
    }
  });
}

/**
 * Track A/B test conversion (when a user completes a goal)
 */
export function trackABTestConversion(testId: string, variantId: string, goal: string): void {
  trackEvent({
    name: 'ab_test_conversion',
    properties: {
      test_id: testId,
      variant_id: variantId,
      goal: goal
    }
  });
}

/**
 * Get all active A/B tests
 */
export function getActiveTests(): ABTest[] {
  return ACTIVE_TESTS.filter(test => test.enabled);
}

/**
 * Check if a test is active
 */
export function isTestActive(testId: string): boolean {
  return ACTIVE_TESTS.some(test => test.id === testId && test.enabled);
}

/**
 * React hook for A/B testing
 */
export function useABTest(testId: string, userId?: string) {
  const variant = getVariantForUser(testId, userId);

  // Track exposure when component mounts
  React.useEffect(() => {
    if (variant) {
      trackABTestExposure(testId, variant);
    }
  }, [testId, variant]);

  return variant;
}

// Import React for the hook
import React from 'react';