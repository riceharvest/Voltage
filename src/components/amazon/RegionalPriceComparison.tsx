/**
 * Regional Price Comparison Component
 * 
 * Displays comprehensive price comparison across Amazon regions with savings analysis,
 * currency conversion, and optimization recommendations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Globe, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Crown, 
  AlertCircle,
  ArrowUpDown,
  Filter,
  BarChart3
} from 'lucide-react';

interface RegionalPriceData {
  region: string;
  price: number;
  currency: string;
  convertedPrice: number;
  targetCurrency: string;
  url: string;
  availability: string;
  shippingTime?: string;
  importFees?: number;
  totalCost: number;
}

interface PriceComparisonData {
  asin: string;
  productTitle: string;
  currentPrice: number;
  originalCurrency: string;
  bestDeal: {
    region: string;
    price: number;
    savings: number;
    savingsPercentage: number;
  };
  regionalPrices: RegionalPriceData[];
  analysis: {
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    volatility: number; // Price volatility percentage
    bestBuyingOpportunity: boolean;
  };
  recommendations: Array<{
    type: 'best-price' | 'fastest-shipping' | 'lowest-fees' | 'reliable-seller';
    region: string;
    reason: string;
    savings?: number;
  }>;
}

interface RegionalPriceComparisonProps {
  asins: string[];
  targetCurrency?: string;
  includeShipping?: boolean;
  includeImportFees?: boolean;
  showAnalysis?: boolean;
  maxRegions?: number;
  className?: string;
}

export function RegionalPriceComparison({
  asins,
  targetCurrency = 'USD',
  includeShipping = true,
  includeImportFees = true,
  showAnalysis = true,
  maxRegions = 8,
  className = ''
}: RegionalPriceComparisonProps) {
  const [comparisonData, setComparisonData] = useState<PriceComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'region' | 'availability'>('price');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [analysisView, setAnalysisView] = useState<'overview' | 'detailed' | 'savings'>('overview');

  useEffect(() => {
    fetchComparisonData();
  }, [asins, targetCurrency]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/amazon/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asins,
          targetCurrency,
          includeComparison: true
        })
      });

      const result = await response.json();

      if (result.success) {
        const processedData = processComparisonData(result.data.pricing);
        setComparisonData(processedData);
        setSelectedRegions(processedData[0]?.regionalPrices.map(p => p.region) || []);
      } else {
        setError(result.error || 'Failed to fetch comparison data');
      }
    } catch (err) {
      setError('Network error while fetching comparison data');
      console.error('Comparison fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processComparisonData = (pricingData: any[]): PriceComparisonData[] => {
    return pricingData.map(product => {
      // Calculate total costs including shipping and import fees
      const regionalPrices = product.regionalPrices.map((region: any) => ({
        ...region,
        shippingTime: getShippingTime(region.region),
        importFees: includeImportFees ? calculateImportFees(region.convertedPrice, region.region) : 0,
        totalCost: region.convertedPrice + (includeShipping ? getShippingCost(region.convertedPrice, region.region) : 0) + (includeImportFees ? calculateImportFees(region.convertedPrice, region.region) : 0)
      }));

      // Find best deal
      const bestDeal = regionalPrices.reduce((best: any, current: any) => 
        current.totalCost < best.totalCost ? current : best
      );

      const prices = regionalPrices.map(r => r.totalCost);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const volatility = ((maxPrice - minPrice) / averagePrice) * 100;

      return {
        asin: product.asin,
        productTitle: `Product ${product.asin}`,
        currentPrice: product.currentPrice,
        originalCurrency: product.originalCurrency,
        bestDeal: {
          region: bestDeal.region,
          price: bestDeal.totalCost,
          savings: maxPrice - bestDeal.totalCost,
          savingsPercentage: ((maxPrice - bestDeal.totalCost) / maxPrice) * 100
        },
        regionalPrices: regionalPrices.sort((a, b) => a.totalCost - b.totalCost),
        analysis: {
          averagePrice,
          priceRange: { min: minPrice, max: maxPrice },
          volatility,
          bestBuyingOpportunity: volatility > 20
        },
        recommendations: generateRecommendations(regionalPrices)
      };
    });
  };

  const generateRecommendations = (regionalPrices: RegionalPriceData[]) => {
    const recommendations = [];

    // Best price recommendation
    const cheapest = regionalPrices[0];
    recommendations.push({
      type: 'best-price',
      region: cheapest.region,
      reason: `Lowest total cost at ${formatPrice(cheapest.totalCost)}`,
      savings: regionalPrices[regionalPrices.length - 1].totalCost - cheapest.totalCost
    });

    // Fastest shipping recommendation
    const fastestShipping = regionalPrices.reduce((best, current) => 
      getShippingTime(current.region) < getShippingTime(best.region) ? current : best
    );
    recommendations.push({
      type: 'fastest-shipping',
      region: fastestShipping.region,
      reason: `Fastest delivery: ${getShippingTime(fastestShipping.region)}`
    });

    // Lowest fees recommendation
    const lowestFees = regionalPrices.reduce((best, current) => 
      (current.importFees || 0) < (best.importFees || 0) ? current : best
    );
    if (lowestFees.importFees && lowestFees.importFees > 0) {
      recommendations.push({
        type: 'lowest-fees',
        region: lowestFees.region,
        reason: `Lowest import fees: ${formatPrice(lowestFees.importFees)}`
      });
    }

    return recommendations;
  };

  const getShippingTime = (region: string): string => {
    const shippingTimes: Record<string, string> = {
      'US': '2-3 days',
      'UK': '3-5 days',
      'DE': '3-5 days',
      'FR': '4-6 days',
      'NL': '3-5 days',
      'CA': '4-7 days',
      'AU': '7-10 days',
      'JP': '5-8 days'
    };
    return shippingTimes[region] || '7-14 days';
  };

  const getShippingCost = (price: number, region: string): number => {
    const shippingCosts: Record<string, number> = {
      'US': 0,
      'UK': price * 0.05,
      'DE': price * 0.06,
      'FR': price * 0.07,
      'NL': price * 0.06,
      'CA': price * 0.08,
      'AU': price * 0.15,
      'JP': price * 0.12
    };
    return shippingCosts[region] || price * 0.1;
  };

  const calculateImportFees = (price: number, region: string): number => {
    // Simplified import fee calculation
    const importRates: Record<string, number> = {
      'US': 0,
      'UK': 0.02,
      'DE': 0.03,
      'FR': 0.025,
      'NL': 0.02,
      'CA': 0.05,
      'AU': 0.08,
      'JP': 0.04
    };
    return price * (importRates[region] || 0.05);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: targetCurrency
    }).format(price);
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 10) return 'text-green-600';
    if (savings > 5) return 'text-green-500';
    if (savings > 0) return 'text-green-400';
    return 'text-gray-500';
  };

  const getRegionFlag = (region: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'UK': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'NL': '🇳🇱',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'JP': '🇯🇵'
    };
    return flags[region] || '🌍';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Regional Price Comparison
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {asins.map((asin, index) => (
              <div key={asin} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load price comparison</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button onClick={fetchComparisonData} variant="outline" size="sm" className="mt-3">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Regional Price Comparison
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="price">Sort by Price</option>
                <option value="region">Sort by Region</option>
                <option value="availability">Sort by Availability</option>
              </select>
              <Badge variant="outline">{comparisonData.length} products</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {comparisonData.map((product) => (
        <Card key={product.asin} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">{product.productTitle}</h4>
                <p className="text-sm text-gray-600">ASIN: {product.asin}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(product.bestDeal.price)}
                </div>
                <div className="text-sm text-gray-600">
                  in {product.bestDeal.region}
                </div>
                <div className="text-sm font-medium text-green-600">
                  Save {formatPrice(product.bestDeal.savings)} ({product.bestDeal.savingsPercentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={analysisView} onValueChange={(v) => setAnalysisView(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="savings">Savings Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Best Deal Highlight */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Best Deal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{getRegionFlag(product.bestDeal.region)} {product.bestDeal.region}</div>
                      <div className="text-sm text-gray-600">Total cost including shipping & fees</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(product.bestDeal.price)}
                      </div>
                      <div className="text-sm text-green-600">
                        Save {product.bestDeal.savingsPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Lowest Price</div>
                    <div className="text-lg font-semibold">{formatPrice(product.analysis.priceRange.min)}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Average Price</div>
                    <div className="text-lg font-semibold">{formatPrice(product.analysis.averagePrice)}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Highest Price</div>
                    <div className="text-lg font-semibold">{formatPrice(product.analysis.priceRange.max)}</div>
                  </div>
                </div>

                {/* Price Volatility */}
                {product.analysis.volatility > 10 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        High Price Volatility ({product.analysis.volatility.toFixed(1)}%)
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Prices vary significantly across regions. Monitor for the best buying opportunity.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                <div className="space-y-3">
                  {product.regionalPrices.map((region, index) => (
                    <div key={region.region} className={`p-4 border rounded-lg ${
                      index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getRegionFlag(region.region)}</span>
                          <div>
                            <div className="font-medium">{region.region}</div>
                            <div className="text-sm text-gray-600">
                              {region.availability} • {region.shippingTime}
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-green-600">
                              <Crown className="h-3 w-3 mr-1" />
                              Best
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{formatPrice(region.totalCost)}</div>
                          <div className="text-sm text-gray-600">
                            Base: {formatPrice(region.convertedPrice)}
                          </div>
                          {includeShipping && (
                            <div className="text-xs text-gray-500">
                              + Shipping: {formatPrice(getShippingCost(region.convertedPrice, region.region))}
                            </div>
                          )}
                          {includeImportFees && region.importFees && region.importFees > 0 && (
                            <div className="text-xs text-gray-500">
                              + Fees: {formatPrice(region.importFees)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <a href={region.url} target="_blank" rel="noopener noreferrer">
                            View on Amazon
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="savings" className="space-y-4">
                {/* Recommendations */}
                <div className="space-y-3">
                  <h5 className="font-medium">Smart Buying Recommendations</h5>
                  {product.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {rec.type === 'best-price' && <DollarSign className="h-4 w-4 text-green-600" />}
                        {rec.type === 'fastest-shipping' && <MapPin className="h-4 w-4 text-blue-600" />}
                        {rec.type === 'lowest-fees' && <TrendingDown className="h-4 w-4 text-purple-600" />}
                        {rec.type === 'reliable-seller' && <Globe className="h-4 w-4 text-gray-600" />}
                        <span className="font-medium">{getRegionFlag(rec.region)} {rec.region}</span>
                        {rec.savings && (
                          <Badge variant="outline" className="text-green-600">
                            Save {formatPrice(rec.savings)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>

                {/* Savings Breakdown */}
                <div className="space-y-3">
                  <h5 className="font-medium">Potential Savings</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-sm text-gray-600">Maximum Savings</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(product.analysis.priceRange.max - product.analysis.priceRange.min)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {((product.analysis.priceRange.max - product.analysis.priceRange.min) / product.analysis.priceRange.max * 100).toFixed(1)}% off highest price
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-gray-600">Best Deal Savings</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(product.bestDeal.savings)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.bestDeal.savingsPercentage.toFixed(1)}% below average
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default RegionalPriceComparison;