/**
 * Competitive Intelligence Module
 * 
 * Analyzes market position, competitor strategies, and industry trends
 * to provide strategic insights for the soda platform.
 * 
 * @module CompetitiveIntelligence
 */

export interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  growthRate: number;
  pricingStrategy: 'premium' | 'economy' | 'mid-range';
  strengths: string[];
  weaknesses: string[];
  regions: string[];
  productCategories: string[];
}

export interface MarketAnalysis {
  totalMarketSize: number; // in millions
  marketGrowthRate: number;
  ourMarketShare: number;
  competitors: Competitor[];
  trends: MarketTrend[];
  opportunities: MarketOpportunity[];
  threats: MarketThreat[];
}

export interface MarketTrend {
  trend: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 1-10
  description: string;
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  potentialRevenue: number;
  difficulty: 'low' | 'medium' | 'high';
}

export interface MarketThreat {
  id: string;
  competitorId?: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationStrategy: string;
}

export interface PricePositioning {
  productCategory: string;
  ourAveragePrice: number;
  marketAveragePrice: number;
  lowestCompetitorPrice: number;
  highestCompetitorPrice: number;
  priceElasticity: number;
  recommendation: string;
}

class CompetitiveIntelligenceService {
  private marketData: MarketAnalysis;

  constructor() {
    this.marketData = this.initializeMarketData();
  }

  private initializeMarketData(): MarketAnalysis {
    return {
      totalMarketSize: 45000, // $45B Global Energy Drink Market
      marketGrowthRate: 7.2, // CAGR
      ourMarketShare: 0.05, // Startup phase
      competitors: [
        {
          id: 'redbull',
          name: 'Red Bull',
          marketShare: 43,
          growthRate: 4.5,
          pricingStrategy: 'premium',
          strengths: ['Brand recognition', 'Global distribution', 'Marketing'],
          weaknesses: ['High sugar content perception', 'Price'],
          regions: ['Global'],
          productCategories: ['energy_drink', 'sugar_free']
        },
        {
          id: 'monster',
          name: 'Monster Energy',
          marketShare: 39,
          growthRate: 5.8,
          pricingStrategy: 'mid-range',
          strengths: ['Variety of flavors', 'Aggressive marketing', 'Portion size'],
          weaknesses: ['Health concerns'],
          regions: ['Global'],
          productCategories: ['energy_drink', 'coffee', 'tea']
        },
        {
          id: 'celsius',
          name: 'Celsius',
          marketShare: 7,
          growthRate: 15.2,
          pricingStrategy: 'premium',
          strengths: ['Health focus', 'Fitness branding', 'Natural ingredients'],
          weaknesses: ['Limited global reach'],
          regions: ['US', 'EU'],
          productCategories: ['fitness_drink', 'powder']
        }
      ],
      trends: [
        {
          trend: 'Health & Wellness',
          impact: 'positive',
          magnitude: 9,
          description: 'Shift towards natural ingredients and functional benefits'
        },
        {
          trend: 'Sugar Reduction',
          impact: 'positive',
          magnitude: 8,
          description: 'Increasing demand for sugar-free and low-calorie options'
        },
        {
          trend: 'Gaming & Esports',
          impact: 'positive',
          magnitude: 8,
          description: 'Growing consumption among gamers'
        }
      ],
      opportunities: [
        {
          id: 'opp_natural',
          title: 'All-Natural Energy Line',
          description: 'Launch a product line with 100% natural ingredients and no artificial sweeteners',
          potentialRevenue: 2500000,
          difficulty: 'medium'
        },
        {
          id: 'opp_personalization',
          title: 'AI-Driven Personalization',
          description: 'Leverage our app to offer personalized flavor subscriptions',
          potentialRevenue: 5000000,
          difficulty: 'high'
        }
      ],
      threats: [
        {
          id: 'threat_regulation',
          title: 'Sugar Tax Regulation',
          severity: 'high',
          description: 'New sugar taxes in EU regions may impact margins',
          mitigationStrategy: 'Accelerate stevia-based product development'
        },
        {
          id: 'threat_competitor_launch',
          competitorId: 'monster',
          title: 'Competitor Digital Expansion',
          severity: 'medium',
          description: 'Major competitors are investing in direct-to-consumer apps',
          mitigationStrategy: 'Enhance community features and exclusive app-only recipes'
        }
      ]
    };
  }

  /**
   * Get comprehensive market analysis
   */
  public getMarketAnalysis(): MarketAnalysis {
    return this.marketData;
  }

  /**
   * Analyze pricing positioning for a category
   */
  public analyzePricingPositioning(category: string): PricePositioning {
    // Simulation of pricing analysis
    const basePrice = category === 'premium' ? 3.50 : 2.50;
    
    return {
      productCategory: category,
      ourAveragePrice: basePrice,
      marketAveragePrice: basePrice * 1.1,
      lowestCompetitorPrice: basePrice * 0.8,
      highestCompetitorPrice: basePrice * 1.5,
      priceElasticity: -1.2,
      recommendation: 'Opportunity to increase price by 5% while maintaining value proposition'
    };
  }

  /**
   * Track competitor movements (Simulated)
   */
  public updateCompetitorIntelligence(): void {
    // In a real app, this would scrape news or access market data APIs
    // For now, we simulate small fluctuations
    this.marketData.competitors.forEach(competitor => {
      // Simulate slight market share changes
      const fluctuation = (Math.random() - 0.5) * 0.1;
      competitor.marketShare = Math.max(0, competitor.marketShare + fluctuation);
    });
  }

  /**
   * Get competitive alerts
   */
  public getCompetitiveAlerts(): MarketThreat[] {
    return this.marketData.threats.filter(t => t.severity === 'high' || t.severity === 'critical');
  }
}

export const competitiveIntelligence = new CompetitiveIntelligenceService();
