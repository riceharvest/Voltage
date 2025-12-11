/**
 * Intelligent Recipe Validation Engine
 * 
 * Advanced validation system for beverage recipes across all categories with
 * comprehensive ingredient compatibility, allergen detection, nutritional validation,
 * and cross-category safety assessment.
 * 
 * Features:
 * - Ingredient compatibility checking across all categories
 * - Allergen detection and warning system
 * - Nutritional information validation
 * - Recipe scaling safety validation
 * - Cross-category mixing safety assessment
 * 
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { Ingredient } from '@/lib/types';
import { getIngredientsData, getBulkIngredientData, getLimitsData } from './safety-data-service';
import { performanceMonitor } from './performance-monitor';
import { logger } from './logger';

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  score: number; // 0-100 validation score
  categoryCompatibility: CategoryCompatibility[];
  allergenWarnings: AllergenWarning[];
  nutritionalValidation: NutritionalValidation;
  scalingValidation?: ScalingValidation;
  crossCategoryAssessment?: CrossCategoryAssessment;
  metadata: {
    validatedAt: string;
    validationTime: number;
    ingredientCount: number;
    missingIngredients: string[];
  };
}

export interface ValidationWarning {
  type: 'ingredient-compatibility' | 'category-mismatch' | 'nutritional-imbalance' | 'scaling-concern' | 'cross-category' | 'cultural' | 'regional';
  severity: 'info' | 'warning' | 'error';
  message: string;
  messageNl?: string;
  code: string;
  suggestion?: string;
  affectedIngredients?: string[];
}

export interface ValidationError {
  type: 'banned-ingredient' | 'unsafe-combination' | 'regulatory-violation' | 'allergen-conflict';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  messageNl?: string;
  code: string;
  regulatoryReference?: string;
  affectedIngredients?: string[];
}

export interface CategoryCompatibility {
  category: 'classic' | 'energy' | 'hybrid';
  compatibilityScore: number; // 0-100
  compatibilityNotes: string[];
  suggestedAdjustments: string[];
  optimalRatio?: {
    classic: number;
    energy: number;
  };
}

export interface AllergenWarning {
  allergen: string;
  severity: 'low' | 'medium' | 'high';
  sources: string[];
  crossContaminationRisk: 'low' | 'medium' | 'high';
  regulatoryLabeling: string[];
  alternatives: string[];
}

export interface NutritionalValidation {
  totalCaffeine: number;
  caffeinePerServing: number;
  sugarContent: number;
  calories: number;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
  aminoAcids: Record<string, number>;
  validated: boolean;
  deficiencies: string[];
  excesses: string[];
  dailyValuePercentages: Record<string, number>;
}

export interface ScalingValidation {
  originalBatchSize: number;
  targetBatchSize: number;
  scalingFactor: number;
  safe: boolean;
  concentrationChanges: {
    ingredient: string;
    originalConcentration: number;
    scaledConcentration: number;
    impact: 'beneficial' | 'neutral' | 'concerning' | 'dangerous';
  }[];
  safetyConsiderations: string[];
  recommendedAdjustments: string[];
}

export interface CrossCategoryAssessment {
  primaryCategory: 'classic' | 'energy' | 'hybrid';
  secondaryCategories: string[];
  interactionEffects: InteractionEffect[];
  recommendedConsumptionPattern: string[];
  safetyBuffer: number; // minutes between different category consumptions
  cumulativeEffects: CumulativeEffect[];
}

export interface InteractionEffect {
  ingredients: string[];
  effect: 'synergistic' | 'additive' | 'antagonistic' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  description: string;
  safetyImplications: string[];
}

export interface CumulativeEffect {
  effect: 'caffeine-accumulation' | 'tolerance-building' | 'dependency-risk' | 'health-impact';
  severity: 'low' | 'medium' | 'high';
  threshold: number;
  currentLevel: number;
  riskLevel: 'minimal' | 'moderate' | 'elevated' | 'dangerous';
  mitigationStrategies: string[];
}

export class IntelligentRecipeValidationEngine {
  private allergenDatabase: Map<string, string[]> = new Map();
  private ingredientCompatibilityMatrix: Map<string, Set<string>> = new Map();
  private regulatoryThresholds: Map<string, any> = new Map();

  constructor() {
    this.initializeAllergenDatabase();
    this.initializeCompatibilityMatrix();
    this.initializeRegulatoryThresholds();
  }

  /**
   * Validates a complete recipe with comprehensive checks
   */
  async validateRecipe(recipe: {
    id: string;
    name: string;
    category: 'classic' | 'energy' | 'hybrid';
    sodaType?: string;
    ingredients: Array<{
      id: string;
      amount: number;
      unit: string;
      isOptional?: boolean;
    }>;
    batchSize: number;
    servings: number;
    targetBatchSize?: number;
    userRegion?: string;
    userAge?: number;
    healthConditions?: string[];
    allergies?: string[];
  }): Promise<ValidationResult> {
    const startTime = performance.now();
    
    try {
      const validationPromises = [
        this.validateIngredients(recipe.ingredients),
        this.validateNutritionalProfile(recipe),
        this.validateCategorySpecificRules(recipe),
        this.validateAllergens(recipe),
        this.validateRegulatoryCompliance(recipe),
        this.validateScaling(recipe),
        this.validateCrossCategoryInteractions(recipe)
      ];

      const [
        ingredientResult,
        nutritionalResult,
        categoryResult,
        allergenResult,
        regulatoryResult,
        scalingResult,
        crossCategoryResult
      ] = await Promise.all(validationPromises);

      // Combine all validation results
      const allWarnings = [
        ...ingredientResult.warnings,
        ...nutritionalResult.warnings,
        ...categoryResult.warnings,
        ...allergenResult.warnings,
        ...regulatoryResult.warnings
      ].filter((warning, index, self) => 
        index === self.findIndex(w => w.code === warning.code)
      );

      const allErrors = [
        ...ingredientResult.errors,
        ...nutritionalResult.errors,
        ...categoryResult.errors,
        ...allergenResult.errors,
        ...regulatoryResult.errors
      ].filter((error, index, self) => 
        index === self.findIndex(e => e.code === error.code)
      );

      // Calculate overall validation score
      const score = this.calculateValidationScore(allWarnings, allErrors, {
        ingredientCount: recipe.ingredients.length,
        hasAllergens: allergenResult.warnings.length > 0,
        regulatoryCompliant: regulatoryResult.errors.length === 0
      });

      const validationTime = performance.now() - startTime;
      
      return {
        valid: allErrors.filter(e => e.severity === 'critical').length === 0 && score >= 70,
        warnings: allWarnings,
        errors: allErrors,
        score,
        categoryCompatibility: categoryResult.compatibility,
        allergenWarnings: allergenResult.warnings,
        nutritionalValidation: nutritionalResult.validation,
        scalingValidation: scalingResult.validation,
        crossCategoryAssessment: crossCategoryResult.assessment,
        metadata: {
          validatedAt: new Date().toISOString(),
          validationTime,
          ingredientCount: recipe.ingredients.length,
          missingIngredients: []
        }
      };

    } catch (error) {
      logger.error('Recipe validation failed', error);
      performanceMonitor.recordMetric('recipe.validation.error', performance.now() - startTime);
      
      return {
        valid: false,
        warnings: [],
        errors: [{
          type: 'regulatory-violation',
          severity: 'critical',
          message: 'Validation system error - please try again',
          code: 'VALIDATION_SYSTEM_ERROR'
        }],
        score: 0,
        categoryCompatibility: [],
        allergenWarnings: [],
        nutritionalValidation: {
          totalCaffeine: 0,
          caffeinePerServing: 0,
          sugarContent: 0,
          calories: 0,
          vitamins: {},
          minerals: {},
          aminoAcids: {},
          validated: false,
          deficiencies: [],
          excesses: [],
          dailyValuePercentages: {}
        },
        metadata: {
          validatedAt: new Date().toISOString(),
          validationTime: performance.now() - startTime,
          ingredientCount: recipe.ingredients.length,
          missingIngredients: []
        }
      };
    }
  }

  /**
   * Validates ingredient compatibility and safety
   */
  private async validateIngredients(ingredients: Array<{ id: string; amount: number; unit: string; isOptional?: boolean }>): Promise<{
    warnings: ValidationWarning[];
    errors: ValidationError[];
  }> {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    try {
      // Get ingredient data for compatibility checking
      const ingredientData = await getBulkIngredientData(ingredients.map(i => i.id));
      const missingIngredients = ingredientData.missing;

      if (missingIngredients.length > 0) {
        warnings.push({
          type: 'ingredient-compatibility',
          severity: 'warning',
          message: `Missing ingredient data for: ${missingIngredients.join(', ')}`,
          code: 'MISSING_INGREDIENT_DATA',
          suggestion: 'Verify ingredient IDs and update database'
        });
      }

      // Check ingredient compatibility matrix
      for (let i = 0; i < ingredients.length; i++) {
        for (let j = i + 1; j < ingredients.length; j++) {
          const ingredient1 = ingredients[i];
          const ingredient2 = ingredients[j];
          
          if (!this.areIngredientsCompatible(ingredient1.id, ingredient2.id)) {
            warnings.push({
              type: 'ingredient-compatibility',
              severity: 'warning',
              message: `${ingredient1.id} and ${ingredient2.id} may have compatibility issues`,
              code: 'INGREDIENT_INCOMPATIBILITY',
              affectedIngredients: [ingredient1.id, ingredient2.id],
              suggestion: 'Consider adjusting ratios or adding buffer ingredients'
            });
          }
        }
      }

      // Check for banned ingredient combinations
      const bannedCombinations = this.findBannedCombinations(ingredients.map(i => i.id));
      for (const combination of bannedCombinations) {
        errors.push({
          type: 'unsafe-combination',
          severity: 'high',
          message: `Banned ingredient combination detected: ${combination.join(' + ')}`,
          code: 'BANNED_COMBINATION',
          affectedIngredients: combination,
          regulatoryReference: 'EU Food Safety Authority Guidelines'
        });
      }

    } catch (error) {
      logger.error('Ingredient validation failed', error);
      errors.push({
        type: 'regulatory-violation',
        severity: 'critical',
        message: 'Unable to validate ingredient safety',
        code: 'INGREDIENT_VALIDATION_ERROR'
      });
    }

    return { warnings, errors };
  }

  /**
   * Validates nutritional profile and daily value calculations
   */
  private async validateNutritionalProfile(recipe: any): Promise<{
    warnings: ValidationWarning[];
    validation: NutritionalValidation;
  }> {
    const warnings: ValidationWarning[] = [];
    const validation: NutritionalValidation = {
      totalCaffeine: 0,
      caffeinePerServing: 0,
      sugarContent: 0,
      calories: 0,
      vitamins: {},
      minerals: {},
      aminoAcids: {},
      validated: true,
      deficiencies: [],
      excesses: [],
      dailyValuePercentages: {}
    };

    try {
      const ingredientData = await getBulkIngredientData(recipe.ingredients.map((i: any) => i.id));
      const limits = await getLimitsData();

      // Calculate total nutritional content
      for (const ingredient of recipe.ingredients) {
        const ingredientInfo = ingredientData.ingredients.find((i: Ingredient) => i.id === ingredient.id);
        if (!ingredientInfo) continue;

        // Calculate caffeine content
        if (ingredientInfo.caffeine) {
          validation.totalCaffeine += (ingredientInfo.caffeine * ingredient.amount) / 100;
        }

        // Calculate sugar content
        if (ingredientInfo.sugar) {
          validation.sugarContent += (ingredientInfo.sugar * ingredient.amount) / 100;
        }

        // Calculate calories
        if (ingredientInfo.calories) {
          validation.calories += (ingredientInfo.calories * ingredient.amount) / 100;
        }

        // Accumulate vitamins and minerals
        Object.entries(ingredientInfo.vitamins || {}).forEach(([vitamin, amount]) => {
          validation.vitamins[vitamin] = (validation.vitamins[vitamin] || 0) + amount;
        });

        Object.entries(ingredientInfo.minerals || {}).forEach(([mineral, amount]) => {
          validation.minerals[mineral] = (validation.minerals[mineral] || 0) + amount;
        });
      }

      // Calculate per-serving values
      validation.caffeinePerServing = validation.totalCaffeine / recipe.servings;

      // Validate against regulatory limits
      if (validation.caffeinePerServing > limits.caffeine?.maxPerServingMg) {
        warnings.push({
          type: 'nutritional-imbalance',
          severity: 'error',
          message: `Caffeine per serving (${validation.caffeinePerServing.toFixed(1)}mg) exceeds limit (${limits.caffeine?.maxPerServingMg}mg)`,
          code: 'EXCESSIVE_CAFFEINE_PER_SERVING'
        });
      }

      // Check for nutritional imbalances
      if (validation.sugarContent > 50) {
        warnings.push({
          type: 'nutritional-imbalance',
          severity: 'warning',
          message: `High sugar content (${validation.sugarContent.toFixed(1)}g) - consider sugar-free alternatives`,
          code: 'HIGH_SUGAR_CONTENT'
        });
      }

      // Calculate daily value percentages
      const dailyValues = limits.dailyValues || {};
      Object.entries(validation.vitamins).forEach(([vitamin, amount]) => {
        const dv = dailyValues.vitamins?.[vitamin];
        if (dv) {
          validation.dailyValuePercentages[vitamin] = (amount / dv) * 100;
        }
      });

    } catch (error) {
      logger.error('Nutritional validation failed', error);
      validation.validated = false;
      warnings.push({
        type: 'nutritional-imbalance',
        severity: 'warning',
        message: 'Unable to complete nutritional validation',
        code: 'NUTRITIONAL_VALIDATION_ERROR'
      });
    }

    return { warnings, validation };
  }

  /**
   * Validates category-specific rules and compatibility
   */
  private async validateCategorySpecificRules(recipe: any): Promise<{
    warnings: ValidationWarning[];
    compatibility: CategoryCompatibility[];
  }> {
    const warnings: ValidationWarning[] = [];
    const compatibility: CategoryCompatibility[] = [];

    try {
      const categoryRules = this.getCategoryRules(recipe.category);
      
      // Validate category-specific caffeine ranges
      const expectedCaffeineRange = categoryRules.caffeineRange;
      const actualCaffeine = recipe.ingredients.some((i: any) => 
        this.getIngredientCaffeine(i.id) > 0
      ) ? this.calculateTotalCaffeine(recipe.ingredients) : 0;

      if (actualCaffeine < expectedCaffeineRange.min || actualCaffeine > expectedCaffeineRange.max) {
        warnings.push({
          type: 'category-mismatch',
          severity: 'warning',
          message: `Caffeine content (${actualCaffeine}mg) outside expected range for ${recipe.category} (${expectedCaffeineRange.min}-${expectedCaffeineRange.max}mg)`,
          code: 'CAFFEINE_RANGE_MISMATCH'
        });
      }

      // Check for category-specific ingredient requirements
      const requiredIngredients = categoryRules.requiredIngredients;
      const missingRequired = requiredIngredients.filter(req => 
        !recipe.ingredients.some((ing: any) => ing.id === req)
      );

      if (missingRequired.length > 0) {
        warnings.push({
          type: 'category-mismatch',
          severity: 'info',
          message: `Missing recommended ingredients for ${recipe.category}: ${missingRequired.join(', ')}`,
          code: 'MISSING_RECOMMENDED_INGREDIENTS',
          suggestion: 'Consider adding these ingredients for authentic flavor profile'
        });
      }

      // Calculate compatibility scores for all categories
      for (const category of ['classic', 'energy', 'hybrid'] as const) {
        const score = this.calculateCategoryCompatibility(recipe, category);
        const notes = this.getCategoryCompatibilityNotes(recipe, category);
        const adjustments = this.getSuggestedAdjustments(recipe, category);

        compatibility.push({
          category,
          compatibilityScore: score,
          compatibilityNotes: notes,
          suggestedAdjustments: adjustments,
          optimalRatio: category === 'hybrid' ? this.getOptimalHybridRatio(recipe) : undefined
        });
      }

    } catch (error) {
      logger.error('Category validation failed', error);
      warnings.push({
        type: 'category-mismatch',
        severity: 'warning',
        message: 'Unable to validate category-specific rules',
        code: 'CATEGORY_VALIDATION_ERROR'
      });
    }

    return { warnings, compatibility };
  }

  /**
   * Validates allergen content and provides warnings
   */
  private async validateAllergens(recipe: any): Promise<{
    warnings: ValidationWarning[];
    warnings: AllergenWarning[];
  }> {
    const warnings: ValidationWarning[] = [];
    const allergenWarnings: AllergenWarning[] = [];

    try {
      const ingredientData = await getBulkIngredientData(recipe.ingredients.map((i: any) => i.id));

      // Check for known allergens in ingredients
      const allergenSources: Map<string, string[]> = new Map();
      
      for (const ingredient of recipe.ingredients) {
        const ingredientInfo = ingredientData.ingredients.find((i: Ingredient) => i.id === ingredient.id);
        if (!ingredientInfo) continue;

        // Check for direct allergens
        const allergens = this.getAllergensForIngredient(ingredient.id);
        allergens.forEach(allergen => {
          if (!allergenSources.has(allergen)) {
            allergenSources.set(allergen, []);
          }
          allergenSources.get(allergen)!.push(ingredient.id);
        });

        // Check for cross-contamination risks
        if (ingredientInfo.crossContaminationRisk) {
          const contaminationAllergens = this.getAllergensForIngredient(ingredient.id, true);
          contaminationAllergens.forEach(allergen => {
            if (!allergenSources.has(allergen)) {
              allergenSources.set(allergen, []);
            }
            allergenSources.get(allergen)!.push(`${ingredient.id} (cross-contamination)`);
          });
        }
      }

      // Generate allergen warnings
      for (const [allergen, sources] of allergenSources) {
        const severity = this.getAllergenSeverity(allergen);
        const regulatoryLabeling = this.getRegulatoryLabeling(allergen);
        const alternatives = this.getAllergenAlternatives(allergen);

        allergenWarnings.push({
          allergen,
          severity,
          sources,
          crossContaminationRisk: this.assessCrossContaminationRisk(allergen, sources),
          regulatoryLabeling,
          alternatives
        });

        // Add user-facing warnings
        if (recipe.allergies?.includes(allergen)) {
          warnings.push({
            type: 'allergen-conflict',
            severity: 'error',
            message: `Recipe contains ${allergen} - matches user allergy profile`,
            code: 'ALLERGEN_CONFLICT',
            affectedIngredients: sources
          });
        } else {
          warnings.push({
            type: 'allergen-conflict',
            severity: severity === 'high' ? 'warning' : 'info',
            message: `Contains ${allergen} - review for allergen considerations`,
            code: 'ALLERGEN_PRESENT',
            affectedIngredients: sources
          });
        }
      }

    } catch (error) {
      logger.error('Allergen validation failed', error);
      warnings.push({
        type: 'allergen-conflict',
        severity: 'warning',
        message: 'Unable to complete allergen validation',
        code: 'ALLERGEN_VALIDATION_ERROR'
      });
    }

    return { warnings, allergenWarnings };
  }

  /**
   * Validates regulatory compliance across regions
   */
  private async validateRegulatoryCompliance(recipe: any): Promise<{
    warnings: ValidationWarning[];
    errors: ValidationError[];
  }> {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    try {
      const regions = recipe.userRegion ? [recipe.userRegion] : ['EU', 'US', 'CA', 'AU'];
      
      for (const region of regions) {
        const compliance = await this.checkRegionCompliance(recipe, region);
        
        if (!compliance.compliant) {
          if (compliance.severity === 'critical') {
            errors.push({
              type: 'regulatory-violation',
              severity: 'high',
              message: `Regulatory violation in ${region}: ${compliance.issue}`,
              code: `REGULATORY_VIOLATION_${region}`,
              regulatoryReference: compliance.reference
            });
          } else {
            warnings.push({
              type: 'regional',
              severity: 'warning',
              message: `Regulatory consideration in ${region}: ${compliance.issue}`,
              code: `REGULATORY_CONSIDERATION_${region}`,
              suggestion: compliance.suggestion
            });
          }
        }
      }

    } catch (error) {
      logger.error('Regulatory validation failed', error);
      errors.push({
        type: 'regulatory-violation',
        severity: 'critical',
        message: 'Unable to validate regulatory compliance',
        code: 'REGULATORY_VALIDATION_ERROR'
      });
    }

    return { warnings, errors };
  }

  /**
   * Validates recipe scaling safety
   */
  private async validateScaling(recipe: any): Promise<{
    warnings: ValidationWarning[];
    validation?: ScalingValidation;
  }> {
    const warnings: ValidationWarning[] = [];
    
    if (!recipe.targetBatchSize) {
      return { warnings };
    }

    try {
      const scalingFactor = recipe.targetBatchSize / recipe.batchSize;
      const validation: ScalingValidation = {
        originalBatchSize: recipe.batchSize,
        targetBatchSize: recipe.targetBatchSize,
        scalingFactor,
        safe: true,
        concentrationChanges: [],
        safetyConsiderations: [],
        recommendedAdjustments: []
      };

      // Check if scaling factor is reasonable
      if (scalingFactor > 10) {
        warnings.push({
          type: 'scaling-concern',
          severity: 'warning',
          message: `Large scaling factor (${scalingFactor.toFixed(1)}x) may affect taste and safety`,
          code: 'LARGE_SCALING_FACTOR',
          suggestion: 'Consider testing smaller batches first'
        });
      }

      if (scalingFactor < 0.1) {
        warnings.push({
          type: 'scaling-concern',
          severity: 'warning',
          message: `Small scaling factor (${scalingFactor.toFixed(1)}x) may lead to inaccurate measurements`,
          code: 'SMALL_SCALING_FACTOR',
          suggestion: 'Use precision measuring tools for small batches'
        });
      }

      // Validate ingredient scaling
      const ingredientData = await getBulkIngredientData(recipe.ingredients.map((i: any) => i.id));
      
      for (const ingredient of recipe.ingredients) {
        const ingredientInfo = ingredientData.ingredients.find((i: Ingredient) => i.id === ingredient.id);
        if (!ingredientInfo) continue;

        const scaledAmount = ingredient.amount * scalingFactor;
        const impact = this.assessScalingImpact(ingredient, scaledAmount, ingredientInfo);

        validation.concentrationChanges.push({
          ingredient: ingredient.id,
          originalConcentration: ingredient.amount / recipe.batchSize,
          scaledConcentration: scaledAmount / recipe.targetBatchSize,
          impact
        });

        if (impact === 'dangerous') {
          validation.safe = false;
          warnings.push({
            type: 'scaling-concern',
            severity: 'error',
            message: `Scaling ${ingredient.id} to ${scaledAmount.toFixed(2)}${ingredient.unit} may be unsafe`,
            code: 'UNSAFE_SCALING',
            affectedIngredients: [ingredient.id]
          });
        }
      }

      return { warnings, validation };

    } catch (error) {
      logger.error('Scaling validation failed', error);
      warnings.push({
        type: 'scaling-concern',
        severity: 'warning',
        message: 'Unable to complete scaling validation',
        code: 'SCALING_VALIDATION_ERROR'
      });
      return { warnings };
    }
  }

  /**
   * Validates cross-category interactions and effects
   */
  private async validateCrossCategoryInteractions(recipe: any): Promise<{
    warnings: ValidationWarning[];
    assessment?: CrossCategoryAssessment;
  }> {
    const warnings: ValidationWarning[] = [];

    try {
      if (recipe.category !== 'hybrid') {
        return { warnings };
      }

      const assessment: CrossCategoryAssessment = {
        primaryCategory: recipe.category,
        secondaryCategories: this.identifySecondaryCategories(recipe.ingredients),
        interactionEffects: [],
        recommendedConsumptionPattern: [],
        safetyBuffer: 120, // 2 hours default
        cumulativeEffects: []
      };

      // Analyze ingredient interactions
      assessment.interactionEffects = this.analyzeIngredientInteractions(recipe.ingredients);
      
      // Generate consumption recommendations
      assessment.recommendedConsumptionPattern = this.generateConsumptionRecommendations(recipe);
      
      // Calculate safety buffer based on caffeine content
      const totalCaffeine = this.calculateTotalCaffeine(recipe.ingredients);
      assessment.safetyBuffer = this.calculateSafetyBuffer(totalCaffeine);

      // Assess cumulative effects
      assessment.cumulativeEffects = this.assessCumulativeEffects(recipe);

      // Add warnings for significant interactions
      const significantInteractions = assessment.interactionEffects.filter(
        effect => effect.magnitude === 'high'
      );

      for (const interaction of significantInteractions) {
        warnings.push({
          type: 'cross-category',
          severity: 'warning',
          message: `Strong interaction detected between ${interaction.ingredients.join(' and ')}: ${interaction.description}`,
          code: 'STRONG_INTERACTION',
          affectedIngredients: interaction.ingredients,
          suggestion: 'Monitor consumption and consider reducing amounts'
        });
      }

      return { warnings, assessment };

    } catch (error) {
      logger.error('Cross-category validation failed', error);
      warnings.push({
        type: 'cross-category',
        severity: 'warning',
        message: 'Unable to complete cross-category assessment',
        code: 'CROSS_CATEGORY_VALIDATION_ERROR'
      });
      return { warnings };
    }
  }

  // Helper methods

  private initializeAllergenDatabase(): void {
    // Major allergens according to FDA, EU, and other regulatory bodies
    const allergens = {
      'milk': ['casein', 'whey', 'lactose', 'milk-protein'],
      'eggs': ['albumin', 'egg-white', 'egg-yolk'],
      'fish': ['fish-protein', 'fish-oil', 'omega-3'],
      'shellfish': ['shrimp-protein', 'crab-protein', 'lobster-protein'],
      'tree-nuts': ['almond-protein', 'walnut-protein', 'hazelnut-protein', 'cashew-protein', 'pecan-protein'],
      'peanuts': ['peanut-protein', 'peanut-oil'],
      'soy': ['soy-protein', 'soy-lecithin', 'soy-isoflavone'],
      'wheat': ['gluten', 'wheat-protein', 'wheat-starch'],
      'sesame': ['sesame-oil', 'sesame-protein'],
      'sulfites': ['sodium-sulfite', 'potassium-sulfite'],
      'celery': ['celery-protein', 'celery-seed'],
      'mustard': ['mustard-seed', 'mustard-protein'],
      'lupin': ['lupin-protein'],
      'molluscs': ['oyster-protein', 'clam-protein', 'mussel-protein']
    };

    Object.entries(allergens).forEach(([allergen, sources]) => {
      this.allergenDatabase.set(allergen, sources);
    });
  }

  private initializeCompatibilityMatrix(): void {
    // Define known ingredient incompatibilities
    const incompatibilities = [
      ['acidic-phosphoric', 'calcium-carbonate'],
      ['citric-acid', 'sodium-bicarbonate'],
      ['vitamin-c', 'vitamin-b12'],
      ['caffeine', 'melatonin'],
      ['guarana', 'kola-nut'],
      ['taurine', 'artificial-sweeteners']
    ];

    incompatibilities.forEach(([ing1, ing2]) => {
      if (!this.ingredientCompatibilityMatrix.has(ing1)) {
        this.ingredientCompatibilityMatrix.set(ing1, new Set());
      }
      if (!this.ingredientCompatibilityMatrix.has(ing2)) {
        this.ingredientCompatibilityMatrix.set(ing2, new Set());
      }
      this.ingredientCompatibilityMatrix.get(ing1)!.add(ing2);
      this.ingredientCompatibilityMatrix.get(ing2)!.add(ing1);
    });
  }

  private initializeRegulatoryThresholds(): void {
    this.regulatoryThresholds.set('EU', {
      caffeine: { maxPerServing: 160, maxDaily: 400 },
      sugar: { maxPerServing: 25, maxDaily: 90 },
      ageRestrictions: { energy: 16, alcohol: 18 }
    });

    this.regulatoryThresholds.set('US', {
      caffeine: { maxPerServing: 200, maxDaily: 400 },
      sugar: { maxPerServing: 50, maxDaily: 125 },
      ageRestrictions: { energy: 16, alcohol: 21 }
    });

    this.regulatoryThresholds.set('CA', {
      caffeine: { maxPerServing: 180, maxDaily: 400 },
      sugar: { maxPerServing: 25, maxDaily: 100 },
      ageRestrictions: { energy: 16, alcohol: 19 }
    });
  }

  private areIngredientsCompatible(ing1: string, ing2: string): boolean {
    const incompatibilities1 = this.ingredientCompatibilityMatrix.get(ing1);
    const incompatibilities2 = this.ingredientCompatibilityMatrix.get(ing2);
    
    return !incompatibilities1?.has(ing2) && !incompatibilities2?.has(ing1);
  }

  private findBannedCombinations(ingredients: string[]): string[][] {
    const bannedCombinations: string[][] = [];
    
    // Example banned combinations
    const knownBanned = [
      ['alcohol', 'caffeine'],
      ['ephedra', 'guarana'],
      ['synthetic-caffeine', 'natural-caffeine']
    ];

    knownBanned.forEach(combo => {
      if (combo.every(ing => ingredients.includes(ing))) {
        bannedCombinations.push(combo);
      }
    });

    return bannedCombinations;
  }

  private calculateValidationScore(warnings: ValidationWarning[], errors: ValidationError[], context: any): number {
    let score = 100;

    // Deduct for errors
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 50; break;
        case 'high': score -= 30; break;
        case 'medium': score -= 15; break;
      }
    });

    // Deduct for warnings
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'error': score -= 20; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 5; break;
      }
    });

    // Bonus for positive factors
    if (context.regulatoryCompliant) score += 10;
    if (context.ingredientCount >= 3 && context.ingredientCount <= 8) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private getCategoryRules(category: string): any {
    const rules = {
      classic: {
        caffeineRange: { min: 0, max: 50 },
        requiredIngredients: ['carbonated-water', 'natural-flavors'],
        sugarLimit: 40
      },
      energy: {
        caffeineRange: { min: 50, max: 160 },
        requiredIngredients: ['caffeine', 'vitamin-b-complex'],
        sugarLimit: 30
      },
      hybrid: {
        caffeineRange: { min: 25, max: 128 },
        requiredIngredients: ['carbonated-water', 'caffeine'],
        sugarLimit: 35
      }
    };

    return rules[category] || rules.classic;
  }

  private getIngredientCaffeine(ingredientId: string): number {
    // This would typically query the ingredient database
    const caffeineIngredients = ['caffeine', 'guarana', 'kola-nut', 'yerba-mate'];
    return caffeineIngredients.includes(ingredientId) ? 50 : 0;
  }

  private calculateTotalCaffeine(ingredients: any[]): number {
    return ingredients.reduce((total, ingredient) => {
      return total + this.getIngredientCaffeine(ingredient.id);
    }, 0);
  }

  private calculateCategoryCompatibility(recipe: any, category: string): number {
    // Simplified compatibility calculation
    const categoryRules = this.getCategoryRules(category);
    const actualCaffeine = this.calculateTotalCaffeine(recipe.ingredients);
    
    if (actualCaffeine >= categoryRules.caffeineRange.min && 
        actualCaffeine <= categoryRules.caffeineRange.max) {
      return 85;
    }
    
    return 60;
  }

  private getCategoryCompatibilityNotes(recipe: any, category: string): string[] {
    const notes = [];
    
    if (category === 'hybrid') {
      notes.push('Combines characteristics of multiple beverage categories');
      notes.push('Requires careful balancing of ingredients');
    }
    
    return notes;
  }

  private getSuggestedAdjustments(recipe: any, category: string): string[] {
    const adjustments = [];
    
    if (category === 'energy' && this.calculateTotalCaffeine(recipe.ingredients) < 50) {
      adjustments.push('Add caffeine source for authentic energy drink profile');
    }
    
    return adjustments;
  }

  private getOptimalHybridRatio(recipe: any): { classic: number; energy: number } {
    const totalCaffeine = this.calculateTotalCaffeine(recipe.ingredients);
    return {
      classic: Math.max(0, 100 - totalCaffeine),
      energy: Math.min(100, totalCaffeine)
    };
  }

  private getAllergensForIngredient(ingredientId: string, crossContamination = false): string[] {
    const allergens: string[] = [];
    
    // Check against allergen database
    for (const [allergen, sources] of this.allergenDatabase) {
      if (sources.some(source => ingredientId.includes(source))) {
        allergens.push(allergen);
      }
    }

    return allergens;
  }

  private getAllergenSeverity(allergen: string): 'low' | 'medium' | 'high' {
    const highSeverity = ['peanuts', 'tree-nuts', 'shellfish', 'fish', 'eggs', 'milk'];
    const mediumSeverity = ['soy', 'wheat', 'sesame'];
    
    if (highSeverity.includes(allergen)) return 'high';
    if (mediumSeverity.includes(allergen)) return 'medium';
    return 'low';
  }

  private getRegulatoryLabeling(allergen: string): string[] {
    const labeling = {
      'milk': ['Contains: Milk'],
      'eggs': ['Contains: Eggs'],
      'fish': ['Contains: Fish'],
      'shellfish': ['Contains: Shellfish'],
      'tree-nuts': ['Contains: Tree Nuts'],
      'peanuts': ['Contains: Peanuts'],
      'soy': ['Contains: Soy'],
      'wheat': ['Contains: Wheat'],
      'sesame': ['Contains: Sesame']
    };

    return labeling[allergen] || [`May contain: ${allergen}`];
  }

  private getAllergenAlternatives(allergen: string): string[] {
    const alternatives = {
      'milk': ['coconut-milk', 'almond-milk', 'oat-milk'],
      'eggs': ['flax-egg', 'chia-egg'],
      'soy': ['pea-protein', 'rice-protein'],
      'wheat': ['rice-flour', 'almond-flour'],
      'peanuts': ['sunflower-seed-butter'],
      'tree-nuts': ['sunflower-seed-butter', 'pumpkin-seed-butter']
    };

    return alternatives[allergen] || [];
  }

  private assessCrossContaminationRisk(allergen: string, sources: string[]): 'low' | 'medium' | 'high' {
    const processingEquipment = sources.filter(source => 
      source.includes('processing') || source.includes('facility')
    ).length;
    
    if (processingEquipment > 0) return 'high';
    if (sources.length > 1) return 'medium';
    return 'low';
  }

  private async checkRegionCompliance(recipe: any, region: string): Promise<{
    compliant: boolean;
    severity: 'info' | 'warning' | 'critical';
    issue: string;
    reference: string;
    suggestion?: string;
  }> {
    const thresholds = this.regulatoryThresholds.get(region);
    if (!thresholds) {
      return {
        compliant: true,
        severity: 'info',
        issue: 'No specific regulations found',
        reference: `${region} Food Authority`
      };
    }

    const totalCaffeine = this.calculateTotalCaffeine(recipe.ingredients);
    
    if (totalCaffeine > thresholds.caffeine.maxPerServing) {
      return {
        compliant: false,
        severity: 'critical',
        issue: `Caffeine content (${totalCaffeine}mg) exceeds ${region} limit (${thresholds.caffeine.maxPerServing}mg)`,
        reference: `${region} Food Safety Regulations`,
        suggestion: 'Reduce caffeine content or divide into multiple servings'
      };
    }

    return { compliant: true, severity: 'info', issue: 'Compliant', reference: `${region} Food Authority` };
  }

  private assessScalingImpact(ingredient: any, scaledAmount: number, ingredientInfo: Ingredient): 'beneficial' | 'neutral' | 'concerning' | 'dangerous' {
    // Simplified impact assessment
    const maxSafeAmount = ingredientInfo.maxSafeAmount || 1000;
    
    if (scaledAmount > maxSafeAmount * 2) return 'dangerous';
    if (scaledAmount > maxSafeAmount) return 'concerning';
    if (scaledAmount < ingredient.amount * 0.1) return 'concerning';
    
    return 'neutral';
  }

  private identifySecondaryCategories(ingredients: any[]): string[] {
    const categories = new Set<string>();
    
    if (this.calculateTotalCaffeine(ingredients) > 25) categories.add('energy');
    if (ingredients.some(i => i.id.includes('soda') || i.id.includes('classic'))) categories.add('classic');
    
    return Array.from(categories);
  }

  private analyzeIngredientInteractions(ingredients: any[]): InteractionEffect[] {
    const effects: InteractionEffect[] = [];
    
    // Example interactions
    const caffeineIngredients = ingredients.filter(i => this.getIngredientCaffeine(i.id) > 0);
    const taurineIngredients = ingredients.filter(i => i.id.includes('taurine'));
    
    if (caffeineIngredients.length > 0 && taurineIngredients.length > 0) {
      effects.push({
        ingredients: [...caffeineIngredients.map(i => i.id), ...taurineIngredients.map(i => i.id)],
        effect: 'synergistic',
        magnitude: 'medium',
        description: 'Caffeine and taurine may have synergistic effects on energy',
        safetyImplications: ['Monitor total stimulant load', 'Consider spacing consumption']
      });
    }
    
    return effects;
  }

  private generateConsumptionRecommendations(recipe: any): string[] {
    const recommendations = [
      'Consume slowly over 1-2 hours',
      'Monitor total caffeine intake throughout day',
      'Stay hydrated with water',
      'Avoid consumption close to bedtime'
    ];
    
    if (this.calculateTotalCaffeine(recipe.ingredients) > 100) {
      recommendations.unshift('Consider splitting into multiple smaller servings');
    }
    
    return recommendations;
  }

  private calculateSafetyBuffer(totalCaffeine: number): number {
    // Base buffer of 2 hours, increase with caffeine content
    return Math.min(480, 120 + (totalCaffeine * 2)); // Max 8 hours
  }

  private assessCumulativeEffects(recipe: any): CumulativeEffect[] {
    const effects: CumulativeEffect[] = [];
    const totalCaffeine = this.calculateTotalCaffeine(recipe.ingredients);
    
    if (totalCaffeine > 100) {
      effects.push({
        effect: 'caffeine-accumulation',
        severity: totalCaffeine > 200 ? 'high' : 'medium',
        threshold: 400,
        currentLevel: totalCaffeine,
        riskLevel: totalCaffeine > 300 ? 'dangerous' : 'elevated',
        mitigationStrategies: [
          'Limit to one serving per day',
          'Avoid other caffeine sources for 6 hours',
          'Monitor for side effects'
        ]
      });
    }
    
    return effects;
  }
}

// Export singleton instance
export const intelligentRecipeValidationEngine = new IntelligentRecipeValidationEngine();