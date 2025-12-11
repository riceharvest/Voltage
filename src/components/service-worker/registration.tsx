'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface ServiceWorkerConfig {
  registrationOptions?: ServiceWorkerRegistrationOptions;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  isOfflineReady: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function useServiceWorker(config: ServiceWorkerConfig = {}) {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdating: false,
    isOfflineReady: false,
    updateAvailable: false,
    registration: null,
    error: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    // Register service worker
    registerServiceWorker(config)
      .then(registration => {
        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          registration,
          error: null 
        }));
        
        config.onSuccess?.(registration);
      })
      .catch(error => {
        logger.error('Service Worker registration failed:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'Registration failed' 
        }));
      });
  }, [config]);

  const updateServiceWorker = async () => {
    if (!state.registration) return;

    setState(prev => ({ ...prev, isUpdating: true }));

    try {
      await state.registration.update();
      setState(prev => ({ ...prev, isUpdating: false }));
    } catch (error) {
      logger.error('Service Worker update failed:', error);
      setState(prev => ({ 
        ...prev, 
        isUpdating: false,
        error: 'Update failed'
      }));
    }
  };

  const unregisterServiceWorker = async () => {
    if (!state.registration) return;

    try {
      const success = await state.registration.unregister();
      if (success) {
        setState(prev => ({ 
          ...prev, 
          isRegistered: false,
          registration: null
        }));
        logger.info('Service Worker unregistered successfully');
      }
    } catch (error) {
      logger.error('Service Worker unregistration failed:', error);
    }
  };

  const sendMessage = (message: any) => {
    if (state.registration?.active) {
      state.registration.active.postMessage(message);
    }
  };

  return {
    ...state,
    updateServiceWorker,
    unregisterServiceWorker,
    sendMessage
  };
}

async function registerServiceWorker(config: ServiceWorkerConfig): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    ...config.registrationOptions
  });

  // Handle updates
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New update available
        config.onUpdate?.(registration);
      }
    });
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type } = event.data;
    
    switch (type) {
      case 'OFFLINE_READY':
        config.onOfflineReady?.();
        break;
      case 'CACHE_UPDATED':
        // Handle cache updates
        break;
      case 'NEW_VERSION_AVAILABLE':
        config.onUpdate?.(registration);
        break;
    }
  });

  return registration;
}

// Service Worker registration component
interface ServiceWorkerRegistrationProps {
  config?: ServiceWorkerConfig;
  showUpdateNotification?: boolean;
  autoUpdate?: boolean;
}

export function ServiceWorkerRegistration({ 
  config = {},
  showUpdateNotification = true,
  autoUpdate = true 
}: ServiceWorkerRegistrationProps) {
  const [showUpdateUI, setShowUpdateUI] = useState(false);
  const serviceWorker = useServiceWorker({
    ...config,
    onUpdate: (registration) => {
      setShowUpdateUI(true);
      config.onUpdate?.(registration);
      
      if (autoUpdate) {
        // Auto-update after user closes the notification
        setTimeout(() => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }, 5000);
      }
    }
  });

  useEffect(() => {
    if (serviceWorker.isRegistered && serviceWorker.isOfflineReady) {
      logger.info('Service Worker registered and offline ready');
    }
  }, [serviceWorker.isRegistered, serviceWorker.isOfflineReady]);

  if (!serviceWorker.isSupported) {
    return null; // Service workers not supported
  }

  return (
    <>
      {/* Update Notification */}
      {showUpdateNotification && showUpdateUI && (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm">
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 shadow-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Update Available
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              A new version of the app is ready with improved features.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  serviceWorker.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setShowUpdateUI(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Worker Status Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && serviceWorker.isRegistered && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-800">
                SW Active
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Background sync utilities
export class BackgroundSync {
  static async queueAction(action: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    priority?: 'high' | 'normal' | 'low';
  }) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        
        // Store action for later sync
        if ('caches' in window) {
          // Use Cache Storage for storing sync queue
          const cache = await caches.open('sync-queue');
          const response = new Response(JSON.stringify(action));
          await cache.put(`/sync-${Date.now()}`, response);
        }
        
        return true;
      } catch (error) {
        logger.error('Background sync registration failed:', error);
        return false;
      }
    }
    
    // Fallback: try immediate sync
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body ? JSON.stringify(action.body) : undefined
      });
      return true;
    } catch (error) {
      logger.error('Immediate sync failed:', error);
      return false;
    }
  }
}

// Push notification utilities
export class PushNotifications {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  static async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY ? 
          urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY) : undefined
      });
      
      return subscription;
    } catch (error) {
      logger.error('Push subscription failed:', error);
      return null;
    }
  }

  static async unsubscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        return await subscription.unsubscribe();
      }
      
      return true;
    } catch (error) {
      logger.error('Push unsubscribe failed:', error);
      return false;
    }
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}