"use client"

import { useState, useMemo, useEffect } from 'react'
import { CaffeineCalculator } from '@/components/calculator/caffeine-calculator'
import { SafetyValidator } from '@/components/safety/safety-validator'
import { FlavorSelector } from '@/components/recipes/flavor-selector'
import { loadAllFlavors } from '@/data/index'
import { trackCalculatorUsage, trackFlavorSelection, trackRecipeGeneration, trackSafetyWarning } from '@/lib/analytics';
import { Calculator, ShieldCheck } from 'lucide-react'
import { FlavorRecipe } from '@/lib/types'

export default function CalculatorPage() {
  const [caffeineMg, setCaffeineMg] = useState(0)
  const [selectedBase] = useState('classic')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [allFlavors, setAllFlavors] = useState<FlavorRecipe[]>([])

  // Track page view
  useEffect(() => {
    trackCalculatorUsage('page_view');
  // Track flavor selection
  useEffect(() => {
    if (selectedFlavor) {
      const flavor = allFlavors.find(f => f.id === selectedFlavor);
      if (flavor) {
        trackFlavorSelection(selectedFlavor, flavor.name);
      }
    }
  }, [selectedFlavor, allFlavors]);

  // Track recipe generation when valid
  useEffect(() => {
    if (isValid && caffeineMg > 0 && selectedFlavor) {
      const flavor = allFlavors.find(f => f.id === selectedFlavor);
      if (flavor) {
        trackRecipeGeneration({
          base: selectedBase,
          flavors: [flavor.name],
          caffeine: caffeineMg,
          volume: 500 // Default volume
        });
      }
    }
  }, [isValid, caffeineMg, selectedFlavor, selectedBase, allFlavors]);
  }, []);
  // Load flavors on component mount
  useEffect(() => {
    loadAllFlavors().then(setAllFlavors)
  }, [])

  // Memoize ingredients to prevent infinite loops/excessive re-checks in SafetyValidator
  const ingredients = useMemo(() => {
    if (!selectedFlavor || allFlavors.length === 0) return []
    const flavor = allFlavors.find(f => f.id === selectedFlavor)
    return flavor ? flavor.ingredients.map(ing => ing.ingredientId) : []
  }, [selectedFlavor, allFlavors])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
       <div className="mb-12 text-center">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-pulse-slow">
          Recipe Calculator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Design your custom energy blend with precision safety checks.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4 text-primary">
               <Calculator className="w-6 h-6" />
               <h2 className="text-2xl font-bold uppercase">1. Calculator</h2>
            </div>
            <CaffeineCalculator onCaffeineChange={setCaffeineMg} baseId={selectedBase} />
          </section>

          <section>
             <div className="flex items-center gap-3 mb-4 text-cyan-400">
               <ShieldCheck className="w-6 h-6" />
               <h2 className="text-2xl font-bold uppercase">2. Flavor Profile</h2>
            </div>
            <FlavorSelector
              onFlavorSelect={setSelectedFlavor}
              selectedBase={selectedBase}
            />
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4 text-fuchsia-500">
               <ShieldCheck className="w-6 h-6" />
               <h2 className="text-2xl font-bold uppercase">3. Safety Validation</h2>
            </div>
            <SafetyValidator
              caffeineMg={caffeineMg}
              ingredients={ingredients}
              onValidationChange={setIsValid}
            />
          </section>

          {isValid && caffeineMg > 0 && (
            <div className="p-6 bg-primary/10 border border-primary/50 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.2)] animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-black text-primary mb-2 uppercase tracking-wide">
                System Check: Ready
              </h3>
              <p className="text-white/80">
                Your parameters are within EU safety limits. Proceed to synthesis phase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
