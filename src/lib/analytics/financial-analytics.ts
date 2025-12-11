/**
 * Financial Analytics Service
 * 
 * Provides comprehensive financial analysis including:
 * - Revenue tracking and forecasting
 * - Cost analysis and profit margins
 * - Affiliate performance
 * - Customer lifetime value
 * 
 * @module FinancialAnalytics
 */

export interface RevenueStream {
  source: string;
  amount: number;
  growth: number; // percentage
  margin: number; // percentage
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface FinancialReport {
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueStreams: RevenueStream[];
  costStructure: CostBreakdown[];
  burnRate: number;
  runway: number; // months
}

class FinancialAnalyticsService {
  
  /**
   * Generate monthly financial report
   */
  public generateFinancialReport(month: string): FinancialReport {
    // Mock data for demonstration
    const totalRevenue = 125000;
    const costs = 85000;
    
    return {
      totalRevenue,
      grossProfit: totalRevenue * 0.65,
      netProfit: totalRevenue - costs,
      profitMargin: ((totalRevenue - costs) / totalRevenue) * 100,
      revenueStreams: [
        { source: 'Affiliate Sales', amount: 85000, growth: 12.5, margin: 85 },
        { source: 'Premium Subscriptions', amount: 25000, growth: 5.2, margin: 95 },
        { source: 'Merchandise', amount: 15000, growth: -2.1, margin: 40 }
      ],
      costStructure: [
        { category: 'Server & Infrastructure', amount: 12000, percentage: 14.1, trend: 'stable' },
        { category: 'Marketing & Ads', amount: 35000, percentage: 41.2, trend: 'up' },
        { category: 'Development', amount: 28000, percentage: 32.9, trend: 'stable' },
        { category: 'Operations', amount: 10000, percentage: 11.8, trend: 'down' }
      ],
      burnRate: 15000, // Monthly cash burn (if unprofitable)
      runway: 18 // Months of runway left
    };
  }

  /**
   * Analyze Affiliate Performance
   */
  public analyzeAffiliates() {
    return [
      { partner: 'Amazon', revenue: 65000, clicks: 125000, conversion: 2.8, epc: 0.52 },
      { partner: 'Direct Brands', revenue: 15000, clicks: 25000, conversion: 4.5, epc: 0.60 },
      { partner: 'Equipment Partners', revenue: 5000, clicks: 10000, conversion: 1.2, epc: 0.50 }
    ];
  }

  /**
   * Calculate Customer Lifetime Value (LTV)
   */
  public calculateLTV(arpu: number, churnRate: number, grossMargin: number): number {
    // Simple LTV formula: (ARPU * Margin) / Churn
    if (churnRate === 0) return 0;
    return (arpu * grossMargin) / churnRate;
  }
}

export const financialAnalytics = new FinancialAnalyticsService();
