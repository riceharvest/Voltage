import { track } from '@vercel/analytics';
import { getConsentStatus } from './gdpr';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

// Event queue for storing events when consent is not given
let eventQueue: AnalyticsEvent[] = [];

/**
 * Check if analytics tracking is allowed based on user consent
 */
export function canTrackAnalytics(): boolean {
  const consentStatus = getConsentStatus();
  return consentStatus.analytics;
}

/**
 * Track an event only if user has consented to analytics
 * If no consent, queue the event for later processing
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!canTrackAnalytics()) {
    console.log('Analytics tracking queued - no consent yet');
    eventQueue.push(event);
    return;
  }

  try {
    track(event.name, event.properties as Record<string, string | number | boolean | undefined>);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track page views
 */
export function trackPageView(page: string, properties?: Record<string, unknown>): void {
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
export function trackInteraction(action: string, category: string, properties?: Record<string, unknown>): void {
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
export function trackCalculatorUsage(action: string, properties?: Record<string, unknown>): void {
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
 * Flush the event queue and send all queued events
 */
export function flushQueue(): void {
  if (!canTrackAnalytics() || eventQueue.length === 0) {
    return;
  }

  console.log(`Flushing ${eventQueue.length} queued analytics events`);

  // Process all queued events
  const queueToProcess = [...eventQueue];
  eventQueue = [];

  queueToProcess.forEach(event => {
    try {
      track(event.name, event.properties as Record<string, string | number | boolean | undefined>);
    } catch (error) {
      console.error('Analytics tracking error for queued event:', error);
    }
  });
}

/**
 * Get the current queue length (for debugging)
 */
export function getQueueLength(): number {
  return eventQueue.length;
}

/**
 * Clear the event queue without sending events (for when user explicitly declines)
 */
export function clearQueue(): void {
  eventQueue = [];
}

/**
 * Initialize analytics when consent is given
 */
export function initializeAnalytics(): void {
  if (!canTrackAnalytics()) return;

  // Flush any queued events first
  flushQueue();

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