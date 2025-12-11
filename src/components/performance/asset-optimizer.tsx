'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Resource hint types for performance optimization
export interface ResourceHint {
  href: string;
  rel: 'dns-prefetch' | 'preconnect' | 'preload' | 'prefetch' | 'prerender';
  as?: 'script' | 'style' | 'image' | 'font' | 'document';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  referrerPolicy?: 'no-referrer' | 'origin' | 'no-referrer-when-downgrade' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  importance?: 'high' | 'low' | 'auto';
}

// Asset loading state
interface AssetLoadingState {
  [key: string]: 'pending' | 'loading' | 'loaded' | 'error';
}

// Props for AssetOptimizer component
interface AssetOptimizerProps {
  children: React.ReactNode;
  resourceHints?: ResourceHint[];
  criticalAssets?: string[];
  prefetchImages?: string[];
  preloadFonts?: string[];
  enableResourceHints?: boolean;
  enablePrefetching?: boolean;
  performanceBudget?: {
    maxConcurrentRequests?: number;
    timeout?: number;
  };
  className?: string;
}

// Custom hook for resource hints management
function useResourceHints(hints: ResourceHint[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined' || !hints.length) return;

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      
      if (hint.as) link.as = hint.as;
      if (hint.type) link.type = hint.type;
      if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
      if (hint.referrerPolicy) link.referrerPolicy = hint.referrerPolicy;
      if (hint.importance) link.setAttribute('importance', hint.importance);

      // Add to head
      document.head.appendChild(link);

      // Clean up on unmount for prefetch and prerender
      if (['prefetch', 'prerender'].includes(hint.rel)) {
        return () => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        };
      }
    });
  }, [hints]);
}

// Custom hook for asset preloading
function useAssetPreloading(
  criticalAssets: string[] = [],
  prefetchImages: string[] = [],
  preloadFonts: string[] = [],
  enablePrefetching: boolean = true
) {
  const [loadingState, setLoadingState] = useState<AssetLoadingState>({});
  const loadingRef = useRef<Set<string>>(new Set());

  // Preload critical assets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    criticalAssets.forEach(asset => {
      if (loadingRef.current.has(asset)) return;
      
      loadingRef.current.add(asset);
      setLoadingState(prev => ({ ...prev, [asset]: 'loading' }));

      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (asset.match(/\.(css)$/)) {
        link.as = 'style';
        link.type = 'text/css';
      } else if (asset.match(/\.(js)$/)) {
        link.as = 'script';
      } else if (asset.match(/\.(woff|woff2|ttf|eot)$/)) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (asset.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/)) {
        link.as = 'image';
      } else {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }

      link.href = asset;
      document.head.appendChild(link);

      // Simulate loading completion
      link.onload = () => {
        setLoadingState(prev => ({ ...prev, [asset]: 'loaded' }));
      };

      link.onerror = () => {
        setLoadingState(prev => ({ ...prev, [asset]: 'error' }));
      };
    });
  }, [criticalAssets]);

  // Prefetch non-critical assets
  useEffect(() => {
    if (!enablePrefetching || typeof window === 'undefined') return;

    // Prefetch images
    prefetchImages.forEach(imageSrc => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = imageSrc;
      document.head.appendChild(link);
    });

    // Prefetch fonts
    preloadFonts.forEach(fontSrc => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = fontSrc;
      document.head.appendChild(link);
    });
  }, [prefetchImages, preloadFonts, enablePrefetching]);

  return { loadingState };
}

// Main AssetOptimizer component
export function AssetOptimizer({
  children,
  resourceHints = [],
  criticalAssets = [],
  prefetchImages = [],
  preloadFonts = [],
  enableResourceHints = true,
  enablePrefetching = true,
  performanceBudget = {
    maxConcurrentRequests: 6,
    timeout: 5000,
  },
  className,
}: AssetOptimizerProps) {
  // Initialize resource hints
  useResourceHints(enableResourceHints ? resourceHints : []);

  // Initialize asset preloading
  const { loadingState } = useAssetPreloading(
    criticalAssets,
    prefetchImages,
    preloadFonts,
    enablePrefetching
  );

  return (
    <div className={cn('asset-optimizer', className)}>
      {children}
    </div>
  );
}

// Utility component for critical asset preloading
export function CriticalAssetPreloader({ assets }: { assets: string[] }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      // Determine asset type
      if (asset.match(/\.(css)$/)) {
        link.as = 'style';
        link.type = 'text/css';
      } else if (asset.match(/\.(js)$/)) {
        link.as = 'script';
      } else if (asset.match(/\.(woff|woff2|ttf|eot)$/)) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }

      link.href = asset;
      document.head.appendChild(link);
    });
  }, [assets]);

  return null;
}

// Utility component for image preloading
export function ImagePreloader({ src, priority = false }: { src: string; priority?: boolean }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = src;
    
    if (priority) {
      link.setAttribute('importance', 'high');
    }

    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [src, priority]);

  return null;
}

// Resource hints for common external domains
export const EXTERNAL_RESOURCE_HINTS: ResourceHint[] = [
  {
    href: 'https://fonts.googleapis.com',
    rel: 'dns-prefetch',
  },
  {
    href: 'https://fonts.gstatic.com',
    rel: 'dns-prefetch',
  },
  {
    href: 'https://images.unsplash.com',
    rel: 'dns-prefetch',
  },
  {
    href: 'https://api.example.com',
    rel: 'preconnect',
    crossOrigin: 'anonymous',
  },
];

// Performance monitoring hook
export function useAssetPerformance() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLoadTime: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor resource timing
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalLoadTime = 0;
      let successfulCount = 0;

      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          totalLoadTime += entry.duration;
          if (entry.responseStatus >= 200 && entry.responseStatus < 400) {
            successfulCount++;
          }
        }
      });

      setMetrics(prev => ({
        totalRequests: prev.totalRequests + entries.length,
        successfulRequests: prev.successfulRequests + successfulCount,
        failedRequests: prev.failedRequests + (entries.length - successfulCount),
        averageLoadTime: totalLoadTime / entries.length || prev.averageLoadTime,
      }));
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// Export utility functions
export { useResourceHints, useAssetPreloading };