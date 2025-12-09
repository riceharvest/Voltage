"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import { WarningModal } from './warning-modal'
import limits from '@/data/safety/limits.json'

interface SafetyValidatorProps {
  caffeineMg: number
  ingredients: string[]
  onValidationChange: (isValid: boolean) => void
}

export function SafetyValidator({ caffeineMg, ingredients, onValidationChange }: SafetyValidatorProps) {
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [currentWarning, setCurrentWarning] = useState('')

  useEffect(() => {
    const newWarnings: string[] = []
    const newErrors: string[] = []

    // Check caffeine limits
    if (caffeineMg > limits.caffeine?.maxPerServingMg) {
      newErrors.push(`Caffeine exceeds safe serving limit (${limits.caffeine?.maxPerServingMg}mg)`)
    } else if (caffeineMg > limits.caffeine?.warningThresholdMg) {
      newWarnings.push('High caffeine content - monitor consumption')
    }

    // Check for banned ingredients
    const bannedIngredients = limits?.bannedIngredients ? ingredients.filter(id => limits.bannedIngredients.includes(id)) : []
    if (bannedIngredients.length > 0) {
      newErrors.push('Contains banned ingredients')
    }

    setWarnings(newWarnings)
    setErrors(newErrors)
    onValidationChange(newErrors.length === 0)
  }, [caffeineMg, ingredients, onValidationChange])

  const getStatusIcon = () => {
    if (errors.length > 0) return <XCircle className="h-5 w-5 text-red-500" />
    if (warnings.length > 0) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getStatusText = () => {
    if (errors.length > 0) return 'Safety Issues Detected'
    if (warnings.length > 0) return 'Warnings Present'
    return 'Safe Configuration'
  }

  const showWarning = (warning: string) => {
    setCurrentWarning(warning)
    setModalOpen(true)
  }

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Safety Validation
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time safety checks ensure your recipe meets health and regulatory standards.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {getStatusText()}
            </p>

            {errors.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-red-600">Critical Issues:</h4>
                {errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-600">Warnings:</h4>
                {warnings.map((warning, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-yellow-600 hover:text-yellow-700"
                    onClick={() => showWarning(warning)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {warning}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <WarningModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Safety Warning"
          message={currentWarning}
          severity="warning"
        />
      </>
    </TooltipProvider>
  )
}