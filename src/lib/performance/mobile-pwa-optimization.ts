/**
 * Enhanced Mobile Performance with PWA Optimization
 * Implements advanced mobile optimizations, PWA features, touch optimization, and offline capabilities
 */

import { logger } from '../logger';

interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  display: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  themeColor: string;
  backgroundColor: string;
  orientation: 'portrait' | 'landscape' | 'any';
  icons: {
    src: string;
    sizes: string;
    type: string;
  }[];
  shortcuts: {
    name: string;
    short_name: string;
    description: string;
    url: string;
    icons: { src: string; sizes: string }[];
  }[];
}

interface TouchOptimization {
  enableHaptic: boolean;
  gestureThreshold: number;
  tapDelay: number;
  scrollThreshold: number;
  swipeThreshold: number;
}

interface BatteryOptimization {
  enablePowerSaving: boolean;
  backgroundSync: boolean;
  reducedAnimations: boolean;
  adaptiveQuality: boolean;
}

class MobilePWAOptimizer {
  private pwaConfig: PWAConfig;
  private touchOptimization: TouchOptimization;
  private batteryOptimization: BatteryOptimization;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isInstalled = false;
  private isOnline = true;
  private batteryLevel: number | null = null;
  private touchStartTime = 0;

  constructor() {
    this.pwaConfig = this.getDefaultPWAConfig();
    this.touchOptimization = this.getDefaultTouchOptimization();
    this.batteryOptimization = this.getDefaultBatteryOptimization();
    
    this.initializePWA();
    this.setupNetworkMonitoring();
    this.setupBatteryMonitoring();
    this.optimizeMobilePerformance();
  }

  private getDefaultPWAConfig(): PWAConfig {
    return {
      name: 'Voltage Soda Platform',
      shortName: 'Voltage Soda',
      description: 'Create custom energy drinks and sodas with our comprehensive recipe platform',
      startUrl: '/',
      display: 'standalone',
      themeColor: '#3b82f6',
      backgroundColor: '#ffffff',
      orientation: 'any',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      shortcuts: [
        {
          name: 'Calculator',
          short_name: 'Calculator',
          description: 'Quick access to caffeine calculator',
          url: '/calculator',
          icons: [{ src: '/icons/calc-96x96.png', sizes: '96x96' }]
        },
        {
          name: 'Recipes',
          short_name: 'Recipes',
          description: 'Browse all available recipes',
          url: '/flavors',
          icons: [{ src: '/icons/recipes-96x96.png', sizes: '96x96' }]
        },
        {
          name: 'Safety Guide',
          short_name: 'Safety',
          description: 'View safety guidelines',
          url: '/safety',
          icons: [{ src: '/icons/safety-96x96.png', sizes: '96x96' }]
        }
      ]
    };
  }

  private getDefaultTouchOptimization(): TouchOptimization {
    return {
      enableHaptic: true,
      gestureThreshold: 50,
      tapDelay: 300,
      scrollThreshold: 100,
      swipeThreshold: 30
    };
  }

  private getDefaultBatteryOptimization(): BatteryOptimization {
    return {
      enablePowerSaving: true,
      backgroundSync: true,
      reducedAnimations: true,
      adaptiveQuality: true
    };
  }

  // PWA Installation and Registration
  private async initializePWA(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup PWA install prompt
      this.setupInstallPrompt();
      
      // Setup app update handling
      this.setupUpdateHandling();
      
      // Initialize offline capabilities
      this.initializeOfflineCapabilities();
      
      logger.info('PWA initialization completed');
    } catch (error) {
      logger.error('PWA initialization failed', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        this.serviceWorkerRegistration = registration;
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update prompt
                this.showUpdateAvailable();
              }
            });
          }
        });
        
        logger.info('Service worker registered successfully');
      } catch (error) {
        logger.error('Service worker registration failed', error);
      }
    }
  }

  private setupInstallPrompt(): void {
    let deferredPrompt: any = null;
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button or banner
      this.showInstallPrompt(deferredPrompt);
    });
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      logger.info('PWA installed successfully');
      this.trackInstallEvent();
    });
  }

  private showInstallPrompt(deferredPrompt: any): void {
    // Create custom install UI
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div class="pwa-install-banner-content">
        <div class="pwa-install-banner-text">
          <h3>Install Voltage Soda</h3>
          <p>Add to home screen for quick access</p>
        </div>
        <div class="pwa-install-banner-actions">
          <button id="pwa-install-btn" class="btn-primary">Install</button>
          <button id="pwa-dismiss-btn" class="btn-secondary">Not Now</button>
        </div>
      </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 16px;
        z-index: 1000;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
      }
      
      .pwa-install-banner-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .pwa-install-banner-text h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .pwa-install-banner-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
      
      .pwa-install-banner-actions {
        display: flex;
        gap: 8px;
      }
      
      .pwa-install-banner-actions button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: white;
        color: #3b82f6;
      }
      
      .btn-secondary {
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
      }
      
      .pwa-install-banner-actions button:hover {
        transform: translateY(-1px);
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(installBanner);
    
    // Handle install button click
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          logger.info('User accepted PWA installation');
        } else {
          logger.info('User dismissed PWA installation');
        }
        
        deferredPrompt = null;
        this.hideInstallPrompt();
      }
    });
    
    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
      // Remember dismissal for this session
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    });
  }

  private hideInstallPrompt(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  private showUpdateAvailable(): void {
    // Show update notification
    const updateNotification = document.createElement('div');
    updateNotification.id = 'pwa-update-notification';
    updateNotification.innerHTML = `
      <div class="pwa-update-content">
        <span>New version available!</span>
        <button id="pwa-update-btn">Update</button>
      </div>
    `;
    
    const styles = document.createElement('style');
    styles.textContent = `
      .pwa-update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .pwa-update-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .pwa-update-content button {
        background: white;
        color: #10b981;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(updateNotification);
    
    // Handle update button click
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      if (this.serviceWorkerRegistration?.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      updateNotification.remove();
    }, 10000);
  }

  private setupUpdateHandling(): void {
    // Listen for controlling service worker change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Touch Gesture Optimization
  private optimizeMobilePerformance(): void {
    this.setupTouchOptimization();
    this.setupGestureRecognition();
    this.setupHapticFeedback();
    this.setupScrollOptimization();
  }

  private setupTouchOptimization(): void {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= this.touchOptimization.tapDelay) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Optimize touch targets
    this.optimizeTouchTargets();
    
    // Add touch feedback
    this.addTouchFeedback();
  }

  private optimizeTouchTargets(): void {
    // Ensure minimum touch target size (44px)
    const style = document.createElement('style');
    style.textContent = `
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      button, .btn, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Improve touch scrolling */
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      /* Optimize for mobile viewport */
      @viewport {
        width: device-width;
        zoom: 1.0;
      }
    `;
    document.head.appendChild(style);
  }

  private setupGestureRecognition(): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      this.touchStartTime = startTime;
    });

    document.addEventListener('touchend', (e) => {
      if (!startTime) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;
      
      // Detect swipe gestures
      if (Math.abs(deltaX) > this.touchOptimization.swipeThreshold || 
          Math.abs(deltaY) > this.touchOptimization.swipeThreshold) {
        this.handleSwipeGesture(deltaX, deltaY, deltaTime);
      }
      
      startTime = 0;
    });
  }

  private handleSwipeGesture(deltaX: number, deltaY: number, deltaTime: number): void {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY && absX > this.touchOptimization.swipeThreshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.handleSwipeRight();
      } else {
        this.handleSwipeLeft();
      }
    } else if (absY > absX && absY > this.touchOptimization.swipeThreshold) {
      // Vertical swipe
      if (deltaY > 0) {
        this.handleSwipeDown();
      } else {
        this.handleSwipeUp();
      }
    }
  }

  private handleSwipeLeft(): void {
    // Navigate to next recipe/ingredient
    logger.debug('Swipe left detected');
  }

  private handleSwipeRight(): void {
    // Navigate to previous recipe/ingredient
    logger.debug('Swipe right detected');
  }

  private handleSwipeUp(): void {
    // Scroll to top or next section
    logger.debug('Swipe up detected');
  }

  private handleSwipeDown(): void {
    // Scroll to bottom or previous section
    logger.debug('Swipe down detected');
  }

  private setupHapticFeedback(): void {
    if (!this.touchOptimization.enableHaptic || !('vibrate' in navigator)) return;
    
    // Add haptic feedback to interactive elements
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInteractiveElement(target)) {
        this.triggerHapticFeedback('light');
      }
    });
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveSelectors = [
      'button', '.btn', '[role="button"]', 'a', 
      'input', 'select', 'textarea', '.touch-target'
    ];
    
    return interactiveSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
    if (!('vibrate' in navigator)) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }

  private addTouchFeedback(): void {
    // Add visual feedback for touch interactions
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInteractiveElement(target)) {
        target.classList.add('touch-active');
      }
    });
    
    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      setTimeout(() => {
        target.classList.remove('touch-active');
      }, 150);
    });
    
    // Add CSS for touch feedback
    const style = document.createElement('style');
    style.textContent = `
      .touch-active {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .touch-active {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupScrollOptimization(): void {
    // Optimize scroll performance
    let ticking = false;
    
    const updateScrollPosition = () => {
      // Handle scroll-based animations and lazy loading
      this.handleScrollOptimization();
      ticking = false;
    };
    
    const requestScrollUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };
    
    document.addEventListener('scroll', requestScrollUpdate, { passive: true });
  }

  private handleScrollOptimization(): void {
    // Implement scroll-based optimizations
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show/hide navigation based on scroll direction
    this.handleNavigationVisibility(scrollTop);
    
    // Lazy load images when they come into view
    this.handleLazyImageLoading();
  }

  private handleNavigationVisibility(scrollTop: number): void {
    // Implement navigation hide/show logic
    const header = document.querySelector('header');
    if (!header) return;
    
    const lastScrollTop = parseInt(header.getAttribute('data-last-scroll') || '0', 10);
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down - hide navigation
      header.classList.add('nav-hidden');
    } else {
      // Scrolling up - show navigation
      header.classList.remove('nav-hidden');
    }
    
    header.setAttribute('data-last-scroll', scrollTop.toString());
  }

  private handleLazyImageLoading(): void {
    // Implement intersection observer for images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Battery Usage Optimization
  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.adaptToBatteryLevel(battery.level);
        });
        
        // Initial adaptation
        this.adaptToBatteryLevel(battery.level);
      });
    }
  }

  private adaptToBatteryLevel(level: number): void {
    if (!this.batteryOptimization.enablePowerSaving) return;
    
    if (level < 0.2) {
      // Low battery - enable power saving mode
      this.enablePowerSavingMode();
    } else if (level < 0.5) {
      // Medium battery - moderate optimizations
      this.enableModerateOptimizations();
    } else {
      // High battery - normal performance
      this.disablePowerOptimizations();
    }
  }

  private enablePowerSavingMode(): void {
    document.body.classList.add('power-saving-mode');
    
    // Reduce animations
    if (this.batteryOptimization.reducedAnimations) {
      document.body.classList.add('reduced-animations');
    }
    
    // Disable non-essential features
    this.disableNonEssentialFeatures();
    
    // Reduce image quality
    this.reduceImageQuality();
    
    logger.info('Power saving mode enabled');
  }

  private enableModerateOptimizations(): void {
    document.body.classList.add('moderate-optimization');
    
    // Reduce some animations
    document.body.classList.add('reduced-animations');
    
    logger.info('Moderate optimizations enabled');
  }

  private disablePowerOptimizations(): void {
    document.body.classList.remove('power-saving-mode', 'moderate-optimization', 'reduced-animations');
    this.enableEssentialFeatures();
    this.restoreImageQuality();
    
    logger.info('Power optimizations disabled');
  }

  private disableNonEssentialFeatures(): void {
    // Disable videos, complex animations, etc.
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.removeAttribute('autoplay');
    });
  }

  private enableEssentialFeatures(): void {
    // Re-enable essential features
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.hasAttribute('data-autoplay')) {
        video.setAttribute('autoplay', 'true');
      }
    });
  }

  private reduceImageQuality(): void {
    // Serve lower quality images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.dataset.src) {
        const lowQualitySrc = this.getLowQualityImage(img.dataset.src);
        img.src = lowQualitySrc;
      }
    });
  }

  private restoreImageQuality(): void {
    // Restore original image quality
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
      }
    });
  }

  private getLowQualityImage(src: string): string {
    // Add low quality suffix or use optimized format
    return src.replace(/\.(jpg|jpeg|png|webp)$/i, '_low.$1');
  }

  // Background Sync Optimization
  private initializeOfflineCapabilities(): void {
    // Setup background sync for offline functionality
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
    }
    
    // Setup offline indicators
    this.setupOfflineIndicators();
  }

  private setupBackgroundSync(): void {
    // Register background sync events
    this.serviceWorkerRegistration?.sync.register('background-sync-recipes');
    this.serviceWorkerRegistration?.sync.register('background-sync-analytics');
    
    logger.info('Background sync registered');
  }

  private setupOfflineIndicators(): void {
    // Create offline indicator
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.innerHTML = `
      <div class="offline-content">
        <span>You're offline</span>
        <span class="offline-icon">📱</span>
      </div>
    `;
    
    const styles = document.createElement('style');
    styles.textContent = `
      #offline-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        padding: 8px;
        text-align: center;
        font-size: 14px;
        z-index: 1002;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      }
      
      #offline-indicator.show {
        transform: translateY(0);
      }
      
      .offline-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .offline-icon {
        font-size: 16px;
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(offlineIndicator);
  }

  // Network Monitoring
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkRestore();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkLoss();
    });
  }

  private handleNetworkRestore(): void {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
    
    // Sync any pending data
    this.syncPendingData();
    
    logger.info('Network connection restored');
  }

  private handleNetworkLoss(): void {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.add('show');
    }
    
    // Queue any pending requests
    this.queueRequestsForLater();
    
    logger.warn('Network connection lost');
  }

  private syncPendingData(): void {
    // Sync any data that was queued while offline
    logger.info('Syncing pending data');
  }

  private queueRequestsForLater(): void {
    // Queue requests for when network is restored
    logger.info('Queuing requests for later');
  }

  // Utility methods
  private trackInstallEvent(): void {
    // Track PWA installation for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'pwa_installation'
      });
    }
  }

  // Public API
  isPWAInstalled(): boolean {
    return this.isInstalled;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  getBatteryLevel(): number | null {
    return this.batteryLevel;
  }

  getPWAMetrics(): any {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      batteryLevel: this.batteryLevel,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      touchOptimizationEnabled: this.touchOptimization.enableHaptic,
      batteryOptimizationEnabled: this.batteryOptimization.enablePowerSaving
    };
  }

  updatePWAConfig(config: Partial<PWAConfig>): void {
    this.pwaConfig = { ...this.pwaConfig, ...config };
  }
}

// Export singleton instance
export const mobilePWAOptimizer = new MobilePWAOptimizer();

export default MobilePWAOptimizer;
export type { PWAConfig, TouchOptimization, BatteryOptimization };