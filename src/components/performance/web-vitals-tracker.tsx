'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: any;
  }
}

const reportWebVitals = (metric: Metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }

  // Send to analytics service (Vercel Analytics or custom)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      custom_map: { metric_value: metric.value }
    });
  }

  // Send to Sentry for monitoring
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: {
        web_vital: metric.name,
        value: Math.round(metric.value)
      },
      extra: {
        metric
      }
    });
  }
};

export function WebVitalsTracker() {
  useEffect(() => {
    // Track Core Web Vitals
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null; // This component doesn't render anything
}