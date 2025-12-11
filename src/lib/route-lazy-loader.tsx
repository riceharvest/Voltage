import { lazy } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Route-level lazy loading for heavy pages
export const FlavorsPageLazy = lazy(() => 
  import('@/app/flavors/page').then(module => ({ default: module.default }))
)

export const RecipesPageLazy = lazy(() => 
  import('@/app/recipes/page').then(module => ({ default: module.default }))
)

export const GuidePageLazy = lazy(() => 
  import('@/app/guide/page').then(module => ({ default: module.default }))
)

export const SafetyPageLazy = lazy(() => 
  import('@/app/safety/page').then(module => ({ default: module.default }))
)

export const MonitoringPageLazy = lazy(() => 
  import('@/app/monitoring/page').then(module => ({ default: module.default }))
)

export const PhasesPageLazy = lazy(() => 
  import('@/app/phases/page').then(module => ({ default: module.default }))
)

// Loading skeletons for different page types
export function PageLoadingSkeleton({ type = 'default' }: { type?: 'flavors' | 'recipes' | 'guide' | 'safety' | 'monitoring' | 'phases' | 'default' }) {
  switch (type) {
    case 'flavors':
      return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-64" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-24" />
                  ))}
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'recipes':
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'guide':
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'safety':
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'monitoring':
      return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'phases':
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      )
    
    default:
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      )
  }
}