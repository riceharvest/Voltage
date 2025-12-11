/**
 * Cost Comparison Analysis System
 * 
 * Provides comprehensive cost analysis comparing DIY recipe costs vs premade products,
 * regional price variations, bulk purchasing recommendations, and cost per serving calculations.
 */

import { FlavorRecipe, BaseRecipe, CompleteRecipe, AmazonProduct } from './types';
import { amazonURLGenerator } from './amazon-regional';
import { withFallback } from './amazon-fallback';
import { logger } from './logger';

export interface RecipeCost {
  totalCost: number;
  currency: string;
  costPerServing: number;
  servingSize: number;
  ingredients: Array<{
    id: string;
    name: string;
    cost: number;
    quantity: number;
    unit: string;
    supplier: string;
  }>;
  laborCost?: number;
  equipmentCost?: number;
  wastageCost?: number;
}

export interface PremadeCost {
  productCost: number;
  currency: string;
  costPerServing: number;
  servingSize: number;
  quantity: number;
  brand: string;
  asin: string;
  amazonUrl: string;
  shippingCost?: number;
  totalCost: number;
}

export interface CostComparison {
  recipeId: string;
  recipeName: string;
  diy: RecipeCost;
  premade: PremadeCost;
  savings: {
    absolute: number;
    percentage: number;
    perServing: number;
  };
  recommendation: 'diy' | 'premade' | 'tie';
  factors: Array<{
    type: 'cost' | 'convenience' | 'quality' | 'customization' | 'availability';
    diyScore: number;
    premadeScore: number;
    description: string;
  }>;
  breakEvenPoint?: number; // Number of servings where costs equal
  regionalVariations: Array<{
    region: string;
    diyCost: number;
    premadeCost: number;
    savings: number;
    currency: string;
  }>;
}

export interface BulkPurchaseAnalysis {
  product: AmazonProduct;
  optimalQuantity: number;
  costBreakdown: Array<{
    quantity: number;
    unitCost: number;
    totalCost: number;
    savings: number;
    savingsPercentage: number;
  }>;
  recommendations: Array<{
    type: 'individual' | 'bulk' | 'subscription' | 'bundle';
    description: string;
    quantity: number;
    totalCost: number;
    savings: number;
  }>;
}

export interface PriceHistoryAnalysis {
  asin: string;
  productName: string;
  priceHistory: Array<{
    date: Date;
    price: number;
    currency: string;
  }>;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    bestBuyDate?: Date;
    predictedNextPrice?: number;
  };
  recommendations: Array<{
    type: 'buy-now' | 'wait' | 'bulk-buy' | 'subscribe';
    confidence: number;
    reason: string;
    potentialSavings?: number;
  }>;
}

export interface CostOptimizationOptions {
  targetServings: number;
  qualityPreference: 'budget' | 'balanced' | 'premium';
  timeConstraint: 'no-rush' | 'normal' | 'urgent';
  bulkDiscountThreshold?: number;
  includeShipping: boolean;
  includeTaxes: boolean;
}

/**
 * Cost comparison and analysis service
 */
export class CostComparisonService {
  private ingredientPrices: Map<string, Map<string, number>> = new Map(); // ingredientId -> region -> price
  private baseRecipes: Map<string, BaseRecipe> = new Map();
  private recipes: Map<string, FlavorRecipe> = new Map();

  constructor() {
    this.initializeIngredientPrices();
  }

  /**
   * Compare DIY recipe costs vs premade products
   */
  async compareRecipeCosts(
    recipeId: string,
    targetServings: number = 4,
    region: string = 'US'
  ): Promise<CostComparison> {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      throw new Error(`Recipe ${recipeId} not found`);
    }

    // Calculate DIY costs
    const diyCost = await this.calculateDIYCost(recipe, targetServings, region);

    // Get premade product costs
    const premadeCost = await this.getPremadeCost(recipe, targetServings, region);

    // Calculate savings and recommendations
    const savings = {
      absolute: premadeCost.totalCost - diyCost.totalCost,
      percentage: ((premadeCost.totalCost - diyCost.totalCost) / premadeCost.totalCost) * 100,
      perServing: (premadeCost.totalCost - diyCost.totalCost) / targetServings
    };

    const recommendation = this.determineRecommendation(diyCost, premadeCost, savings);
    const factors = this.analyzeDecisionFactors(diyCost, premadeCost);
    const breakEvenPoint = this.calculateBreakEvenPoint(diyCost, premadeCost);
    const regionalVariations = await this.analyzeRegionalVariations(recipe, targetServings);

    return {
      recipeId,
      recipeName: recipe.name,
      diy: diyCost,
      premade: premadeCost,
      savings,
      recommendation,
      factors,
      breakEvenPoint,
      regionalVariations
    };
  }

  /**
   * Analyze bulk purchasing options
   */
  async analyzeBulkPurchases(
    asin: string,
    region: string = 'US',
    targetQuantity?: number
  ): Promise<BulkPurchaseAnalysis> {
    const product = await this.getAmazonProduct(asin, region);
    if (!product) {
      throw new Error(`Product ${asin} not found in region ${region}`);
    }

    // Analyze different quantity options
    const costBreakdown = await this.calculateBulkPricing(product, region);
    
    // Find optimal quantity
    const optimalQuantity = this.findOptimalQuantity(costBreakdown, targetQuantity);

    // Generate recommendations
    const recommendations = this.generateBulkRecommendations(costBreakdown, optimalQuantity);

    return {
      product,
      optimalQuantity,
      costBreakdown,
      recommendations
    };
  }

  /**
   * Analyze price history for buying recommendations
   */
  async analyzePriceHistory(asin: string, region: string = 'US'): Promise<PriceHistoryAnalysis> {
    const product = await this.getAmazonProduct(asin, region);
    if (!product) {
      throw new Error(`Product ${asin} not found`);
    }

    // Get price history (in real implementation, this would come from historical data)
    const priceHistory = await this.getPriceHistory(asin, region);
    
    const trends = this.analyzePriceTrends(priceHistory);
    const recommendations = this.generateBuyRecommendations(trends, priceHistory);

    return {
      asin,
      productName: product.title,
      priceHistory,
      trends,
      recommendations
    };
  }

  /**
   * Calculate DIY recipe cost
   */
  private async calculateDIYCost(
    recipe: FlavorRecipe,
    targetServings: number,
    region: string
  ): Promise<RecipeCost> {
    const baseRecipe = this.getBaseRecipe(recipe.compatibleBases[0]);
    if (!baseRecipe) {
      throw new Error(`Base recipe ${recipe.compatibleBases[0]} not found`);
    }

    const totalCost = {
      ingredients: 0,
      labor: 0,
      equipment: 0,
      wastage: 0
    };

    const ingredientCosts: RecipeCost['ingredients'] = [];

    // Calculate base recipe costs
    for (const baseIngredient of baseRecipe.ingredients) {
      const cost = await this.getIngredientCost(baseIngredient.ingredientId, baseIngredient.amount, region);
      ingredientCosts.push({
        id: baseIngredient.ingredientId,
        name: this.getIngredientName(baseIngredient.ingredientId),
        cost: cost,
        quantity: baseIngredient.amount,
        unit: this.getIngredientUnit(baseIngredient.ingredientId),
        supplier: 'Amazon'
      });
      totalCost.ingredients += cost;
    }

    // Calculate flavor recipe costs
    for (const flavorIngredient of recipe.ingredients) {
      const cost = await this.getIngredientCost(flavorIngredient.ingredientId, flavorIngredient.amount, region);
      ingredientCosts.push({
        id: flavorIngredient.ingredientId,
        name: this.getIngredientName(flavorIngredient.ingredientId),
        cost: cost,
        quantity: flavorIngredient.amount,
        unit: this.getIngredientUnit(flavorIngredient.ingredientId),
        supplier: 'Amazon'
      });
      totalCost.ingredients += cost;
    }

    // Calculate labor costs (time * hourly rate)
    const preparationTime = this.estimatePreparationTime(recipe);
    const hourlyRate = this.getRegionalHourlyRate(region);
    totalCost.labor = preparationTime * hourlyRate;

    // Calculate equipment costs (amortized)
    totalCost.equipment = this.calculateEquipmentCosts(recipe, targetServings);

    // Calculate wastage costs
    totalCost.wastage = totalCost.ingredients * 0.05; // 5% wastage assumption

    const finalCost = totalCost.ingredients + totalCost.labor + totalCost.equipment + totalCost.wastage;

    return {
      totalCost: finalCost,
      currency: this.getRegionCurrency(region),
      costPerServing: finalCost / targetServings,
      servingSize: targetServings,
      ingredients: ingredientCosts,
      laborCost: totalCost.labor,
      equipmentCost: totalCost.equipment,
      wastageCost: totalCost.wastage
    };
  }

  /**
   * Get premade product cost
   */
  private async getPremadeCost(
    recipe: FlavorRecipe,
    targetServings: number,
    region: string
  ): Promise<PremadeCost> {
    if (!recipe.premadeProducts || recipe.premadeProducts.length === 0) {
      throw new Error(`No premade products found for recipe ${recipe.id}`);
    }

    // Find best matching premade product
    const product = await this.findBestMatchingProduct(recipe.premadeProducts, region);
    if (!product) {
      throw new Error(`No suitable premade product found for region ${region}`);
    }

    // Calculate how many units needed for target servings
    const servingSize = this.extractServingSize(product.title);
    const unitsNeeded = Math.ceil(targetServings / servingSize);

    // Get current pricing with fallback handling
    const { data: pricingData } = await withFallback(
      () => this.getProductPricing([product.asin], region),
      { operation: 'getPremadeCost', asin: product.asin, region }
    );

    let unitPrice = product.price;
    let shippingCost = 0;

    if (pricingData && pricingData[0]) {
      unitPrice = pricingData[0].currentPrice;
      shippingCost = this.calculateShippingCost(unitPrice * unitsNeeded, region);
    }

    const productCost = unitPrice * unitsNeeded;
    const totalCost = productCost + shippingCost;

    return {
      productCost,
      currency: product.currency,
      costPerServing: totalCost / targetServings,
      servingSize: servingSize,
      quantity: unitsNeeded,
      brand: product.brand || 'Unknown',
      asin: product.asin,
      amazonUrl: await amazonURLGenerator.generateProductURL(product.asin, region),
      shippingCost,
      totalCost
    };
  }

  /**
   * Analyze regional price variations
   */
  private async analyzeRegionalVariations(
    recipe: FlavorRecipe,
    targetServings: number
  ): Promise<CostComparison['regionalVariations']> {
    const regions = ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'];
    const variations: CostComparison['regionalVariations'] = [];

    for (const region of regions) {
      try {
        const diyCost = await this.calculateDIYCost(recipe, targetServings, region);
        const premadeCost = await this.getPremadeCost(recipe, targetServings, region);
        
        variations.push({
          region,
          diyCost: diyCost.totalCost,
          premadeCost: premadeCost.totalCost,
          savings: premadeCost.totalCost - diyCost.totalCost,
          currency: diyCost.currency
        });
      } catch (error) {
        logger.warn(`Failed to analyze costs for region ${region}`, { error: error.message });
      }
    }

    return variations.sort((a, b) => b.savings - a.savings);
  }

  /**
   * Calculate bulk pricing breakdown
   */
  private async calculateBulkPricing(
    product: AmazonProduct,
    region: string
  ): Promise<BulkPurchaseAnalysis['costBreakdown']> {
    const quantities = [1, 6, 12, 24, 48, 96]; // Common bulk quantities
    
    const breakdown: BulkPurchaseAnalysis['costBreakdown'] = [];

    for (const quantity of quantities) {
      const { data: pricingData } = await withFallback(
        () => this.getProductPricing([product.asin], region),
        { operation: 'calculateBulkPricing', asin: product.asin, region }
      );

      const basePrice = pricingData?.[0]?.currentPrice || product.price;
      const shippingCost = this.calculateBulkShippingCost(basePrice * quantity, region);
      
      const unitCost = (basePrice * quantity + shippingCost) / quantity;
      const totalCost = basePrice * quantity + shippingCost;
      const savings = (basePrice - unitCost) * quantity;
      const savingsPercentage = ((basePrice - unitCost) / basePrice) * 100;

      breakdown.push({
        quantity,
        unitCost,
        totalCost,
        savings,
        savingsPercentage
      });
    }

    return breakdown;
  }

  /**
   * Initialize ingredient prices database
   */
  private initializeIngredientPrices(): void {
    // Mock ingredient prices by region (in reality, this would be from APIs)
    const mockPrices: Record<string, Record<string, number>> = {
      'caffeine': {
        'US': 0.05, 'UK': 0.04, 'DE': 0.045, 'FR': 0.042, 'NL': 0.043,
        'CA': 0.055, 'AU': 0.06, 'JP': 0.048
      },
      'sugar': {
        'US': 0.002, 'UK': 0.0025, 'DE': 0.0022, 'FR': 0.0023, 'NL': 0.0021,
        'CA': 0.0025, 'AU': 0.003, 'JP': 0.0028
      },
      'citric-acid': {
        'US': 0.015, 'UK': 0.018, 'DE': 0.016, 'FR': 0.017, 'NL': 0.0165,
        'CA': 0.017, 'AU': 0.02, 'JP': 0.019
      }
    };

    for (const [ingredientId, regionPrices] of Object.entries(mockPrices)) {
      this.ingredientPrices.set(ingredientId, new Map(Object.entries(regionPrices)));
    }
  }

  /**
   * Get ingredient cost with fallback
   */
  private async getIngredientCost(
    ingredientId: string,
    quantity: number,
    region: string
  ): Promise<number> {
    const prices = this.ingredientPrices.get(ingredientId);
    if (!prices) {
      logger.warn(`No price data for ingredient ${ingredientId}`);
      return 0;
    }

    const pricePerUnit = prices.get(region) || prices.get('US') || 0;
    return pricePerUnit * quantity;
  }

  /**
   * Get ingredient name
   */
  private getIngredientName(ingredientId: string): string {
    const names: Record<string, string> = {
      'caffeine': 'Caffeine',
      'sugar': 'Sugar',
      'citric-acid': 'Citric Acid',
      'flavoring': 'Natural Flavoring',
      'preservative': 'Preservative'
    };
    return names[ingredientId] || ingredientId;
  }

  /**
   * Get ingredient unit
   */
  private getIngredientUnit(ingredientId: string): string {
    const units: Record<string, string> = {
      'caffeine': 'mg',
      'sugar': 'g',
      'citric-acid': 'g',
      'flavoring': 'ml',
      'preservative': 'g'
    };
    return units[ingredientId] || 'g';
  }

  /**
   * Get base recipe
   */
  private getBaseRecipe(baseId: string): BaseRecipe | undefined {
    return this.baseRecipes.get(baseId);
  }

  /**
   * Estimate preparation time
   */
  private estimatePreparationTime(recipe: FlavorRecipe): number {
    // Base time plus complexity factor
    const baseTime = 15; // 15 minutes base
    const complexity = recipe.ingredients.length * 2; // 2 minutes per ingredient
    return baseTime + complexity;
  }

  /**
   * Get regional hourly rate
   */
  private getRegionalHourlyRate(region: string): number {
    const rates: Record<string, number> = {
      'US': 15, 'UK': 12, 'DE': 14, 'FR': 13, 'NL': 13,
      'CA': 14, 'AU': 16, 'JP': 11
    };
    return rates[region] || 12;
  }

  /**
   * Calculate equipment costs
   */
  private calculateEquipmentCosts(recipe: FlavorRecipe, servings: number): number {
    // Amortize equipment costs over expected uses
    const equipmentCost = 50; // $50 for basic equipment
    const expectedUses = 100; // 100 uses expected
    return equipmentCost / expectedUses;
  }

  /**
   * Calculate shipping cost
   */
  private calculateShippingCost(totalValue: number, region: string): number {
    const shippingRates: Record<string, number> = {
      'US': Math.min(totalValue * 0.05, 15), // 5% or $15 max
      'UK': Math.min(totalValue * 0.06, 20),
      'DE': Math.min(totalValue * 0.06, 18),
      'FR': Math.min(totalValue * 0.07, 22),
      'NL': Math.min(totalValue * 0.06, 16),
      'CA': Math.min(totalValue * 0.08, 25),
      'AU': Math.min(totalValue * 0.15, 35),
      'JP': Math.min(totalValue * 0.12, 30)
    };
    return shippingRates[region] || totalValue * 0.1;
  }

  /**
   * Calculate bulk shipping cost
   */
  private calculateBulkShippingCost(totalValue: number, region: string): number {
    const baseShipping = this.calculateShippingCost(totalValue, region);
    return baseShipping * 0.8; // 20% discount for bulk orders
  }

  /**
   * Extract serving size from product title
   */
  private extractServingSize(title: string): number {
    const match = title.match(/(\d+)\s*(ml|oz|liter|litre)/i);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.includes('oz')) return amount / 8; // Convert oz to servings (8oz = 1 serving)
      if (unit.includes('ml')) return amount / 250; // Convert ml to servings (250ml = 1 serving)
      if (unit.includes('liter') || unit.includes('litre')) return (amount * 1000) / 250;
    }
    
    return 1; // Default to 1 serving
  }

  /**
   * Find best matching product
   */
  private async findBestMatchingProduct(
    products: AmazonProduct[],
    region: string
  ): Promise<AmazonProduct | null> {
    return products.find(p => p.region === region) || products[0] || null;
  }

  /**
   * Get Amazon product pricing
   */
  private async getProductPricing(asins: string[], region: string): Promise<any[]> {
    // This would make actual API calls in production
    return asins.map(asin => ({
      asin,
      currentPrice: 4.99 + Math.random() * 5, // Mock price
      currency: 'USD'
    }));
  }

  /**
   * Get Amazon product
   */
  private async getAmazonProduct(asin: string, region: string): Promise<AmazonProduct | null> {
    // Mock implementation
    return {
      asin,
      region,
      price: 4.99,
      currency: 'USD',
      availability: 'in-stock',
      affiliateUrl: `https://amazon.com/dp/${asin}`,
      title: `Product ${asin}`
    };
  }

  /**
   * Get price history
   */
  private async getPriceHistory(asin: string, region: string): Promise<Array<{ date: Date; price: number; currency: string }>> {
    // Mock price history
    const history = [];
    const basePrice = 4.99;
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const price = basePrice + (Math.random() - 0.5) * 2; // Random variation
      history.push({
        date,
        price: Math.max(price, basePrice * 0.8), // Don't go below 80% of base
        currency: 'USD'
      });
    }
    
    return history;
  }

  /**
   * Analyze price trends
   */
  private analyzePriceTrends(history: Array<{ date: Date; price: number; currency: string }>): PriceHistoryAnalysis['trends'] {
    if (history.length < 2) {
      return { direction: 'stable', volatility: 0 };
    }

    const recent = history.slice(-7);
    const older = history.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, h) => sum + h.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.price, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    // Calculate volatility
    const prices = history.map(h => h.price);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / avg * 100;
    
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (change > 2) direction = 'increasing';
    else if (change < -2) direction = 'decreasing';
    else direction = 'stable';
    
    return {
      direction,
      volatility,
      bestBuyDate: prices.indexOf(Math.min(...prices)) >= 0 ? history[prices.indexOf(Math.min(...prices))].date : undefined,
      predictedNextPrice: recentAvg * (1 + change / 100)
    };
  }

  /**
   * Generate buy recommendations
   */
  private generateBuyRecommendations(
    trends: PriceHistoryAnalysis['trends'],
    history: Array<{ date: Date; price: number; currency: string }>
  ): PriceHistoryAnalysis['recommendations'] {
    const recommendations = [];
    
    if (trends.direction === 'decreasing') {
      recommendations.push({
        type: 'buy-now',
        confidence: 0.8,
        reason: 'Prices are trending downward',
        potentialSavings: trends.volatility * 0.5
      });
    } else if (trends.direction === 'increasing') {
      recommendations.push({
        type: 'wait',
        confidence: 0.7,
        reason: 'Prices are trending upward',
        potentialSavings: trends.volatility * 0.3
      });
    }
    
    if (trends.volatility > 15) {
      recommendations.push({
        type: 'bulk-buy',
        confidence: 0.6,
        reason: 'High price volatility suggests bulk buying opportunity'
      });
    }
    
    return recommendations;
  }

  /**
   * Determine recommendation
   */
  private determineRecommendation(
    diyCost: RecipeCost,
    premadeCost: PremadeCost,
    savings: { percentage: number }
  ): 'diy' | 'premade' | 'tie' {
    if (savings.percentage > 20) return 'diy';
    if (savings.percentage < -20) return 'premade';
    return 'tie';
  }

  /**
   * Analyze decision factors
   */
  private analyzeDecisionFactors(
    diyCost: RecipeCost,
    premadeCost: PremadeCost
  ): CostComparison['factors'] {
    return [
      {
        type: 'cost',
        diyScore: diyCost.totalCost < premadeCost.totalCost ? 10 : 5,
        premadeScore: premadeCost.totalCost < diyCost.totalCost ? 10 : 5,
        description: 'Cost comparison'
      },
      {
        type: 'convenience',
        diyScore: 3,
        premadeScore: 10,
        description: 'Time and effort required'
      },
      {
        type: 'quality',
        diyScore: 8,
        premadeScore: 6,
        description: 'Control over ingredients and quality'
      },
      {
        type: 'customization',
        diyScore: 10,
        premadeScore: 3,
        description: 'Ability to customize flavor and ingredients'
      },
      {
        type: 'availability',
        diyScore: 9,
        premadeScore: 7,
        description: 'Ingredient and product availability'
      }
    ];
  }

  /**
   * Calculate break-even point
   */
  private calculateBreakEvenPoint(diyCost: RecipeCost, premadeCost: PremadeCost): number | undefined {
    if (premadeCost.costPerServing === diyCost.costPerServing) {
      return undefined; // No break-even point
    }
    
    const difference = Math.abs(premadeCost.costPerServing - diyCost.costPerServing);
    if (difference < 0.01) {
      return undefined; // Costs are effectively equal
    }
    
    // When costs per serving are equal
    // Fixed DIY cost + (variable cost per serving * servings) = Premade cost per serving * servings
    // servings = Fixed DIY cost / (Premade cost per serving - Variable DIY cost per serving)
    
    const fixedDIYCost = diyCost.totalCost - (diyCost.costPerServing * diyCost.servingSize);
    const variableDIYCostPerServing = diyCost.costPerServing;
    
    if (premadeCost.costPerServing <= variableDIYCostPerServing) {
      return undefined; // Premade is always cheaper per serving
    }
    
    return Math.ceil(fixedDIYCost / (premadeCost.costPerServing - variableDIYCostPerServing));
  }

  /**
   * Find optimal quantity
   */
  private findOptimalQuantity(
    breakdown: BulkPurchaseAnalysis['costBreakdown'],
    targetQuantity?: number
  ): number {
    if (targetQuantity) {
      return targetQuantity;
    }
    
    // Find quantity with best savings percentage
    return breakdown.reduce((best, current) => 
      current.savingsPercentage > best.savingsPercentage ? current : best
    ).quantity;
  }

  /**
   * Generate bulk recommendations
   */
  private generateBulkRecommendations(
    breakdown: BulkPurchaseAnalysis['costBreakdown'],
    optimalQuantity: number
  ): BulkPurchaseAnalysis['recommendations'] {
    const recommendations = [];
    
    // Individual purchase
    const individual = breakdown.find(b => b.quantity === 1);
    if (individual) {
      recommendations.push({
        type: 'individual',
        description: 'Buy as needed',
        quantity: 1,
        totalCost: individual.totalCost,
        savings: 0
      });
    }
    
    // Bulk purchase
    const bulk = breakdown.find(b => b.quantity === optimalQuantity);
    if (bulk) {
      recommendations.push({
        type: 'bulk',
        description: 'Optimal bulk purchase',
        quantity: bulk.quantity,
        totalCost: bulk.totalCost,
        savings: bulk.savings
      });
    }
    
    // Subscription recommendation
    recommendations.push({
      type: 'subscription',
      description: 'Subscribe & Save (if available)',
      quantity: optimalQuantity,
      totalCost: bulk ? bulk.totalCost * 0.85 : 0, // 15% subscription discount
      savings: bulk ? bulk.savings * 1.15 : 0
    });
    
    return recommendations;
  }

  /**
   * Get region currency
   */
  private getRegionCurrency(region: string): string {
    const currencies: Record<string, string> = {
      'US': 'USD', 'UK': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'NL': 'EUR',
      'CA': 'CAD', 'AU': 'AUD', 'JP': 'JPY'
    };
    return currencies[region] || 'USD';
  }
}

/**
 * Global cost comparison service instance
 */
export const costComparisonService = new CostComparisonService();

/**
 * Convenience functions
 */
export async function compareRecipeCosts(
  recipeId: string,
  targetServings: number = 4,
  region: string = 'US'
): Promise<CostComparison> {
  return costComparisonService.compareRecipeCosts(recipeId, targetServings, region);
}

export async function analyzeBulkPurchases(
  asin: string,
  region: string = 'US',
  targetQuantity?: number
): Promise<BulkPurchaseAnalysis> {
  return costComparisonService.analyzeBulkPurchases(asin, region, targetQuantity);
}

export async function analyzePriceHistory(
  asin: string,
  region: string = 'US'
): Promise<PriceHistoryAnalysis> {
  return costComparisonService.analyzePriceHistory(asin, region);
}

export default {
  CostComparisonService,
  costComparisonService,
  compareRecipeCosts,
  analyzeBulkPurchases,
  analyzePriceHistory
};