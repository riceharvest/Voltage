"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle } from 'lucide-react'

const phases = [
  {
    id: 'base',
    title: 'Phase 1: Master Base',
    description: 'Prepare the caffeinated base syrup',
    steps: [
      'Dissolve preservatives in warm water',
      'Heat water to 60°C',
      'Add caffeine, taurine, acids, and citrate',
      'Stir until clear',
      'Add preservatives',
      'Dissolve sugar/erythritol',
      'Combine and cool to <30°C'
    ]
  },
  {
    id: 'flavor',
    title: 'Phase 2: Flavor Library',
    description: 'Add your chosen flavor profile',
    steps: [
      'Select flavor recipe',
      'Measure flavor ingredients',
      'Add to cooled base',
      'Mix thoroughly',
      'Let flavors meld (24h recommended)'
    ]
  },
  {
    id: 'serve',
    title: 'Phase 3: Serving & Quick Mix',
    description: 'Carbonate and serve your drink',
    steps: [
      'Pour syrup into glass',
      'Add sparkling water (1:4 ratio)',
      'Stir gently',
      'Add ice',
      'Enjoy safely!'
    ]
  }
]

export function PhaseStepper() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const toggleStep = (phaseId: string, stepIndex: number) => {
    const stepKey = `${phaseId}-${stepIndex}`
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepKey)) {
      newCompleted.delete(stepKey)
    } else {
      newCompleted.add(stepKey)
    }
    setCompletedSteps(newCompleted)
  }

  const progress = (completedSteps.size / phases.reduce((acc, phase) => acc + phase.steps.length, 0)) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phase-by-Phase Workflow</CardTitle>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-muted-foreground">
          {completedSteps.size} of {phases.reduce((acc, phase) => acc + phase.steps.length, 0)} steps completed
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{phase.title}</h3>
                <Button
                  variant={currentPhase === phaseIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPhase(phaseIndex)}
                >
                  {currentPhase === phaseIndex ? 'Active' : 'View'}
                </Button>
              </div>

              <p className="text-muted-foreground mb-4">{phase.description}</p>

              {currentPhase === phaseIndex && (
                <div className="space-y-2">
                  {phase.steps.map((step, stepIndex) => {
                    const stepKey = `${phase.id}-${stepIndex}`
                    const isCompleted = completedSteps.has(stepKey)

                    return (
                      <div
                        key={stepIndex}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleStep(phase.id, stepIndex)}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}