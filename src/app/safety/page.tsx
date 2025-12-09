"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle, XCircle, Shield, Scale, Users } from 'lucide-react'
import { SafetyValidator } from '@/components/safety/safety-validator'
import { Ingredient } from '@/lib/types'
import { limits, ingredients, addIngredient, removeIngredient } from '@/lib/safety-data-service'
import { calculateComplianceScore } from '@/lib/safety-validation-service'

export default function SafetyPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [caffeineAmount, setCaffeineAmount] = useState<number>(0)
  const [ageInput, setAgeInput] = useState<string>('')
  const [isValid, setIsValid] = useState(true)
  const [complianceScore, setComplianceScore] = useState(100)

  // Calculate compliance score based on current inputs
  useEffect(() => {
    const age = parseInt(ageInput) || 0
    const score = calculateComplianceScore(age, caffeineAmount, selectedIngredients)
    setComplianceScore(score)
  }, [caffeineAmount, selectedIngredients, ageInput])

  const handleAddIngredient = (ingredientId: string) => {
    setSelectedIngredients(addIngredient(selectedIngredients, ingredientId))
  }

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(removeIngredient(selectedIngredients, ingredientId))
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplianceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Safety & Compliance Center
        </h1>
        <p className="text-muted-foreground">
          Ensure your energy drink formulations meet EU safety standards and regulatory requirements.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Safety Information */}
        <div className="space-y-6">
          {/* EU Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                EU Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance Score</span>
                <div className="flex items-center gap-2">
                  {getComplianceIcon(complianceScore)}
                  <span className={`font-bold ${getComplianceColor(complianceScore)}`}>
                    {complianceScore}%
                  </span>
                </div>
              </div>
              <Progress value={complianceScore} className="w-full" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Age Restriction:</span>
                  <Badge variant="outline">{limits.ageRestriction}+ years</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Max Caffeine/Serving:</span>
                  <Badge variant="outline">{limits.caffeine.maxPerServingMg}mg</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Max Daily Caffeine:</span>
                  <Badge variant="outline">{limits.caffeine.maxDailyMg}mg</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Safety Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">High Caffeine Risk</p>
                <p className="text-xs text-yellow-700">
                  Caffeine content above 40mg per serving may cause adverse effects.
                </p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Banned Ingredients</p>
                <p className="text-xs text-red-700">
                  {limits.bannedIngredients.join(', ')} are prohibited in EU energy drinks.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Age Restriction</p>
                <p className="text-xs text-blue-700">
                  Not recommended for individuals under {limits.ageRestriction} years of age.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* EU Regulations */}
          <Card>
            <CardHeader>
              <CardTitle>EU Regulatory Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Directive 2002/46/EC</h4>
                <p className="text-muted-foreground">
                  Food supplements regulation requiring safety assessment and labeling.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Regulation (EU) No 1169/2011</h4>
                <p className="text-muted-foreground">
                  Food information to consumers - mandatory allergen and nutritional labeling.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">EFSA Guidelines</h4>
                <p className="text-muted-foreground">
                  European Food Safety Authority recommendations for caffeine intake.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Interactive Validation */}
        <div className="space-y-6">
          {/* Age Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Age Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="age">Consumer Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  placeholder="Enter age in years"
                />
                {ageInput && parseInt(ageInput) < limits.ageRestriction && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Below minimum age requirement
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Caffeine Dosage Validator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Caffeine Dosage Validator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caffeine">Caffeine per Serving (mg)</Label>
                <Input
                  id="caffeine"
                  type="number"
                  value={caffeineAmount || ''}
                  onChange={(e) => setCaffeineAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 80"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className={caffeineAmount > limits.caffeine.maxPerServingMg ? 'text-red-600 font-semibold' : ''}>
                    {caffeineAmount}mg
                  </span>
                </div>
                <Progress
                  value={(caffeineAmount / limits.caffeine.maxPerServingMg) * 100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0mg</span>
                  <span>{limits.caffeine.maxPerServingMg}mg max</span>
                </div>
              </div>

              {caffeineAmount > limits.caffeine.maxPerServingMg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Exceeds EU Limit</p>
                  <p className="text-xs text-red-700">
                    Maximum allowed is {limits.caffeine.maxPerServingMg}mg per serving
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredient Validator */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Safety Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add Ingredient to Check</Label>
                <Select onValueChange={handleAddIngredient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        <div className="flex items-center gap-2">
                          <span>{ingredient.name}</span>
                          {ingredient.safety.banned && (
                            <Badge variant="destructive" className="text-xs">Banned</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedIngredients.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Ingredients</Label>
                  <div className="space-y-1">
                    {selectedIngredients.map((id) => {
                      const ingredient = ingredients.find(i => i.id === id)
                      return ingredient ? (
                        <div key={id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{ingredient.name}</span>
                            {ingredient.safety.banned && (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIngredient(id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Validation Results */}
        <div className="space-y-6">
          {/* Real-time Safety Validation */}
          <SafetyValidator
            caffeineMg={caffeineAmount}
            ingredients={selectedIngredients}
            onValidationChange={setIsValid}
          />

          {/* Compliance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedIngredients.filter(id => {
                      const ing = ingredients.find(i => i.id === id)
                      return ing?.safety.euCompliant
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">EU Compliant</div>
                </div>

                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedIngredients.filter(id => {
                      const ing = ingredients.find(i => i.id === id)
                      return !ing?.safety.euCompliant || ing?.safety.banned
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Non-Compliant</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Key Requirements Met:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {caffeineAmount <= limits.caffeine.maxPerServingMg ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Caffeine ≤ {limits.caffeine.maxPerServingMg}mg/serving</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!selectedIngredients.some(id => limits.bannedIngredients.includes(id)) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>No banned ingredients</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ageInput && parseInt(ageInput) >= limits.ageRestriction ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Age ≥ {limits.ageRestriction} years</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                disabled={!isValid}
                variant={isValid ? "default" : "secondary"}
              >
                {isValid ? "Export Compliance Report" : "Fix Issues to Export"}
              </Button>

              <Button variant="outline" className="w-full">
                View Full EU Guidelines
              </Button>

              <Button variant="outline" className="w-full">
                Contact Regulatory Expert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}