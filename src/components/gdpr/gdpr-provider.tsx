'use client';

import { useState, useEffect } from 'react';
import { CookieConsentBanner } from './cookie-consent-banner';
import { initializeAnalytics } from '@/lib/analytics';
import { createConsentCookie, getConsentData, isConsentValid } from '@/lib/gdpr';

interface GDPRProviderProps {
  children: React.ReactNode;
  initialIsEUUser?: boolean;
}

export function GDPRProvider({ children, initialIsEUUser = false }: GDPRProviderProps) {
  const [isEUUser, setIsEUUser] = useState(initialIsEUUser);
  const [showBanner, setShowBanner] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch GDPR status from API
    const fetchGDPRStatus = async () => {
      try {
        const response = await fetch('/api/gdpr/status');
        const data = await response.json();

        setIsEUUser(data.isEU);

        if (data.hasConsent) {
          setConsentGiven(true);
        } else if (data.consentRequired) {
          setShowBanner(true);
        } else {
          setConsentGiven(true); // Non-EU users don't need consent
        }
      } catch (error) {
        console.error('Error fetching GDPR status:', error);
        // Default to showing banner if API fails
        setShowBanner(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGDPRStatus();
  }, []);

  const handleAccept = (preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => {
    const consentCookie = createConsentCookie(preferences);

    // Set cookie for 1 year
    document.cookie = `gdpr-consent=${consentCookie}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;

    setConsentGiven(true);
    setShowBanner(false);

    // Here you would typically initialize analytics/marketing scripts based on preferences
    if (preferences.analytics) {
      // Initialize analytics (e.g., Vercel Analytics, Google Analytics)
      initializeAnalytics();

      console.log('Analytics consent given');
    }

    if (preferences.marketing) {
      // Initialize marketing scripts
      console.log('Marketing consent given');
    }
  };

  const handleDecline = () => {
    // Set minimal consent (only necessary cookies)
    const minimalConsent = createConsentCookie({
      necessary: true,
      analytics: false,
      marketing: false
    });

    document.cookie = `gdpr-consent=${minimalConsent}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;

    setConsentGiven(true);
    setShowBanner(false);
  };

  // Don't render children until GDPR status is resolved
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <CookieConsentBanner
        isVisible={showBanner}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
}