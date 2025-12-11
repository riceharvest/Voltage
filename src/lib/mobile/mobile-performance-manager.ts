/**
 * Enhanced Mobile Performance Manager
 * Provides comprehensive mobile performance optimization including:
 * - Network-aware loading strategies
 * - Adaptive quality based on device capabilities
 * - Memory optimization for mobile devices
 * - Battery-aware performance adjustments
 * - Critical resource prioritization
 */

import { logger } from '../logger';

interface DeviceCapabilities {
  memory: number; // in GB
  cores: number;
  isLowEnd: boolean;
  supportsWebGL: boolean;
  supportsWebP: boolean;
  supportsIntersectionObserver: boolean;
  supportsServiceWorker: boolean;
  networkType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
}

interface PerformanceProfile {
  name: string;
  maxConcurrentRequests: number;
  imageQuality: number; // 0.5 to 1.0
  enableAnimations: boolean;
  enableLazyLoading: boolean;
  enableServiceWorker: boolean;
  enableWebGL: boolean;
  resourcePriority: 'conservative' | 'balanced' | 'aggressive';
  cacheSize: number; // in MB
  enablePrefetching: boolean;
}

interface ResourcePriority {
  critical: string[]; // URLs that must be loaded immediately
  important: string[]; // URLs that should be loaded soon
  deferred: string[]; // URLs that can be loaded later
  background: string[]; // URLs loaded in background
}

class MobilePerformanceManager {
  private deviceCapabilities: DeviceCapabilities;
  private performanceProfile: PerformanceProfile;
  private networkAware: boolean = true;
  private isInitialized: boolean = false;
  private resourcePriorities: ResourcePriority = { critical: [], important: [], deferred: [], background: [] };
  private observerCallbacks: Map<string, IntersectionObserver> = new Map();
  private preloadQueue: string[] = [];
  private criticalResourcesLoaded: Set<string> = new Set();

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.performanceProfile = this.determineOptimalProfile();
    this.initializeMobileOptimizations();
  }

  /**
   * Detect device capabilities for performance optimization
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const navigator = window.navigator;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      memory: (navigator as any).deviceMemory || 4, // Default to 4GB if not supported
      cores: navigator.hardwareConcurrency || 4,
      isLowEnd: this.isLowEndDevice(),
      supportsWebGL: this.detectWebGLSupport(),
      supportsWebP: this.detectWebPSupport(),
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      networkType: connection?.effectiveType || 'unknown'
    };
  }

  /**
   * Determine if device is low-end based on multiple factors
   */
  private isLowEndDevice(): boolean {
    const memory = (window.navigator as any).deviceMemory || 4;
    const cores = window.navigator.hardwareConcurrency || 4;
    const connection = (window.navigator as any).connection?.effectiveType;
    
    // Consider low-end if: <4GB memory OR <2 cores OR slow network
    return memory < 4 || cores < 2 || connection === 'slow-2g' || connection === '2g';
  }

  /**
   * Detect WebGL support for enhanced graphics
   */
  private detectWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect WebP image format support
   */
  private detectWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Determine optimal performance profile based on device capabilities
   */
  private determineOptimalProfile(): PerformanceProfile {
    const { memory, cores, isLowEnd, networkType } = this.deviceCapabilities;
    
    if (isLowEnd || memory <= 2) {
      return {
        name: 'conservative',
        maxConcurrentRequests: 2,
        imageQuality: 0.6,
        enableAnimations: true,
        enableLazyLoading: true,
        enableServiceWorker: true,
        enableWebGL: false,
        resourcePriority: 'conservative',
        cacheSize: 10, // 10MB
        enablePrefetching: false
      };
    } else if (memory <= 4 || cores <= 4) {
      return {
        name: 'balanced',
        maxConcurrentRequests: 4,
        imageQuality: 0.8,
        enableAnimations: true,
        enableLazyLoading: true,
        enableServiceWorker: true,
        enableWebGL: this.deviceCapabilities.supportsWebGL,
        resourcePriority: 'balanced',
        cacheSize: 25, // 25MB
        enablePrefetching: true
      };
    } else {
      return {
        name: 'aggressive',
        maxConcurrentRequests: 6,
        imageQuality: 0.95,
        enableAnimations: true,
        enableLazyLoading: true,
        enableServiceWorker: true,
        enableWebGL: true,
        resourcePriority: 'aggressive',
        cacheSize: 50, // 50MB
        enablePrefetching: true
      };
    }
  }

  /**
   * Initialize mobile-specific performance optimizations
   */
  private initializeMobileOptimizations(): void {
    this.setupNetworkAwareLoading();
    this.setupMemoryOptimization();
    this.setupResourcePrioritization();
    this.setupProgressiveEnhancement();
    this.isInitialized = true;
    
    logger.info('Mobile performance manager initialized', {
      profile: this.performanceProfile.name,
      deviceCapabilities: this.deviceCapabilities
    });
  }

  /**
   * Setup network-aware loading strategies
   */
  private setupNetworkAwareLoading(): void {
    const connection = (navigator as any).connection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        this.deviceCapabilities.networkType = connection.effectiveType;
        this.adaptToNetworkConditions();
      });
    }

    // Initial network adaptation
    this.adaptToNetworkConditions();
  }

  /**
   * Adapt performance based on network conditions
   */
  private adaptToNetworkConditions(): void {
    const { networkType } = this.deviceCapabilities;
    const { enablePrefetching, maxConcurrentRequests } = this.performanceProfile;
    
    switch (networkType) {
      case 'slow-2g':
      case '2g':
        this.performanceProfile.maxConcurrentRequests = Math.min(maxConcurrentRequests, 1);
        this.performanceProfile.enablePrefetching = false;
        this.performanceProfile.imageQuality = 0.5;
        break;
        
      case '3g':
        this.performanceProfile.maxConcurrentRequests = Math.min(maxConcurrentRequests, 2);
        this.performanceProfile.enablePrefetching = false;
        this.performanceProfile.imageQuality = Math.min(this.performanceProfile.imageQuality, 0.7);
        break;
        
      case '4g':
        this.performanceProfile.maxConcurrentRequests = Math.min(maxConcurrentRequests, 4);
        this.performanceProfile.enablePrefetching = true;
        break;
        
      case 'wifi':
        this.performanceProfile.maxConcurrentRequests = maxConcurrentRequests;
        this.performanceProfile.enablePrefetching = true;
        break;
        
      default:
        // Unknown - use conservative defaults
        this.performanceProfile.maxConcurrentRequests = Math.min(maxConcurrentRequests, 2);
        this.performanceProfile.enablePrefetching = false;
    }
    
    logger.debug('Adapted to network conditions', {
      networkType,
      concurrentRequests: this.performanceProfile.maxConcurrentRequests,
      enablePrefetching: this.performanceProfile.enablePrefetching
    });
  }

  /**
   * Setup memory optimization strategies
   */
  private setupMemoryOptimization(): void {
    // Monitor memory usage and trigger cleanup if needed
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usageRatio > 0.8) {
          this.triggerMemoryCleanup();
        }
      }, 30000); // Check every 30 seconds
    }

    // Optimize images based on memory
    if (this.deviceCapabilities.memory < 4) {
      this.setupImageOptimization();
    }
  }

  /**
   * Setup resource prioritization system
   */
  private setupResourcePrioritization(): void {
    // Define critical resources that must load immediately
    this.resourcePriorities.critical = [
      '/_next/static/css/app/layout.css',
      '/_next/static/js/app/layout.js',
      '/fonts/inter-400.woff2',
      '/manifest.json'
    ];

    // Define important resources for early loading
    this.resourcePriorities.important = [
      '/api/flavors',
      '/api/ingredients',
      '/api/safety/limits'
    ];

    // Define deferred resources
    this.resourcePriorities.deferred = [
      '/api/suppliers',
      '/api/amazon/products'
    ];

    // Define background resources
    this.resourcePriorities.background = [
      '/analytics.js',
      '/third-party-scripts.js'
    ];
  }

  /**
   * Setup progressive enhancement
   */
  private setupProgressiveEnhancement(): void {
    // Only load advanced features if supported
    if (!this.performanceProfile.enableWebGL) {
      this.disableWebGLFeatures();
    }

    if (!this.performanceProfile.enableServiceWorker) {
      this.disableServiceWorkerFeatures();
    }

    // Apply performance-specific CSS classes
    document.documentElement.classList.add(`performance-${this.performanceProfile.name}`);
    document.documentElement.classList.add(`device-${this.deviceCapabilities.isLowEnd ? 'low-end' : 'high-end'}`);
  }

  /**
   * Optimize images for mobile devices
   */
  private setupImageOptimization(): void {
    // Add image optimization observers
    if (this.deviceCapabilities.supportsIntersectionObserver) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.optimizeImage(entry.target as HTMLImageElement);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before entering viewport
      });

      // Observe all images
      document.querySelectorAll('img').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Optimize individual image based on device capabilities
   */
  private optimizeImage(img: HTMLImageElement): void {
    const { supportsWebP, imageQuality } = this.deviceCapabilities;
    const currentSrc = img.src;
    
    // For low-end devices, use lower quality
    if (this.deviceCapabilities.isLowEnd) {
      img.style.imageRendering = 'pixelated';
      img.loading = 'lazy';
    }

    // Use WebP if supported and not already using it
    if (supportsWebP && !currentSrc.includes('.webp')) {
      const webpSrc = currentSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      img.src = webpSrc;
    }

    // Add loading optimization
    img.decoding = 'async';
    img.loading = img.loading || 'lazy';
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup(): void {
    // Clear unused observers
    this.observerCallbacks.forEach(observer => observer.disconnect());
    this.observerCallbacks.clear();

    // Clear preload queue if memory is critical
    if ((performance as any).memory?.usedJSHeapSize > (performance as any).memory?.jsHeapSizeLimit * 0.9) {
      this.preloadQueue.length = 0;
    }

    logger.warn('Memory cleanup triggered');
  }

  /**
   * Disable WebGL features for low-end devices
   */
  private disableWebGLFeatures(): void {
    document.documentElement.classList.add('no-webgl');
  }

  /**
   * Disable service worker features for unsupported devices
   */
  private disableServiceWorkerFeatures(): void {
    document.documentElement.classList.add('no-service-worker');
  }

  /**
   * Smart resource preloading based on network and device capabilities
   */
  smartPreload(resources: string[]): void {
    if (!this.performanceProfile.enablePrefetching) {
      return;
    }

    const canPreload = this.canPreloadResources();
    if (!canPreload) {
      return;
    }

    resources.forEach(url => {
      if (!this.criticalResourcesLoaded.has(url)) {
        this.preloadQueue.push(url);
      }
    });

    this.processPreloadQueue();
  }

  /**
   * Check if we can safely preload resources
   */
  private canPreloadResources(): boolean {
    const { networkType } = this.deviceCapabilities;
    const connection = (navigator as any).connection;
    
    // Don't preload on slow connections
    if (networkType === 'slow-2g' || networkType === '2g') {
      return false;
    }

    // Respect save-data preference
    if (connection?.saveData) {
      return false;
    }

    return true;
  }

  /**
   * Process preload queue with throttling
   */
  private async processPreloadQueue(): Promise<void> {
    const { maxConcurrentRequests } = this.performanceProfile;
    const batchSize = Math.min(maxConcurrentRequests, 3);
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, batchSize);
      
      await Promise.allSettled(
        batch.map(url => this.preloadResource(url))
      );

      // Small delay between batches to avoid overwhelming the network
      if (this.preloadQueue.length > 0) {
        await this.delay(100);
      }
    }
  }

  /**
   * Preload individual resource
   */
  private async preloadResource(url: string): Promise<void> {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      this.criticalResourcesLoaded.add(url);
      logger.debug('Resource preloaded', { url });
    } catch (error) {
      logger.warn('Failed to preload resource', { url, error });
    }
  }

  /**
   * Get optimal image format based on device capabilities
   */
  getOptimalImageFormat(currentFormat: string): string {
    const { supportsWebP } = this.deviceCapabilities;
    
    // Use WebP if supported and current format is not already WebP
    if (supportsWebP && !currentFormat.includes('webp')) {
      return currentFormat.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return currentFormat;
  }

  /**
   * Get device-optimized CSS classes
   */
  getDeviceClasses(): string[] {
    const classes = [
      `performance-${this.performanceProfile.name}`,
      `network-${this.deviceCapabilities.networkType}`,
      `memory-${this.deviceCapabilities.memory}gb`
    ];

    if (this.deviceCapabilities.isLowEnd) {
      classes.push('low-end-device');
    }

    if (!this.deviceCapabilities.supportsWebGL) {
      classes.push('no-webgl');
    }

    return classes;
  }

  /**
   * Check if feature should be enabled based on performance profile
   */
  shouldEnableFeature(feature: string): boolean {
    switch (feature) {
      case 'animations':
        return this.performanceProfile.enableAnimations;
      case 'lazy-loading':
        return this.performanceProfile.enableLazyLoading;
      case 'service-worker':
        return this.performanceProfile.enableServiceWorker;
      case 'webgl':
        return this.performanceProfile.enableWebGL;
      case 'prefetching':
        return this.performanceProfile.enablePrefetching;
      default:
        return true;
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): any {
    return {
      deviceCapabilities: this.deviceCapabilities,
      performanceProfile: this.performanceProfile,
      isInitialized: this.isInitialized,
      preloadedResources: this.criticalResourcesLoaded.size,
      queueSize: this.preloadQueue.length
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    // Clean up observers
    this.observerCallbacks.forEach(observer => observer.disconnect());
    this.observerCallbacks.clear();
    
    // Clear preload queue
    this.preloadQueue.length = 0;
    
    logger.info('Mobile performance manager destroyed');
  }
}

// Export singleton instance
export const mobilePerformanceManager = new MobilePerformanceManager();

export default MobilePerformanceManager;
export type { DeviceCapabilities, PerformanceProfile, ResourcePriority };