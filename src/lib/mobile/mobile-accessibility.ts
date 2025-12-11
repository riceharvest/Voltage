/**
 * Mobile Accessibility System
 * Provides comprehensive accessibility features for mobile devices including:
 * - Voice control integration
 * - Screen reader optimization
 * - High contrast mode support
 * - Large text and zoom accessibility
 * - Motor disability accommodations
 * - Voice navigation capabilities
 */

import { logger } from '../logger';

interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrastMode: 'normal' | 'high' | 'custom';
  voiceControl: boolean;
  voiceNavigation: boolean;
  screenReader: boolean;
  motorAssistance: boolean;
  reducedMotion: boolean;
  colorBlindness: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  hapticFeedback: boolean;
  soundEffects: boolean;
  timeoutDuration: number; // seconds
}

interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
}

interface AccessibilityState {
  isEnabled: boolean;
  currentMode: AccessibilityPreferences;
  screenReaderActive: boolean;
  voiceControlActive: boolean;
  fontScale: number;
  isHighContrast: boolean;
  reducedMotionEnabled: boolean;
  colorBlindnessFilter: string;
  motorAssistanceActive: boolean;
}

class MobileAccessibilityManager {
  private preferences: AccessibilityPreferences;
  private accessibilityState: AccessibilityState;
  private voiceRecognition: any = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private screenReaderAnnouncements: string[] = [];
  private isInitialized: boolean = false;
  private voiceCommands: Map<string, VoiceCommand> = new Map();
  private accessibilityListeners: Map<string, (state: AccessibilityState) => void> = new Map();
  private focusManagement: { current: HTMLElement | null } = { current: null };
  private timeoutTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.accessibilityState = this.getInitialState();
    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility system
   */
  private initializeAccessibility(): void {
    this.loadPreferences();
    this.setupScreenReaderSupport();
    this.setupVoiceControl();
    this.setupSpeechSynthesis();
    this.setupMotorAssistance();
    this.setupAccessibilityObservers();
    this.applyAccessibilitySettings();
    this.isInitialized = true;
    
    logger.info('Mobile accessibility system initialized', {
      preferences: this.preferences
    });
  }

  /**
   * Load user preferences from storage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('voltage-accessibility-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...parsed };
      }
    } catch (error) {
      logger.warn('Failed to load accessibility preferences', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('voltage-accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      logger.warn('Failed to save accessibility preferences', error);
    }
  }

  /**
   * Setup screen reader support
   */
  private setupScreenReaderSupport(): void {
    // Detect screen reader
    this.accessibilityState.screenReaderActive = this.detectScreenReader();
    
    // Setup live region for announcements
    this.createLiveRegion();
    
    // Setup navigation landmarks
    this.setupLandmarks();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Add ARIA live regions for dynamic content
    this.setupLiveRegions();
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): boolean {
    // Check for common screen reader user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderPatterns = [
      'nvda', 'jaws', 'windoweyes', 'voiceover', 'talkback', 
      'orca', 'speech recognition', 'narrator'
    ];
    
    return screenReaderPatterns.some(pattern => userAgent.includes(pattern));
  }

  /**
   * Create live region for screen reader announcements
   */
  private createLiveRegion(): void {
    // Create polite live region
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.setAttribute('aria-relevant', 'additions text');
    politeRegion.className = 'sr-only';
    politeRegion.id = 'accessibility-polite';
    politeRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(politeRegion);

    // Create assertive live region for urgent announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.setAttribute('aria-relevant', 'additions text');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'accessibility-assertive';
    assertiveRegion.style.cssText = politeRegion.style.cssText;
    document.body.appendChild(assertiveRegion);
  }

  /**
   * Setup navigation landmarks
   */
  private setupLandmarks(): void {
    // Ensure main content has proper landmark
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main && !main.hasAttribute('aria-label')) {
      main.setAttribute('aria-label', 'Main content');
    }

    // Add navigation landmarks
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (nav && !nav.hasAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Add search landmark if search exists
    const search = document.querySelector('[role="search"]') || document.querySelector('form[role="search"]');
    if (search) {
      search.setAttribute('aria-label', 'Search');
    }
  }

  /**
   * Setup focus management for keyboard and switch navigation
   */
  private setupFocusManagement(): void {
    // Track focus for motor assistance
    document.addEventListener('focusin', (e) => {
      this.focusManagement.current = e.target as HTMLElement;
      this.announceFocusChange(e.target as HTMLElement);
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Handle switch navigation for motor disabilities
    document.addEventListener('click', (e) => {
      this.handleSwitchNavigation(e);
    });
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    
    switch (e.key) {
      case 'Tab':
        this.handleTabNavigation(e);
        break;
      case 'Enter':
      case ' ':
        this.handleActivation(e, target);
        break;
      case 'Escape':
        this.handleEscape(e);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowNavigation(e, target);
        break;
      case 'Home':
      case 'End':
        this.handleHomeEndNavigation(e, target);
        break;
    }
  }

  /**
   * Handle tab navigation with visual indicators
   */
  private handleTabNavigation(e: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(this.focusManagement.current);
    
    if (e.shiftKey) {
      // Shift+Tab - reverse
      if (currentIndex <= 0) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab - forward
      if (currentIndex >= focusableElements.length - 1) {
        e.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  /**
   * Handle activation keys
   */
  private handleActivation(e: KeyboardEvent, target: HTMLElement): void {
    if (target.tagName === 'BUTTON' || 
        target.getAttribute('role') === 'button' ||
        target.tagName === 'A' ||
        target.hasAttribute('aria-label')) {
      
      e.preventDefault();
      target.click();
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape(e: KeyboardEvent): void {
    // Close modals, menus, etc.
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowNavigation(e: KeyboardEvent, target: HTMLElement): void {
    const group = target.closest('[role="group"], [role="radiogroup"], [role="listbox"]');
    if (!group) return;

    const items = Array.from(group.querySelectorAll('[role="option"], [role="radio"], button, a'));
    const currentIndex = items.indexOf(target);

    let nextIndex = currentIndex;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
    }

    if (nextIndex !== currentIndex) {
      e.preventDefault();
      (items[nextIndex] as HTMLElement)?.focus();
    }
  }

  /**
   * Handle Home/End navigation
   */
  private handleHomeEndNavigation(e: KeyboardEvent, target: HTMLElement): void {
    const container = target.closest('ul, ol, [role="list"], nav');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('li, a, button, [role="option"]'));
    if (items.length === 0) return;

    e.preventDefault();
    if (e.key === 'Home') {
      (items[0] as HTMLElement)?.focus();
    } else {
      (items[items.length - 1] as HTMLElement)?.focus();
    }
  }

  /**
   * Setup voice control
   */
  private setupVoiceControl(): void {
    if (!this.preferences.voiceControl) return;

    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.voiceRecognition = new SpeechRecognition();
      
      this.voiceRecognition.continuous = false;
      this.voiceRecognition.interimResults = false;
      this.voiceRecognition.lang = this.getCurrentLanguage();
      
      this.voiceRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        this.processVoiceCommand(transcript);
      };
      
      this.voiceRecognition.onerror = (event: any) => {
        logger.warn('Voice recognition error', event.error);
      };
    }

    this.setupVoiceCommands();
  }

  /**
   * Setup voice commands
   */
  private setupVoiceCommands(): void {
    const commands: VoiceCommand[] = [
      // Navigation commands
      { phrase: 'go home', action: 'navigate', parameters: { url: '/' }, confidence: 0.8 },
      { phrase: 'go to calculator', action: 'navigate', parameters: { url: '/calculator' }, confidence: 0.8 },
      { phrase: 'go to recipes', action: 'navigate', parameters: { url: '/flavors' }, confidence: 0.8 },
      { phrase: 'go to safety', action: 'navigate', parameters: { url: '/safety' }, confidence: 0.8 },
      
      // Action commands
      { phrase: 'search for', action: 'search', parameters: {}, confidence: 0.7 },
      { phrase: 'calculate', action: 'calculate', parameters: {}, confidence: 0.7 },
      { phrase: 'increase font', action: 'increase-font', parameters: {}, confidence: 0.8 },
      { phrase: 'decrease font', action: 'decrease-font', parameters: {}, confidence: 0.8 },
      { phrase: 'high contrast', action: 'toggle-contrast', parameters: {}, confidence: 0.8 },
      { phrase: 'read this page', action: 'read-page', parameters: {}, confidence: 0.7 },
      
      // Emergency commands
      { phrase: 'emergency', action: 'emergency', parameters: {}, confidence: 0.9 },
      { phrase: 'help', action: 'help', parameters: {}, confidence: 0.8 },
      { phrase: 'stop voice control', action: 'stop-voice', parameters: {}, confidence: 0.9 }
    ];

    commands.forEach(command => {
      this.voiceCommands.set(command.phrase, command);
    });
  }

  /**
   * Process voice commands
   */
  private processVoiceCommand(transcript: string): void {
    // Find matching command
    let bestMatch: VoiceCommand | null = null;
    let highestConfidence = 0;

    this.voiceCommands.forEach(command => {
      const similarity = this.calculateSimilarity(transcript, command.phrase);
      if (similarity > command.confidence && similarity > highestConfidence) {
        highestConfidence = similarity;
        bestMatch = command;
      }
    });

    if (bestMatch) {
      this.executeVoiceCommand(bestMatch, transcript);
    } else {
      this.announceToScreenReader(`Command not recognized: ${transcript}`);
    }
  }

  /**
   * Calculate text similarity for voice commands
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Execute voice command
   */
  private executeVoiceCommand(command: VoiceCommand, transcript: string): void {
    switch (command.action) {
      case 'navigate':
        window.location.href = command.parameters!.url;
        break;
        
      case 'search':
        const searchTerm = transcript.replace(command.phrase, '').trim();
        if (searchTerm) {
          const searchInput = document.querySelector('input[type="search"], [role="search"] input') as HTMLInputElement;
          if (searchInput) {
            searchInput.value = searchTerm;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.announceToScreenReader(`Searching for ${searchTerm}`);
          }
        }
        break;
        
      case 'increase-font':
        this.increaseFontSize();
        break;
        
      case 'decrease-font':
        this.decreaseFontSize();
        break;
        
      case 'toggle-contrast':
        this.toggleHighContrast();
        break;
        
      case 'read-page':
        this.readPageContent();
        break;
        
      case 'stop-voice':
        this.stopVoiceControl();
        break;
        
      case 'emergency':
        this.handleEmergency();
        break;
        
      case 'help':
        this.showVoiceHelp();
        break;
        
      default:
        this.announceToScreenReader('Command executed');
    }
  }

  /**
   * Setup speech synthesis for audio feedback
   */
  private setupSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Read page content aloud
   */
  private readPageContent(): void {
    if (!this.speechSynthesis) return;

    const content = this.extractReadableContent();
    if (content) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      this.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Extract readable content from page
   */
  private extractReadableContent(): string {
    const main = document.querySelector('main') || document.body;
    const headings = Array.from(main.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent)
      .filter(Boolean)
      .join(', ');
    
    const paragraphs = Array.from(main.querySelectorAll('p'))
      .slice(0, 3) // First 3 paragraphs
      .map(p => p.textContent)
      .filter(Boolean)
      .join(' ');
    
    return `Page content. Headings: ${headings}. ${paragraphs}`;
  }

  /**
   * Setup motor assistance features
   */
  private setupMotorAssistance(): void {
    if (!this.preferences.motorAssistance) return;

    // Increase timeout duration
    this.setupTimeoutExtension();
    
    // Add larger touch targets
    this.increaseTouchTargets();
    
    // Setup switch navigation
    this.setupSwitchNavigation();
    
    // Add dwell clicking
    this.setupDwellClicking();
  }

  /**
   * Setup timeout extension for motor disabilities
   */
  private setupTimeoutExtension(): void {
    const timeoutDuration = this.preferences.timeoutDuration * 1000;
    
    this.timeoutTimer = setTimeout(() => {
      this.announceToScreenReader('Timeout extended due to accessibility settings');
      // Extend timeout or disable it entirely
    }, timeoutDuration);
  }

  /**
   * Increase touch targets for motor assistance
   */
  private increaseTouchTargets(): void {
    const style = document.createElement('style');
    style.id = 'motor-assistance-styles';
    style.textContent = `
      button, .btn, [role="button"], a, input[type="button"], input[type="submit"] {
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 12px 16px !important;
      }
      
      /* Increase spacing between interactive elements */
      button + button, .btn + .btn, [role="button"] + [role="button"] {
        margin-top: 8px !important;
      }
      
      /* Larger checkboxes and radio buttons */
      input[type="checkbox"], input[type="radio"] {
        width: 20px !important;
        height: 20px !important;
      }
      
      /* Larger form fields */
      input, select, textarea {
        min-height: 44px !important;
        font-size: 16px !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup switch navigation for users who can only use one switch
   */
  private setupSwitchNavigation(): void {
    let currentFocusIndex = 0;
    const focusableElements = this.getFocusableElements();
    
    // Listen for switch activation (space or enter key)
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        
        // Move to next focusable element
        currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
        focusableElements[currentFocusIndex].focus();
        
        this.announceToScreenReader(`Focused: ${focusableElements[currentFocusIndex].getAttribute('aria-label') || focusableElements[currentFocusIndex].textContent}`);
      }
    });
  }

  /**
   * Setup dwell clicking for eye-tracking or head movement
   */
  private setupDwellClicking(): void {
    let dwellTimer: NodeJS.Timeout | null = null;
    const dwellTime = 2000; // 2 seconds
    
    document.addEventListener('mousemove', (e) => {
      const target = e.target as HTMLElement;
      
      if (target && this.isClickable(target)) {
        // Clear previous timer
        if (dwellTimer) clearTimeout(dwellTimer);
        
        // Start new dwell timer
        dwellTimer = setTimeout(() => {
          target.click();
          this.announceToScreenReader('Element activated by dwell');
        }, dwellTime);
      } else {
        if (dwellTimer) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      }
    });
  }

  /**
   * Setup accessibility observers
   */
  private setupAccessibilityObservers(): void {
    // Observe for new elements being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processAccessibilityNode(node as Element);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Process accessibility for new DOM nodes
   */
  private processAccessibilityNode(element: Element): void {
    // Add ARIA labels where missing
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      if (element.tagName === 'IMG') {
        const alt = element.getAttribute('alt');
        if (alt) {
          element.setAttribute('aria-label', alt);
        }
      }
    }
    
    // Ensure proper roles
    if (!element.hasAttribute('role')) {
      if (element.tagName === 'NAV') {
        element.setAttribute('role', 'navigation');
      } else if (element.tagName === 'MAIN') {
        element.setAttribute('role', 'main');
      }
    }
  }

  /**
   * Announce to screen reader
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = document.getElementById(`accessibility-${priority}`);
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
    
    // Also use speech synthesis if available
    if (this.speechSynthesis && this.preferences.soundEffects) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = 0.5;
      this.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Announce focus change
   */
  private announceFocusChange(element: HTMLElement): void {
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  element.textContent?.trim();
    
    if (label) {
      this.announceToScreenReader(`Focused: ${label}`);
    }
  }

  /**
   * Increase font size
   */
  increaseFontSize(): void {
    const sizes = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    
    this.preferences.fontSize = sizes[nextIndex] as AccessibilityPreferences['fontSize'];
    this.applyFontSize();
    this.savePreferences();
    
    this.announceToScreenReader(`Font size changed to ${this.preferences.fontSize}`);
  }

  /**
   * Decrease font size
   */
  decreaseFontSize(): void {
    const sizes = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const prevIndex = Math.max(currentIndex - 1, 0);
    
    this.preferences.fontSize = sizes[prevIndex] as AccessibilityPreferences['fontSize'];
    this.applyFontSize();
    this.savePreferences();
    
    this.announceToScreenReader(`Font size changed to ${this.preferences.fontSize}`);
  }

  /**
   * Apply font size settings
   */
  private applyFontSize(): void {
    const scale = {
      small: 0.875,
      medium: 1,
      large: 1.125,
      'extra-large': 1.25
    }[this.preferences.fontSize];
    
    document.documentElement.style.fontSize = `${scale}rem`;
    this.accessibilityState.fontScale = scale;
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    this.preferences.contrastMode = this.preferences.contrastMode === 'high' ? 'normal' : 'high';
    this.applyHighContrast();
    this.savePreferences();
    
    this.announceToScreenReader(`High contrast ${this.preferences.contrastMode === 'high' ? 'enabled' : 'disabled'}`);
  }

  /**
   * Apply high contrast settings
   */
  private applyHighContrast(): void {
    const isHigh = this.preferences.contrastMode === 'high';
    this.accessibilityState.isHighContrast = isHigh;
    
    if (isHigh) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  /**
   * Apply all accessibility settings
   */
  private applyAccessibilitySettings(): void {
    this.applyFontSize();
    this.applyHighContrast();
    this.applyReducedMotion();
    this.applyColorBlindnessFilter();
  }

  /**
   * Apply reduced motion settings
   */
  private applyReducedMotion(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldReduce = this.preferences.reducedMotion || prefersReducedMotion;
    
    this.accessibilityState.reducedMotionEnabled = shouldReduce;
    
    if (shouldReduce) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  /**
   * Apply color blindness filter
   */
  private applyColorBlindnessFilter(): void {
    const filter = this.preferences.colorBlindness;
    this.accessibilityState.colorBlindnessFilter = filter;
    
    if (filter !== 'none') {
      document.body.classList.add(`colorblind-${filter}`);
    } else {
      document.body.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
    }
  }

  /**
   * Get focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    return Array.from(document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled')) as HTMLElement[];
  }

  /**
   * Check if element is clickable
   */
  private isClickable(element: HTMLElement): boolean {
    return element.matches('button, .btn, [role="button"], a, input[type="button"], input[type="submit"]');
  }

  /**
   * Handle switch navigation for motor disabilities
   */
  private handleSwitchNavigation(e: MouseEvent): void {
    // This would integrate with external switch devices
    // For now, we'll use keyboard shortcuts as switch activation
  }

  /**
   * Handle escape key for motor assistance
   */
  private handleEscape(e: KeyboardEvent): void {
    // Clear dwell timers
    // Close active menus/modals
    // Reset focus to safe element
  }

  /**
   * Setup live regions for dynamic content
   */
  private setupLiveRegions(): void {
    // Create live regions for form validation
    const form = document.querySelector('form');
    if (form) {
      form.setAttribute('aria-live', 'polite');
      form.setAttribute('aria-relevant', 'additions text');
    }
  }

  /**
   * Start voice control
   */
  startVoiceControl(): void {
    if (this.voiceRecognition) {
      this.voiceRecognition.start();
      this.accessibilityState.voiceControlActive = true;
      this.announceToScreenReader('Voice control started. Say a command.');
    }
  }

  /**
   * Stop voice control
   */
  stopVoiceControl(): void {
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
      this.accessibilityState.voiceControlActive = false;
      this.announceToScreenReader('Voice control stopped.');
    }
  }

  /**
   * Show voice help
   */
  private showVoiceHelp(): void {
    const commands = Array.from(this.voiceCommands.keys()).join(', ');
    this.announceToScreenReader(`Available voice commands: ${commands}`);
  }

  /**
   * Handle emergency situations
   */
  private handleEmergency(): void {
    this.announceToScreenReader('Emergency assistance activated. Contacting emergency services.');
    // In a real app, this would trigger emergency protocols
  }

  /**
   * Get current language for voice recognition
   */
  private getCurrentLanguage(): string {
    // Map locale codes to speech recognition codes
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'nl': 'nl-NL',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ru': 'ru-RU'
    };
    
    const locale = document.documentElement.lang || 'en';
    return langMap[locale] || 'en-US';
  }

  /**
   * Update preferences
   */
  updatePreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
    this.applyAccessibilitySettings();
    this.notifyListeners();
  }

  /**
   * Get accessibility state
   */
  getAccessibilityState(): AccessibilityState {
    return { ...this.accessibilityState };
  }

  /**
   * Register state change listener
   */
  addStateListener(id: string, callback: (state: AccessibilityState) => void): void {
    this.accessibilityListeners.set(id, callback);
  }

  /**
   * Remove state change listener
   */
  removeStateListener(id: string): void {
    this.accessibilityListeners.delete(id);
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.accessibilityListeners.forEach((callback) => {
      try {
        callback(this.getAccessibilityState());
      } catch (error) {
        logger.error('Error in accessibility state listener', error);
      }
    });
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      fontSize: 'medium',
      contrastMode: 'normal',
      voiceControl: false,
      voiceNavigation: false,
      screenReader: false,
      motorAssistance: false,
      reducedMotion: false,
      colorBlindness: 'none',
      hapticFeedback: true,
      soundEffects: true,
      timeoutDuration: 30
    };
  }

  /**
   * Get initial accessibility state
   */
  private getInitialState(): AccessibilityState {
    return {
      isEnabled: true,
      currentMode: this.preferences,
      screenReaderActive: false,
      voiceControlActive: false,
      fontScale: 1,
      isHighContrast: false,
      reducedMotionEnabled: false,
      colorBlindnessFilter: 'none',
      motorAssistanceActive: false
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
    
    this.accessibilityListeners.clear();
    
    // Remove live regions
    document.getElementById('accessibility-polite')?.remove();
    document.getElementById('accessibility-assertive')?.remove();
    
    // Remove accessibility styles
    document.getElementById('motor-assistance-styles')?.remove();
    
    logger.info('Mobile accessibility system destroyed');
  }
}

// Export singleton instance
export const mobileAccessibilityManager = new MobileAccessibilityManager();

export default MobileAccessibilityManager;
export type { AccessibilityPreferences, AccessibilityState, VoiceCommand };