import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy flavor selector component
const FlavorSelector = lazy(() => 
  import('./flavor-selector').then(module => ({ default: module.FlavorSelector }))
)

interface LoadingSkeletonProps {
  selectedBase: string
}

function LoadingSkeleton({ selectedBase }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface FlavorSelectorLazyProps {
  onFlavorSelect: (flavorId: string) => void
  selectedBase: string
}

export function FlavorSelectorLazy({ onFlavorSelect, selectedBase }: FlavorSelectorLazyProps) {
  return (
    <Suspense 
      fallback={<LoadingSkeleton selectedBase={selectedBase} />}
      errorElement={<div className="text-red-500">Failed to load flavor selector</div>}
    >
      <FlavorSelector onFlavorSelect={onFlavorSelect} selectedBase={selectedBase} />
    </Suspense>
  )
}