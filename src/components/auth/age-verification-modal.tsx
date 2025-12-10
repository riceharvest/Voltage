'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerified: () => void;
}

export function AgeVerificationModal({ isOpen, onVerified }: AgeVerificationModalProps) {
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 120;
  const maxBirthYear = currentYear - 18;

  useEffect(() => {
    // Fetch CSRF token when modal opens
    if (isOpen) {
      fetch('/api/csrf-token')
        .then(res => res.json())
        .then(data => setCsrfToken(data.csrfToken))
        .catch(err => console.error('Failed to fetch CSRF token:', err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const year = parseInt(birthYear);
    if (isNaN(year) || year < minBirthYear || year > maxBirthYear) {
      setError('Please enter a valid birth year. You must be at least 18 years old.');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ birthYear: year }),
      });

      if (response.ok) {
        onVerified();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to verify age. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" role="dialog" aria-labelledby="age-verification-title" aria-describedby="age-verification-description">
        <DialogHeader>
          <DialogTitle id="age-verification-title">Age Verification Required</DialogTitle>
        </DialogHeader>
        <div id="age-verification-description" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This website contains information about energy drinks. Due to EU regulations,
            you must be at least 18 years old to access this content.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="age-verification-title" aria-label="Age verification form">
            <div className="space-y-2">
              <Label htmlFor="birthYear">Enter your birth year</Label>
              <Input
                id="birthYear"
                type="number"
                placeholder="e.g. 1990"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min={minBirthYear}
                max={maxBirthYear}
                required
                aria-describedby={error ? "birthYear-error" : undefined}
                aria-invalid={!!error}
              />
            </div>
            {error && (
              <p id="birthYear-error" className="text-sm text-destructive" role="alert">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Verify Age
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">
            Your birth year is only used for age verification and is not stored.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}