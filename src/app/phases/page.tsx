import { PhaseStepper } from '@/components/workflow/phase-stepper'

export default function PhasesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Phase-by-Phase Workflow</h1>
      <p className="text-muted-foreground mb-8">
        Follow these guided steps to safely create your custom energy drink.
        Each phase includes safety checkpoints and detailed instructions.
      </p>

      <PhaseStepper />
    </div>
  )
}