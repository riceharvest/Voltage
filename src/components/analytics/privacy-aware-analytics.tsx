'use client';

import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';
import { useGdpr } from '../gdpr/use-gdpr';
import { flushQueue } from '@/lib/analytics';

export function PrivacyAwareAnalytics() {
  const { hasAnalyticsConsent, isLoading } = useGdpr();

  // Listen for consent changes and flush queue when analytics consent is granted
  useEffect(() => {
    if (hasAnalyticsConsent && !isLoading) {
      console.log('Analytics consent granted - flushing queued events');
      flushQueue();
    }
  }, [hasAnalyticsConsent, isLoading]);

  // Don't render analytics until consent status is determined
  if (isLoading) {
    return null;
  }

  // Only render analytics if user has given consent
  if (!hasAnalyticsConsent) {
    console.log('Analytics component not rendered - no consent');
    return null;
  }

  console.log('Analytics component rendered - consent granted');
  return <Analytics />;
}