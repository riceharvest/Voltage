import { track } from '@vercel/analytics';
import { getConsentData } from './gdpr';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

/**
 * Check if analytics tracking is allowed based on user consent
 */
export function canTrackAnalytics(): boolean {
  if (typeof window === 'undefined') return false;

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const consent = getConsentData(cookies);
  return consent?.analytics === true;
}

/**
 * Track an event only if user has consented to analytics
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!canTrackAnalytics()) {
    console.log('Analytics tracking skipped - no consent');
    return;
  }

  try {
    track(event.name, event.properties);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track page views
 */
export function trackPageView(page: string, properties?: Record<string, any>): void {
  trackEvent({
    name: 'page_view',
    properties: {
      page,
      ...properties
    }
  });
}

/**
 * Track user interactions
 */
export function trackInteraction(action: string, category: string, properties?: Record<string, any>): void {
  trackEvent({
    name: 'user_interaction',
    properties: {
      action,
      category,
      ...properties
    }
  });
}

/**
 * Track calculator usage
 */
export function trackCalculatorUsage(action: string, properties?: Record<string, any>): void {
  trackInteraction(action, 'calculator', properties);
}

/**
 * Track flavor selections
 */
export function trackFlavorSelection(flavorId: string, flavorName: string): void {
  trackEvent({
    name: 'flavor_selected',
    properties: {
      flavor_id: flavorId,
      flavor_name: flavorName
    }
  });
}

/**
 * Track recipe generation
 */
export function trackRecipeGeneration(recipeData: {
  base: string;
  flavors: string[];
  caffeine: number;
  volume: number;
}): void {
  trackEvent({
    name: 'recipe_generated',
    properties: {
      base: recipeData.base,
      flavor_count: recipeData.flavors.length,
      caffeine_mg: recipeData.caffeine,
      volume_ml: recipeData.volume
    }
  });
}

/**
 * Track safety warnings
 */
export function trackSafetyWarning(warningType: string, severity: 'low' | 'medium' | 'high'): void {
  trackEvent({
    name: 'safety_warning',
    properties: {
      warning_type: warningType,
      severity
    }
  });
}

/**
 * Track affiliate link clicks
 */
export function trackAffiliateClick(affiliateName: string, productId?: string): void {
  trackEvent({
    name: 'affiliate_click',
    properties: {
      affiliate: affiliateName,
      product_id: productId
    }
  });
}

/**
 * Track conversions from affiliate links
 */
export function trackAffiliateConversion(affiliateName: string, value?: number, currency: string = 'EUR'): void {
  trackEvent({
    name: 'affiliate_conversion',
    properties: {
      affiliate: affiliateName,
      value,
      currency
    }
  });
}

/**
 * Initialize analytics when consent is given
 */
export function initializeAnalytics(): void {
  if (!canTrackAnalytics()) return;

  // Track initial page load
  trackPageView(window.location.pathname);

  // Track consent given
  trackEvent({
    name: 'consent_given',
    properties: {
      analytics: true
    }
  });
}