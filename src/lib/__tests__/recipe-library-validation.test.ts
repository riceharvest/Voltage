import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Comprehensive Recipe Library Testing
 * Tests 100+ recipes for data integrity, calculation accuracy, and safety validation
 */

interface RecipeData {
  id: string
  name: string
  category: string
  caffeine?: {
    amount: number
    unit: string
    source: string
  }
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    category: string
    safetyLimit?: number
  }>
  instructions: string[]
  nutrition?: {
    calories: number
    sugar: number
    caffeine: number
  }
  batchSizes: Array<{
    volume: number
    unit: string
    scaling: Record<string, number>
  }>
  safety: {
    maxDaily: number
    warnings: string[]
    contraindications: string[]
  }
  culturalAdaptations?: Record<string, {
    name: string
    description: string
    localIngredients?: string[]
  }>
}

class RecipeValidator {
  private recipeFiles: string[] = []
  private recipes: RecipeData[] = []
  private validationErrors: Array<{ recipe: string; error: string; severity: 'error' | 'warning' }> = []

  constructor() {
    this.loadRecipeFiles()
  }

  private loadRecipeFiles(): void {
    const flavorsDir = path.join(__dirname, '../../data/flavors')
    
    try {
      const files = fs.readdirSync(flavorsDir)
      this.recipeFiles = files.filter(file => file.endsWith('.json'))
      console.log(`Found ${this.recipeFiles.length} recipe files`)
    } catch (error) {
      console.error('Failed to load recipe files:', error)
    }
  }

  async loadAllRecipes(): Promise<void> {
    this.recipes = []
    
    for (const file of this.recipeFiles) {
      try {
        const filePath = path.join(__dirname, '../../data/flavors', file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const recipe = JSON.parse(content)
        
        this.recipes.push(recipe)
      } catch (error) {
        this.validationErrors.push({
          recipe: file,
          error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        })
      }
    }
  }

  validateDataIntegrity(): void {
    this.recipes.forEach(recipe => {
      // Required fields validation
      this.validateRequiredFields(recipe)
      
      // Data type validation
      this.validateDataTypes(recipe)
      
      // Ingredient validation
      this.validateIngredients(recipe)
      
      // Nutrition validation
      this.validateNutrition(recipe)
      
      // Safety validation
      this.validateSafety(recipe)
      
      // Batch size validation
      this.validateBatchSizes(recipe)
    })
  }

  private validateRequiredFields(recipe: RecipeData): void {
    const required = ['id', 'name', 'category', 'ingredients', 'instructions']
    
    required.forEach(field => {
      if (!(field in recipe)) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Missing required field: ${field}`,
          severity: 'error'
        })
      }
    })
  }

  private validateDataTypes(recipe: RecipeData): void {
    if (typeof recipe.id !== 'string') {
      this.validationErrors.push({
        recipe: recipe.id,
        error: 'ID must be a string',
        severity: 'error'
      })
    }

    if (typeof recipe.name !== 'string' || recipe.name.trim().length === 0) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: 'Name must be a non-empty string',
        severity: 'error'
      })
    }

    if (!Array.isArray(recipe.ingredients)) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: 'Ingredients must be an array',
        severity: 'error'
      })
    }

    if (!Array.isArray(recipe.instructions)) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: 'Instructions must be an array',
        severity: 'error'
      })
    }
  }

  private validateIngredients(recipe: RecipeData): void {
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name || typeof ingredient.name !== 'string') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Ingredient ${index}: Invalid name`,
          severity: 'error'
        })
      }

      if (typeof ingredient.amount !== 'number' || ingredient.amount <= 0) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Ingredient ${ingredient.name}: Invalid amount`,
          severity: 'error'
        })
      }

      if (!ingredient.unit || typeof ingredient.unit !== 'string') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Ingredient ${ingredient.name}: Invalid unit`,
          severity: 'error'
        })
      }
    })
  }

  private validateNutrition(recipe: RecipeData): void {
    if (recipe.nutrition) {
      if (typeof recipe.nutrition.caffeine !== 'number') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Nutrition: caffeine must be a number',
          severity: 'warning'
        })
      }

      if (typeof recipe.nutrition.calories !== 'number') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Nutrition: calories must be a number',
          severity: 'warning'
        })
      }

      if (typeof recipe.nutrition.sugar !== 'number') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Nutrition: sugar must be a number',
          severity: 'warning'
        })
      }
    }
  }

  private validateSafety(recipe: RecipeData): void {
    if (recipe.safety) {
      if (typeof recipe.safety.maxDaily !== 'number') {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Safety: maxDaily must be a number',
          severity: 'error'
        })
      }

      if (!Array.isArray(recipe.safety.warnings)) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Safety: warnings must be an array',
          severity: 'error'
        })
      }
    }
  }

  private validateBatchSizes(recipe: RecipeData): void {
    if (recipe.batchSizes) {
      if (!Array.isArray(recipe.batchSizes)) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Batch sizes must be an array',
          severity: 'error'
        })
        return
      }

      recipe.batchSizes.forEach((batch, index) => {
        if (typeof batch.volume !== 'number' || batch.volume <= 0) {
          this.validationErrors.push({
            recipe: recipe.id,
            error: `Batch size ${index}: Invalid volume`,
            severity: 'error'
          })
        }

        if (typeof batch.scaling !== 'object') {
          this.validationErrors.push({
            recipe: recipe.id,
            error: `Batch size ${index}: Invalid scaling object`,
            severity: 'error'
          })
        }
      })
    }
  }

  validateCalculationAccuracy(): void {
    this.recipes.forEach(recipe => {
      // Test batch scaling calculations
      if (recipe.batchSizes) {
        this.testBatchScaling(recipe)
      }

      // Test caffeine calculations
      this.testCaffeineCalculations(recipe)

      // Test nutrition calculations
      this.testNutritionCalculations(recipe)
    })
  }

  private testBatchScaling(recipe: RecipeData): void {
    recipe.batchSizes?.forEach(batch => {
      const baseBatch = recipe.batchSizes?.[0] // Assume first batch is base
      if (!baseBatch) return

      Object.entries(batch.scaling).forEach(([ingredientName, scale]) => {
        if (typeof scale !== 'number' || scale <= 0) {
          this.validationErrors.push({
            recipe: recipe.id,
            error: `Batch scaling: Invalid scale for ${ingredientName}`,
            severity: 'error'
          })
        }

        // Validate scaling logic
        const expectedScale = batch.volume / baseBatch.volume
        if (Math.abs(scale - expectedScale) > 0.01) {
          this.validationErrors.push({
            recipe: recipe.id,
            error: `Batch scaling: Incorrect scale for ${ingredientName}. Expected ${expectedScale}, got ${scale}`,
            severity: 'warning'
          })
        }
      })
    })
  }

  private testCaffeineCalculations(recipe: RecipeData): void {
    const caffeineIngredient = recipe.ingredients.find(ing => 
      ing.category === 'caffeine' || ing.name.toLowerCase().includes('caffeine')
    )

    if (caffeineIngredient && recipe.nutrition) {
      // Basic sanity check - caffeine amount should be reasonable
      if (caffeineIngredient.amount > 500) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Caffeine amount seems unusually high',
          severity: 'warning'
        })
      }

      if (caffeineIngredient.amount < 1) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Caffeine amount seems unusually low',
          severity: 'warning'
        })
      }
    }
  }

  private testNutritionCalculations(recipe: RecipeData): void {
    if (recipe.nutrition) {
      // Validate calorie calculations
      const totalCaloriesFromIngredients = recipe.ingredients.reduce((total, ing) => {
        // Simplified calculation - in reality you'd have calorie data per ingredient
        return total + (ing.amount * 4) // Rough estimate
      }, 0)

      if (Math.abs(totalCaloriesFromIngredients - recipe.nutrition.calories) > 50) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: 'Nutrition: calories may be incorrectly calculated',
          severity: 'warning'
        })
      }
    }
  }

  validateSafetyCompliance(): void {
    this.recipes.forEach(recipe => {
      // EU compliance validation
      this.validateEUCompliance(recipe)
      
      // Safety limit validation
      this.validateSafetyLimits(recipe)
      
      // Contraindications validation
      this.validateContraindications(recipe)
    })
  }

  private validateEUCompliance(recipe: RecipeData): void {
    const caffeineLimit = 320 // EU daily limit in mg
    
    if (recipe.safety?.maxDaily && recipe.safety.maxDaily > caffeineLimit) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: `Daily caffeine exceeds EU limit (${caffeineLimit}mg)`,
        severity: 'error'
      })
    }
  }

  private validateSafetyLimits(recipe: RecipeData): void {
    recipe.ingredients.forEach(ingredient => {
      if (ingredient.safetyLimit && ingredient.amount > ingredient.safetyLimit) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Ingredient ${ingredient.name} exceeds safety limit`,
          severity: 'error'
        })
      }
    })
  }

  private validateContraindications(recipe: RecipeData): void {
    if (!recipe.safety?.contraindications) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: 'Missing contraindications information',
        severity: 'warning'
      })
    }
  }

  validateCategorySpecificRules(): void {
    const categoryRules: Record<string, { maxCaffeine: number; requiredIngredients: string[]; bannedIngredients: string[] }> = {
      'energy': {
        maxCaffeine: 320,
        requiredIngredients: ['caffeine', 'taurine'],
        bannedIngredients: ['alcohol', 'ephedrine']
      },
      'sports': {
        maxCaffeine: 250,
        requiredIngredients: ['caffeine', 'creatine'],
        bannedIngredients: ['sugar alcohols', 'artificial sweeteners']
      },
      'natural': {
        maxCaffeine: 200,
        requiredIngredients: ['natural caffeine'],
        bannedIngredients: ['synthetic caffeine', 'artificial colors']
      }
    }

    this.recipes.forEach(recipe => {
      const rules = categoryRules[recipe.category]
      if (rules) {
        this.validateCategoryRules(recipe, rules)
      }
    })
  }

  private validateCategoryRules(recipe: RecipeData, rules: any): void {
    // Check caffeine limits
    const caffeineAmount = recipe.ingredients
      .filter(ing => ing.category === 'caffeine')
      .reduce((sum, ing) => sum + ing.amount, 0)

    if (caffeineAmount > rules.maxCaffeine) {
      this.validationErrors.push({
        recipe: recipe.id,
        error: `Category ${recipe.category}: Caffeine exceeds limit of ${rules.maxCaffeine}mg`,
        severity: 'error'
      })
    }

    // Check required ingredients
    rules.requiredIngredients.forEach((required: string) => {
      const hasIngredient = recipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes(required.toLowerCase()) ||
        ing.category === required
      )
      
      if (!hasIngredient) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Category ${recipe.category}: Missing required ingredient: ${required}`,
          severity: 'warning'
        })
      }
    })

    // Check banned ingredients
    rules.bannedIngredients.forEach((banned: string) => {
      const hasBanned = recipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes(banned.toLowerCase()) ||
        ing.category === banned
      )
      
      if (hasBanned) {
        this.validationErrors.push({
          recipe: recipe.id,
          error: `Category ${recipe.category}: Contains banned ingredient: ${banned}`,
          severity: 'error'
        })
      }
    })
  }

  generateValidationReport(): {
    totalRecipes: number
    errors: number
    warnings: number
    errorDetails: Array<{ recipe: string; error: string; severity: 'error' | 'warning' }>
    summary: Record<string, { errors: number; warnings: number }>
  } {
    const summary: Record<string, { errors: number; warnings: number }> = {}
    
    this.validationErrors.forEach(error => {
      if (!summary[error.recipe]) {
        summary[error.recipe] = { errors: 0, warnings: 0 }
      }
      
      if (error.severity === 'error') {
        summary[error.recipe].errors++
      } else {
        summary[error.recipe].warnings++
      }
    })

    return {
      totalRecipes: this.recipes.length,
      errors: this.validationErrors.filter(e => e.severity === 'error').length,
      warnings: this.validationErrors.filter(e => e.severity === 'warning').length,
      errorDetails: this.validationErrors,
      summary
    }
  }

  getValidationErrors(): Array<{ recipe: string; error: string; severity: 'error' | 'warning' }> {
    return this.validationErrors
  }
}

describe('Recipe Library Validation', () => {
  let validator: RecipeValidator

  beforeEach(async () => {
    validator = new RecipeValidator()
    await validator.loadAllRecipes()
  })

  afterEach(() => {
    validator = new RecipeValidator()
  })

  describe('Data Integrity Tests', () => {
    it('should validate all recipe files can be loaded', async () => {
      expect(validator).toBeDefined()
      expect(validator['recipes'].length).toBeGreaterThan(0)
    })

    it('should validate recipe data integrity', () => {
      validator.validateDataIntegrity()
      const errors = validator.getValidationErrors().filter(e => e.severity === 'error')
      expect(errors).toHaveLength(0)
    })

    it('should validate data types for all recipes', () => {
      validator.validateDataIntegrity()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('must be') || e.error.includes('Invalid')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate ingredient structure', () => {
      validator.validateDataIntegrity()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Ingredient')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate nutrition data consistency', () => {
      validator.validateDataIntegrity()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Nutrition')
      )
      expect(errors).toHaveLength(0)
    })
  })

  describe('Calculation Accuracy Tests', () => {
    it('should validate batch scaling calculations', () => {
      validator.validateCalculationAccuracy()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Batch scaling')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate caffeine calculation accuracy', () => {
      validator.validateCalculationAccuracy()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Caffeine')
      )
      expect(errors.length).toBe(0)
    })

    it('should validate nutrition calculation accuracy', () => {
      validator.validateCalculationAccuracy()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Nutrition') && e.error.includes('calories')
      )
      expect(errors.length).toBe(0)
    })
  })

  describe('Safety Validation Tests', () => {
    it('should validate EU compliance for all recipes', () => {
      validator.validateSafetyCompliance()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('EU')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate safety limits for ingredients', () => {
      validator.validateSafetyCompliance()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('exceeds safety limit')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate contraindications are documented', () => {
      validator.validateSafetyCompliance()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('contraindications')
      )
      expect(errors).toHaveLength(0)
    })
  })

  describe('Category-Specific Safety Tests', () => {
    it('should validate energy drink category rules', () => {
      validator.validateCategorySpecificRules()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Category energy')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate sports drink category rules', () => {
      validator.validateCategorySpecificRules()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Category sports')
      )
      expect(errors).toHaveLength(0)
    })

    it('should validate natural drink category rules', () => {
      validator.validateCategorySpecificRules()
      const errors = validator.getValidationErrors().filter(e => 
        e.error.includes('Category natural')
      )
      expect(errors).toHaveLength(0)
    })
  })

  describe('Comprehensive Validation Report', () => {
    it('should generate comprehensive validation report', () => {
      validator.validateDataIntegrity()
      validator.validateCalculationAccuracy()
      validator.validateSafetyCompliance()
      validator.validateCategorySpecificRules()

      const report = validator.generateValidationReport()
      
      expect(report).toHaveProperty('totalRecipes')
      expect(report).toHaveProperty('errors')
      expect(report).toHaveProperty('warnings')
      expect(report).toHaveProperty('errorDetails')
      expect(report).toHaveProperty('summary')
      
      expect(report.totalRecipes).toBeGreaterThan(0)
      expect(report.errors).toBeGreaterThanOrEqual(0)
      expect(report.warnings).toBeGreaterThanOrEqual(0)
    })

    it('should provide detailed error breakdown by recipe', () => {
      validator.validateDataIntegrity()
      
      const report = validator.generateValidationReport()
      expect(report.summary).toBeDefined()
      
      Object.keys(report.summary).forEach(recipeId => {
        expect(report.summary[recipeId]).toHaveProperty('errors')
        expect(report.summary[recipeId]).toHaveProperty('warnings')
        expect(report.summary[recipeId].errors).toBeGreaterThanOrEqual(0)
        expect(report.summary[recipeId].warnings).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should validate recipe processing performance', async () => {
      const startTime = Date.now()
      
      validator.validateDataIntegrity()
      validator.validateCalculationAccuracy()
      validator.validateSafetyCompliance()
      validator.validateCategorySpecificRules()
      
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      // Should process 100+ recipes in under 30 seconds
      expect(processingTime).toBeLessThan(30000)
      console.log(`Processed ${validator['recipes'].length} recipes in ${processingTime}ms`)
    })

    it('should validate memory usage during validation', async () => {
      const initialMemory = process.memoryUsage()
      
      validator.validateDataIntegrity()
      validator.validateCalculationAccuracy()
      validator.validateSafetyCompliance()
      validator.validateCategorySpecificRules()
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
    })
  })
})

export { RecipeValidator }