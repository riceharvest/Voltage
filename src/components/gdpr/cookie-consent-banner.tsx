'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface CookieConsentBannerProps {
  isVisible: boolean;
  onAccept: (preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => void;
  onDecline: () => void;
}

export function CookieConsentBanner({
  isVisible,
  onAccept,
  onDecline
}: CookieConsentBannerProps) {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t" role="dialog" aria-labelledby="cookie-preferences-title" aria-describedby="cookie-preferences-description">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cookie Preferences</h3>

          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
            You can choose which types of cookies to accept. Necessary cookies are required for the site to function.
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="necessary"
                checked={preferences.necessary}
                disabled
              />
              <label htmlFor="necessary" className="text-sm font-medium">
                Necessary Cookies
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Required for basic site functionality, security, and age verification.
            </p>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2" role="checkbox" aria-checked={preferences.analytics}>
                <Checkbox
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, analytics: checked as boolean }))
                  }
                  aria-labelledby="analytics-label"
                />
                <label id="analytics-label" htmlFor="analytics" className="text-sm font-medium">
                  Analytics Cookies
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Help us understand how visitors interact with our website.
            </p>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2" role="checkbox" aria-checked={preferences.marketing}>
                <Checkbox
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, marketing: checked as boolean }))
                  }
                  aria-labelledby="marketing-label"
                />
                <label id="marketing-label" htmlFor="marketing" className="text-sm font-medium">
                  Marketing Cookies
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Used to deliver personalized advertisements and track campaign effectiveness.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              onClick={() => onAccept(preferences)}
              className="flex-1"
            >
              Accept Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => onAccept({ necessary: true, analytics: true, marketing: true })}
              className="flex-1"
            >
              Accept All
            </Button>
            <Button
              variant="ghost"
              onClick={onDecline}
            >
              Decline All
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you consent to our use of cookies in accordance with our{' '}
            <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
          </p>
        </div>
      </Card>
    </div>
  );
}