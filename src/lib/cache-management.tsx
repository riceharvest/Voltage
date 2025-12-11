'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  cacheBreakdown: {
    static: { size: number; entries: number };
    images: { size: number; entries: number };
    api: { size: number; entries: number };
    pages: { size: number; entries: number };
  };
  lastUpdated: Date;
}

export interface CacheConfig {
  static: { maxAge: number; maxEntries: number };
  images: { maxAge: number; maxEntries: number };
  api: { maxAge: number; maxEntries: number };
  pages: { maxAge: number; maxEntries: number };
}

export class CacheManager {
  private static instance: CacheManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async setServiceWorker(registration: ServiceWorkerRegistration) {
    this.serviceWorkerRegistration = registration;
  }

  async clearCache(cacheName?: string): Promise<boolean> {
    try {
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: cacheName ? 'CACHE_CLEAR_SPECIFIC' : 'CACHE_CLEAR',
          payload: cacheName ? { cacheName } : undefined
        });
        return true;
      }

      // Fallback to manual cache clearing
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        if (cacheName) {
          const specificCache = cacheNames.find(name => name.includes(cacheName));
          if (specificCache) {
            await caches.delete(specificCache);
          }
        } else {
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Cache clearing failed:', error);
      return false;
    }
  }

  async getCacheStats(): Promise<CacheStats | null> {
    try {
      if (!('caches' in window)) {
        return null;
      }

      const cacheNames = await caches.keys();
      const stats: CacheStats = {
        totalSize: 0,
        totalEntries: 0,
        cacheBreakdown: {
          static: { size: 0, entries: 0 },
          images: { size: 0, entries: 0 },
          api: { size: 0, entries: 0 },
          pages: { size: 0, entries: 0 }
        },
        lastUpdated: new Date()
      };

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        let cacheType: keyof CacheStats['cacheBreakdown'] = 'api'; // default
        
        if (cacheName.includes('static')) cacheType = 'static';
        else if (cacheName.includes('image')) cacheType = 'images';
        else if (cacheName.includes('page')) cacheType = 'pages';
        
        stats.cacheBreakdown[cacheType].entries += requests.length;
        stats.totalEntries += requests.length;

        // Estimate cache size (this is approximate)
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const size = this.estimateResponseSize(response);
            stats.cacheBreakdown[cacheType].size += size;
            stats.totalSize += size;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  private estimateResponseSize(response: Response): number {
    // This is a rough estimate since we can't easily get the exact size
    const headers = Array.from(response.headers.entries());
    let size = headers.reduce((acc, [key, value]) => acc + key.length + value.length, 0);
    
    if (response.body) {
      // Add estimated content size
      size += 1024; // Rough estimate
    }
    
    return size;
  }

  async cleanupOldEntries(): Promise<boolean> {
    try {
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'CACHE_CLEANUP'
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
      return false;
    }
  }

  async updateCache(): Promise<boolean> {
    try {
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'FORCE_UPDATE'
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Cache update failed:', error);
      return false;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// React hooks for cache management
export function useCacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheManager = CacheManager.getInstance();

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newStats = await cacheManager.getCacheStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cache stats');
    } finally {
      setIsLoading(false);
    }
  }, [cacheManager]);

  const clearCache = useCallback(async (cacheName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await cacheManager.clearCache(cacheName);
      if (success) {
        // Refresh stats after clearing
        await refreshStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setIsLoading(false);
    }
  }, [cacheManager, refreshStats]);

  const cleanupCache = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await cacheManager.cleanupOldEntries();
      if (success) {
        await refreshStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup cache');
    } finally {
      setIsLoading(false);
    }
  }, [cacheManager, refreshStats]);

  const updateCache = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await cacheManager.updateCache();
      if (success) {
        await refreshStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cache');
    } finally {
      setIsLoading(false);
    }
  }, [cacheManager, refreshStats]);

  // Auto-refresh stats periodically
  useEffect(() => {
    refreshStats();
    
    const interval = setInterval(refreshStats, 60000); // Every minute
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    clearCache,
    cleanupCache,
    updateCache,
    formatBytes: cacheManager.formatBytes
  };
}

// Cache management component
interface CacheManagementProps {
  showAdvancedControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CacheManagement({ 
  showAdvancedControls = true,
  autoRefresh = true,
  refreshInterval = 60000 
}: CacheManagementProps) {
  const {
    stats,
    isLoading,
    error,
    clearCache,
    cleanupCache,
    updateCache,
    refreshStats,
    formatBytes
  } = useCacheManager();

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all cached data? This will affect offline functionality.')) {
      await clearCache();
    }
  };

  const handleClearSpecific = async (cacheType: string) => {
    const cacheNames = {
      static: 'static assets (CSS, JS)',
      images: 'cached images',
      api: 'API responses',
      pages: 'cached pages'
    };
    
    if (confirm(`Clear ${cacheNames[cacheType as keyof typeof cacheNames]}?`)) {
      await clearCache(cacheType);
    }
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
        <p className="text-gray-600">
          {error ? `Error loading cache stats: ${error}` : 'Loading cache information...'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Cache Management</h3>
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
          {showAdvancedControls && (
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{formatBytes(stats.totalSize)}</div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(stats.cacheBreakdown).length}
          </div>
          <div className="text-sm text-gray-600">Cache Types</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-gray-800">
            {stats.lastUpdated.toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-600">Last Updated</div>
        </div>
      </div>

      {/* Cache Breakdown */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Cache Breakdown</h4>
        
        {Object.entries(stats.cacheBreakdown).map(([type, data]) => (
          <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  type === 'static' ? 'bg-blue-500' :
                  type === 'images' ? 'bg-green-500' :
                  type === 'api' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}></div>
                <div>
                  <div className="font-medium capitalize">{type} Cache</div>
                  <div className="text-sm text-gray-600">
                    {data.entries} entries • {formatBytes(data.size)}
                  </div>
                </div>
              </div>
            </div>
            
            {showAdvancedControls && (
              <button
                onClick={() => handleClearSpecific(type)}
                disabled={isLoading || data.entries === 0}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Cache Actions */}
      {showAdvancedControls && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Actions</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={cleanupCache}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
            >
              🧹 Cleanup Old Entries
            </button>
            <button
              onClick={updateCache}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors disabled:opacity-50"
            >
              🔄 Force Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}