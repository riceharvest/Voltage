/**
 * Battery and Data Usage Optimization System
 * Provides intelligent optimization for mobile devices to:
 * - Monitor battery level and adapt performance accordingly
 * - Optimize data usage based on connection type
 * - Implement intelligent prefetching strategies
 * - Provide power-saving modes
 * - Enable background processing optimization
 */

import { logger } from '../logger';

interface BatteryInfo {
  level: number; // 0.0 to 1.0
  charging: boolean;
  chargingTime: number; // seconds until full, -1 if unknown
  dischargingTime: number; // seconds until empty, -1 if unknown
  isLowPowerMode: boolean;
}

interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
  type: string;
}

interface OptimizationProfile {
  name: string;
  batteryThreshold: number;
  networkTypes: NetworkInfo['effectiveType'][];
  features: {
    backgroundSync: boolean;
    autoRefresh: boolean;
    imageQuality: number; // 0.1 to 1.0
    videoAutoplay: boolean;
    animations: boolean;
    prefetching: boolean;
    notifications: boolean;
    locationServices: boolean;
  };
  dataLimits: {
    maxImageSize: number; // KB
    maxVideoSize: number; // KB
    cacheSize: number; // MB
    syncFrequency: number; // minutes
  };
}

class BatteryDataOptimizer {
  private batteryInfo: BatteryInfo | null = null;
  private networkInfo: NetworkInfo | null = null;
  private currentProfile: OptimizationProfile;
  private profiles: OptimizationProfile[] = [];
  private batteryMonitor: any = null;
  private isInitialized: boolean = false;
  private optimizationListeners: Map<string, (profile: OptimizationProfile) => void> = new Map();
  private lastOptimizationTime: number = 0;

  constructor() {
    this.currentProfile = this.getDefaultProfile();
    this.initializeProfiles();
    this.initializeMonitoring();
  }

  /**
   * Initialize battery and network monitoring
   */
  private initializeMonitoring(): void {
    this.setupBatteryMonitoring();
    this.setupNetworkMonitoring();
    this.detectSystemPowerMode();
    this.applyInitialOptimizations();
    this.isInitialized = true;
    
    logger.info('Battery & Data optimizer initialized', {
      profile: this.currentProfile.name
    });
  }

  /**
   * Setup battery level monitoring
   */
  private setupBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.updateBatteryInfo(battery);
        
        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.updateBatteryInfo(battery);
        });
        
        battery.addEventListener('chargingchange', () => {
          this.updateBatteryInfo(battery);
        });
        
        battery.addEventListener('chargingtimechange', () => {
          this.updateBatteryInfo(battery);
        });
        
        battery.addEventListener('dischargingtimechange', () => {
          this.updateBatteryInfo(battery);
        });
      }).catch((error: any) => {
        logger.warn('Battery API not supported or failed', error);
      });
    }

    // Listen for system power mode changes
    if ('ondeviceorientation' in window) {
      // iOS low power mode detection
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.detectSystemPowerMode(), 1000);
      });
    }

    // Periodic battery check
    setInterval(() => {
      this.checkBatteryStatus();
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (connection) {
      this.updateNetworkInfo(connection);
      
      connection.addEventListener('change', () => {
        this.updateNetworkInfo(connection);
      });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleNetworkRestore();
    });

    window.addEventListener('offline', () => {
      this.handleNetworkLoss();
    });

    // Initial network info
    this.updateNetworkInfo(connection);
  }

  /**
   * Detect system power mode
   */
  private detectSystemPowerMode(): void {
    // iOS Low Power Mode detection
    const isIOSLowPowerMode = () => {
      return (navigator as any).userAgent.includes('iPhone') || 
             (navigator as any).userAgent.includes('iPad');
    };

    // Android Power Save Mode detection
    const isAndroidPowerSave = () => {
      return (navigator as any).userAgent.includes('Android');
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for reduced data preference
    const connection = (navigator as any).connection;
    const saveData = connection?.saveData || false;

    if (prefersReducedMotion || saveData) {
      if (this.batteryInfo) {
        this.batteryInfo.isLowPowerMode = true;
      }
    }

    logger.debug('System power mode detected', {
      isIOSLowPowerMode: isIOSLowPowerMode(),
      isAndroidPowerSave: isAndroidPowerSave(),
      prefersReducedMotion,
      saveData
    });
  }

  /**
   * Update battery information
   */
  private updateBatteryInfo(battery: any): void {
    this.batteryInfo = {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
      isLowPowerMode: this.batteryInfo?.isLowPowerMode || false
    };

    this.optimizeBasedOnBattery();
    logger.debug('Battery info updated', this.batteryInfo);
  }

  /**
   * Update network information
   */
  private updateNetworkInfo(connection: any): void {
    if (connection) {
      this.networkInfo = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
        type: connection.type || 'unknown'
      };
    } else {
      // Fallback for browsers without Network Information API
      this.networkInfo = {
        effectiveType: navigator.onLine ? '4g' : 'unknown',
        downlink: 10, // Assume 10 Mbps
        rtt: 50, // Assume 50ms
        saveData: false,
        type: 'unknown'
      };
    }

    this.optimizeBasedOnNetwork();
    logger.debug('Network info updated', this.networkInfo);
  }

  /**
   * Optimize based on battery level
   */
  private optimizeBasedOnBattery(): void {
    if (!this.batteryInfo) return;

    const { level, charging } = this.batteryInfo;
    let profile = this.getDefaultProfile();

    // Critical battery (less than 10%)
    if (level < 0.1) {
      profile = this.profiles.find(p => p.name === 'critical') || this.getDefaultProfile();
    }
    // Low battery (less than 20%)
    else if (level < 0.2) {
      profile = this.profiles.find(p => p.name === 'low') || this.getDefaultProfile();
    }
    // Medium battery (less than 50%)
    else if (level < 0.5) {
      profile = this.profiles.find(p => p.name === 'medium') || this.getDefaultProfile();
    }
    // High battery
    else {
      profile = this.profiles.find(p => p.name === 'normal') || this.getDefaultProfile();
    }

    // If charging, use normal profile
    if (charging) {
      profile = this.profiles.find(p => p.name === 'charging') || this.getDefaultProfile();
    }

    this.setOptimizationProfile(profile);
  }

  /**
   * Optimize based on network conditions
   */
  private optimizeBasedOnNetwork(): void {
    if (!this.networkInfo) return;

    const { effectiveType, saveData } = this.networkInfo;
    let profile = this.getDefaultProfile();

    // Save data mode
    if (saveData) {
      profile = this.profiles.find(p => p.name === 'data-saver') || this.getDefaultProfile();
    }
    // Slow network
    else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      profile = this.profiles.find(p => p.name === 'slow-network') || this.getDefaultProfile();
    }
    // 3G network
    else if (effectiveType === '3g') {
      profile = this.profiles.find(p => p.name === '3g-network') || this.getDefaultProfile();
    }

    this.setOptimizationProfile(profile);
  }

  /**
   * Set optimization profile
   */
  private setOptimizationProfile(profile: OptimizationProfile): void {
    const shouldUpdate = this.shouldUpdateProfile(profile);
    
    if (shouldUpdate) {
      this.currentProfile = profile;
      this.applyProfileOptimizations(profile);
      this.notifyListeners(profile);
      this.lastOptimizationTime = Date.now();
      
      logger.info('Optimization profile changed', {
        from: this.currentProfile.name,
        to: profile.name,
        reason: this.getOptimizationReason(profile)
      });
    }
  }

  /**
   * Check if profile should be updated
   */
  private shouldUpdateProfile(newProfile: OptimizationProfile): boolean {
    const timeSinceLastUpdate = Date.now() - this.lastOptimizationTime;
    
    // Don't update too frequently (minimum 30 seconds between updates)
    if (timeSinceLastUpdate < 30000) {
      return false;
    }
    
    // Always update if profile name changed
    return this.currentProfile.name !== newProfile.name;
  }

  /**
   * Get reason for optimization change
   */
  private getOptimizationReason(profile: OptimizationProfile): string {
    if (!this.batteryInfo || !this.networkInfo) return 'unknown';

    const reasons = [];

    if (this.batteryInfo.level < 0.2) {
      reasons.push(`low-battery-${Math.round(this.batteryInfo.level * 100)}%`);
    }
    
    if (this.batteryInfo.isLowPowerMode) {
      reasons.push('system-low-power-mode');
    }

    if (this.networkInfo.saveData) {
      reasons.push('data-saver-enabled');
    }

    if (['slow-2g', '2g'].includes(this.networkInfo.effectiveType)) {
      reasons.push(`slow-network-${this.networkInfo.effectiveType}`);
    }

    return reasons.join(', ') || 'manual';
  }

  /**
   * Apply profile optimizations
   */
  private applyProfileOptimizations(profile: OptimizationProfile): void {
    const { features, dataLimits } = profile;

    // Apply feature toggles
    this.toggleFeature('backgroundSync', features.backgroundSync);
    this.toggleFeature('autoRefresh', features.autoRefresh);
    this.toggleFeature('videoAutoplay', features.videoAutoplay);
    this.toggleFeature('animations', features.animations);
    this.toggleFeature('prefetching', features.prefetching);
    this.toggleFeature('notifications', features.notifications);
    this.toggleFeature('locationServices', features.locationServices);

    // Apply data limits
    this.applyDataLimits(dataLimits);

    // Apply quality settings
    this.applyQualitySettings(features.imageQuality);

    // Update document classes for CSS-based optimizations
    this.updateDocumentClasses(profile);
  }

  /**
   * Toggle feature
   */
  private toggleFeature(feature: string, enabled: boolean): void {
    document.documentElement.setAttribute(`data-${feature}`, enabled ? 'enabled' : 'disabled');
    
    // Special handling for certain features
    switch (feature) {
      case 'animations':
        this.toggleAnimations(enabled);
        break;
      case 'prefetching':
        this.togglePrefetching(enabled);
        break;
      case 'notifications':
        this.toggleNotifications(enabled);
        break;
    }
  }

  /**
   * Toggle animations
   */
  private toggleAnimations(enabled: boolean): void {
    const style = document.createElement('style');
    style.id = 'animation-optimization';
    
    if (!enabled) {
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const existingStyle = document.getElementById('animation-optimization');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  /**
   * Toggle prefetching
   */
  private togglePrefetching(enabled: boolean): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('prefetchToggle', {
      detail: { enabled }
    }));
  }

  /**
   * Toggle notifications
   */
  private toggleNotifications(enabled: boolean): void {
    // Dispatch custom event for notification system
    window.dispatchEvent(new CustomEvent('notificationToggle', {
      detail: { enabled }
    }));
  }

  /**
   * Apply data limits
   */
  private applyDataLimits(limits: OptimizationProfile['dataLimits']): void {
    // Store limits in localStorage for other components to access
    localStorage.setItem('voltage-data-limits', JSON.stringify(limits));
    
    // Dispatch event for components to handle limits
    window.dispatchEvent(new CustomEvent('dataLimitsUpdate', {
      detail: limits
    }));
  }

  /**
   * Apply quality settings
   */
  private applyQualitySettings(imageQuality: number): void {
    // Update image quality for lazy loading components
    document.documentElement.setAttribute('data-image-quality', imageQuality.toString());
    
    // Dispatch event for image optimization
    window.dispatchEvent(new CustomEvent('imageQualityUpdate', {
      detail: { quality: imageQuality }
    }));
  }

  /**
   * Update document classes for CSS-based optimizations
   */
  private updateDocumentClasses(profile: OptimizationProfile): void {
    document.documentElement.className = document.documentElement.className
      .replace(/optimization-\w+/g, '') // Remove existing optimization classes
      .trim();
    
    document.documentElement.classList.add(`optimization-${profile.name}`);
  }

  /**
   * Check battery status periodically
   */
  private checkBatteryStatus(): void {
    // Additional battery checks for platforms that don't support Battery API
    this.detectSystemPowerMode();
    
    // Check if we should re-optimize
    if (this.batteryInfo) {
      this.optimizeBasedOnBattery();
    }
  }

  /**
   * Handle network restore
   */
  private handleNetworkRestore(): void {
    // Re-enable features that require network
    if (this.currentProfile.features.prefetching) {
      this.togglePrefetching(true);
    }
    
    logger.info('Network connection restored');
  }

  /**
   * Handle network loss
   */
  private handleNetworkLoss(): void {
    // Disable network-dependent features
    this.togglePrefetching(false);
    
    logger.warn('Network connection lost');
  }

  /**
   * Apply initial optimizations
   */
  private applyInitialOptimizations(): void {
    // Apply current profile on initialization
    this.applyProfileOptimizations(this.currentProfile);
  }

  /**
   * Register optimization change listener
   */
  addOptimizationListener(id: string, callback: (profile: OptimizationProfile) => void): void {
    this.optimizationListeners.set(id, callback);
  }

  /**
   * Remove optimization change listener
   */
  removeOptimizationListener(id: string): void {
    this.optimizationListeners.delete(id);
  }

  /**
   * Notify all listeners of optimization changes
   */
  private notifyListeners(profile: OptimizationProfile): void {
    this.optimizationListeners.forEach((callback) => {
      try {
        callback(profile);
      } catch (error) {
        logger.error('Error in optimization listener', error);
      }
    });
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus(): any {
    return {
      battery: this.batteryInfo,
      network: this.networkInfo,
      profile: this.currentProfile,
      isInitialized: this.isInitialized,
      lastOptimizationTime: this.lastOptimizationTime,
      listeners: this.optimizationListeners.size
    };
  }

  /**
   * Force optimization update
   */
  forceUpdate(): void {
    this.optimizeBasedOnBattery();
    this.optimizeBasedOnNetwork();
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): OptimizationProfile {
    return this.currentProfile;
  }

  /**
   * Get default profile
   */
  private getDefaultProfile(): OptimizationProfile {
    return {
      name: 'normal',
      batteryThreshold: 0.5,
      networkTypes: ['4g', 'wifi'],
      features: {
        backgroundSync: true,
        autoRefresh: true,
        imageQuality: 0.8,
        videoAutoplay: true,
        animations: true,
        prefetching: true,
        notifications: true,
        locationServices: true
      },
      dataLimits: {
        maxImageSize: 500, // KB
        maxVideoSize: 5000, // KB
        cacheSize: 50, // MB
        syncFrequency: 5 // minutes
      }
    };
  }

  /**
   * Initialize optimization profiles
   */
  private initializeProfiles(): void {
    this.profiles = [
      // Critical battery profile
      {
        name: 'critical',
        batteryThreshold: 0.1,
        networkTypes: ['slow-2g', '2g', '3g', '4g', 'wifi'],
        features: {
          backgroundSync: false,
          autoRefresh: false,
          imageQuality: 0.3,
          videoAutoplay: false,
          animations: false,
          prefetching: false,
          notifications: false,
          locationServices: false
        },
        dataLimits: {
          maxImageSize: 100,
          maxVideoSize: 1000,
          cacheSize: 10,
          syncFrequency: 30
        }
      },
      
      // Low battery profile
      {
        name: 'low',
        batteryThreshold: 0.2,
        networkTypes: ['slow-2g', '2g', '3g', '4g', 'wifi'],
        features: {
          backgroundSync: true,
          autoRefresh: false,
          imageQuality: 0.5,
          videoAutoplay: false,
          animations: false,
          prefetching: false,
          notifications: true,
          locationServices: false
        },
        dataLimits: {
          maxImageSize: 200,
          maxVideoSize: 2000,
          cacheSize: 20,
          syncFrequency: 15
        }
      },
      
      // Medium battery profile
      {
        name: 'medium',
        batteryThreshold: 0.5,
        networkTypes: ['slow-2g', '2g', '3g', '4g', 'wifi'],
        features: {
          backgroundSync: true,
          autoRefresh: true,
          imageQuality: 0.7,
          videoAutoplay: false,
          animations: true,
          prefetching: true,
          notifications: true,
          locationServices: true
        },
        dataLimits: {
          maxImageSize: 300,
          maxVideoSize: 3000,
          cacheSize: 35,
          syncFrequency: 10
        }
      },
      
      // Normal profile
      {
        name: 'normal',
        batteryThreshold: 0.8,
        networkTypes: ['3g', '4g', 'wifi'],
        features: {
          backgroundSync: true,
          autoRefresh: true,
          imageQuality: 0.8,
          videoAutoplay: true,
          animations: true,
          prefetching: true,
          notifications: true,
          locationServices: true
        },
        dataLimits: {
          maxImageSize: 500,
          maxVideoSize: 5000,
          cacheSize: 50,
          syncFrequency: 5
        }
      },
      
      // Charging profile
      {
        name: 'charging',
        batteryThreshold: 1.0,
        networkTypes: ['2g', '3g', '4g', 'wifi'],
        features: {
          backgroundSync: true,
          autoRefresh: true,
          imageQuality: 1.0,
          videoAutoplay: true,
          animations: true,
          prefetching: true,
          notifications: true,
          locationServices: true
        },
        dataLimits: {
          maxImageSize: 1000,
          maxVideoSize: 10000,
          cacheSize: 100,
          syncFrequency: 1
        }
      },
      
      // Data saver profile
      {
        name: 'data-saver',
        batteryThreshold: 0.0,
        networkTypes: ['slow-2g', '2g', '3g', '4g', 'wifi'],
        features: {
          backgroundSync: false,
          autoRefresh: false,
          imageQuality: 0.4,
          videoAutoplay: false,
          animations: false,
          prefetching: false,
          notifications: true,
          locationServices: false
        },
        dataLimits: {
          maxImageSize: 150,
          maxVideoSize: 1500,
          cacheSize: 25,
          syncFrequency: 20
        }
      },
      
      // Slow network profile
      {
        name: 'slow-network',
        batteryThreshold: 0.0,
        networkTypes: ['slow-2g', '2g'],
        features: {
          backgroundSync: true,
          autoRefresh: false,
          imageQuality: 0.6,
          videoAutoplay: false,
          animations: true,
          prefetching: false,
          notifications: true,
          locationServices: true
        },
        dataLimits: {
          maxImageSize: 250,
          maxVideoSize: 2500,
          cacheSize: 30,
          syncFrequency: 15
        }
      },
      
      // 3G network profile
      {
        name: '3g-network',
        batteryThreshold: 0.0,
        networkTypes: ['3g'],
        features: {
          backgroundSync: true,
          autoRefresh: true,
          imageQuality: 0.7,
          videoAutoplay: false,
          animations: true,
          prefetching: true,
          notifications: true,
          locationServices: true
        },
        dataLimits: {
          maxImageSize: 400,
          maxVideoSize: 4000,
          cacheSize: 40,
          syncFrequency: 8
        }
      }
    ];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.optimizationListeners.clear();
    
    if (this.batteryMonitor) {
      // Clean up battery monitoring if needed
    }
    
    logger.info('Battery & Data optimizer destroyed');
  }
}

// Export singleton instance
export const batteryDataOptimizer = new BatteryDataOptimizer();

export default BatteryDataOptimizer;
export type { BatteryInfo, NetworkInfo, OptimizationProfile };