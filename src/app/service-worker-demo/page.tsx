'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CacheManagement } from '@/lib/cache-management';
import { BackgroundSync, PushNotifications } from '@/components/service-worker/registration';
import { useOffline } from '@/lib/use-offline';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Zap
} from 'lucide-react';

export default function ServiceWorkerDemo() {
  const { isOnline, wasOffline } = useOffline();
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('checking');
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isTestingCache, setIsTestingCache] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    checkServiceWorkerStatus();
    testOfflineCapabilities();
  }, []);

  const checkServiceWorkerStatus = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setServiceWorkerStatus('active');
      } else {
        setServiceWorkerStatus('not-registered');
      }
    } else {
      setServiceWorkerStatus('not-supported');
    }
  };

  const testOfflineCapabilities = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Service Worker Support
      if ('serviceWorker' in navigator) {
        results.push('✅ Service Workers supported');
      } else {
        results.push('❌ Service Workers not supported');
      }

      // Test 2: Cache API
      if ('caches' in window) {
        results.push('✅ Cache API available');
      } else {
        results.push('❌ Cache API not available');
      }

      // Test 3: Background Sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        results.push('✅ Background Sync supported');
      } else {
        results.push('❌ Background Sync not supported');
      }

      // Test 4: Push Notifications
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        results.push('✅ Push Notifications supported');
      } else {
        results.push('❌ Push Notifications not supported');
      }

      // Test 5: Notification API
      if ('Notification' in window) {
        results.push('✅ Notifications API available');
      } else {
        results.push('❌ Notifications API not available');
      }

      setTestResults(results);
    } catch (error) {
      results.push(`❌ Error testing capabilities: ${error}`);
      setTestResults(results);
    }
  };

  const simulateOfflineAction = async () => {
    setIsTestingCache(true);
    const results: string[] = [];
    
    try {
      // Simulate offline action that should be queued
      const action = {
        url: '/api/test-offline',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { action: 'test-offline', timestamp: Date.now() }
      };

      const queued = await BackgroundSync.queueAction(action);
      
      if (queued) {
        results.push('✅ Offline action queued successfully');
        setSyncQueue(prev => [...prev, { ...action, id: Date.now(), queuedAt: new Date() }]);
      } else {
        results.push('❌ Failed to queue offline action');
      }
    } catch (error) {
      results.push(`❌ Error queuing offline action: ${error}`);
    }
    
    setIsTestingCache(false);
    setTestResults(prev => [...prev, ...results]);
  };

  const testCachePerformance = async () => {
    setIsTestingCache(true);
    const results: string[] = [];
    
    try {
      // Test cache performance
      const start = performance.now();
      
      // Try to fetch and cache some data
      const response = await fetch('/api/flavors');
      const data = await response.json();
      
      const end = performance.now();
      const duration = end - start;
      
      results.push(`✅ API call completed in ${duration.toFixed(2)}ms`);
      results.push(`✅ Received ${Array.isArray(data) ? data.length : 'unknown'} items`);
      
      // Test cache retrieval
      const cacheStart = performance.now();
      const cachedResponse = await fetch('/api/flavors');
      const cacheEnd = performance.now();
      const cacheDuration = cacheEnd - cacheStart;
      
      results.push(`✅ Cached retrieval in ${cacheDuration.toFixed(2)}ms`);
      
      if (cacheDuration < duration) {
        results.push('🚀 Cache performance improvement detected');
      }
    } catch (error) {
      results.push(`❌ Cache test failed: ${error}`);
    }
    
    setIsTestingCache(false);
    setTestResults(prev => [...prev, ...results]);
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await PushNotifications.requestPermission();
      setTestResults(prev => [...prev, 
        permission === 'granted' 
          ? '✅ Notification permission granted' 
          : '❌ Notification permission denied'
      ]);
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Notification request failed: ${error}`]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not-registered': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'not-supported': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Service Worker Active';
      case 'not-registered': return 'Not Registered';
      case 'not-supported': return 'Not Supported';
      default: return 'Checking...';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Worker & Offline Demo</h1>
        <p className="text-gray-600">
          Test and monitor the offline caching capabilities of the energy drink app.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {wasOffline && isOnline && (
              <Badge variant="outline" className="mt-2 text-green-600">
                Back Online
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(serviceWorkerStatus)}
              <span className="text-sm">{getStatusText(serviceWorkerStatus)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {syncQueue.length}
            </div>
            <p className="text-sm text-gray-600">Pending actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Capability Tests */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Offline Capabilities Test</CardTitle>
          <CardDescription>
            Test various offline features and APIs supported by your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {result}
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={testOfflineCapabilities}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run Tests
            </Button>
            
            <Button 
              onClick={simulateOfflineAction}
              disabled={isTestingCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Queue Offline Action
            </Button>
            
            <Button 
              onClick={testCachePerformance}
              disabled={isTestingCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Test Cache Performance
            </Button>
            
            <Button 
              onClick={requestNotificationPermission}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Request Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Monitor and manage the service worker cache
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CacheManagement showAdvancedControls={true} />
        </CardContent>
      </Card>

      {/* Sync Queue */}
      {syncQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Background Sync Queue</CardTitle>
            <CardDescription>
              Actions queued for synchronization when back online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncQueue.map((action, index) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{action.method} {action.url}</div>
                    <div className="text-sm text-gray-600">
                      Queued at {action.queuedAt.toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}