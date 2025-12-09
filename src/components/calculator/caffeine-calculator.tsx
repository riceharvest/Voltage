import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { bases } from '@/data/index'

interface CaffeineCalculatorProps {
  onCaffeineChange: (mg: number) => void
  baseId: string
}

export function CaffeineCalculator({ onCaffeineChange, baseId }: CaffeineCalculatorProps) {
  const [desiredCaffeine, setDesiredCaffeine] = useState('')
  const [syrupAmount, setSyrupAmount] = useState<number | null>(null)

  const base = bases.find(b => b.id === baseId)
  const baseCaffeineConcentration = base && base.ingredients && Array.isArray(base.ingredients) ? (base.ingredients.find(i => i.ingredientId === 'caffeine-anhydrous')?.amount || 0) : 0

  useEffect(() => {
    // Recalculate when desired caffeine or base changes
    if (desiredCaffeine) {
      calculateSyrup()
    } else {
      setSyrupAmount(null)
      onCaffeineChange(0)
    }
  }, [desiredCaffeine, baseId])


  const calculateSyrup = () => {
    const caffeine = parseFloat(desiredCaffeine)
    if (isNaN(caffeine) || caffeine <= 0) return

    if (baseCaffeineConcentration <= 0) return

    // Calculate syrup needed based on the concentration in the base
    if (baseCaffeineConcentration <= 0) return
    // If base has 1.6g/L (1.6mg/ml) of syrup:
    // Needed Syrup (ml) = Desired Caffeine (mg) / Concentration (mg/ml)
    const syrupMl = caffeine / baseCaffeineConcentration
    setSyrupAmount(syrupMl)
    onCaffeineChange(caffeine)
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Caffeine Calculator
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Calculate the exact amount of caffeine syrup needed for your desired energy level.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="caffeine" className="flex items-center gap-2">
              Desired Caffeine (mg)
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the total caffeine content you want in your drink (recommended: 50-150mg).</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="caffeine"
              type="number"
              value={desiredCaffeine}
              onChange={(e) => setDesiredCaffeine(e.target.value)}
              placeholder="e.g., 80"
            />
          </div>

          <div className="text-sm text-gray-500">
                Based on syrup efficiency: {baseCaffeineConcentration} mg caffeine / ml syrup
          </div>

          {syrupAmount !== null && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-semibold">Required Syrup: {syrupAmount.toFixed(1)} ml</p>
              <p className="text-sm text-muted-foreground">
                For a standard 330ml can, add {((syrupAmount / 330) * 100).toFixed(1)}% syrup
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-4">
            ⚠️ Maximum safe daily caffeine: 400mg. Consult healthcare provider.
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}