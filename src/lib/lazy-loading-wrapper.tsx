import { Suspense, ComponentType, lazy } from 'react'
import { PageLoadingSkeleton } from './route-lazy-loader'

interface LazyLoadingWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorElement?: React.ReactNode
  type?: 'default' | 'flavors' | 'recipes' | 'guide' | 'safety' | 'monitoring' | 'phases'
}

export function LazyLoadingWrapper({ 
  children, 
  fallback, 
  errorElement,
  type = 'default'
}: LazyLoadingWrapperProps) {
  return (
    <Suspense 
      fallback={fallback || <PageLoadingSkeleton type={type} />}
      errorElement={errorElement || <div className="text-red-500 p-4">Component failed to load</div>}
    >
      {children}
    </Suspense>
  )
}

interface ComponentLazyWrapperProps {
  component: ComponentType<any>
  props?: Record<string, any>
  fallback?: React.ReactNode
  errorElement?: React.ReactNode
}

export function ComponentLazyWrapper({ 
  component: Component, 
  props = {}, 
  fallback,
  errorElement 
}: ComponentLazyWrapperProps) {
  return (
    <LazyLoadingWrapper fallback={fallback} errorElement={errorElement}>
      <Component {...props} />
    </LazyLoadingWrapper>
  )
}

// Specific wrapper components for common use cases
const FeedbackWidgetLazy = lazy(() => import('../components/feedback/feedback-widget-lazy').then(module => ({ default: module.FeedbackWidgetLazy })))
const EnhancedABTestDemoLazy = lazy(() => import('../components/ab-testing/enhanced-ab-test-demo-lazy').then(module => ({ default: module.EnhancedABTestDemoLazy })))

export function FeedbackWidgetWrapper({ isEnhanced = false, className }: { isEnhanced?: boolean; className?: string }) {
  return (
    <LazyLoadingWrapper>
      <Suspense fallback={null}>
        <FeedbackWidgetLazy isEnhanced={isEnhanced} className={className} />
      </Suspense>
    </LazyLoadingWrapper>
  )
}

export function ABTestDemoWrapper({ testId }: { testId?: string }) {
  return (
    <LazyLoadingWrapper>
      <Suspense fallback={null}>
        <EnhancedABTestDemoLazy testId={testId} />
      </Suspense>
    </LazyLoadingWrapper>
  )
}