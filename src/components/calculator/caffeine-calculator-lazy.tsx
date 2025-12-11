import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy calculator component
const CaffeineCalculator = lazy(() => 
  import('./caffeine-calculator').then(module => ({ default: module.CaffeineCalculator }))
)

interface LoadingSkeletonProps {
  baseId: string
}

function LoadingSkeleton({ baseId }: LoadingSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="p-4 bg-muted rounded-lg">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-3 w-56" />
      </CardContent>
    </Card>
  )
}

interface CaffeineCalculatorLazyProps {
  onCaffeineChange: (mg: number) => void
  baseId: string
}

export function CaffeineCalculatorLazy({ onCaffeineChange, baseId }: CaffeineCalculatorLazyProps) {
  return (
    <Suspense 
      fallback={<LoadingSkeleton baseId={baseId} />}
      errorElement={<div className="text-red-500">Failed to load calculator</div>}
    >
      <CaffeineCalculator onCaffeineChange={onCaffeineChange} baseId={baseId} />
    </Suspense>
  )
}