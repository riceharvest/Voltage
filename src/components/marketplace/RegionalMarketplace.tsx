'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Globe, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  ExternalLink,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { FlavorRecipe } from '@/lib/types';

interface Region {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  amazonDomain: string;
  shippingTime: string;
  taxRate: number;
}

interface ProductAvailability {
  asin: string;
  region: string;
  price: number;
  originalPrice?: number;
  currency: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock' | 'pre-order';
  shippingTime: string;
  rating?: number;
  reviewCount?: number;
  primeEligible: boolean;
  lastUpdated: string;
}

interface RegionalMarketplaceProps {
  flavor?: FlavorRecipe;
  onProductSelect?: (product: ProductAvailability) => void;
  className?: string;
}

const regions: Region[] = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇺🇸',
    amazonDomain: 'amazon.com',
    shippingTime: '2-3 days',
    taxRate: 0.08
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flag: '🇬🇧',
    amazonDomain: 'amazon.co.uk',
    shippingTime: '1-2 days',
    taxRate: 0.20
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    flag: '🇩🇪',
    amazonDomain: 'amazon.de',
    shippingTime: '1-2 days',
    taxRate: 0.19
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    flag: '🇫🇷',
    amazonDomain: 'amazon.fr',
    shippingTime: '1-2 days',
    taxRate: 0.20
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    flag: '🇳🇱',
    amazonDomain: 'amazon.nl',
    shippingTime: '1 day',
    taxRate: 0.21
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    flag: '🇨🇦',
    amazonDomain: 'amazon.ca',
    shippingTime: '2-4 days',
    taxRate: 0.13
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    flag: '🇦🇺',
    amazonDomain: 'amazon.com.au',
    shippingTime: '3-5 days',
    taxRate: 0.10
  },
  {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    flag: '🇯🇵',
    amazonDomain: 'amazon.co.jp',
    shippingTime: '1-3 days',
    taxRate: 0.10
  }
];

// Mock product data - in real implementation, this would come from Amazon API
const mockProducts: ProductAvailability[] = [
  {
    asin: 'B08N5WRWNW',
    region: 'US',
    price: 24.99,
    originalPrice: 29.99,
    currency: 'USD',
    availability: 'in-stock',
    shippingTime: '2-3 days',
    rating: 4.5,
    reviewCount: 1234,
    primeEligible: true,
    lastUpdated: '2025-12-10T16:20:00Z'
  },
  {
    asin: 'B08N5WRWNW',
    region: 'GB',
    price: 22.50,
    currency: 'GBP',
    availability: 'in-stock',
    shippingTime: '1-2 days',
    rating: 4.3,
    reviewCount: 856,
    primeEligible: true,
    lastUpdated: '2025-12-10T16:19:30Z'
  },
  {
    asin: 'B08N5WRWNW',
    region: 'DE',
    price: 26.99,
    currency: 'EUR',
    availability: 'limited',
    shippingTime: '1-2 days',
    rating: 4.4,
    reviewCount: 423,
    primeEligible: true,
    lastUpdated: '2025-12-10T16:18:45Z'
  },
  {
    asin: 'B08N5WRWNW',
    region: 'NL',
    price: 27.99,
    currency: 'EUR',
    availability: 'in-stock',
    shippingTime: '1 day',
    rating: 4.6,
    reviewCount: 234,
    primeEligible: true,
    lastUpdated: '2025-12-10T16:21:00Z'
  },
  {
    asin: 'B08N5WRWNW',
    region: 'FR',
    price: 28.99,
    currency: 'EUR',
    availability: 'out-of-stock',
    shippingTime: '3-5 days',
    rating: 4.2,
    reviewCount: 567,
    primeEligible: false,
    lastUpdated: '2025-12-10T16:17:20Z'
  }
];

const getUserLocation = async (): Promise<string> => {
  try {
    // In a real implementation, you would use a geolocation service
    // For now, we'll simulate based on IP or user preference
    return 'NL'; // Default to Netherlands
  } catch (error) {
    console.error('Error getting user location:', error);
    return 'US'; // Fallback to US
  }
};

const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  // Mock exchange rates - in real implementation, use a real currency API
  const exchangeRates: Record<string, number> = {
    'USD-EUR': 0.85,
    'USD-GBP': 0.73,
    'USD-CAD': 1.25,
    'USD-AUD': 1.35,
    'USD-JPY': 110,
    'EUR-USD': 1.18,
    'EUR-GBP': 0.86,
    'EUR-CAD': 1.47,
    'EUR-AUD': 1.59,
    'EUR-JPY': 129.5,
    'GBP-USD': 1.37,
    'GBP-EUR': 1.16,
    'GBP-CAD': 1.71,
    'GBP-AUD': 1.85,
    'GBP-JPY': 150.7
  };

  const rate = exchangeRates[`${fromCurrency}-${toCurrency}`];
  if (!rate) return amount; // No conversion available

  return amount * rate;
};

const getAvailabilityIcon = (availability: string) => {
  switch (availability) {
    case 'in-stock':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'limited':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'out-of-stock':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pre-order':
      return <Package className="w-4 h-4 text-blue-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-500" />;
  }
};

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'in-stock':
      return 'text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
    case 'limited':
      return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'out-of-stock':
      return 'text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300';
    case 'pre-order':
      return 'text-blue-700 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
    default:
      return 'text-gray-700 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

export function RegionalMarketplace({ flavor, onProductSelect, className }: RegionalMarketplaceProps) {
  const [userRegion, setUserRegion] = useState<string>('US');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'availability'>('price');
  const [loading, setLoading] = useState(false);

  // Initialize user location
  useEffect(() => {
    const initializeLocation = async () => {
      const location = await getUserLocation();
      setUserRegion(location);
      
      const region = regions.find(r => r.code === location);
      if (region) {
        setSelectedCurrency(region.currency);
      }
    };
    
    initializeLocation();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = mockProducts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.asin.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(product => product.availability === availabilityFilter);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const priceA = convertCurrency(a.price, a.currency, selectedCurrency);
          const priceB = convertCurrency(b.price, b.currency, selectedCurrency);
          return priceA - priceB;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'availability':
          const availabilityOrder = { 'in-stock': 0, 'limited': 1, 'pre-order': 2, 'out-of-stock': 3 };
          return availabilityOrder[a.availability] - availabilityOrder[b.availability];
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, availabilityFilter, sortBy, selectedCurrency]);

  // Get best deals (lowest prices)
  const bestDeals = useMemo(() => {
    const deals = [...filteredProducts]
      .filter(p => p.availability === 'in-stock')
      .slice(0, 3);
    return deals;
  }, [filteredProducts]);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    const availableProducts = filteredProducts.filter(p => p.availability === 'in-stock');
    if (availableProducts.length === 0) return null;

    const prices = availableProducts.map(p => convertCurrency(p.price, p.currency, selectedCurrency));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { minPrice, maxPrice, avgPrice };
  }, [filteredProducts, selectedCurrency]);

  const getRegionFlag = (regionCode: string) => {
    return regions.find(r => r.code === regionCode)?.flag || '🌍';
  };

  const getRegionName = (regionCode: string) => {
    return regions.find(r => r.code === regionCode)?.name || regionCode;
  };

  const formatPrice = (price: number, currency: string) => {
    const region = regions.find(r => r.currency === currency);
    return region ? `${region.currencySymbol}${price.toFixed(2)}` : `${price.toFixed(2)} ${currency}`;
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-600 to-purple-600">
          Regional Marketplace
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Compare prices and availability across global Amazon regions. Find the best deals and shipping options for your location.
        </p>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Currency Selection */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {regions.map(region => (
                <option key={region.currency} value={region.currency}>
                  {region.flag} {region.currency} ({region.currencySymbol})
                </option>
              ))}
            </select>

            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Availability</option>
              <option value="in-stock">In Stock</option>
              <option value="limited">Limited Stock</option>
              <option value="pre-order">Pre-order</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'availability')}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
              <option value="availability">Sort by Availability</option>
            </select>
          </div>

          {/* Price Statistics */}
          {priceStats && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Lowest Price</div>
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(priceStats.minPrice, selectedCurrency)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Average Price</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(priceStats.avgPrice, selectedCurrency)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Highest Price</div>
                <div className="text-lg font-bold text-red-600">
                  {formatPrice(priceStats.maxPrice, selectedCurrency)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Deals */}
      {bestDeals.length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingDown className="w-5 h-5" />
              Best Deals Near You
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-300">
              Lowest prices available in your region and nearby areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestDeals.map((product, index) => {
                const region = regions.find(r => r.code === product.region);
                const convertedPrice = convertCurrency(product.price, product.currency, selectedCurrency);
                
                return (
                  <div
                    key={`${product.asin}-${product.region}`}
                    className="p-4 border rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onProductSelect?.(product)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getRegionFlag(product.region)}</span>
                      <span className="font-medium">{getRegionName(product.region)}</span>
                      {index === 0 && (
                        <Badge className="bg-green-500 text-white text-xs">Best Price</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatPrice(convertedPrice, selectedCurrency)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {region?.shippingTime} shipping
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{product.rating} ({product.reviewCount})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regional Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Comparison
          </CardTitle>
          <CardDescription>
            Compare availability and pricing across all Amazon regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const region = regions.find(r => r.code === product.region);
              const convertedPrice = convertCurrency(product.price, product.currency, selectedCurrency);
              const isUserRegion = product.region === userRegion;
              
              return (
                <div
                  key={`${product.asin}-${product.region}`}
                  className={`p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                    isUserRegion ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => onProductSelect?.(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Region Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRegionFlag(product.region)}</span>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getRegionName(product.region)}
                            {isUserRegion && (
                              <Badge variant="outline" className="text-xs">Your Region</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {region?.amazonDomain}
                          </div>
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        {getAvailabilityIcon(product.availability)}
                        <Badge className={`text-xs ${getAvailabilityColor(product.availability)}`}>
                          {product.availability.replace('-', ' ')}
                        </Badge>
                      </div>

                      {/* Shipping */}
                      <div className="text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {product.shippingTime}
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Price */}
                      <div className="text-xl font-bold">
                        {formatPrice(convertedPrice, selectedCurrency)}
                      </div>
                      {product.originalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(convertCurrency(product.originalPrice, product.currency, selectedCurrency), selectedCurrency)}
                        </div>
                      )}
                      
                      {/* Rating */}
                      {product.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{product.rating}</span>
                          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                        </div>
                      )}

                      {/* Prime Badge */}
                      {product.primeEligible && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Prime
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Last updated: {new Date(product.lastUpdated).toLocaleString()}</span>
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        View on Amazon
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setAvailabilityFilter('all');
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}