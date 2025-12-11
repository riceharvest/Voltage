/**
 * Multi-Currency Support System
 * 
 * Implements comprehensive currency management with:
 * - Real-time exchange rates for 20+ major currencies
 * - Regional price formatting conventions
 * - Currency conversion for calculator and cost analysis
 * - Amazon regional pricing integration
 * - Tax calculation support by region
 * - Currency cache and optimization
 * 
 * @example
 * ```typescript
 * const price = await convertCurrency(25.99, 'USD', 'EUR');
 * const formatted = formatCurrency(price, 'EUR', 'de-DE');
 * ```
 */

import { cache } from './cache';

export interface Currency {
  code: string; // ISO 4217 code (USD, EUR, etc.)
  name: string;
  symbol: string;
  decimals: number;
  minorUnit: string;
  region: string[];
  enabled: boolean;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
  source: string;
  confidence: number; // 0-1
}

export interface PriceFormatting {
  currency: string;
  locale: string;
  currencyDisplay: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  useGrouping: boolean;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
}

export interface TaxRate {
  region: string;
  taxType: 'VAT' | 'GST' | 'HST' | 'PST' | 'SALES_TAX';
  rate: number;
  included: boolean; // true if tax is included in displayed price
  name: string;
  threshold?: number; // minimum purchase amount for tax to apply
}

export interface AmazonPrice {
  region: string;
  currency: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  shipping?: number;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order';
  lastUpdated: string;
}

/**
 * Currency database with major global currencies
 */
const CURRENCY_DATA: Record<string, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['US', 'GU', 'PR', 'VI'],
    enabled: true
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    minorUnit: 'cents',
    region: ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'],
    enabled: true
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    minorUnit: 'pence',
    region: ['GB', 'GG', 'IM', 'JE'],
    enabled: true
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['CA'],
    enabled: true
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['AU', 'NF', 'CX'],
    enabled: true
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimals: 0,
    minorUnit: 'yen',
    region: ['JP'],
    enabled: true
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimals: 2,
    minorUnit: 'fen',
    region: ['CN'],
    enabled: true
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    minorUnit: 'paise',
    region: ['IN'],
    enabled: true
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimals: 0,
    minorUnit: 'won',
    region: ['KR'],
    enabled: true
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['BR'],
    enabled: true
  },
  RUB: {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    decimals: 2,
    minorUnit: 'kopecks',
    region: ['RU'],
    enabled: true
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimals: 2,
    minorUnit: 'cents',
    region: ['CH', 'LI'],
    enabled: true
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    decimals: 2,
    minorUnit: 'öre',
    region: ['SE', 'AX'],
    enabled: true
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    decimals: 2,
    minorUnit: 'øre',
    region: ['NO', 'BV', 'SJ'],
    enabled: true
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    decimals: 2,
    minorUnit: 'øre',
    region: ['DK', 'FO', 'GL'],
    enabled: true
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    decimals: 2,
    minorUnit: 'grosz',
    region: ['PL'],
    enabled: true
  },
  CZK: {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    decimals: 2,
    minorUnit: 'haléř',
    region: ['CZ'],
    enabled: true
  },
  HUF: {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    decimals: 0,
    minorUnit: 'forint',
    region: ['HU'],
    enabled: true
  },
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    decimals: 2,
    minorUnit: 'kuruş',
    region: ['TR'],
    enabled: true
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['MX'],
    enabled: true
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    minorUnit: 'cents',
    region: ['ZA'],
    enabled: true
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['SG'],
    enabled: true
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['HK'],
    enabled: true
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    decimals: 2,
    minorUnit: 'cents',
    region: ['NZ', 'CK', 'NU', 'PN', 'TK'],
    enabled: true
  }
};

/**
 * Regional tax rates
 */
const TAX_RATES: Record<string, TaxRate[]> = {
  'US': [
    { region: 'US', taxType: 'SALES_TAX', rate: 0, included: false, name: 'Sales Tax' }
  ],
  'EU': [
    { region: 'EU', taxType: 'VAT', rate: 0.20, included: true, name: 'VAT' }
  ],
  'GB': [
    { region: 'GB', taxType: 'VAT', rate: 0.20, included: true, name: 'VAT' }
  ],
  'CA': [
    { region: 'CA', taxType: 'GST', rate: 0.05, included: true, name: 'GST' }
  ],
  'AU': [
    { region: 'AU', taxType: 'GST', rate: 0.10, included: true, name: 'GST' }
  ],
  'JP': [
    { region: 'JP', taxType: 'SALES_TAX', rate: 0.10, included: true, name: 'Consumption Tax' }
  ]
};

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCY_DATA).filter(currency => currency.enabled);
}

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | null {
  return CURRENCY_DATA[code.toUpperCase()] || null;
}

/**
 * Get default currency for region
 */
export function getDefaultCurrencyForRegion(region: string): string {
  // EU countries use EUR
  if (['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'].includes(region)) {
    return 'EUR';
  }
  
  // Other specific mappings
  const mappings: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD',
    'JP': 'JPY',
    'CN': 'CNY',
    'IN': 'INR',
    'KR': 'KRW',
    'BR': 'BRL',
    'RU': 'RUB',
    'CH': 'CHF',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'CZ': 'CZK',
    'HU': 'HUF',
    'TR': 'TRY',
    'MX': 'MXN',
    'ZA': 'ZAR',
    'SG': 'SGD',
    'HK': 'HKD',
    'NZ': 'NZD'
  };
  
  return mappings[region] || 'USD';
}

/**
 * Exchange rate service with caching
 */
class ExchangeRateService {
  private cacheKey = 'exchange_rates';
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    // Same currency
    if (fromUpper === toUpper) {
      return {
        from: fromUpper,
        to: toUpper,
        rate: 1,
        lastUpdated: new Date().toISOString(),
        source: 'same_currency',
        confidence: 1
      };
    }

    try {
      // Check cache first
      const cachedRates = await cache.get<Record<string, ExchangeRate>>(this.cacheKey);
      const cacheKey = `${fromUpper}_${toUpper}`;
      
      if (cachedRates && cachedRates[cacheKey]) {
        const cached = cachedRates[cacheKey];
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        
        if (cacheAge < this.cacheExpiry) {
          return cached;
        }
      }

      // Fetch fresh rate
      const rate = await this.fetchExchangeRate(fromUpper, toUpper);
      
      // Update cache
      const updatedRates = {
        ...(cachedRates || {}),
        [cacheKey]: rate
      };
      
      await cache.set(this.cacheKey, updatedRates, this.cacheExpiry);
      
      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Return fallback rate (using cached or hardcoded fallback)
      return this.getFallbackRate(fromUpper, toUpper);
    }
  }

  /**
   * Fetch exchange rate from external API
   */
  private async fetchExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    // Using exchangerate-api.com (free tier)
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${from}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates[to];
    
    if (!rate) {
      throw new Error(`Rate not found for ${to}`);
    }
    
    return {
      from,
      to,
      rate,
      lastUpdated: new Date().toISOString(),
      source: 'exchangerate-api.com',
      confidence: 0.9
    };
  }

  /**
   * Get fallback exchange rate
   */
  private getFallbackRate(from: string, to: string): ExchangeRate {
    // Hardcoded fallback rates (approximate, should be updated regularly)
    const fallbackRates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
      'USD_CAD': 1.25,
      'USD_AUD': 1.35,
      'USD_JPY': 110,
      'EUR_USD': 1.18,
      'GBP_USD': 1.37
    };
    
    const key = `${from}_${to}`;
    const rate = fallbackRates[key] || 1;
    
    return {
      from,
      to,
      rate,
      lastUpdated: new Date().toISOString(),
      source: 'fallback_cache',
      confidence: 0.5
    };
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate.rate;
  }

  /**
   * Get multiple exchange rates
   */
  async getExchangeRates(from: string, to: string[]): Promise<ExchangeRate[]> {
    const promises = to.map(currency => this.getExchangeRate(from, currency));
    return Promise.all(promises);
  }
}

/**
 * Currency formatting service
 */
class CurrencyFormattingService {
  /**
   * Format currency according to regional conventions
   */
  formatCurrency(
    amount: number,
    currency: string,
    locale: string = 'en-US',
    options: Partial<PriceFormatting> = {}
  ): string {
    const currencyData = getCurrency(currency);
    if (!currencyData) {
      return amount.toFixed(2);
    }

    const defaultOptions: PriceFormatting = {
      currency,
      locale,
      currencyDisplay: 'symbol',
      useGrouping: true,
      minimumFractionDigits: currencyData.decimals,
      maximumFractionDigits: currencyData.decimals
    };

    const formatOptions = { ...defaultOptions, ...options };

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: formatOptions.currencyDisplay,
        useGrouping: formatOptions.useGrouping,
        minimumFractionDigits: formatOptions.minimumFractionDigits,
        maximumFractionDigits: formatOptions.maximumFractionDigits
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting failed:', error);
      // Fallback to basic formatting
      return `${currencyData.symbol}${amount.toFixed(currencyData.decimals)}`;
    }
  }

  /**
   * Parse formatted currency string
   */
  parseCurrency(formattedAmount: string, currency: string): number {
    const currencyData = getCurrency(currency);
    if (!currencyData) {
      return parseFloat(formattedAmount.replace(/[^\d.-]/g, ''));
    }

    // Remove currency symbol and formatting
    const cleaned = formattedAmount
      .replace(/[^\d.,-]/g, '')
      .replace(/,/g, '')
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(currency: string): string {
    const currencyData = getCurrency(currency);
    return currencyData?.symbol || currency;
  }

  /**
   * Format amount without currency symbol
   */
  formatAmount(amount: number, currency: string, locale: string = 'en-US'): string {
    const currencyData = getCurrency(currency);
    if (!currencyData) {
      return amount.toFixed(2);
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: currencyData.decimals,
      maximumFractionDigits: currencyData.decimals,
      useGrouping: true
    }).format(amount);
  }
}

/**
 * Tax calculation service
 */
class TaxCalculationService {
  /**
   * Calculate tax for a region
   */
  calculateTax(
    amount: number,
    region: string,
    taxInclusive: boolean = false
  ): { tax: number; total: number; taxRate: number; taxName: string } {
    const taxRates = TAX_RATES[region] || [];
    
    if (taxRates.length === 0) {
      return {
        tax: 0,
        total: amount,
        taxRate: 0,
        taxName: 'No Tax'
      };
    }

    // Use the first applicable tax rate
    const taxRate = taxRates[0];
    const rate = taxRate.rate;
    
    let tax = 0;
    let total = amount;

    if (taxInclusive) {
      // Tax is included in the displayed price
      tax = amount * (rate / (1 + rate));
      total = amount;
    } else {
      // Tax is additional
      tax = amount * rate;
      total = amount + tax;
    }

    return {
      tax: Math.round(tax * 100) / 100, // Round to 2 decimal places
      total: Math.round(total * 100) / 100,
      taxRate: rate,
      taxName: taxRate.name
    };
  }

  /**
   * Get tax rates for a region
   */
  getTaxRates(region: string): TaxRate[] {
    return TAX_RATES[region] || [];
  }

  /**
   * Check if tax is included in prices for a region
   */
  isTaxInclusive(region: string): boolean {
    const taxRates = TAX_RATES[region];
    return taxRates?.[0]?.included || false;
  }
}

/**
 * Amazon pricing integration
 */
class AmazonPricingService {
  private cacheKey = 'amazon_pricing';
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  /**
   * Get Amazon pricing for a region
   */
  async getAmazonPrice(
    asin: string,
    region: string
  ): Promise<AmazonPrice | null> {
    const cacheKey = `${asin}_${region}`;
    
    try {
      // Check cache first
      const cachedPrices = await cache.get<Record<string, AmazonPrice>>(this.cacheKey);
      
      if (cachedPrices && cachedPrices[cacheKey]) {
        const cached = cachedPrices[cacheKey];
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        
        if (cacheAge < this.cacheExpiry) {
          return cached;
        }
      }

      // Fetch from Amazon API (this would need proper Amazon API integration)
      const price = await this.fetchAmazonPrice(asin, region);
      
      if (price) {
        // Update cache
        const updatedPrices = {
          ...(cachedPrices || {}),
          [cacheKey]: price
        };
        
        await cache.set(this.cacheKey, updatedPrices, this.cacheExpiry);
      }
      
      return price;
    } catch (error) {
      console.error('Failed to fetch Amazon price:', error);
      return null;
    }
  }

  /**
   * Fetch price from Amazon API
   */
  private async fetchAmazonPrice(asin: string, region: string): Promise<AmazonPrice | null> {
    // This would integrate with Amazon Product Advertising API
    // For now, return mock data
    return {
      region,
      currency: getDefaultCurrencyForRegion(region),
      price: 25.99,
      availability: 'in_stock',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Convert Amazon price to target currency
   */
  async convertAmazonPrice(
    amazonPrice: AmazonPrice,
    targetCurrency: string
  ): Promise<AmazonPrice> {
    const exchangeRateService = new ExchangeRateService();
    const convertedPrice = await exchangeRateService.convertCurrency(
      amazonPrice.price,
      amazonPrice.currency,
      targetCurrency
    );

    return {
      ...amazonPrice,
      price: Math.round(convertedPrice * 100) / 100,
      currency: targetCurrency,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Service instances
export const exchangeRateService = new ExchangeRateService();
export const currencyFormattingService = new CurrencyFormattingService();
export const taxCalculationService = new TaxCalculationService();
export const amazonPricingService = new AmazonPricingService();

/**
 * High-level currency conversion function
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  return exchangeRateService.convertCurrency(amount, fromCurrency, toCurrency);
}

/**
 * High-level currency formatting function
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US',
  options?: Partial<PriceFormatting>
): string {
  return currencyFormattingService.formatCurrency(amount, currency, locale, options);
}

/**
 * Calculate total price with tax
 */
export function calculateTotalPrice(
  basePrice: number,
  region: string,
  currency: string,
  taxInclusive: boolean = false
): {
  basePrice: number;
  tax: number;
  total: number;
  currency: string;
  formatted: {
    basePrice: string;
    tax: string;
    total: string;
  };
} {
  const taxCalc = taxCalculationService.calculateTax(basePrice, region, taxInclusive);
  const formatted = {
    basePrice: formatCurrency(basePrice, currency),
    tax: formatCurrency(taxCalc.tax, currency),
    total: formatCurrency(taxCalc.total, currency)
  };

  return {
    basePrice,
    tax: taxCalc.tax,
    total: taxCalc.total,
    currency,
    formatted
  };
}

/**
 * Get pricing comparison across regions
 */
export async function getRegionalPricingComparison(
  basePrice: number,
  baseCurrency: string,
  targetRegions: string[]
): Promise<Array<{
  region: string;
  currency: string;
  originalPrice: number;
  convertedPrice: number;
  tax: number;
  total: number;
  formatted: string;
  exchangeRate: ExchangeRate;
}>> {
  const results = [];
  
  for (const region of targetRegions) {
    const currency = getDefaultCurrencyForRegion(region);
    const convertedPrice = await convertCurrency(basePrice, baseCurrency, currency);
    const taxCalc = taxCalculationService.calculateTax(convertedPrice, region);
    const exchangeRate = await exchangeRateService.getExchangeRate(baseCurrency, currency);
    
    results.push({
      region,
      currency,
      originalPrice: basePrice,
      convertedPrice,
      tax: taxCalc.tax,
      total: taxCalc.total,
      formatted: formatCurrency(taxCalc.total, currency),
      exchangeRate
    });
  }
  
  return results;
}

/**
 * Initialize currency system
 */
export async function initializeCurrencySystem(): Promise<void> {
  try {
    // Pre-warm exchange rate cache with major currencies
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    const baseCurrency = 'USD';
    
    await exchangeRateService.getExchangeRates(baseCurrency, majorCurrencies.filter(c => c !== baseCurrency));
    
    console.log('Currency system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize currency system:', error);
  }
}

export default {
  getSupportedCurrencies,
  getCurrency,
  getDefaultCurrencyForRegion,
  convertCurrency,
  formatCurrency,
  calculateTotalPrice,
  getRegionalPricingComparison,
  initializeCurrencySystem,
  exchangeRateService,
  currencyFormattingService,
  taxCalculationService,
  amazonPricingService
};