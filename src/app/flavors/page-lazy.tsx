'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the original flavors page component
const FlavorsPageContent = lazy(() => 
  import('./page').then(module => ({ default: module.default }))
)

function FlavorsPageLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-12 text-center">
        <div className="h-12 w-96 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
        <div className="h-6 w-96 bg-muted rounded-lg mx-auto animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="group border-white/10 bg-zinc-900/40 overflow-hidden backdrop-blur-sm">
            {/* Header Color Strip */}
            <div className="h-2 w-full bg-muted animate-pulse" />
            
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>

              {/* Ingredients List */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Button */}
              <Skeleton className="h-10 w-full" />

              {/* Footer Metadata */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FlavorsPageLazy() {
  return (
    <Suspense fallback={<FlavorsPageLoadingSkeleton />}>
      <FlavorsPageContent />
    </Suspense>
  )
}