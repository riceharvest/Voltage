import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy safety validator component
const SafetyValidator = lazy(() => 
  import('../safety/safety-validator').then(module => ({ default: module.SafetyValidator }))
)

interface LoadingSkeletonProps {
  caffeineMg: number
  ingredients: string[]
}

function LoadingSkeleton({ caffeineMg, ingredients }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="p-6 border rounded-xl space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface SafetyValidatorLazyProps {
  caffeineMg: number
  ingredients: string[]
  onValidationChange: (isValid: boolean) => void
}

export function SafetyValidatorLazy({ caffeineMg, ingredients, onValidationChange }: SafetyValidatorLazyProps) {
  return (
    <Suspense 
      fallback={<LoadingSkeleton caffeineMg={caffeineMg} ingredients={ingredients} />}
      errorElement={<div className="text-red-500">Failed to load safety validator</div>}
    >
      <SafetyValidator caffeineMg={caffeineMg} ingredients={ingredients} onValidationChange={onValidationChange} />
    </Suspense>
  )
}