/**
 * Product & Recipe Analytics Service
 * 
 * Analyzes product performance, recipe popularity, and ingredient usage trends.
 * Provides insights for inventory management and product development.
 * 
 * @module ProductAnalytics
 */

export interface RecipeMetrics {
  recipeId: string;
  name: string;
  views: number;
  calculations: number;
  saves: number;
  shares: number;
  avgRating: number;
  completionRate: number;
  ingredients: string[];
  baseType: string;
}

export interface IngredientTrend {
  ingredientId: string;
  name: string;
  usageCount: number;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  seasonalPeak: string | null;
}

export interface ProductInsight {
  type: 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  metric: string;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

class ProductAnalyticsService {
  
  /**
   * Analyze recipe performance
   */
  public analyzeRecipePerformance(recipes: RecipeMetrics[]): {
    topPerformers: RecipeMetrics[];
    underperformers: RecipeMetrics[];
    risingStars: RecipeMetrics[];
  } {
    const sortedByEngagement = [...recipes].sort((a, b) => 
      (b.calculations + b.shares) - (a.calculations + a.shares)
    );

    const sortedByGrowth = [...recipes].sort((a, b) => b.completionRate - a.completionRate);

    return {
      topPerformers: sortedByEngagement.slice(0, 10),
      underperformers: sortedByEngagement.slice(-10),
      risingStars: sortedByGrowth.filter(r => r.views < 1000 && r.completionRate > 80).slice(0, 5)
    };
  }

  /**
   * Analyze ingredient usage trends
   */
  public analyzeIngredientTrends(usageData: any[]): IngredientTrend[] {
    // In a real implementation, this would aggregate usage data over time
    // For now, we return mock trends
    return [
      {
        ingredientId: 'caffeine_anhydrous',
        name: 'Caffeine Anhydrous',
        usageCount: 15420,
        trend: 'stable',
        growthRate: 2.1,
        seasonalPeak: null
      },
      {
        ingredientId: 'stevia',
        name: 'Stevia Extract',
        usageCount: 8950,
        trend: 'up',
        growthRate: 15.4,
        seasonalPeak: 'summer'
      },
      {
        ingredientId: 'taurine',
        name: 'Taurine',
        usageCount: 12100,
        trend: 'down',
        growthRate: -3.2,
        seasonalPeak: null
      }
    ];
  }

  /**
   * Generate product development insights
   */
  public generateProductInsights(recipes: RecipeMetrics[], trends: IngredientTrend[]): ProductInsight[] {
    const insights: ProductInsight[] = [];

    // Analyze flavor combinations
    const popularBases = this.getPopularBases(recipes);
    if (popularBases[0].count > recipes.length * 0.4) {
      insights.push({
        type: 'trend',
        title: `Dominant Base: ${popularBases[0].base}`,
        description: `${popularBases[0].base} is used in 40% of top recipes.`,
        metric: `${popularBases[0].percentage}% share`,
        impact: 'high',
        action: 'Develop more variations of this base'
      });
    }

    // Analyze rising ingredients
    const risingIngredient = trends.find(t => t.growthRate > 10);
    if (risingIngredient) {
      insights.push({
        type: 'opportunity',
        title: `Rising Star: ${risingIngredient.name}`,
        description: `${risingIngredient.name} usage is growing rapidly (+${risingIngredient.growthRate}%).`,
        metric: 'High Growth',
        impact: 'medium',
        action: 'Feature recipes using this ingredient'
      });
    }

    // Identify underperforming popular categories
    const underperformingHighView = recipes.find(r => r.views > 5000 && r.completionRate < 30);
    if (underperformingHighView) {
      insights.push({
        type: 'warning',
        title: 'High Interest, Low Completion',
        description: `Recipe "${underperformingHighView.name}" attracts views but fails to convert.`,
        metric: `${underperformingHighView.completionRate}% completion`,
        impact: 'high',
        action: 'Review recipe complexity or ingredient availability'
      });
    }

    return insights;
  }

  private getPopularBases(recipes: RecipeMetrics[]) {
    const counts: Record<string, number> = {};
    recipes.forEach(r => {
      counts[r.baseType] = (counts[r.baseType] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([base, count]) => ({ 
        base, 
        count, 
        percentage: Math.round((count / recipes.length) * 100) 
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get dummy data for demonstration
   */
  public getMockData() {
    const mockRecipes: RecipeMetrics[] = Array.from({ length: 50 }).map((_, i) => ({
      recipeId: `recipe-${i}`,
      name: `Energy Mix ${i}`,
      views: Math.floor(Math.random() * 10000),
      calculations: Math.floor(Math.random() * 5000),
      saves: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 500),
      avgRating: 3 + Math.random() * 2,
      completionRate: 20 + Math.random() * 80,
      ingredients: ['Caffeine', 'Taurine', 'Vitamin B12'],
      baseType: ['Soda', 'Water', 'Juice'][Math.floor(Math.random() * 3)]
    }));

    const trends = this.analyzeIngredientTrends([]);
    const performance = this.analyzeRecipePerformance(mockRecipes);
    const insights = this.generateProductInsights(mockRecipes, trends);

    return { performance, trends, insights };
  }
}

export const productAnalytics = new ProductAnalyticsService();
