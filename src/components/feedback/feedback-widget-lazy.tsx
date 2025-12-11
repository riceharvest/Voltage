import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy feedback widget components
const EnhancedFeedbackWidget = lazy(() => 
  import('./enhanced-feedback-widget').then(module => ({ default: module.EnhancedFeedbackWidget }))
)

const FeedbackWidget = lazy(() => 
  import('./feedback-widget').then(module => ({ default: module.FeedbackWidget }))
)

interface LoadingSkeletonProps {
  isEnhanced?: boolean
}

function LoadingSkeleton({ isEnhanced = false }: LoadingSkeletonProps) {
  return (
    <div className={`${isEnhanced ? 'fixed bottom-4 right-4 z-50' : ''}`}>
      <div className={`${isEnhanced ? 'w-80 h-96' : 'w-64 h-48'} bg-white rounded-lg shadow-lg border p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

interface FeedbackWidgetLazyProps {
  isEnhanced?: boolean
  className?: string
}

export function FeedbackWidgetLazy({ isEnhanced = false, className }: FeedbackWidgetLazyProps) {
  const ComponentToLoad = isEnhanced ? EnhancedFeedbackWidget : FeedbackWidget
  
  return (
    <Suspense 
      fallback={<LoadingSkeleton isEnhanced={isEnhanced} />}
      errorElement={
        <div className={`${isEnhanced ? 'text-red-500' : ''} ${className || ''}`}>
          {isEnhanced ? 'Enhanced feedback widget failed to load' : 'Feedback widget failed to load'}
        </div>
      }
    >
      <ComponentToLoad className={className} />
    </Suspense>
  )
}