'use client';

import { useState, useEffect } from 'react';
import { AgeVerificationModal } from './age-verification-modal';

interface AgeVerificationProviderProps {
  children: React.ReactNode;
}

export function AgeVerificationProvider({ children }: AgeVerificationProviderProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = async () => {
      try {
        // Check if age-verified cookie exists by making a request that would fail if not verified
        const response = await fetch('/api/auth/check-verification', {
          method: 'GET',
        });

        if (response.ok) {
          setIsVerified(true);
        }
      } catch (error) {
        // If request fails, user is not verified
        console.log('User not verified');
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, []);

  const handleVerification = () => {
    setIsVerified(true);
  };

  if (isChecking) {
    // Show loading state while checking verification
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AgeVerificationModal
        isOpen={!isVerified}
        onVerified={handleVerification}
      />
    </>
  );
}