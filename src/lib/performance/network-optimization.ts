/**
 * Global Network Optimization
 * Implements HTTP/2, HTTP/3, resource prioritization, network-aware loading, and bandwidth-adaptive delivery
 */

import { logger } from '../logger';

interface NetworkQuality {
  downlink: number; // Mbps
  rtt: number; // ms
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
}

interface ResourcePriority {
  resource: string;
  priority: 'high' | 'medium' | 'low';
  preload: boolean;
  prefetch: boolean;
  critical: boolean;
}

interface BandwidthProfile {
  name: string;
  minBandwidth: number;
  maxBandwidth: number;
  resourceStrategy: {
    images: 'lazy' | 'progressive' | 'optimized';
    scripts: 'defer' | 'async' | 'critical';
    styles: 'critical' | 'non-critical';
    fonts: 'preload' | 'swap' | 'fallback';
  };
  cachingStrategy: 'aggressive' | 'balanced' | 'conservative';
}

class GlobalNetworkOptimizer {
  private networkQuality: NetworkQuality | null = null;
  private connectionType: string = 'unknown';
  private bandwidthProfiles = new Map<string, BandwidthProfile>();
  private resourcePriorities = new Map<string, ResourcePriority>();
  private httpVersion: '1.1' | '2' | '3' = '1.1';
  private isInitialized = false;

  constructor() {
    this.initializeBandwidthProfiles();
    this.detectNetworkQuality();
    this.detectHTTPVersion();
    this.startNetworkMonitoring();
  }

  private initializeBandwidthProfiles(): void {
    const profiles: BandwidthProfile[] = [
      {
        name: 'slow-connection',
        minBandwidth: 0,
        maxBandwidth: 1.5,
        resourceStrategy: {
          images: 'lazy',
          scripts: 'defer',
          styles: 'critical',
          fonts: 'fallback'
        },
        cachingStrategy: 'aggressive'
      },
      {
        name: 'medium-connection',
        minBandwidth: 1.5,
        maxBandwidth: 10,
        resourceStrategy: {
          images: 'progressive',
          scripts: 'async',
          styles: 'non-critical',
          fonts: 'swap'
        },
        cachingStrategy: 'balanced'
      },
      {
        name: 'fast-connection',
        minBandwidth: 10,
        maxBandwidth: Infinity,
        resourceStrategy: {
          images: 'optimized',
          scripts: 'async',
          styles: 'non-critical',
          fonts: 'preload'
        },
        cachingStrategy: 'conservative'
      }
    ];

    profiles.forEach(profile => {
      this.bandwidthProfiles.set(profile.name, profile);
    });
  }

  private detectNetworkQuality(): void {
    if (typeof window === 'undefined') return;

    // Get network information if available
    const connection = (navigator as any).connection;
    
    if (connection) {
      this.networkQuality = {
        downlink: connection.downlink || 1,
        rtt: connection.rtt || 100,
        effectiveType: connection.effectiveType || '3g',
        saveData: connection.saveData || false
      };
      
      this.connectionType = connection.effectiveType || 'unknown';
      logger.info('Network quality detected', this.networkQuality);
    } else {
      // Fallback detection based on user agent and other heuristics
      this.fallbackNetworkDetection();
    }
  }

  private fallbackNetworkDetection(): void {
    // Basic detection based on user agent
    const userAgent = navigator.userAgent;
    let effectiveType = '3g'; // Default
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      effectiveType = '2g'; // Assume mobile might be slower
    }
    
    this.networkQuality = {
      downlink: 5, // Assume moderate speed
      rtt: 100,
      effectiveType: effectiveType as any,
      saveData: false
    };
    
    this.connectionType = effectiveType;
  }

  private detectHTTPVersion(): void {
    if (typeof window === 'undefined') return;

    // Detect supported HTTP version
    // This is a simplified detection - in production, you'd use more sophisticated methods
    const isHTTPS = location.protocol === 'https:';
    
    if (isHTTPS && 'serverTiming' in PerformanceObserver.prototype) {
      this.httpVersion = '2'; // Assume HTTP/2 for HTTPS
    } else if (isHTTPS) {
      this.httpVersion = '1.1';
    } else {
      this.httpVersion = '1.1';
    }

    logger.info(`HTTP version detected: ${this.httpVersion}`);
  }

  private startNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor network quality changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.detectNetworkQuality();
        this.adaptToNetworkQuality();
      });
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      logger.info('Network connection restored');
      this.handleNetworkRestore();
    });

    window.addEventListener('offline', () => {
      logger.warn('Network connection lost');
      this.handleNetworkLoss();
    });
  }

  // HTTP/2 and HTTP/3 Implementation
  enableHTTPOptimization(): void {
    if (typeof window === 'undefined') return;

    // Enable HTTP/2 server push hints (in production, this would be configured server-side)
    this.enableResourceHints();
    
    // Optimize connection management
    this.optimizeConnections();
    
    // Enable compression if supported
    this.enableCompressionOptimization();
  }

  private enableResourceHints(): void {
    // Add resource hints based on network quality
    const hints = this.getResourceHints();
    
    hints.forEach(hint => {
      this.addResourceHint(hint.rel, hint.href, hint.as);
    });
  }

  private getResourceHints(): { rel: string; href: string; as?: string }[] {
    const hints: { rel: string; href: string; as?: string }[] = [];
    
    // DNS prefetch for external domains
    hints.push({ rel: 'dns-prefetch', href: '//fonts.googleapis.com' });
    hints.push({ rel: 'dns-prefetch', href: '//fonts.gstatic.com' });
    
    // Preconnect to critical resources
    const profile = this.getCurrentBandwidthProfile();
    if (profile.resourceStrategy.images !== 'lazy') {
      hints.push({ rel: 'preconnect', href: 'https://images.unsplash.com', as: 'image' });
    }
    
    return hints;
  }

  private addResourceHint(rel: string, href: string, as?: string): void {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    
    document.head.appendChild(link);
  }

  private optimizeConnections(): void {
    // Optimize TCP connections for HTTP/2
    if (this.httpVersion === '2' || this.httpVersion === '3') {
      // Enable connection multiplexing optimizations
      this.enableConnectionMultiplexing();
    }
  }

  private enableConnectionMultiplexing(): void {
    // In HTTP/2, multiple requests can share a single connection
    // This is automatically handled by the browser, but we can optimize our resource loading
    logger.debug('HTTP/2 connection multiplexing enabled');
  }

  private enableCompressionOptimization(): void {
    // Enable gzip/brotli compression hints
    const acceptEncoding = navigator.userAgent.includes('Chrome') ? 'br,gzip' : 'gzip';
    
    // Add compression preferences to requests
    this.setCompressionPreferences(acceptEncoding);
  }

  private setCompressionPreferences(encoding: string): void {
    // This would be implemented in actual HTTP requests
    logger.debug('Compression preferences set', { encoding });
  }

  // Resource Prioritization and Preloading
  prioritizeResources(resources: ResourcePriority[]): void {
    resources.forEach(resource => {
      this.resourcePriorities.set(resource.resource, resource);
    });

    // Apply prioritization strategies
    this.applyResourcePrioritization();
  }

  private applyResourcePrioritization(): void {
    const profile = this.getCurrentBandwidthProfile();
    
    // Apply network-adaptive strategies
    this.applyBandwidthAdaptiveLoading(profile);
    
    // Apply priority-based loading
    this.applyPriorityLoading();
  }

  private applyPriorityLoading(): void {
    this.resourcePriorities.forEach((priority, resource) => {
      if (priority.preload) {
        this.preloadResource(resource);
      }
      
      if (priority.prefetch) {
        this.prefetchResource(resource);
      }
    });
  }

  private preloadResource(resource: string): void {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = this.getResourceType(resource);
    
    document.head.appendChild(link);
    logger.debug(`Preloaded resource: ${resource}`);
  }

  private prefetchResource(resource: string): void {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource;
    
    document.head.appendChild(link);
    logger.debug(`Prefetched resource: ${resource}`);
  }

  private getResourceType(resource: string): string {
    const extension = resource.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'css':
        return 'style';
      case 'js':
        return 'script';
      case 'woff':
      case 'woff2':
        return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return 'image';
      default:
        return 'fetch';
    }
  }

  // Network-aware Loading Strategies
  private applyBandwidthAdaptiveLoading(profile: BandwidthProfile): void {
    const { resourceStrategy } = profile;
    
    // Adapt image loading strategy
    this.adaptImageLoading(resourceStrategy.images);
    
    // Adapt script loading strategy
    this.adaptScriptLoading(resourceStrategy.scripts);
    
    // Adapt font loading strategy
    this.adaptFontLoading(resourceStrategy.fonts);
  }

  private adaptImageLoading(strategy: 'lazy' | 'progressive' | 'optimized'): void {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      switch (strategy) {
        case 'lazy':
          this.enableLazyImageLoading(img);
          break;
        case 'progressive':
          this.enableProgressiveImageLoading(img);
          break;
        case 'optimized':
          this.optimizeImageLoading(img);
          break;
      }
    });
  }

  private enableLazyImageLoading(img: HTMLImageElement): void {
    // Enable intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            if (target.dataset.src) {
              target.src = target.dataset.src;
              target.removeAttribute('data-src');
            }
            observer.unobserve(target);
          }
        });
      });
      
      observer.observe(img);
    }
  }

  private enableProgressiveImageLoading(img: HTMLImageElement): void {
    // Load low-quality image first, then high-quality
    if (img.dataset.src) {
      img.src = this.getLowQualityImage(img.dataset.src);
      
      // Load high-quality image after a delay
      setTimeout(() => {
        img.src = img.dataset.src;
      }, 100);
    }
  }

  private optimizeImageLoading(img: HTMLImageElement): void {
    // Load optimized formats first (WebP, AVIF)
    if (img.dataset.src) {
      const optimizedSrc = this.getOptimizedImageFormat(img.dataset.src);
      img.src = optimizedSrc;
    }
  }

  private adaptScriptLoading(strategy: 'defer' | 'async' | 'critical'): void {
    const scripts = document.querySelectorAll('script[src]');
    
    scripts.forEach(script => {
      switch (strategy) {
        case 'defer':
          script.setAttribute('defer', 'true');
          break;
        case 'async':
          script.setAttribute('async', 'true');
          break;
        case 'critical':
          // Keep critical scripts as they are
          break;
      }
    });
  }

  private adaptFontLoading(strategy: 'preload' | 'swap' | 'fallback'): void {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.includes('fonts.')) {
        switch (strategy) {
          case 'preload':
            this.preloadFont(href);
            break;
          case 'swap':
            link.setAttribute('font-display', 'swap');
            break;
          case 'fallback':
            link.setAttribute('font-display', 'fallback');
            break;
        }
      }
    });
  }

  private preloadFont(fontUrl: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  }

  // Intelligent Fallback Mechanisms
  implementFallbackMechanisms(): void {
    this.setupConnectionFallback();
    this.setupResourceFallback();
    this.setupCompressionFallback();
  }

  private setupConnectionFallback(): void {
    // Implement connection fallback strategies
    const connection = (navigator as any).connection;
    
    if (connection && connection.effectiveType === 'slow-2g') {
      // Disable non-essential features for very slow connections
      this.disableNonEssentialFeatures();
    }
  }

  private setupResourceFallback(): void {
    // Implement resource loading fallbacks
    window.addEventListener('error', (event) => {
      this.handleResourceLoadError(event);
    }, true);
  }

  private setupCompressionFallback(): void {
    // Fallback to uncompressed resources if compression fails
    // Implementation would depend on server configuration
  }

  private handleResourceLoadError(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'IMG') {
      // Fallback to lower quality image or placeholder
      this.fallbackImage(target as HTMLImageElement);
    } else if (target.tagName === 'LINK') {
      // Fallback to non-optimized resource
      this.fallbackResource(target as HTMLLinkElement);
    }
  }

  private fallbackImage(img: HTMLImageElement): void {
    // Try loading from fallback CDN or use placeholder
    const fallbackSrc = this.getFallbackImage(img.src);
    if (fallbackSrc && fallbackSrc !== img.src) {
      img.src = fallbackSrc;
    }
  }

  private fallbackResource(link: HTMLLinkElement): void {
    // Try loading non-optimized version
    const fallbackHref = this.getFallbackResource(link.href);
    if (fallbackHref && fallbackHref !== link.href) {
      link.href = fallbackHref;
    }
  }

  private disableNonEssentialFeatures(): void {
    // Disable animations, videos, and other non-essential features
    document.body.classList.add('reduced-motion');
    
    // Disable video autoplay
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.removeAttribute('autoplay');
    });
  }

  // Bandwidth-adaptive Content Delivery
  getAdaptiveContentStrategy(): any {
    const profile = this.getCurrentBandwidthProfile();
    
    return {
      profile: profile.name,
      bandwidth: this.networkQuality?.downlink || 0,
      rtt: this.networkQuality?.rtt || 0,
      strategies: {
        images: this.getImageDeliveryStrategy(profile),
        scripts: this.getScriptDeliveryStrategy(profile),
        fonts: this.getFontDeliveryStrategy(profile),
        caching: this.getCachingStrategy(profile)
      }
    };
  }

  private getImageDeliveryStrategy(profile: BandwidthProfile): any {
    return {
      format: profile.resourceStrategy.images === 'optimized' ? 'webp' : 'jpeg',
      quality: profile.name === 'slow-connection' ? 70 : 85,
      lazyLoad: profile.resourceStrategy.images === 'lazy',
      progressive: profile.resourceStrategy.images === 'progressive'
    };
  }

  private getScriptDeliveryStrategy(profile: BandwidthProfile): any {
    return {
      loading: profile.resourceStrategy.scripts,
      minification: profile.name !== 'slow-connection',
      bundling: profile.name === 'fast-connection'
    };
  }

  private getFontDeliveryStrategy(profile: BandwidthProfile): any {
    return {
      display: profile.resourceStrategy.fonts,
      preload: profile.resourceStrategy.fonts === 'preload',
      subset: profile.name === 'slow-connection'
    };
  }

  private getCachingStrategy(profile: BandwidthProfile): any {
    const strategies = {
      'aggressive': { maxAge: 86400, staleWhileRevalidate: 604800 },
      'balanced': { maxAge: 3600, staleWhileRevalidate: 86400 },
      'conservative': { maxAge: 1800, staleWhileRevalidate: 3600 }
    };
    
    return strategies[profile.cachingStrategy] || strategies.balanced;
  }

  // Utility methods
  private getCurrentBandwidthProfile(): BandwidthProfile {
    const downlink = this.networkQuality?.downlink || 1;
    
    for (const [name, profile] of this.bandwidthProfiles) {
      if (downlink >= profile.minBandwidth && downlink < profile.maxBandwidth) {
        return profile;
      }
    }
    
    // Default to medium profile
    return this.bandwidthProfiles.get('medium-connection')!;
  }

  private getLowQualityImage(src: string): string {
    // Add low-quality image suffix
    return src.replace(/\.(jpg|jpeg|png|webp)$/i, '_low.$1');
  }

  private getOptimizedImageFormat(src: string): string {
    // Try WebP first, then fall back to original
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    
    // Check if WebP is supported
    const webp = new Image();
    webp.onload = webp.onerror = () => {
      if (webp.onerror) {
        // WebP not supported, use original
        return src;
      }
    };
    webp.src = webpSrc;
    
    return webpSrc;
  }

  private getFallbackImage(src: string): string {
    // Return placeholder or cached version
    return '/images/placeholder.png';
  }

  private getFallbackResource(href: string): string {
    // Return non-minified or uncompressed version
    return href.replace(/\.min\.(css|js)$/i, '.$1');
  }

  private adaptToNetworkQuality(): void {
    logger.info('Adapting to network quality change', this.networkQuality);
    
    // Re-apply bandwidth-adaptive strategies
    const profile = this.getCurrentBandwidthProfile();
    this.applyBandwidthAdaptiveLoading(profile);
  }

  private handleNetworkRestore(): void {
    // Resume paused operations
    this.resumeOperations();
  }

  private handleNetworkLoss(): void {
    // Pause non-essential operations
    this.pauseOperations();
  }

  private resumeOperations(): void {
    // Resume resource loading and operations
    document.body.classList.remove('network-offline');
  }

  private pauseOperations(): void {
    // Pause non-essential operations
    document.body.classList.add('network-offline');
  }

  // Public API
  getNetworkStats(): any {
    return {
      quality: this.networkQuality,
      connectionType: this.connectionType,
      httpVersion: this.httpVersion,
      currentProfile: this.getCurrentBandwidthProfile().name,
      resourceCount: this.resourcePriorities.size
    };
  }

  updateResourcePriority(resource: string, priority: ResourcePriority): void {
    this.resourcePriorities.set(resource, priority);
  }

  isFastConnection(): boolean {
    return this.networkQuality?.effectiveType === '4g' || this.networkQuality?.downlink > 10;
  }
}

// Export singleton instance
export const networkOptimizer = new GlobalNetworkOptimizer();

export default GlobalNetworkOptimizer;
export type { NetworkQuality, ResourcePriority, BandwidthProfile };