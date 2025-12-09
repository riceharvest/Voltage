'use client';

import { useOffline } from '@/lib/use-offline';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOffline();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline
        ? 'bg-green-100 border border-green-200 text-green-800'
        : 'bg-orange-100 border border-orange-200 text-orange-800'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          showReconnected ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Back online</span>
            </>
          ) : null
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
            <span className="text-xs opacity-75">Some features may be limited</span>
          </>
        )}
      </div>
    </div>
  );
}