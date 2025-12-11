'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  colorBlindFriendly: boolean;
  focusIndicators: boolean;
  voiceNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceToScreenReader: (message: string) => void;
  focusElement: (selector: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardNavigation: false,
  screenReaderOptimized: false,
  colorBlindFriendly: false,
  focusIndicators: true,
  voiceNavigation: false,
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error parsing accessibility settings:', error);
      }
    }

    // Detect system preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (contrastQuery.matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }
    
    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    const handlePreferenceChange = (e: MediaQueryListEvent) => {
      if (e.media === '(prefers-reduced-motion: reduce)') {
        updateSetting('reducedMotion', e.matches);
      } else if (e.media === '(prefers-contrast: high)') {
        updateSetting('highContrast', e.matches);
      }
    };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    reducedMotionQuery.addEventListener('change', handlePreferenceChange);
    contrastQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handlePreferenceChange);
      contrastQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const announceToScreenReader = (message: string) => {
    // Create or update announcement element
    let announcer = document.getElementById('accessibility-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'accessibility-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = '';
      }
    }, 1000);
  };

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Keyboard navigation enhancement
  useEffect(() => {
    if (settings.keyboardNavigation) {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Enhanced keyboard navigation
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
        
        switch (event.key) {
          case 'Tab':
            // Enhanced tab navigation with announcements
            setTimeout(() => {
              const activeElement = document.activeElement;
              if (activeElement && activeElement !== document.body) {
                const label = activeElement.getAttribute('aria-label') || 
                             (activeElement as HTMLElement).textContent ||
                             activeElement.getAttribute('title') ||
                             'Interactive element';
                announceToScreenReader(`Focused on ${label}`);
              }
            }, 100);
            break;
            
          case 'Escape':
            // Close modals, dropdowns, etc.
            const openModal = document.querySelector('[role="dialog"][aria-modal="true"]');
            if (openModal) {
              (openModal as HTMLElement).click();
            }
            break;
            
          case 'ArrowDown':
          case 'ArrowUp':
            // Arrow key navigation for menus
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              const direction = event.key === 'ArrowDown' ? 1 : -1;
              const nextIndex = Math.max(0, Math.min(focusableElements.length - 1, currentIndex + direction));
              (focusableElements[nextIndex] as HTMLElement).focus();
            }
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [settings.keyboardNavigation]);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    announceToScreenReader,
    focusElement,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen Reader Announcements */}
      <div id="accessibility-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />
      
      {/* Skip Links */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#navigation" className="skip-link">Skip to navigation</a>
        <a href="#search" className="skip-link">Skip to search</a>
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for category-specific accessibility features
export function useCategoryAccessibility(category?: string) {
  const { announceToScreenReader, settings } = useAccessibility();
  
  const getCategoryAriaLabel = () => {
    switch (category) {
      case 'classic':
        return 'Classic soda recipes with traditional flavors and nostalgic appeal';
      case 'energy':
        return 'Energy drink recipes with high caffeine content for performance';
      case 'hybrid':
        return 'Hybrid recipes combining classic and energy drink elements';
      default:
        return 'Beverage recipes';
    }
  };

  const getColorDescription = (color: string) => {
    if (settings.colorBlindFriendly) {
      // Provide alternative color descriptions
      const colorMap: Record<string, string> = {
        'red': 'warm color similar to apple or cherry',
        'blue': 'cool color like sky or ocean',
        'green': 'natural color like grass or leaf',
        'orange': 'warm color like sunset or carrot',
        'purple': 'rich color like grape or eggplant',
        'yellow': 'bright color like sun or banana',
        'brown': 'earthy color like chocolate or coffee',
        'clear': 'transparent color like water'
      };
      return colorMap[color.toLowerCase()] || color;
    }
    return color;
  };

  const announceCategoryChange = (newCategory: string) => {
    const categoryNames = {
      classic: 'Classic Sodas',
      energy: 'Energy Drinks', 
      hybrid: 'Hybrid Recipes'
    };
    announceToScreenReader(`Switched to ${categoryNames[newCategory as keyof typeof categoryNames]} category`);
  };

  return {
    ariaLabel: getCategoryAriaLabel(),
    colorDescription: getColorDescription,
    announceCategoryChange,
    settings
  };
}