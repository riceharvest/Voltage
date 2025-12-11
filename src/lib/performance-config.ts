/**
 * Performance optimization configuration for lazy loading
 * This file centralizes performance-related settings and monitoring
 */

export interface PerformanceConfig {
  // Lazy loading thresholds
  LAZY_LOAD_THRESHOLD: number
  PRELOAD_THRESHOLD: number
  RENDER_BLOCKING_THRESHOLD: number
  
  // Component loading priorities
  CRITICAL_COMPONENTS: string[]
  HIGH_PRIORITY_COMPONENTS: string[]
  MEDIUM_PRIORITY_COMPONENTS: string[]
  LOW_PRIORITY_COMPONENTS: string[]
  
  // Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: boolean
  PERFORMANCE_LOGGING: boolean
  BUNDLE_ANALYTICS: boolean
  
  // Cache settings
  COMPONENT_CACHE_SIZE: number
  ROUTE_CACHE_SIZE: number
  CACHE_TTL: number
  
  // Network optimization
  PREFETCH_LINKS: boolean
  PREFETCH_DISTANCE: number
  CONNECTION_AWARE_LOADING: boolean
}

export const performanceConfig: PerformanceConfig = {
  // Load components when they are 300px away from viewport
  LAZY_LOAD_THRESHOLD: 300,
  
  // Preload components when they are 1000px away from viewport
  PRELOAD_THRESHOLD: 1000,
  
  // Components that block rendering should load in under 2 seconds
  RENDER_BLOCKING_THRESHOLD: 2000,
  
  // Critical components that should load immediately
  CRITICAL_COMPONENTS: [
    'Header',
    'Footer',
    'MainNavigation',
    'CriticalCSS'
  ],
  
  // High priority components for core functionality
  HIGH_PRIORITY_COMPONENTS: [
    'CaffeineCalculator',
    'SafetyValidator',
    'FlavorSelector',
    'FlavorsPage',
    'GuidePage'
  ],
  
  // Medium priority components for enhanced experience
  MEDIUM_PRIORITY_COMPONENTS: [
    'PrivacyAwareAnalytics',
    'WebVitalsTracker',
    'RecipesPage',
    'SafetyPage'
  ],
  
  // Low priority components that can load later
  LOW_PRIORITY_COMPONENTS: [
    'EnhancedFeedbackWidget',
    'FeedbackWidget',
    'EnhancedABTestDemo',
    'MonitoringPage',
    'PhasesPage'
  ],
  
  // Enable performance monitoring in production
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'production',
  
  // Log performance metrics during development
  PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  
  // Enable bundle analytics for optimization insights
  BUNDLE_ANALYTICS: process.env.NODE_ENV === 'production',
  
  // Cache up to 50 components in memory
  COMPONENT_CACHE_SIZE: 50,
  
  // Cache up to 20 routes in memory
  ROUTE_CACHE_SIZE: 20,
  
  // Cache entries expire after 5 minutes
  CACHE_TTL: 5 * 60 * 1000,
  
  // Enable prefetching of next likely routes
  PREFETCH_LINKS: true,
  
  // Prefetch when user is 800px away from link
  PREFETCH_DISTANCE: 800,
  
  // Adjust loading strategy based on connection speed
  CONNECTION_AWARE_LOADING: true,
}

// Network-aware loading configuration
export const getNetworkConfig = () => {
  if (typeof navigator === 'undefined') return null
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return null
  
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  }
}

// Performance optimization strategies
export const getOptimizationStrategy = () => {
  const network = getNetworkConfig()
  
  if (!network) return 'balanced'
  
  if (network.saveData) return 'minimal'
  if (network.effectiveType === '2g') return 'minimal'
  if (network.effectiveType === '3g') return 'balanced'
  return 'aggressive'
}

// Component loading strategies based on context
export const getLoadingStrategy = (componentName: string) => {
  const strategy = getOptimizationStrategy()
  const network = getNetworkConfig()
  
  // Critical components always load immediately
  if (performanceConfig.CRITICAL_COMPONENTS.includes(componentName)) {
    return { priority: 'high', preload: true, eager: true }
  }
  
  // Adjust strategy based on network conditions
  switch (strategy) {
    case 'minimal':
      return {
        priority: 'low',
        preload: false,
        eager: false,
        threshold: performanceConfig.LAZY_LOAD_THRESHOLD * 2
      }
    
    case 'balanced':
      return {
        priority: 'medium',
        preload: false,
        eager: false,
        threshold: performanceConfig.LAZY_LOAD_THRESHOLD
      }
    
    case 'aggressive':
      return {
        priority: 'high',
        preload: true,
        eager: false,
        threshold: performanceConfig.PRELOAD_THRESHOLD
      }
    
    default:
      return {
        priority: 'medium',
        preload: false,
        eager: false,
        threshold: performanceConfig.LAZY_LOAD_THRESHOLD
      }
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component load time
  measureComponentLoad: (componentName: string) => {
    if (!performanceConfig.ENABLE_PERFORMANCE_MONITORING) return null
    
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const duration = end - start
      
      if (performanceConfig.PERFORMANCE_LOGGING) {
        console.log(`Component loaded: ${componentName} in ${duration.toFixed(2)}ms`)
      }
      
      // Send to analytics if configured
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'component_load_time', {
          component_name: componentName,
          load_time: duration,
          custom_parameter: 'performance_monitoring'
        })
      }
      
      return duration
    }
  },
  
  // Monitor bundle size impact
  measureBundleImpact: (componentName: string, bundleSize: number) => {
    if (!performanceConfig.BUNDLE_ANALYTICS) return
    
    console.log(`Bundle impact - ${componentName}: ${(bundleSize / 1024).toFixed(2)}KB`)
    
    // Alert for large bundles
    if (bundleSize > 100 * 1024) { // 100KB
      console.warn(`Large bundle detected: ${componentName} (${(bundleSize / 1024).toFixed(2)}KB)`)
    }
  },
  
  // Track user experience metrics
  trackUXMetrics: () => {
    if (typeof window === 'undefined') return
    
    // Track First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log(`FCP: ${entry.startTime.toFixed(2)}ms`)
          
          if (window.gtag) {
            window.gtag('event', 'performance_metrics', {
              metric_name: 'first_contentful_paint',
              value: entry.startTime,
              custom_parameter: 'ux_tracking'
            })
          }
        }
      }
    }).observe({ entryTypes: ['paint'] })
    
    // Track Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`)
        
        if (window.gtag) {
          window.gtag('event', 'performance_metrics', {
            metric_name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            custom_parameter: 'ux_tracking'
          })
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // Track Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let cumulativeScore = 0
      for (const entry of list.getEntries()) {
        cumulativeScore += entry.value
      }
      
      console.log(`CLS: ${cumulativeScore.toFixed(3)}`)
      
      if (window.gtag) {
        window.gtag('event', 'performance_metrics', {
          metric_name: 'cumulative_layout_shift',
          value: cumulativeScore,
          custom_parameter: 'ux_tracking'
        })
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (performanceConfig.ENABLE_PERFORMANCE_MONITORING) {
    performanceMonitor.trackUXMetrics()
  }
}

// Export default configuration
export default performanceConfig