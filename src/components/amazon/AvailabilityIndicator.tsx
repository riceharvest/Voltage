/**
 * Availability Indicator Component
 * 
 * Displays real-time stock availability information for Amazon products
 * across different regions with visual indicators and alerts.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Package, 
  Truck, 
  Star,
  TrendingUp,
  RefreshCw,
  Bell
} from 'lucide-react';

interface AvailabilityData {
  asin: string;
  totalStock: number;
  availabilityByRegion: Record<string, {
    status: 'in-stock' | 'out-of-stock' | 'limited' | 'pre-order' | 'discontinued' | 'unknown';
    stockLevel?: number;
    fulfillmentType: 'FBA' | 'FBM' | 'FBM-prime' | 'unknown';
    sellerCount: number;
    shippingOptions: string[];
    priceStability: 'stable' | 'fluctuating' | 'increasing';
    restockDate?: string;
    url: string;
  }>;
  alternatives: Array<{
    asin: string;
    region: string;
    status: string;
    price?: number;
    similarity: number;
    url: string;
  }>;
  restockPredictions: Array<{
    region: string;
    predictedDate: string;
    confidence: number;
  }>;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AvailabilityAlert {
  type: 'out-of-stock' | 'low-stock' | 'limited-stock';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  asin: string;
  region?: string;
}

interface AvailabilityIndicatorProps {
  asins: string[];
  regions?: string[];
  showAlternatives?: boolean;
  showPredictions?: boolean;
  enableAlerts?: boolean;
  compact?: boolean;
  className?: string;
}

export function AvailabilityIndicator({
  asins,
  regions = ['US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP'],
  showAlternatives = true,
  showPredictions = true,
  enableAlerts = true,
  compact = false,
  className = ''
}: AvailabilityIndicatorProps) {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AvailabilityAlert[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('US');

  useEffect(() => {
    fetchAvailabilityData();
  }, [asins, regions]);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/amazon/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asins,
          regions,
          checkAlternatives: showAlternatives
        })
      });

      const result = await response.json();

      if (result.success) {
        setAvailabilityData(result.data.availability);
        if (enableAlerts) {
          setAlerts(result.data.alerts || []);
        }
      } else {
        setError(result.error || 'Failed to fetch availability data');
      }
    } catch (err) {
      setError('Network error while fetching availability data');
      console.error('Availability fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out-of-stock':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pre-order':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'discontinued':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pre-order':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStockLevelPercentage = (stockLevel?: number) => {
    if (!stockLevel) return 0;
    return Math.min((stockLevel / 100) * 100, 100); // Assuming 100 is full stock
  };

  const getFulfillmentIcon = (type: string) => {
    switch (type) {
      case 'FBA':
        return <Star className="h-3 w-3 text-blue-500" title="Fulfilled by Amazon" />;
      case 'FBM-prime':
        return <Truck className="h-3 w-3 text-purple-500" title="Prime eligible" />;
      case 'FBM':
        return <Package className="h-3 w-3 text-gray-500" title="Fulfilled by merchant" />;
      default:
        return null;
    }
  };

  const getPriceStabilityIcon = (stability: string) => {
    switch (stability) {
      case 'stable':
        return <CheckCircle className="h-3 w-3 text-green-500" title="Stable pricing" />;
      case 'fluctuating':
        return <TrendingUp className="h-3 w-3 text-yellow-500" title="Fluctuating prices" />;
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" title="Rising prices" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Availability
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {asins.map((asin, index) => (
              <div key={asin} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
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
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load availability data</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button 
              onClick={fetchAvailabilityData} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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
        {/* Header with Region Selector */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Availability
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <Button
              onClick={fetchAvailabilityData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">{alert.message}</span>
                  {enableAlerts && (
                    <Button variant="outline" size="sm">
                      Set Alert
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Availability Data */}
        {availabilityData.map((product) => (
          <Card key={product.asin} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{product.asin}</Badge>
                  <div className={`w-3 h-3 rounded-full ${getUrgencyColor(product.urgencyLevel)}`} 
                       title={`Urgency: ${product.urgencyLevel}`} />
                  <span className="text-sm text-gray-600">
                    Total Stock: {product.totalStock}
                  </span>
                </div>
                <Badge className={getStatusColor(
                  Object.values(product.availabilityByRegion)[0]?.status || 'unknown'
                )}>
                  {product.urgencyLevel.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Regional Availability */}
              <div>
                <h5 className="font-medium mb-3">Regional Availability</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.availabilityByRegion)
                    .filter(([region]) => !selectedRegion || region === selectedRegion)
                    .map(([region, data]) => (
                    <div key={region} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(data.status)}
                          <span className="font-medium">{region}</span>
                        </div>
                        <Badge className={getStatusColor(data.status)}>
                          {data.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {data.stockLevel !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Stock:</span>
                            <Progress 
                              value={getStockLevelPercentage(data.stockLevel)} 
                              className="flex-1 h-2"
                            />
                            <span className="font-medium">{data.stockLevel}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Fulfillment:</span>
                          <div className="flex items-center gap-1">
                            {getFulfillmentIcon(data.fulfillmentType)}
                            <span>{data.fulfillmentType}</span>
                          </div>
                          <span className="text-gray-500">({data.sellerCount} sellers)</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Shipping:</span>
                          <span>{data.shippingOptions.slice(0, 2).join(', ')}</span>
                          {data.shippingOptions.length > 2 && (
                            <span className="text-gray-500">+{data.shippingOptions.length - 2} more</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Price:</span>
                          {getPriceStabilityIcon(data.priceStability)}
                          <span className="capitalize">{data.priceStability}</span>
                        </div>
                        
                        {data.restockDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600">
                              Restock: {data.restockDate}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <a href={data.url} target="_blank" rel="noopener noreferrer">
                            View on Amazon
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restock Predictions */}
              {showPredictions && product.restockPredictions.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Restock Predictions
                  </h5>
                  <div className="space-y-2">
                    {product.restockPredictions.map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="font-medium">{prediction.region}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{prediction.predictedDate}</div>
                          <div className="text-xs text-gray-600">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Products */}
              {showAlternatives && product.alternatives.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Alternative Products</h5>
                  <div className="space-y-2">
                    {product.alternatives.map((alt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alt.status)}
                          <span className="font-medium">{alt.region}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(alt.similarity * 100)}% match
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {alt.price && (
                            <span className="text-sm font-medium">
                              ${alt.price.toFixed(2)}
                            </span>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <a href={alt.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
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

export default AvailabilityIndicator;