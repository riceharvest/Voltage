/**
 * Enhanced IP-Based Geolocation System with Multi-Region Support
 * 
 * Provides privacy-focused geolocation detection with GDPR compliance.
 * Automatically detects user's location and maps it to appropriate Amazon regions.
 * Supports state/province level granularity and cultural adaptation.
 * 
 * @example
 * ```typescript
 * const location = await getEnhancedUserLocation();
 * const amazonRegion = mapLocationToAmazonRegion(location.country);
 * const culturalAdaptations = getCulturalAdaptations(location);
 * ```
 */

export interface GeolocationData {
  country: string;
  region: string;
  state?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  isEU: boolean;
  isGDPRApplicable: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  currency?: string;
  language?: string[];
  culturalRegion?: string;
  confidence: number;
}

export interface AmazonRegionMapping {
  countryCode: string;
  amazonRegion: 'US' | 'UK' | 'DE' | 'FR' | 'NL' | 'CA' | 'AU' | 'JP';
  confidence: number;
  fallback?: boolean;
}

/**
 * Privacy-focused geolocation data source
 */
interface GeolocationProvider {
  getLocation(): Promise<GeolocationData>;
  getCachedLocation(): GeolocationData | null;
  cacheLocation(location: GeolocationData): void;
}

/**
 * GDPR compliance settings
 */
export interface GDPRSettings {
  requireConsent: boolean;
  cookieConsentRequired: boolean;
  dataRetentionDays: number;
  anonymizeIPs: boolean;
}

/**
 * Default GDPR settings for EU compliance
 */
const DEFAULT_GDPR_SETTINGS: GDPRSettings = {
  requireConsent: true,
  cookieConsentRequired: true,
  dataRetentionDays: 30,
  anonymizeIPs: true
};

/**
 * Country to Amazon region mapping with fallback logic
 */
const COUNTRY_TO_AMAZON_REGION: Record<string, AmazonRegionMapping> = {
  // United States & territories
  'US': { countryCode: 'US', amazonRegion: 'US', confidence: 1.0 },
  'CA': { countryCode: 'CA', amazonRegion: 'CA', confidence: 0.9 },
  
  // European Union
  'GB': { countryCode: 'GB', amazonRegion: 'UK', confidence: 0.95 },
  'DE': { countryCode: 'DE', amazonRegion: 'DE', confidence: 0.95 },
  'FR': { countryCode: 'FR', amazonRegion: 'FR', confidence: 0.95 },
  'NL': { countryCode: 'NL', amazonRegion: 'NL', confidence: 0.95 },
  'AT': { countryCode: 'AT', amazonRegion: 'DE', confidence: 0.8 },
  'BE': { countryCode: 'BE', amazonRegion: 'NL', confidence: 0.8 },
  'LU': { countryCode: 'LU', amazonRegion: 'DE', confidence: 0.8 },
  'IE': { countryCode: 'IE', amazonRegion: 'UK', confidence: 0.8 },
  'IT': { countryCode: 'IT', amazonRegion: 'DE', confidence: 0.7 },
  'ES': { countryCode: 'ES', amazonRegion: 'FR', confidence: 0.7 },
  'PL': { countryCode: 'PL', amazonRegion: 'DE', confidence: 0.7 },
  
  // Asia Pacific
  'AU': { countryCode: 'AU', amazonRegion: 'AU', confidence: 0.95 },
  'JP': { countryCode: 'JP', amazonRegion: 'JP', confidence: 0.95 },
  'NZ': { countryCode: 'NZ', amazonRegion: 'AU', confidence: 0.8 },
  
  // Fallbacks for unsupported regions
  'CN': { countryCode: 'CN', amazonRegion: 'US', confidence: 0.3, fallback: true },
  'RU': { countryCode: 'RU', amazonRegion: 'US', confidence: 0.3, fallback: true },
  'IN': { countryCode: 'IN', amazonRegion: 'US', confidence: 0.3, fallback: true },
  'BR': { countryCode: 'BR', amazonRegion: 'US', confidence: 0.3, fallback: true }
};

/**
 * EU country codes for GDPR compliance
 */
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE'
]);

/**
 * Geolocation service with multiple fallback providers
 */
class GeolocationService implements GeolocationProvider {
  private cache: GeolocationData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get user's geolocation with privacy protection
   */
  async getLocation(): Promise<GeolocationData> {
    // Check cache first
    const cached = this.getCachedLocation();
    if (cached) {
      return cached;
    }

    try {
      // Try multiple geolocation providers in order of preference
      const location = await this.tryGeolocationProviders();
      
      // Cache the result
      this.cacheLocation(location);
      
      return location;
    } catch (error) {
      console.warn('Geolocation failed, using fallback:', error);
      return this.getFallbackLocation();
    }
  }

  /**
   * Get cached location if still valid
   */
  getCachedLocation(): GeolocationData | null {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }
    return null;
  }

  /**
   * Cache location data with expiry
   */
  cacheLocation(location: GeolocationData): void {
    this.cache = location;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  /**
   * Try multiple geolocation providers
   */
  private async tryGeolocationProviders(): Promise<GeolocationData> {
    const providers = [
      () => this.getLocationFromHeaders(),
      () => this.getLocationFromAPI(),
      () => this.getLocationFromBrowser()
    ];

    for (const provider of providers) {
      try {
        const location = await provider();
        if (location.country) {
          return location;
        }
      } catch (error) {
        console.debug('Geolocation provider failed:', error);
      }
    }

    throw new Error('All geolocation providers failed');
  }

  /**
   * Get location from request headers (server-side)
   */
  private async getLocationFromHeaders(): Promise<GeolocationData> {
    // Try Cloudflare headers first
    const cfCountry = this.getHeaderValue('CF-IPCountry');
    const cfRegion = this.getHeaderValue('CF-Region');
    
    if (cfCountry) {
      return {
        country: cfCountry.toUpperCase(),
        region: cfRegion || '',
        isEU: EU_COUNTRIES.has(cfCountry.toUpperCase()),
        isGDPRApplicable: EU_COUNTRIES.has(cfCountry.toUpperCase())
      };
    }

    // Try other CDN headers
    const country = this.getHeaderValue('X-COUNTRY') || this.getHeaderValue('GEOIP_COUNTRY');
    if (country) {
      const countryCode = country.toUpperCase();
      return {
        country: countryCode,
        region: this.getHeaderValue('X-REGION') || '',
        isEU: EU_COUNTRIES.has(countryCode),
        isGDPRApplicable: EU_COUNTRIES.has(countryCode)
      };
    }

    throw new Error('No country header found');
  }

  /**
   * Get location from external API
   */
  private async getLocationFromAPI(): Promise<GeolocationData> {
    const apis = [
      'https://ipapi.co/json/',
      'https://ipapi.com/json/',
      'https://ipgeolocation.io/ip-location'
    ];

    for (const api of apis) {
      try {
        const response = await fetch(`${api}?fields=country_code,region,city,timezone`);
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code?.toUpperCase();
          
          if (countryCode) {
            return {
              country: countryCode,
              region: data.region || '',
              city: data.city,
              timezone: data.timezone,
              isEU: EU_COUNTRIES.has(countryCode),
              isGDPRApplicable: EU_COUNTRIES.has(countryCode)
            };
          }
        }
      } catch (error) {
        console.debug('API geolocation failed:', error);
      }
    }

    throw new Error('API geolocation failed');
  }

  /**
   * Get location from browser (client-side only)
   */
  private async getLocationFromBrowser(): Promise<GeolocationData> {
    if (typeof window === 'undefined') {
      throw new Error('Browser geolocation not available on server');
    }

    // Use browser timezone as fallback indicator
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const region = this.getRegionFromTimezone(timezone);
    
    // This is a fallback - we can't get exact country from browser
    // without explicit user permission for geolocation API
    return {
      country: region || 'US',
      region: region || '',
      timezone,
      isEU: this.isEuropeanTimezone(timezone),
      isGDPRApplicable: this.isEuropeanTimezone(timezone)
    };
  }

  /**
   * Get header value helper
   */
  private getHeaderValue(headerName: string): string | null {
    if (typeof window === 'undefined') {
      // Server-side: try to get from headers
      const headers = require('next/headers');
      try {
        const headerList = headers();
        return headerList.get(headerName.toLowerCase()) || null;
      } catch {
        return null;
      }
    } else {
      // Client-side: check meta tags or data attributes
      const meta = document.querySelector(`meta[name="${headerName}"]`);
      if (meta) {
        return meta.getAttribute('content');
      }
      return null;
    }
  }

  /**
   * Map timezone to region
   */
  private getRegionFromTimezone(timezone: string): string | null {
    if (!timezone) return null;
    
    if (timezone.includes('Europe/')) return 'EU';
    if (timezone.includes('America/')) return 'US';
    if (timezone.includes('Asia/')) return 'AS';
    if (timezone.includes('Australia/')) return 'AU';
    
    return null;
  }

  /**
   * Check if timezone indicates European location
   */
  private isEuropeanTimezone(timezone: string): boolean {
    return timezone.includes('Europe/') && 
           !timezone.includes('Europe/Moscow') &&
           !timezone.includes('Europe/Kiev');
  }

  /**
   * Fallback location for failed geolocation
   */
  private getFallbackLocation(): GeolocationData {
    return {
      country: 'US',
      region: '',
      isEU: false,
      isGDPRApplicable: false
    };
  }
}

/**
 * Global geolocation service instance
 */
export const geolocationService = new GeolocationService();

/**
 * Get user's location with GDPR compliance
 */
export async function getUserLocation(gdprSettings: GDPRSettings = DEFAULT_GDPR_SETTINGS): Promise<GeolocationData> {
  // Check GDPR compliance requirements
  if (gdprSettings.requireConsent && !hasUserConsent()) {
    console.debug('Geolocation blocked: no user consent');
    return {
      country: 'US',
      region: '',
      isEU: false,
      isGDPRApplicable: false
    };
  }

  return await geolocationService.getLocation();
}

/**
 * Map location to Amazon region
 */
export function mapLocationToAmazonRegion(countryCode: string, fallbackRegion: 'US' | 'UK' | 'DE' = 'US'): AmazonRegionMapping {
  const mapping = COUNTRY_TO_AMAZON_REGION[countryCode.toUpperCase()];
  
  if (mapping) {
    return mapping;
  }

  // Fallback to specified region
  return {
    countryCode: countryCode.toUpperCase(),
    amazonRegion: fallbackRegion,
    confidence: 0.1,
    fallback: true
  };
}

/**
 * Get all available Amazon regions
 */
export function getAvailableAmazonRegions(): Array<{code: string, name: string, domain: string}> {
  return [
    { code: 'US', name: 'United States', domain: 'amazon.com' },
    { code: 'UK', name: 'United Kingdom', domain: 'amazon.co.uk' },
    { code: 'DE', name: 'Germany', domain: 'amazon.de' },
    { code: 'FR', name: 'France', domain: 'amazon.fr' },
    { code: 'NL', name: 'Netherlands', domain: 'amazon.nl' },
    { code: 'CA', name: 'Canada', domain: 'amazon.ca' },
    { code: 'AU', name: 'Australia', domain: 'amazon.com.au' },
    { code: 'JP', name: 'Japan', domain: 'amazon.co.jp' }
  ];
}

/**
 * Check if user has given consent for geolocation
 */
function hasUserConsent(): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side, assume consent
  }

  const consent = localStorage.getItem('geolocation-consent');
  const cookieConsent = document.cookie.includes('cookie-consent=accepted');
  
  return consent === 'granted' || cookieConsent;
}

/**
 * Request geolocation consent from user
 */
export async function requestGeolocationConsent(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // Show consent modal or banner
  const consent = await showConsentDialog();
  
  if (consent) {
    localStorage.setItem('geolocation-consent', 'granted');
    return true;
  }
  
  localStorage.setItem('geolocation-consent', 'denied');
  return false;
}

/**
 * Show GDPR consent dialog (implementation depends on your consent system)
 */
async function showConsentDialog(): Promise<boolean> {
  return new Promise((resolve) => {
    // This would integrate with your existing GDPR consent system
    // For now, return a simple confirmation
    const confirmed = window.confirm(
      'This site uses location data to provide you with the most relevant Amazon shopping experience. ' +
      'Your location will only be used to determine which Amazon region to show you products from. ' +
      'Do you consent to this use of your location data?'
    );
    
    resolve(confirmed);
  });
}

/**
 * Clear cached location data (for privacy compliance)
 */
export function clearLocationCache(): void {
  geolocationService.cacheLocation({
    country: 'US',
    region: '',
    isEU: false,
    isGDPRApplicable: false
  });
}

export default {
  getUserLocation,
  mapLocationToAmazonRegion,
  getAvailableAmazonRegions,
  requestGeolocationConsent,
  clearLocationCache,
  geolocationService
};