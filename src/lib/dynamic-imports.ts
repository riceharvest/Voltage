/**
 * Dynamic imports configuration for lazy loading heavy components and routes
 * This file centralizes all lazy loading configurations for better maintainability
 */

import { lazy, LazyExoticComponent } from 'react'

// Component lazy loading configurations
export const componentLazyImports = {
  // Calculator components
  CaffeineCalculator: lazy(() => 
    import('@/components/calculator/caffeine-calculator').then(module => ({ 
      default: module.CaffeineCalculator 
    }))
  ),
  SafetyValidator: lazy(() => 
    import('@/components/safety/safety-validator').then(module => ({ 
      default: module.SafetyValidator 
    }))
  ),
  FlavorSelector: lazy(() => 
    import('@/components/recipes/flavor-selector').then(module => ({ 
      default: module.FlavorSelector 
    }))
  ),

  // Feedback components
  EnhancedFeedbackWidget: lazy(() => 
    import('@/components/feedback/enhanced-feedback-widget').then(module => ({ 
      default: module.EnhancedFeedbackWidget 
    }))
  ),
  FeedbackWidget: lazy(() => 
    import('@/components/feedback/feedback-widget').then(module => ({ 
      default: module.FeedbackWidget 
    }))
  ),

  // A/B Testing components
  EnhancedABTestDemo: lazy(() => 
    import('@/components/ab-testing/enhanced-ab-test-demo').then(module => ({ 
      default: module.EnhancedABTestDemo 
    }))
  ),

  // Analytics components
  PrivacyAwareAnalytics: lazy(() => 
    import('@/components/analytics/privacy-aware-analytics').then(module => ({ 
      default: module.PrivacyAwareAnalytics 
    }))
  ),
  WebVitalsTracker: lazy(() => 
    import('@/components/performance/web-vitals-tracker').then(module => ({ 
      default: module.WebVitalsTracker 
    }))
  ),

  // Layout components
  Header: lazy(() => 
    import('@/components/layout/header').then(module => ({ 
      default: module.Header 
    }))
  ),
  Footer: lazy(() => 
    import('@/components/layout/footer').then(module => ({ 
      default: module.Footer 
    }))
  ),
} as const

// Route lazy loading configurations
export const routeLazyImports = {
  // Page components
  FlavorsPage: lazy(() => 
    import('@/app/flavors/page').then(module => ({ 
      default: module.default 
    }))
  ),
  RecipesPage: lazy(() => 
    import('@/app/recipes/page').then(module => ({ 
      default: module.default 
    }))
  ),
  GuidePage: lazy(() => 
    import('@/app/guide/page').then(module => ({ 
      default: module.default 
    }))
  ),
  SafetyPage: lazy(() => 
    import('@/app/safety/page').then(module => ({ 
      default: module.default 
    }))
  ),
  MonitoringPage: lazy(() => 
    import('@/app/monitoring/page').then(module => ({ 
      default: module.default 
    }))
  ),
  PhasesPage: lazy(() => 
    import('@/app/phases/page').then(module => ({ 
      default: module.default 
    }))
  ),
} as const

// Type definitions for lazy components
export type ComponentLazyKey = keyof typeof componentLazyImports
export type RouteLazyKey = keyof typeof routeLazyImports

// Utility functions for creating lazy-loaded components
export function createLazyComponent<T extends Record<string, any>>(
  importFn: LazyExoticComponent<() => JSX.Element>,
  fallback: React.ReactNode,
  errorElement?: React.ReactNode
) {
  return function LazyComponent(props: T) {
    const Component = importFn
    return (
      <React.Suspense fallback={fallback}>
        <Component {...props} />
      </React.Suspense>
    )
  }
}

// Performance monitoring utilities
export function trackLazyLoad(componentName: string, loadTime: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'lazy_load_performance', {
      component_name: componentName,
      load_time: loadTime,
      custom_parameter: 'performance_tracking'
    })
  }
}

export function measureLoadTime<T extends string>(name: T): T {
  const start = performance.now()
  const end = performance.now()
  const loadTime = end - start
  
  // Log performance metrics for monitoring
  console.log(`Lazy load performance - ${name}: ${loadTime.toFixed(2)}ms`)
  
  // Track in analytics if available
  trackLazyLoad(name, loadTime)
  
  return name
}

// Preloading utilities for critical components
export function preloadCriticalComponent<T extends Record<string, any>>(
  importFn: LazyExoticComponent<() => JSX.Element>
): Promise<void> {
  return importFn.preload()
}

export function preloadRoute(routeName: RouteLazyKey) {
  const importFn = routeLazyImports[routeName]
  if (importFn?.preload) {
    return importFn.preload()
  }
  return Promise.resolve()
}

// Component priority levels for loading strategy
export const COMPONENT_PRIORITIES = {
  CRITICAL: 'critical',     // Above-the-fold, essential for page load
  HIGH: 'high',            // Important but not immediately visible
  MEDIUM: 'medium',        // Normal priority components
  LOW: 'low',              // Below-the-fold, can load later
  BACKGROUND: 'background' // Non-critical, lowest priority
} as const

export type ComponentPriority = typeof COMPONENT_PRIORITIES[keyof typeof COMPONENT_PRIORITIES]

// Component priority mapping
export const componentPriorityMap: Record<ComponentLazyKey, ComponentPriority> = {
  // Critical - Above-the-fold components
  Header: COMPONENT_PRIORITIES.CRITICAL,
  Footer: COMPONENT_PRIORITIES.CRITICAL,

  // High priority - Important functionality
  CaffeineCalculator: COMPONENT_PRIORITIES.HIGH,
  SafetyValidator: COMPONENT_PRIORITIES.HIGH,
  FlavorSelector: COMPONENT_PRIORITIES.HIGH,

  // Medium priority - Standard components
  PrivacyAwareAnalytics: COMPONENT_PRIORITIES.MEDIUM,
  WebVitalsTracker: COMPONENT_PRIORITIES.MEDIUM,

  // Low priority - Enhancement components
  EnhancedFeedbackWidget: COMPONENT_PRIORITIES.LOW,
  FeedbackWidget: COMPONENT_PRIORITIES.LOW,
  EnhancedABTestDemo: COMPONENT_PRIORITIES.LOW,
} as const

// Route priority mapping
export const routePriorityMap: Record<RouteLazyKey, ComponentPriority> = {
  // Critical routes - Main navigation targets
  FlavorsPage: COMPONENT_PRIORITIES.HIGH,
  GuidePage: COMPONENT_PRIORITIES.HIGH,

  // Medium priority - Secondary routes
  RecipesPage: COMPONENT_PRIORITIES.MEDIUM,
  SafetyPage: COMPONENT_PRIORITIES.MEDIUM,

  // Low priority - Admin/utility routes
  MonitoringPage: COMPONENT_PRIORITIES.LOW,
  PhasesPage: COMPONENT_PRIORITIES.LOW,
} as const