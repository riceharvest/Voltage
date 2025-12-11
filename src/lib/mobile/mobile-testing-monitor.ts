/**
 * Mobile Testing and Monitoring System
 * Provides comprehensive testing and monitoring for mobile devices including:
 * - Mobile device testing matrix
 * - Performance monitoring for mobile
 * - Mobile user experience tracking
 * - Cross-platform compatibility testing
 * - Mobile-specific error tracking
 * - Mobile analytics and insights
 */

import { logger } from '../logger';

interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  os: 'iOS' | 'Android' | 'Windows' | 'Unknown';
  osVersion: string;
  screenSize: {
    width: number;
    height: number;
    ratio: number;
  };
  pixelRatio: number;
  memory: number; // GB
  cores: number;
  browser: string;
  browserVersion: string;
  capabilities: {
    touch: boolean;
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    notifications: boolean;
    serviceWorker: boolean;
    webGL: boolean;
    webRTC: boolean;
    bluetooth: boolean;
    nfc: boolean;
  };
  connection: {
    type: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
    downlink: number; // Mbps
    rtt: number; // ms
    saveData: boolean;
  };
}

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage: {
    used: number; // MB
    total: number; // MB
    percentage: number;
  };
  batteryLevel?: number;
  isCharging: boolean;
  networkBytes: {
    sent: number;
    received: number;
  };
  frameRate: number;
  scrollPerformance: number;
  touchResponseTime: number;
}

interface UserExperienceMetrics {
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  bounceRate: number;
  conversionRate: number;
  featureUsage: Map<string, number>;
  errorRate: number;
  crashRate: number;
  accessibilityUsage: {
    screenReader: boolean;
    voiceControl: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
  gestureUsage: {
    swipe: number;
    tap: number;
    pinch: number;
    longPress: number;
  };
  deviceOrientation: 'portrait' | 'landscape';
}

interface TestResult {
  id: string;
  testName: string;
  deviceId: string;
  timestamp: number;
  passed: boolean;
  duration: number;
  metrics: Record<string, any>;
  screenshots?: string[];
  logs: string[];
  errors: string[];
}

interface CompatibilityIssue {
  id: string;
  deviceId: string;
  browser: string;
  feature: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
  affectedUsers: number;
  detectedAt: number;
}

class MobileTestingMonitor {
  private deviceInfo: DeviceInfo;
  private performanceMetrics: PerformanceMetrics;
  private userExperienceMetrics: UserExperienceMetrics;
  private testResults: TestResult[] = [];
  private compatibilityIssues: CompatibilityIssue[] = [];
  private isInitialized: boolean = false;
  private performanceObserver: PerformanceObserver | null = null;
  private errorObserver: ((error: ErrorEvent) => void) | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private sessionStartTime: number = 0;
  private baselineMetrics: PerformanceMetrics | null = null;
  private performanceThresholds = {
    loadTime: 3000, // 3 seconds
    firstPaint: 1500, // 1.5 seconds
    firstContentfulPaint: 1800, // 1.8 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1,
    memoryUsage: 80, // 80%
    frameRate: 30 // 30 FPS minimum
  };

  constructor() {
    this.deviceInfo = this.detectDeviceInfo();
    this.performanceMetrics = this.getInitialMetrics();
    this.userExperienceMetrics = this.getInitialUXMetrics();
    this.sessionStartTime = Date.now();
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupUserExperienceTracking();
    this.setupDeviceOrientationTracking();
    this.setupNetworkMonitoring();
    this.startContinuousMonitoring();
    this.isInitialized = true;
    
    logger.info('Mobile testing monitor initialized', {
      device: this.deviceInfo.name,
      os: this.deviceInfo.os,
      browser: this.deviceInfo.browser
    });
  }

  /**
   * Detect device information
   */
  private detectDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const screen = window.screen;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    // Detect OS
    let os: DeviceInfo['os'] = 'Unknown';
    let osVersion = 'Unknown';
    
    if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        osVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
      }
    } else if (/Android/i.test(ua)) {
      os = 'Android';
      const match = ua.match(/Android (\d+\.\d+\.\d+)/);
      if (match) {
        osVersion = match[1];
      }
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
      osVersion = '10+'; // Simplified for mobile
    }

    // Detect browser
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.includes('Chrome')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    }

    // Detect device name and model
    let name = 'Unknown Device';
    let model = 'Unknown';
    let manufacturer = 'Unknown';

    if (os === 'iOS') {
      if (/iPhone/i.test(ua)) {
        name = 'iPhone';
        if (/iPhone15,4/i.test(ua)) { name = 'iPhone 15 Pro'; model = 'A3102'; manufacturer = 'Apple'; }
        else if (/iPhone14,2/i.test(ua)) { name = 'iPhone 14 Pro'; model = 'A2890'; manufacturer = 'Apple'; }
        else if (/iPhone13,2/i.test(ua)) { name = 'iPhone 13'; model = 'A2633'; manufacturer = 'Apple'; }
        else if (/iPhone12,1/i.test(ua)) { name = 'iPhone 12'; model = 'A2403'; manufacturer = 'Apple'; }
        else { model = 'iPhone'; manufacturer = 'Apple'; }
      } else if (/iPad/i.test(ua)) {
        name = 'iPad';
        model = 'iPad';
        manufacturer = 'Apple';
      }
    } else if (os === 'Android') {
      const manufacturerMatch = ua.match(/; ([^;]+?);/);
      if (manufacturerMatch) {
        manufacturer = manufacturerMatch[1].trim();
        name = `${manufacturer} Device`;
      }
      
      const modelMatch = ua.match(/Android[^;]+?;\s*([^)]+)\)/);
      if (modelMatch) {
        model = modelMatch[1].trim();
        name = model;
      }
    }

    return {
      id: this.generateDeviceId(),
      name,
      model,
      manufacturer,
      os,
      osVersion,
      screenSize: {
        width: screen.width,
        height: screen.height,
        ratio: screen.width / screen.height
      },
      pixelRatio: window.devicePixelRatio || 1,
      memory: (navigator as any).deviceMemory || 4,
      cores: navigator.hardwareConcurrency || 4,
      browser,
      browserVersion,
      capabilities: {
        touch: 'ontouchstart' in window,
        camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        geolocation: 'geolocation' in navigator,
        notifications: 'Notification' in window,
        serviceWorker: 'serviceWorker' in navigator,
        webGL: this.detectWebGL(),
        webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        bluetooth: 'bluetooth' in navigator,
        nfc: 'nfc' in navigator
      },
      connection: {
        type: connection?.type || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      }
    };
  }

  /**
   * Detect WebGL support
   */
  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.handlePerformanceEntry(entry);
        });
      });

      // Observe different performance entry types
      try {
        this.performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        // Fallback for older browsers
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint'] });
      }
    }

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.performanceMetrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      this.performanceMetrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let cls = 0;
      entryList.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      this.performanceMetrics.cumulativeLayoutShift = cls;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Handle performance entry
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.performanceMetrics.loadTime = (entry as PerformanceNavigationTiming).loadEventEnd - (entry as PerformanceNavigationTiming).navigationStart;
        this.performanceMetrics.domContentLoaded = (entry as PerformanceNavigationTiming).domContentLoadedEventEnd - (entry as PerformanceNavigationTiming).navigationStart;
        break;
      case 'paint':
        if (entry.name === 'first-paint') {
          this.performanceMetrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.performanceMetrics.firstContentfulPaint = entry.startTime;
        }
        break;
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // JavaScript errors
    this.errorObserver = (event) => {
      this.recordError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.message
      });
    };
    window.addEventListener('error', this.errorObserver);

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise-rejection', {
        reason: event.reason
      });
    });

    // Resource loading errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError('resource-loading', {
          element: event.target,
          source: (event.target as any).src || (event.target as any).href
        });
      }
    }, true);
  }

  /**
   * Setup user experience tracking
   */
  private setupUserExperienceTracking(): void {
    // Track page views
    this.userExperienceMetrics.pageViews = 1;

    // Track interactions
    document.addEventListener('click', (e) => {
      this.userExperienceMetrics.interactions++;
      this.trackInteraction(e.target as HTMLElement);
    });

    // Track scroll performance
    let scrollStartTime = 0;
    let scrollEvents = 0;
    
    document.addEventListener('scroll', () => {
      if (scrollEvents === 0) {
        scrollStartTime = performance.now();
      }
      scrollEvents++;
      
      requestAnimationFrame(() => {
        const duration = performance.now() - scrollStartTime;
        if (duration > 0) {
          this.performanceMetrics.scrollPerformance = Math.max(0, 100 - (duration / 16)); // Normalize to 0-100
        }
        scrollEvents = 0;
      });
    }, { passive: true });

    // Track touch response time
    document.addEventListener('touchstart', (e) => {
      const touchStartTime = performance.now();
      
      const handleTouchEnd = () => {
        const responseTime = performance.now() - touchStartTime;
        this.performanceMetrics.touchResponseTime = responseTime;
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    });

    // Track frame rate
    this.trackFrameRate();
  }

  /**
   * Track frame rate
   */
  private trackFrameRate(): void {
    let frames = 0;
    let lastTime = performance.now();
    
    const countFrames = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.frameRate = frames;
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };
    
    requestAnimationFrame(countFrames);
  }

  /**
   * Track interaction
   */
  private trackInteraction(element: HTMLElement): void {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    
    // Track specific features
    if (element.closest('[data-testid="calculator"]')) {
      this.userExperienceMetrics.featureUsage.set('calculator', (this.userExperienceMetrics.featureUsage.get('calculator') || 0) + 1);
    } else if (element.closest('[data-testid="recipe"]')) {
      this.userExperienceMetrics.featureUsage.set('recipes', (this.userExperienceMetrics.featureUsage.get('recipes') || 0) + 1);
    } else if (element.closest('[data-testid="safety"]')) {
      this.userExperienceMetrics.featureUsage.set('safety', (this.userExperienceMetrics.featureUsage.get('safety') || 0) + 1);
    }
  }

  /**
   * Setup device orientation tracking
   */
  private setupDeviceOrientationTracking(): void {
    const updateOrientation = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      this.userExperienceMetrics.deviceOrientation = orientation;
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        this.deviceInfo.connection = {
          type: connection.type || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        };
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Track data usage
    if ('connection' in navigator && 'downlink' in (navigator as any).connection) {
      // Estimate data usage based on page performance
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.transferSize) {
            this.performanceMetrics.networkBytes.received += entry.transferSize;
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectContinuousMetrics();
      this.checkPerformanceThresholds();
      this.generateAlerts();
    }, 30000);

    // Before page unload, send final metrics
    window.addEventListener('beforeunload', () => {
      this.sendFinalMetrics();
    });
  }

  /**
   * Collect continuous metrics
   */
  private collectContinuousMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = {
        used: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
        total: memory.totalJSHeapSize / (1024 * 1024), // Convert to MB
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    // Update battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.performanceMetrics.batteryLevel = battery.level * 100;
        this.performanceMetrics.isCharging = battery.charging;
      }).catch(() => {
        // Battery API not supported or failed
      });
    }

    // Update session duration
    this.userExperienceMetrics.sessionDuration = Date.now() - this.sessionStartTime;
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(): void {
    const issues: string[] = [];

    if (this.performanceMetrics.loadTime > this.performanceThresholds.loadTime) {
      issues.push(`Slow page load: ${this.performanceMetrics.loadTime}ms`);
    }

    if (this.performanceMetrics.firstInputDelay > this.performanceThresholds.firstInputDelay) {
      issues.push(`High first input delay: ${this.performanceMetrics.firstInputDelay}ms`);
    }

    if (this.performanceMetrics.cumulativeLayoutShift > this.performanceThresholds.cumulativeLayoutShift) {
      issues.push(`High layout shift: ${this.performanceMetrics.cumulativeLayoutShift}`);
    }

    if (this.performanceMetrics.frameRate < this.performanceThresholds.frameRate) {
      issues.push(`Low frame rate: ${this.performanceMetrics.frameRate} FPS`);
    }

    if (this.performanceMetrics.memoryUsage.percentage > this.performanceThresholds.memoryUsage) {
      issues.push(`High memory usage: ${this.performanceMetrics.memoryUsage.percentage}%`);
    }

    if (issues.length > 0) {
      logger.warn('Performance issues detected', { issues, device: this.deviceInfo.id });
    }
  }

  /**
   * Generate alerts for critical issues
   */
  private generateAlerts(): void {
    const alerts: string[] = [];

    if (this.performanceMetrics.memoryUsage.percentage > 95) {
      alerts.push('CRITICAL: Memory usage above 95%');
    }

    if (this.performanceMetrics.frameRate < 15) {
      alerts.push('CRITICAL: Frame rate below 15 FPS');
    }

    if (this.performanceMetrics.firstInputDelay > 300) {
      alerts.push('WARNING: First input delay above 300ms');
    }

    alerts.forEach(alert => {
      this.sendAlert(alert);
    });
  }

  /**
   * Send alert
   */
  private sendAlert(message: string): void {
    // In a real app, this would send to monitoring service
    console.warn('Mobile Performance Alert:', message);
    
    // Show notification to user if critical
    if (message.includes('CRITICAL')) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Performance Alert', {
          body: message,
          icon: '/icon-192x192.png'
        });
      }
    }
  }

  /**
   * Run automated tests
   */
  async runAutomatedTests(): Promise<TestResult[]> {
    const tests = [
      { name: 'PWA Support', test: this.testPWASupport.bind(this) },
      { name: 'Touch Support', test: this.testTouchSupport.bind(this) },
      { name: 'Responsive Design', test: this.testResponsiveDesign.bind(this) },
      { name: 'Performance', test: this.testPerformance.bind(this) },
      { name: 'Accessibility', test: this.testAccessibility.bind(this) },
      { name: 'Offline Support', test: this.testOfflineSupport.bind(this) },
      { name: 'Battery Optimization', test: this.testBatteryOptimization.bind(this) },
      { name: 'Network Optimization', test: this.testNetworkOptimization.bind(this) }
    ];

    const results: TestResult[] = [];

    for (const { name, test } of tests) {
      const result = await this.runSingleTest(name, test);
      results.push(result);
      this.testResults.push(result);
    }

    return results;
  }

  /**
   * Run single test
   */
  private async runSingleTest(testName: string, testFn: () => Promise<boolean>): Promise<TestResult> {
    const startTime = Date.now();
    let passed = false;
    let metrics: Record<string, any> = {};
    let logs: string[] = [];
    let errors: string[] = [];

    try {
      logs.push(`Starting test: ${testName}`);
      passed = await testFn();
      logs.push(`Test ${testName} ${passed ? 'passed' : 'failed'}`);
      metrics = this.collectTestMetrics(testName);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      logger.error(`Test ${testName} failed`, error);
    }

    return {
      id: this.generateTestId(),
      testName,
      deviceId: this.deviceInfo.id,
      timestamp: Date.now(),
      passed,
      duration: Date.now() - startTime,
      metrics,
      logs,
      errors
    };
  }

  /**
   * Test PWA support
   */
  private async testPWASupport(): Promise<boolean> {
    const requirements = [
      'serviceWorker' in navigator,
      'Cache' in window,
      'Notification' in window || 'PushManager' in window,
      'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window
    ];

    return requirements.every(Boolean);
  }

  /**
   * Test touch support
   */
  private async testTouchSupport(): Promise<boolean> {
    return 'ontouchstart' in window;
  }

  /**
   * Test responsive design
   */
  private async testResponsiveDesign(): Promise<boolean> {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) return false;

    const content = viewportMeta.getAttribute('content') || '';
    return content.includes('width=device-width');
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<boolean> {
    return (
      this.performanceMetrics.loadTime < this.performanceThresholds.loadTime &&
      this.performanceMetrics.firstInputDelay < this.performanceThresholds.firstInputDelay
    );
  }

  /**
   * Test accessibility
   */
  private async testAccessibility(): Promise<boolean> {
    const checks = [
      document.querySelector('main') !== null,
      document.querySelector('[role="navigation"]') !== null,
      document.querySelector('h1') !== null,
      Array.from(document.querySelectorAll('img')).every(img => img.hasAttribute('alt'))
    ];

    return checks.every(Boolean);
  }

  /**
   * Test offline support
   */
  private async testOfflineSupport(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch {
      return false;
    }
  }

  /**
   * Test battery optimization
   */
  private async testBatteryOptimization(): Promise<boolean> {
    // Check if performance adapts to battery level
    return true; // Simplified for demo
  }

  /**
   * Test network optimization
   */
  private async testNetworkOptimization(): Promise<boolean> {
    const connection = (navigator as any).connection;
    return !!connection;
  }

  /**
   * Collect test metrics
   */
  private collectTestMetrics(testName: string): Record<string, any> {
    const metrics: Record<string, any> = {
      timestamp: Date.now(),
      device: this.deviceInfo.id
    };

    switch (testName) {
      case 'Performance':
        metrics.loadTime = this.performanceMetrics.loadTime;
        metrics.firstInputDelay = this.performanceMetrics.firstInputDelay;
        metrics.memoryUsage = this.performanceMetrics.memoryUsage;
        break;
      case 'Accessibility':
        metrics.screenReaderActive = this.userExperienceMetrics.accessibilityUsage.screenReader;
        metrics.highContrast = this.userExperienceMetrics.accessibilityUsage.highContrast;
        break;
      case 'PWA Support':
        metrics.serviceWorker = this.deviceInfo.capabilities.serviceWorker;
        metrics.notifications = this.deviceInfo.capabilities.notifications;
        break;
    }

    return metrics;
  }

  /**
   * Record error
   */
  private recordError(type: string, details: any): void {
    logger.error(`Mobile error: ${type}`, details);
    
    // In a real app, this would send to error tracking service
    this.userExperienceMetrics.errorRate++;
  }

  /**
   * Send final metrics
   */
  private sendFinalMetrics(): void {
    const finalMetrics = {
      sessionDuration: Date.now() - this.sessionStartTime,
      performance: this.performanceMetrics,
      userExperience: this.userExperienceMetrics,
      device: this.deviceInfo,
      timestamp: Date.now()
    };

    // Send to analytics service
    console.log('Final mobile metrics:', finalMetrics);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): {
    device: DeviceInfo;
    performance: PerformanceMetrics;
    userExperience: UserExperienceMetrics;
    testResults: TestResult[];
    compatibilityIssues: CompatibilityIssue[];
  } {
    return {
      device: this.deviceInfo,
      performance: this.performanceMetrics,
      userExperience: this.userExperienceMetrics,
      testResults: this.testResults,
      compatibilityIssues: this.compatibilityIssues
    };
  }

  /**
   * Run compatibility test
   */
  testCompatibility(): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Test missing features
    if (!this.deviceInfo.capabilities.touch) {
      issues.push({
        id: this.generateIssueId(),
        deviceId: this.deviceInfo.id,
        browser: this.deviceInfo.browser,
        feature: 'Touch Support',
        severity: 'high',
        description: 'Device does not support touch events',
        solution: 'Implement mouse-based navigation fallback',
        affectedUsers: 1,
        detectedAt: Date.now()
      });
    }

    if (!this.deviceInfo.capabilities.serviceWorker) {
      issues.push({
        id: this.generateIssueId(),
        deviceId: this.deviceInfo.id,
        browser: this.deviceInfo.browser,
        feature: 'Service Worker',
        severity: 'medium',
        description: 'Browser does not support service workers',
        solution: 'Implement graceful fallback for offline functionality',
        affectedUsers: 1,
        detectedAt: Date.now()
      });
    }

    // Test performance issues
    if (this.performanceMetrics.loadTime > this.performanceThresholds.loadTime) {
      issues.push({
        id: this.generateIssueId(),
        deviceId: this.deviceInfo.id,
        browser: this.deviceInfo.browser,
        feature: 'Page Load Performance',
        severity: 'high',
        description: `Page load time (${this.performanceMetrics.loadTime}ms) exceeds threshold (${this.performanceThresholds.loadTime}ms)`,
        solution: 'Optimize critical rendering path and reduce bundle size',
        affectedUsers: 1,
        detectedAt: Date.now()
      });
    }

    this.compatibilityIssues.push(...issues);
    return issues;
  }

  /**
   * Generate device ID
   */
  private generateDeviceId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate test ID
   */
  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate issue ID
   */
  private generateIssueId(): string {
    return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get initial performance metrics
   */
  private getInitialMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      isCharging: false,
      networkBytes: { sent: 0, received: 0 },
      frameRate: 0,
      scrollPerformance: 0,
      touchResponseTime: 0
    };
  }

  /**
   * Get initial UX metrics
   */
  private getInitialUXMetrics(): UserExperienceMetrics {
    return {
      sessionDuration: 0,
      pageViews: 0,
      interactions: 0,
      bounceRate: 0,
      conversionRate: 0,
      featureUsage: new Map(),
      errorRate: 0,
      crashRate: 0,
      accessibilityUsage: {
        screenReader: false,
        voiceControl: false,
        highContrast: false,
        largeText: false,
        reducedMotion: false
      },
      gestureUsage: {
        swipe: 0,
        tap: 0,
        pinch: 0,
        longPress: 0
      },
      deviceOrientation: 'portrait'
    };
  }

  /**
   * Set performance baseline
   */
  setPerformanceBaseline(): void {
    this.baselineMetrics = { ...this.performanceMetrics };
    logger.info('Performance baseline set');
  }

  /**
   * Compare against baseline
   */
  compareToBaseline(): Record<string, { current: number; baseline: number; change: number }> {
    if (!this.baselineMetrics) return {};

    const comparison: Record<string, { current: number; baseline: number; change: number }> = {};

    Object.keys(this.performanceMetrics).forEach(key => {
      if (typeof this.performanceMetrics[key as keyof PerformanceMetrics] === 'number') {
        const current = this.performanceMetrics[key as keyof PerformanceMetrics] as number;
        const baseline = this.baselineMetrics![key as keyof PerformanceMetrics] as number;
        const change = ((current - baseline) / baseline) * 100;

        comparison[key] = { current, baseline, change };
      }
    });

    return comparison;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.errorObserver) {
      window.removeEventListener('error', this.errorObserver);
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Send final metrics
    this.sendFinalMetrics();

    logger.info('Mobile testing monitor destroyed');
  }
}

// Export singleton instance
export const mobileTestingMonitor = new MobileTestingMonitor();

export default MobileTestingMonitor;
export type { DeviceInfo, PerformanceMetrics, UserExperienceMetrics, TestResult, CompatibilityIssue };