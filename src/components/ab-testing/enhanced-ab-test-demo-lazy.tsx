import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy A/B testing component
const EnhancedABTestDemo = lazy(() => 
  import('./enhanced-ab-test-demo').then(module => ({ default: module.EnhancedABTestDemo }))
)

interface LoadingSkeletonProps {
  testId?: string
}

function LoadingSkeleton({ testId }: LoadingSkeletonProps) {
  return (
    <div className="p-6 border rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

interface EnhancedABTestDemoLazyProps {
  testId?: string
}

export function EnhancedABTestDemoLazy({ testId }: EnhancedABTestDemoLazyProps) {
  return (
    <Suspense 
      fallback={<LoadingSkeleton testId={testId} />}
      errorElement={<div className="text-red-500">Failed to load A/B test demo</div>}
    >
      <EnhancedABTestDemo testId={testId} />
    </Suspense>
  )
}