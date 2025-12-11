/**
 * Product Price Display Component
 * 
 * Displays dynamic pricing information for Amazon products with currency conversion,
 * price history, and regional comparison features.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Globe, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PriceData {
  asin: string;
  currentPrice: number;
  originalCurrency: string;
  convertedPrice: number;
  targetCurrency: string;
  priceChange: {
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  regionalPrices: Array<{
    region: string;
    price: number;
    currency: string;
    convertedPrice: number;
    url: string;
    availability: string;
  }>;
  priceHistory: Array<{ date: string; price: number; currency: string }>;
}

interface PriceAlert {
  asin: string;
  type: 'price-drop' | 'best-price' | 'limited-availability';
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

interface ProductPriceDisplayProps {
  asins: string[];
  targetCurrency?: string;
  showComparison?: boolean;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export function ProductPriceDisplay({
  asins,
  targetCurrency = 'USD',
  showComparison = true,
  showHistory = false,
  compact = false,
  className = ''
}: ProductPriceDisplayProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(targetCurrency);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    fetchPricingData();
  }, [asins, selectedCurrency]);

  const fetchPricingData = async () => {
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
          targetCurrency: selectedCurrency,
          includeComparison: showComparison
        })
      });

      const result = await response.json();

      if (result.success) {
        setPriceData(result.data.pricing);
        setAlerts(result.data.priceAlerts || []);
      } else {
        setError(result.error || 'Failed to fetch pricing data');
      }
    } catch (err) {
      setError('Network error while fetching pricing data');
      console.error('Pricing fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price);
  };

  const getPriceChangeIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out-of-stock':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <h3 className="text-lg font-semibold">Pricing Information</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {asins.map((asin, index) => (
              <div key={asin} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load pricing data</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button 
              onClick={fetchPricingData} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Currency Selector */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pricing Information</h3>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="JPY">JPY</option>
          </select>
        </div>

        {/* Price Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getUrgencyColor(alert.urgency)}`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Price Data */}
        {priceData.map((product) => (
          <Card key={product.asin} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">
                    {formatPrice(product.convertedPrice, selectedCurrency)}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Original: {formatPrice(product.currentPrice, product.originalCurrency)}</span>
                    {product.priceChange.percentage > 0 && (
                      <div className="flex items-center gap-1">
                        {getPriceChangeIcon(product.priceChange.direction)}
                        <span className={
                          product.priceChange.direction === 'up' ? 'text-red-600' :
                          product.priceChange.direction === 'down' ? 'text-green-600' : 'text-gray-600'
                        }>
                          {product.priceChange.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{product.asin}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Regional Price Comparison */}
              {showComparison && product.regionalPrices.length > 1 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Regional Comparison
                  </h5>
                  <div className="space-y-2">
                    {product.regionalPrices.map((region, index) => (
                      <div key={region.region} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getAvailabilityIcon(region.availability)}
                          <span className="font-medium">{region.region}</span>
                          <span className="text-sm text-gray-600">
                            {formatPrice(region.price, region.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatPrice(region.convertedPrice, selectedCurrency)}
                          </span>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <a href={region.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price History */}
              {showHistory && product.priceHistory.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Price History (Last 30 Days)
                  </h5>
                  <div className="space-y-2">
                    {product.priceHistory.slice(-7).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{entry.date}</span>
                        <span className="font-medium">
                          {formatPrice(entry.price, entry.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(product.priceChange.percentage * 10, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}

              {/* Best Deal Indicator */}
              {showComparison && product.regionalPrices.length > 1 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Best Price</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPrice(product.regionalPrices[0].convertedPrice, selectedCurrency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        in {product.regionalPrices[0].region}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default ProductPriceDisplay;