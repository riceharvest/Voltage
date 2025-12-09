"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SafetyValidator } from '@/components/safety/safety-validator'
import { CompleteRecipe, DilutionRatio, Ingredient } from '@/lib/types'

// Import data
import { bases, flavors } from '@/data/index'
import ingredientsData from '@/data/ingredients/ingredients.json'


// Helper function to get ingredient details by ID
const getIngredientById = (id: string): Ingredient | undefined => {
  return (ingredientsData as unknown as Ingredient[]).find(ingredient => ingredient.id === id)
}

export default function RecipesPage() {
  const [selectedBase, setSelectedBase] = useState<string>('')
  const [selectedFlavor, setSelectedFlavor] = useState<string>('')
  const [desiredCaffeine, setDesiredCaffeine] = useState<string>('')
  const [dilutionRatio, setDilutionRatio] = useState<DilutionRatio>({ syrup: 1, water: 4, total: 5 })
  const [isValid, setIsValid] = useState(true)

  const base = bases.find(b => b.id === selectedBase)
  const flavor = flavors.find(f => f.id === selectedFlavor)

  // Get caffeine concentration from base data
  const caffeineConcentration = base?.ingredients.find(ing => ing.ingredientId === 'caffeine-anhydrous')?.amount || 0

  // Calculate syrup amount based on desired caffeine
  const calculateSyrupAmount = (caffeineMg: number): number => {
    if (!base || caffeineConcentration === 0) return 0
    return caffeineMg / caffeineConcentration
  }

  // Calculate caffeine content per serving
  const calculateCaffeineContent = (syrupAmount: number): number => {
    if (!base) return 0
    return syrupAmount * caffeineConcentration
  }

  const syrupAmount = desiredCaffeine ? calculateSyrupAmount(parseFloat(desiredCaffeine) || 0) : 0
  const caffeineContent = calculateCaffeineContent(syrupAmount)

  // Generate complete recipe
  const generateRecipe = (): CompleteRecipe | null => {
    if (!base || !flavor) return null

    return {
      base,
      flavor,
      dilution: dilutionRatio,
      caffeineContent
    }
  }

  const recipe = generateRecipe()

  const compatibleFlavors = flavors.filter(f =>
    f.compatibleBases.includes(selectedBase)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recipe Builder</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Selections and Calculations */}
        <div className="space-y-6">
          {/* Base Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Base Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBase} onValueChange={setSelectedBase}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a base" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{base.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {base.type === 'classic' ? 'Sugar-based' : 'Zero-calorie'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {base && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Base Details</h4>
                  <p className="text-sm">{base.nameNl}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">{base.type}</Badge>
                    <Badge variant="outline">
                      {base.yield.syrup}ml syrup → {base.yield.drink}ml drink
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flavor Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Flavor Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedFlavor}
                onValueChange={setSelectedFlavor}
                disabled={!selectedBase}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a flavor" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleFlavors.map((flavor) => (
                    <SelectItem key={flavor.id} value={flavor.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{flavor.name}</span>
                        <span className="text-sm text-muted-foreground">{flavor.profile}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {flavor && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Flavor Details</h4>
                  <p className="text-sm">{flavor.profileNl}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">
                      Aging: {flavor.aging.recommended}h {flavor.aging.optional ? '(optional)' : '(required)'}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-semibold mb-2">Flavor Ingredients (for 1L base syrup):</h5>
                    <div className="space-y-1">
                      {flavor.ingredients.map((ingredient) => {
                        const ingredientDetails = getIngredientById(ingredient.ingredientId)
                        return (
                          <div key={ingredient.ingredientId} className="flex justify-between text-sm">
                            <span>{ingredientDetails?.name || ingredient.ingredientId}</span>
                            <span className="font-mono">
                              {ingredient.amount} {ingredientDetails?.unit || 'units'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caffeine Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Caffeine Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caffeine">Desired Caffeine (mg per serving)</Label>
                <Input
                  id="caffeine"
                  type="number"
                  value={desiredCaffeine}
                  onChange={(e) => setDesiredCaffeine(e.target.value)}
                  placeholder="e.g., 80"
                />
              </div>

              {syrupAmount > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">Required Syrup: {syrupAmount.toFixed(1)} ml</p>
                  <p className="text-sm text-muted-foreground">
                    For a standard 330ml can, add {((syrupAmount / 330) * 100).toFixed(1)}% syrup
                  </p>
                  <div className="mt-2">
                    <Label>Dilution Ratio (Syrup:Water)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={dilutionRatio.syrup}
                        onChange={(e) => setDilutionRatio(prev => ({
                          ...prev,
                          syrup: parseInt(e.target.value) || 1,
                          total: (parseInt(e.target.value) || 1) + prev.water
                        }))}
                        className="w-20"
                      />
                      <span className="self-center">:</span>
                      <Input
                        type="number"
                        value={dilutionRatio.water}
                        onChange={(e) => setDilutionRatio(prev => ({
                          ...prev,
                          water: parseInt(e.target.value) || 4,
                          total: prev.syrup + (parseInt(e.target.value) || 4)
                        }))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results and Validation */}
        <div className="space-y-6">
          {/* Safety Validation */}
          <SafetyValidator
            caffeineMg={caffeineContent}
            ingredients={selectedFlavor ? flavors.find(f => f.id === selectedFlavor)?.ingredients.map(ing => ing.ingredientId) || [] : []}
            onValidationChange={setIsValid}
          />

          {/* Recipe Summary */}
          {recipe && (
            <Card>
              <CardHeader>
                <CardTitle>Recipe Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Base: {recipe.base.name}</h4>
                    <p className="text-sm text-muted-foreground">{recipe.base.nameNl}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Flavor: {recipe.flavor.name}</h4>
                    <p className="text-sm text-muted-foreground">{recipe.flavor.profileNl}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Caffeine Content</Label>
                      <p className="text-2xl font-bold">{recipe.caffeineContent.toFixed(0)}mg</p>
                    </div>
                    <div>
                      <Label>Dilution Ratio</Label>
                      <p className="text-lg">{recipe.dilution.syrup}:{recipe.dilution.water}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Serving Size</Label>
                    <p className="text-lg">
                      {recipe.dilution.syrup === 0 ? 'N/A' : ((syrupAmount * recipe.dilution.total) / recipe.dilution.syrup).toFixed(0)}ml total
                    </p>
                  </div>

                  {isValid && (
                    <Button className="w-full" size="lg">
                      Generate Full Recipe
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}