'use client';

import { useState, useEffect } from 'react';
import { getConsentData } from '@/lib/gdpr';

export interface GdprConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function useGdpr() {
  const [consent, setConsent] = useState<GdprConsent>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get consent from cookie
    const getConsentFromCookie = () => {
      if (typeof window === 'undefined') {
        return {
          necessary: true,
          analytics: false,
          marketing: false
        };
      }

      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const consentData = getConsentData(cookies);
      return consentData || {
        necessary: true,
        analytics: false,
        marketing: false
      };
    };

    const currentConsent = getConsentFromCookie();
    setConsent(currentConsent);
    setIsLoading(false);

    // Listen for consent changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gdpr-consent') {
        const updatedConsent = getConsentFromCookie();
        setConsent(updatedConsent);
      }
    };

    // Also listen for cookie changes (since cookies don't trigger storage events)
    const checkConsentPeriodically = () => {
      const currentConsent = getConsentFromCookie();
      setConsent(currentConsent);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkConsentPeriodically, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return {
    consent,
    hasAnalyticsConsent: consent.analytics,
    hasMarketingConsent: consent.marketing,
    isLoading
  };
}