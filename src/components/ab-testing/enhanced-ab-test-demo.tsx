'use client';

import React from 'react';
import { useEnhancedABTest, trackEnhancedABConversion, ABTestContext } from '@/lib/enhanced-ab-testing';
import { isFeatureEnabled } from '@/lib/feature-flags';

/**
 * Enhanced A/B Testing Demo Component
 * 
 * Demonstrates the integration between A/B testing and feature flag systems
 * Shows how to:
 * - Use enhanced A/B testing with feature flag integration
 * - Track conversions with goal validation
 * - Maintain GDPR compliance
 * - Display test statistics and results
 */

interface EnhancedABTestDemoProps {
  testId: string;
  userId?: string;
  className?: string;
}

export function EnhancedABTestDemo({ testId, userId, className = '' }: EnhancedABTestDemoProps) {
  // Create enhanced context for A/B testing
  const context: ABTestContext = {
    userId,
    environment: process.env.NODE_ENV,
    country: 'NL', // Could be detected from geo-IP
    customAttributes: {
      deviceType: 'desktop', // Could be detected from user agent
      sessionDuration: '5min' // Could be calculated from session data
    }
  };

  // Use enhanced A/B testing hook
  const assignment = useEnhancedABTest(testId, context);

  // Check if feature flag is enabled for additional targeting
  const isFeatureFlagEnabled = isFeatureEnabled(`${testId}_feature`, context);

  if (!assignment) {
    return (
      <div className={`ab-test-placeholder ${className}`}>
        <p>A/B test "{testId}" is not active for this user.</p>
      </div>
    );
  }

  const handleConversion = (goal: string) => {
    trackEnhancedABConversion(testId, assignment.variantId, goal, context);
    
    // Show success message
    alert(`Conversion tracked: ${goal} for variant ${assignment.variantId}`);
  };

  return (
    <div className={`enhanced-ab-test-demo ${className}`}>
      <div className="bg-white p-6 rounded-lg shadow-md border">
        {/* Test Information */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            A/B Test: {testId}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Variant: <strong>{assignment.variantId}</strong></span>
            <span>Assignment: {new Date(assignment.assignedAt).toLocaleTimeString()}</span>
            <span>Control: {assignment.isControl ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Feature Flag Status */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="text-sm font-medium text-blue-900">
              Feature Flag Status:
            </span>
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              isFeatureFlagEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isFeatureFlagEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Variant-specific Content */}
        <div className="mb-6">
          {assignment.variantId === 'control' && (
            <div className="control-variant">
              <h4 className="font-medium text-gray-900 mb-2">Control Variant</h4>
              <p className="text-gray-700">
                This is the current implementation. Users see the baseline experience 
                to compare against new variations.
              </p>
            </div>
          )}

          {assignment.variantId === 'enhanced' && (
            <div className="enhanced-variant">
              <h4 className="font-medium text-gray-900 mb-2">Enhanced Variant</h4>
              <p className="text-gray-700">
                This variant includes improved UI elements and enhanced user experience 
                features designed to increase engagement.
              </p>
            </div>
          )}

          {assignment.variantId === 'grid' && (
            <div className="grid-variant">
              <h4 className="font-medium text-gray-900 mb-2">Grid Layout</h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                <div className="p-3 bg-white rounded border">Item 1</div>
                <div className="p-3 bg-white rounded border">Item 2</div>
                <div className="p-3 bg-white rounded border">Item 3</div>
                <div className="p-3 bg-white rounded border">Item 4</div>
              </div>
            </div>
          )}

          {assignment.variantId === 'list' && (
            <div className="list-variant">
              <h4 className="font-medium text-gray-900 mb-2">List Layout</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded border">Detailed List Item 1</div>
                <div className="p-3 bg-gray-50 rounded border">Detailed List Item 2</div>
                <div className="p-3 bg-gray-50 rounded border">Detailed List Item 3</div>
              </div>
            </div>
          )}

          {assignment.variantId === 'carousel' && (
            <div className="carousel-variant">
              <h4 className="font-medium text-gray-900 mb-2">Carousel Layout</h4>
              <div className="relative overflow-hidden bg-gray-50 rounded p-4">
                <div className="flex space-x-4 animate-pulse">
                  <div className="w-24 h-16 bg-gray-200 rounded"></div>
                  <div className="w-24 h-16 bg-gray-200 rounded"></div>
                  <div className="w-24 h-16 bg-gray-200 rounded"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">← Swipe to see more items →</p>
              </div>
            </div>
          )}
        </div>

        {/* Conversion Goals */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Test Conversion Goals</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleConversion('primary_action')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Primary Action
            </button>
            <button
              onClick={() => handleConversion('secondary_action')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Secondary Action
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            Debug Information
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                assignment,
                context,
                featureFlagEnabled: isFeatureFlagEnabled,
                gdprCompliant: true,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

/**
 * Enhanced A/B Test Statistics Component
 * Shows test performance metrics and statistical significance
 */
export function ABTestStatistics({ testId }: { testId: string }) {
  // This would fetch real statistics from the API
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    // In production, fetch from /api/ab-tests/[id]/results
    // For demo, show mock data
    setStats({
      totalExposures: 1250,
      totalConversions: 87,
      conversionRate: 6.96,
      variants: {
        control: { exposures: 625, conversions: 38, rate: 6.08 },
        enhanced: { exposures: 625, conversions: 49, rate: 7.84 }
      },
      significance: {
        isSignificant: true,
        pValue: 0.032,
        confidence: 96.8,
        lift: 28.9
      }
    });
  }, [testId]);

  if (!stats) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Test Statistics: {testId}
      </h3>

      {/* Overall Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalExposures}</div>
          <div className="text-sm text-gray-600">Total Exposures</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalConversions}</div>
          <div className="text-sm text-gray-600">Total Conversions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Overall Rate</div>
        </div>
      </div>

      {/* Variant Comparison */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Variant Performance</h4>
        <div className="space-y-3">
          {Object.entries(stats.variants).map(([variantId, data]) => (
            <div key={variantId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{variantId}</span>
              <div className="flex space-x-6 text-sm">
                <span>{data.exposures} exposures</span>
                <span>{data.conversions} conversions</span>
                <span className="font-semibold">{data.rate.toFixed(2)}% rate</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Significance */}
      <div className={`p-4 rounded border ${
        stats.significance.isSignificant 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <h4 className="font-medium mb-2">Statistical Analysis</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Significance:</span>
            <span className={`ml-2 font-semibold ${
              stats.significance.isSignificant ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {stats.significance.isSignificant ? 'Significant' : 'Not Significant'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">P-value:</span>
            <span className="ml-2 font-semibold">{stats.significance.pValue}</span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>
            <span className="ml-2 font-semibold">{stats.significance.confidence.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Lift:</span>
            <span className="ml-2 font-semibold text-green-600">
              +{stats.significance.lift.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Example Component
 * Shows how A/B testing integrates with feature flags
 */
export function ABTestFeatureFlagIntegration() {
  const context: ABTestContext = {
    environment: process.env.NODE_ENV,
    userId: 'demo-user-123'
  };

  // Example: Use feature flag to determine if A/B test should run
  const shouldRunABTest = isFeatureEnabled('ab_testing_enabled', context);
  const featureVariant = isFeatureEnabled('new_feature_variant', context) ? 'b' : 'a';

  if (!shouldRunABTest) {
    return (
      <div className="p-4 bg-gray-100 rounded border">
        <p className="text-gray-600">A/B testing is currently disabled for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900">Feature Flag Integration</h3>
        <p className="text-blue-800">
          Feature flag determined variant: <strong>{featureVariant}</strong>
        </p>
      </div>
      
      <EnhancedABTestDemo 
        testId="calculator_layout_v2" 
        userId="demo-user-123"
      />
    </div>
  );
}