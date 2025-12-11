/**
 * Enhanced Calculator Service
 * 
 * Comprehensive calculator engine supporting all new platform capabilities
 * including multi-mode calculations, advanced batch scaling, Amazon pricing,
 * cultural adaptations, and intelligent optimization.
 */

import { 
  FlavorRecipe, 
  PremadeSyrup, 
  CostComparison, 
  ComprehensiveCostAnalysis,
  RegionalPricingData,
  BulkPurchasingRecommendation,
  QualityValueAssessment
} from './types';
import { PremadeCostAnalysis } from './premade-cost-analysis';
import { PremadeSyrupService } from './premade-syrups';
import { SafetyValidationService } from './safety-validation-service';
import { CulturalAdaptationService } from './cultural-adaptation';

/**
 * Calculator Input Interface
 */
export interface CalculatorInput {
  // Basic Configuration
  category: 'classic' | 'energy' | 'hybrid';
  mode: 'diy' | 'premade' | 'hybrid';
  targetFlavor: string;
  
  // Volume and Serving Settings
  targetVolume: number; // ml
  servingSize: number; // ml per serving
  batchSize: number; // number of servings
  
  // Regional Settings
  region: string;
  currency: string;
  language: string;
  
  // User Preferences
  qualityPreference: 'budget' | 'standard' | 'premium';
  timePreference: 'immediate' | 'weekly' | 'monthly';
  culturalPreference: string;
  
  // Safety Settings
  age: number;
  healthConditions: string[];
  caffeineSensitivity: 'low' | 'medium' | 'high';
  
  // Advanced Options
  useAmazonIntegration: boolean;
  enableBatchOptimization: boolean;
  enableCostAnalysis: boolean;
  enableRegionalAdaptation: boolean;
}

/**
 * Batch Optimization Result
 */
export interface BatchOptimizationResult {
  optimalBatchSize: number;
  equipmentRecommendations: {
    type: string;
    capacity: number;
    cost: number;
    efficiency: number;
  }[];
  costPerServing: number;
  preparationTime: number;
  storageRequirements: {
    space: string;
    temperature: string;
    shelfLife: number;
  };
  wasteReduction: {
    percentage: number;
    strategies: string[];
  };
  scalingFactors: {
    linear: boolean;
    efficiency: number[];
    limits: {
      minimum: number;
      maximum: number;
      recommended: number;
    };
  };
}

/**
 * Amazon Integration Result
 */
export interface AmazonIntegrationResult {
  available: boolean;
  products: Array<{
    asin: string;
    title: string;
    price: number;
    currency: string;
    availability: string;
    affiliateUrl: string;
    rating: number;
    primeEligible: boolean;
  }>;
  priceComparison: {
    lowest: number;
    highest: number;
    average: number;
    savings: number;
  };
  recommendations: string[];
  bulkOptions: Array<{
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    savings: number;
  }>;
}

/**
 * Regional Adaptation Result
 */
export interface RegionalAdaptationResult {
  adaptedFlavor: FlavorRecipe;
  culturalNotes: {
    taste: string[];
    preparation: string[];
    serving: string[];
    safety: string[];
  };
  localIngredients: Array<{
    id: string;
    name: string;
    availability: string;
    cost: number;
    substitute?: string;
  }>;
  regulatoryCompliance: {
    compliant: boolean;
    warnings: string[];
    requirements: string[];
  };
  unitPreferences: {
    primary: string;
    secondary: string;
    conversion: Record<string, number>;
  };
}

/**
 * Performance Analytics
 */
export interface CalculatorAnalytics {
  usage: {
    mode: Record<string, number>;
    category: Record<string, number>;
    features: Record<string, number>;
  };
  efficiency: {
    averageCalculationTime: number;
    userSatisfaction: number;
    errorRate: number;
    featureAdoption: Record<string, number>;
  };
  insights: {
    popularCombinations: Array<{
      flavor: string;
      mode: string;
      frequency: number;
    }>;
    optimizationOpportunities: string[];
    userBehaviorPatterns: Record<string, any>;
  };
}

/**
 * Enhanced Calculator Service
 */
export class EnhancedCalculatorService {
  private costAnalyzer: PremadeCostAnalysis;
  private syrupService: PremadeSyrupService;
  private safetyService: SafetyValidationService;
  private culturalService: CulturalAdaptationService;
  private analytics: CalculatorAnalytics;

  constructor() {
    this.costAnalyzer = new PremadeCostAnalysis(new PremadeSyrupService());
    this.syrupService = new PremadeSyrupService();
    this.safetyService = new SafetyValidationService();
    this.culturalService = new CulturalAdaptationService();
    this.analytics = this.initializeAnalytics();
  }

  /**
   * Perform comprehensive calculation with all enhancements
   */
  public async performEnhancedCalculation(input: CalculatorInput): Promise<{
    basic: {
      caffeine: number;
      ingredients: FlavorRecipe['ingredients'];
      dilution: string;
      valid: boolean;
    };
    batchOptimization?: BatchOptimizationResult;
    amazonIntegration?: AmazonIntegrationResult;
    regionalAdaptation?: RegionalAdaptationResult;
    costAnalysis?: ComprehensiveCostAnalysis;
    safetyValidation: {
      valid: boolean;
      warnings: any[];
      compliance: number;
    };
    recommendations: {
      approach: 'diy' | 'premade' | 'hybrid';
      reasoning: string[];
      alternatives: Array<{
        approach: string;
        cost: number;
        quality: number;
        when: string;
      }>;
    };
    analytics: CalculatorAnalytics;
  }> {
    const startTime = Date.now();
    
    // Load flavor data
    const flavorData = await this.loadFlavorData(input.targetFlavor);
    if (!flavorData) {
      throw new Error(`Flavor not found: ${input.targetFlavor}`);
    }

    // Perform basic calculation
    const basic = this.performBasicCalculation(input, flavorData);

    // Batch optimization
    const batchOptimization = input.enableBatchOptimization 
      ? await this.optimizeBatchSize(input, basic)
      : undefined;

    // Amazon integration
    const amazonIntegration = input.useAmazonIntegration
      ? await this.integrateAmazonPricing(input, flavorData)
      : undefined;

    // Regional adaptation
    const regionalAdaptation = input.enableRegionalAdaptation
      ? await this.adaptToRegion(input, flavorData)
      : undefined;

    // Cost analysis
    const costAnalysis = input.enableCostAnalysis
      ? await this.performCostAnalysis(input, basic)
      : undefined;

    // Safety validation
    const safetyValidation = this.validateSafety(input, basic);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, {
      basic,
      batchOptimization,
      amazonIntegration,
      regionalAdaptation,
      costAnalysis,
      safetyValidation
    });

    // Update analytics
    this.updateAnalytics(input, {
      basic,
      batchOptimization,
      amazonIntegration,
      regionalAdaptation,
      costAnalysis,
      safetyValidation
    });

    const calculationTime = Date.now() - startTime;
    this.analytics.efficiency.averageCalculationTime = 
      (this.analytics.efficiency.averageCalculationTime + calculationTime) / 2;

    return {
      basic,
      batchOptimization,
      amazonIntegration,
      regionalAdaptation,
      costAnalysis,
      safetyValidation,
      recommendations,
      analytics: this.analytics
    };
  }

  /**
   * Advanced batch scaling with intelligent optimization
   */
  public async optimizeBatchSize(
    input: CalculatorInput, 
    basicResult: any
  ): Promise<BatchOptimizationResult> {
    const volumes = [100, 250, 500, 1000, 2000, 5000, 10000]; // ml
    const results = volumes.map(volume => ({
      volume,
      costPerServing: this.calculateCostPerServing(input, volume),
      preparationTime: this.calculatePreparationTime(input, volume),
      waste: this.calculateWaste(input, volume),
      efficiency: this.calculateEfficiency(input, volume)
    }));

    // Find optimal batch size
    const optimal = this.findOptimalBatchSize(results);
    
    // Generate equipment recommendations
    const equipmentRecommendations = this.generateEquipmentRecommendations(optimal.volume);
    
    // Calculate storage requirements
    const storageRequirements = this.calculateStorageRequirements(optimal.volume);
    
    // Waste reduction strategies
    const wasteReduction = this.calculateWasteReduction(input, results);

    return {
      optimalBatchSize: optimal.volume,
      equipmentRecommendations,
      costPerServing: optimal.costPerServing,
      preparationTime: optimal.preparationTime,
      storageRequirements,
      wasteReduction,
      scalingFactors: {
        linear: this.isLinearScaling(results),
        efficiency: results.map(r => r.efficiency),
        limits: {
          minimum: 100,
          maximum: 10000,
          recommended: optimal.volume
        }
      }
    };
  }

  /**
   * Amazon pricing integration
   */
  public async integrateAmazonPricing(
    input: CalculatorInput,
    flavorData: FlavorRecipe
  ): Promise<AmazonIntegrationResult> {
    // Simulate Amazon API calls (in real implementation, this would call actual Amazon API)
    const mockProducts = await this.getAmazonProducts(flavorData);
    
    const priceComparison = {
      lowest: Math.min(...mockProducts.map(p => p.price)),
      highest: Math.max(...mockProducts.map(p => p.price)),
      average: mockProducts.reduce((sum, p) => sum + p.price, 0) / mockProducts.length,
      savings: 0 // Calculate based on comparison to DIY cost
    };

    // Generate bulk options
    const bulkOptions = this.generateBulkOptions(mockProducts, input.batchSize);

    return {
      available: mockProducts.length > 0,
      products: mockProducts,
      priceComparison,
      recommendations: this.generateAmazonRecommendations(mockProducts, input),
      bulkOptions
    };
  }

  /**
   * Cultural and regional adaptations
   */
  public async adaptToRegion(
    input: CalculatorInput,
    flavorData: FlavorRecipe
  ): Promise<RegionalAdaptationResult> {
    const culturalAdaptation = this.culturalService.adaptFlavor(flavorData, input.region);
    const localIngredients = await this.getLocalIngredients(input.region, flavorData);
    const regulatoryCompliance = this.checkRegulatoryCompliance(input.region, flavorData);
    const unitPreferences = this.getUnitPreferences(input.region);

    return {
      adaptedFlavor: culturalAdaptation,
      culturalNotes: {
        taste: this.getCulturalTasteNotes(input.region),
        preparation: this.getCulturalPreparationNotes(input.region),
        serving: this.getCulturalServingNotes(input.region),
        safety: this.getCulturalSafetyNotes(input.region)
      },
      localIngredients,
      regulatoryCompliance,
      unitPreferences
    };
  }

  /**
   * Interactive recipe builder with visual feedback
   */
  public buildInteractiveRecipe(
    input: CalculatorInput,
    currentRecipe: any
  ): {
    visualRepresentation: any;
    realTimeFeedback: any;
    customizationOptions: any[];
    validationFeedback: any;
  } {
    return {
      visualRepresentation: this.generateVisualRecipe(currentRecipe),
      realTimeFeedback: this.generateRealTimeFeedback(input, currentRecipe),
      customizationOptions: this.getCustomizationOptions(input),
      validationFeedback: this.validateRecipeRealtime(currentRecipe)
    };
  }

  // Private helper methods

  private async loadFlavorData(flavorId: string): Promise<FlavorRecipe | null> {
    // Load from existing data service
    const { loadAllFlavors } = await import('@/data/index');
    const allFlavors = await loadAllFlavors();
    return allFlavors.find(f => f.id === flavorId) || null;
  }

  private performBasicCalculation(input: CalculatorInput, flavorData: FlavorRecipe) {
    // Calculate caffeine based on category and mode
    let caffeine = 0;
    switch (input.category) {
      case 'classic':
        caffeine = input.mode === 'energy' ? 30 : 0;
        break;
      case 'energy':
        caffeine = 80; // Base energy drink caffeine
        break;
      case 'hybrid':
        caffeine = 40;
        break;
    }

    // Adjust based on serving size
    caffeine = (caffeine * input.servingSize) / 250; // Base on 250ml serving

    return {
      caffeine: Math.round(caffeine),
      ingredients: flavorData.ingredients,
      dilution: this.getDilutionRatio(input),
      valid: caffeine <= this.getMaxCaffeine(input.category)
    };
  }

  private getDilutionRatio(input: CalculatorInput): string {
    const ratios = {
      classic: '1:6',
      energy: '1:4',
      hybrid: '1:5'
    };
    return ratios[input.category];
  }

  private getMaxCaffeine(category: string): number {
    const limits = {
      classic: 50,
      energy: 160,
      hybrid: 128
    };
    return limits[category as keyof typeof limits] || 100;
  }

  private calculateCostPerServing(input: CalculatorInput, volume: number): number {
    // Base cost calculation
    const baseCost = {
      diy: 0.15,
      premade: 0.45,
      hybrid: 0.35
    }[input.mode];

    // Volume scaling factor (economies of scale)
    const scalingFactor = volume > 1000 ? 0.9 : volume > 500 ? 0.95 : 1.0;
    
    return (baseCost * scalingFactor * volume) / 1000;
  }

  private calculatePreparationTime(input: CalculatorInput, volume: number): number {
    const baseTime = {
      diy: 15,
      premade: 5,
      hybrid: 10
    }[input.mode];

    // Time scaling (not linear due to setup time)
    const setupTime = 2;
    const perServingTime = baseTime / (input.batchSize || 10);
    
    return setupTime + (perServingTime * volume / input.servingSize);
  }

  private calculateWaste(input: CalculatorInput, volume: number): number {
    // Waste factors by volume and mode
    const baseWaste = {
      diy: 0.1,
      premade: 0.05,
      hybrid: 0.07
    }[input.mode];

    // Larger batches have less waste percentage
    const volumeFactor = volume > 2000 ? 0.8 : volume > 1000 ? 0.9 : 1.0;
    
    return baseWaste * volumeFactor;
  }

  private calculateEfficiency(input: CalculatorInput, volume: number): number {
    const cost = this.calculateCostPerServing(input, volume);
    const time = this.calculatePreparationTime(input, volume);
    const waste = this.calculateWaste(input, volume);
    
    // Efficiency score (lower is better for cost/time, higher is better for waste)
    const costScore = Math.max(0, 100 - cost * 10);
    const timeScore = Math.max(0, 100 - time * 2);
    const wasteScore = Math.max(0, 100 - waste * 100);
    
    return (costScore + timeScore + wasteScore) / 3;
  }

  private findOptimalBatchSize(results: any[]): any {
    // Find the batch size with best efficiency score
    return results.reduce((best, current) => 
      current.efficiency > best.efficiency ? current : best
    );
  }

  private generateEquipmentRecommendations(volume: number): any[] {
    const equipment = [];
    
    if (volume > 500) {
      equipment.push({
        type: 'Large Mixing Container',
        capacity: volume,
        cost: 25,
        efficiency: 95
      });
    }
    
    if (volume > 1000) {
      equipment.push({
        type: 'Digital Scale',
        capacity: 5000,
        cost: 45,
        efficiency: 98
      });
    }
    
    return equipment;
  }

  private calculateStorageRequirements(volume: number): any {
    return {
      space: `${Math.ceil(volume / 1000)}L`,
      temperature: 'Cool, dry place',
      shelfLife: volume > 1000 ? 7 : 3 // days
    };
  }

  private calculateWasteReduction(input: CalculatorInput, results: any[]): any {
    const best = this.findOptimalBatchSize(results);
    const currentWaste = this.calculateWaste(input, input.targetVolume);
    const optimalWaste = this.calculateWaste(input, best.volume);
    
    return {
      percentage: ((currentWaste - optimalWaste) / currentWaste) * 100,
      strategies: [
        'Use optimal batch sizes',
        'Store in proper containers',
        'Use within recommended timeframe'
      ]
    };
  }

  private isLinearScaling(results: any[]): boolean {
    // Check if efficiency scales linearly with volume
    const efficiencies = results.map(r => r.efficiency);
    const variance = this.calculateVariance(efficencies);
    return variance < 5; // Low variance indicates linear scaling
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private async getAmazonProducts(flavorData: FlavorRecipe): Promise<any[]> {
    // Mock Amazon products - in real implementation, this would call Amazon API
    return [
      {
        asin: 'B08N5WRWNW',
        title: `${flavorData.name} - Premium Syrup`,
        price: 12.99,
        currency: 'EUR',
        availability: 'in-stock',
        affiliateUrl: 'https://amazon.de/dp/B08N5WRWNW?tag=affiliate-20',
        rating: 4.5,
        primeEligible: true
      },
      {
        asin: 'B08N5WRWNX',
        title: `${flavorData.name} - Value Pack`,
        price: 8.99,
        currency: 'EUR',
        availability: 'in-stock',
        affiliateUrl: 'https://amazon.de/dp/B08N5WRWNX?tag=affiliate-20',
        rating: 4.2,
        primeEligible: false
      }
    ];
  }

  private generateBulkOptions(products: any[], batchSize: number): any[] {
    return products.map(product => {
      const quantity = Math.ceil(batchSize / 10); // Assume 10 servings per bottle
      const pricePerUnit = product.price * (1 - (quantity > 5 ? 0.15 : 0.05));
      const totalPrice = pricePerUnit * quantity;
      
      return {
        quantity,
        pricePerUnit,
        totalPrice,
        savings: (product.price * quantity) - totalPrice
      };
    });
  }

  private generateAmazonRecommendations(products: any[], input: CalculatorInput): string[] {
    const recommendations = [];
    
    if (products.some(p => p.primeEligible)) {
      recommendations.push('Prime eligible products offer fastest delivery');
    }
    
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const cheapest = Math.min(...products.map(p => p.price));
    
    if (cheapest < avgPrice * 0.8) {
      recommendations.push('Best value option available below average price');
    }
    
    return recommendations;
  }

  private validateSafety(input: CalculatorInput, basicResult: any): any {
    const maxCaffeine = this.getMaxCaffeine(input.category);
    const warnings = [];
    
    if (basicResult.caffeine > maxCaffeine) {
      warnings.push({
        type: 'caffeine',
        message: `Caffeine content (${basicResult.caffeine}mg) exceeds ${input.category} category limit`,
        severity: 'warning'
      });
    }
    
    if (input.age < 18 && basicResult.caffeine > 50) {
      warnings.push({
        type: 'age',
        message: 'High caffeine not recommended for minors',
        severity: 'warning'
      });
    }
    
    return {
      valid: warnings.filter(w => w.severity === 'error').length === 0,
      warnings,
      compliance: Math.max(0, 100 - (warnings.length * 20))
    };
  }

  private generateRecommendations(input: CalculatorInput, results: any): any {
    const { costAnalysis, basic, safetyValidation } = results;
    
    let preferred = input.mode;
    const reasoning = [];
    
    if (costAnalysis) {
      const recommendation = costAnalysis.recommendation.preferred;
      preferred = recommendation;
      reasoning.push(...costAnalysis.recommendation.reasoning);
    }
    
    if (!safetyValidation.valid) {
      reasoning.push('Safety validation indicates need for adjustments');
    }
    
    return {
      approach: preferred,
      reasoning,
      alternatives: [
        {
          approach: 'diy',
          cost: costAnalysis?.diy.totalCost || 0,
          quality: costAnalysis?.qualityAssessment.diy.overallRating || 0,
          when: 'Best for fresh ingredients and customization'
        },
        {
          approach: 'premade',
          cost: costAnalysis?.premade.totalCost || 0,
          quality: costAnalysis?.qualityAssessment.premade.overallRating || 0,
          when: 'Best for convenience and consistency'
        }
      ]
    };
  }

  private async performCostAnalysis(input: CalculatorInput, basicResult: any): Promise<ComprehensiveCostAnalysis> {
    const diyRecipe = {
      ingredients: basicResult.ingredients.map((ing: any) => ({
        id: ing.ingredientId,
        name: ing.ingredientId,
        amount: ing.amount,
        unit: 'ml',
        cost: 0.5,
        supplier: 'local',
        shelfLife: 30
      })),
      laborTime: this.calculatePreparationTime(input, input.targetVolume),
      equipmentNeeded: ['mixing-bowl', 'measuring-cups'],
      difficulty: 'intermediate' as const
    };
    
    return await this.costAnalyzer.analyzeCostComparison({
      targetFlavor: input.targetFlavor,
      diyRecipe,
      targetServingSize: input.servingSize,
      batchSize: input.batchSize,
      region: input.region,
      currency: input.currency,
      qualityPreference: input.qualityPreference,
      timeframe: input.timePreference
    });
  }

  private initializeAnalytics(): CalculatorAnalytics {
    return {
      usage: {
        mode: { diy: 0, premade: 0, hybrid: 0 },
        category: { classic: 0, energy: 0, hybrid: 0 },
        features: { batchOptimization: 0, amazonIntegration: 0, regionalAdaptation: 0 }
      },
      efficiency: {
        averageCalculationTime: 0,
        userSatisfaction: 0,
        errorRate: 0,
        featureAdoption: {}
      },
      insights: {
        popularCombinations: [],
        optimizationOpportunities: [],
        userBehaviorPatterns: {}
      }
    };
  }

  private updateAnalytics(input: CalculatorInput, results: any): void {
    // Update usage statistics
    this.analytics.usage.mode[input.mode]++;
    this.analytics.usage.category[input.category]++;
    
    if (results.batchOptimization) {
      this.analytics.usage.features.batchOptimization++;
    }
    if (results.amazonIntegration) {
      this.analytics.usage.features.amazonIntegration++;
    }
    if (results.regionalAdaptation) {
      this.analytics.usage.features.regionalAdaptation++;
    }
  }

  // Placeholder methods for additional features
  private generateVisualRecipe(recipe: any): any {
    return {
      ingredients: recipe.ingredients,
      steps: recipe.instructions,
      visual: 'ingredient-diagram'
    };
  }

  private generateRealTimeFeedback(input: CalculatorInput, recipe: any): any {
    return {
      cost: this.calculateCostPerServing(input, input.targetVolume),
      caffeine: recipe.caffeine,
      validity: true,
      suggestions: ['Consider reducing batch size for better efficiency']
    };
  }

  private getCustomizationOptions(input: CalculatorInput): any[] {
    return [
      {
        id: 'sweetness',
        name: 'Sweetness Level',
        options: ['Light', 'Medium', 'Sweet'],
        current: 'Medium'
      },
      {
        id: 'carbonation',
        name: 'Carbonation',
        options: ['Still', 'Light', 'Sparkling'],
        current: 'Sparkling'
      }
    ];
  }

  private validateRecipeRealtime(recipe: any): any {
    return {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }
}