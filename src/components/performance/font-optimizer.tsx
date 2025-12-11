'use client';

import { useEffect, useState, useCallback } from 'react';

// Font loading configuration
interface FontConfig {
  family: string;
  weights: number[];
  style?: 'normal' | 'italic';
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
  fallbacks?: string[];
}

// Props for FontOptimizer component
interface FontOptimizerProps {
  fonts: FontConfig[];
  enablePreloading?: boolean;
  enableFontDisplaySwap?: boolean;
  className?: string;
}

// Font loading state
interface FontLoadingState {
  [fontFamily: string]: {
    [weight: number]: 'pending' | 'loading' | 'loaded' | 'error';
  };
}

// Custom hook for font loading
function useFontLoading(fonts: FontConfig[], enablePreloading: boolean = true) {
  const [fontState, setFontState] = useState<FontLoadingState>({});
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const loadFont = useCallback(async (fontConfig: FontConfig, weight: number) => {
    const fontKey = `${fontConfig.family}-${weight}`;
    
    try {
      setFontState(prev => ({
        ...prev,
        [fontConfig.family]: {
          ...prev[fontConfig.family],
          [weight]: 'loading'
        }
      }));

      // Create font face
      const fontFace = new FontFace(
        fontConfig.family,
        `url('/fonts/${fontConfig.family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2')`,
        {
          style: fontConfig.style || 'normal',
          weight: weight.toString(),
          display: fontConfig.display || 'swap',
        }
      );

      // Load the font
      await fontFace.load();
      
      // Add to document fonts
      (document as any).fonts.add(fontFace);

      setFontState(prev => ({
        ...prev,
        [fontConfig.family]: {
          ...prev[fontConfig.family],
          [weight]: 'loaded'
        }
      }));

      setLoadedFonts(prev => new Set([...prev, fontKey]));
      
    } catch (error) {
      console.warn(`Failed to load font ${fontConfig.family} ${weight}:`, error);
      setFontState(prev => ({
        ...prev,
        [fontConfig.family]: {
          ...prev[fontConfig.family],
          [weight]: 'error'
        }
      }));
    }
  }, []);

  // Preload fonts
  useEffect(() => {
    if (!enablePreloading || typeof window === 'undefined') return;

    fonts.forEach(fontConfig => {
      fontConfig.weights.forEach(weight => {
        const fontKey = `${fontConfig.family}-${weight}`;
        
        if (!loadedFonts.has(fontKey)) {
          if (fontConfig.preload) {
            loadFont(fontConfig, weight);
          } else {
            // Use link rel=preload for non-critical fonts
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = `/fonts/${fontConfig.family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2`;
            document.head.appendChild(link);
          }
        }
      });
    });
  }, [fonts, enablePreloading, loadedFonts, loadFont]);

  return { fontState, loadedFonts };
}

// Font optimizer component
export function FontOptimizer({
  fonts = [],
  enablePreloading = true,
  enableFontDisplaySwap = true,
  className,
}: FontOptimizerProps) {
  const { fontState } = useFontLoading(fonts, enablePreloading);

  // Inject font-display: swap CSS if enabled
  useEffect(() => {
    if (!enableFontDisplaySwap || typeof window === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'font-display-swap';
    style.textContent = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('font-display-swap');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [enableFontDisplaySwap]);

  return (
    <div className={className}>
      {/* Font loading state can be used for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs font-mono">
          {Object.entries(fontState).map(([family, weights]) => (
            <div key={family}>
              <strong>{family}:</strong>
              {Object.entries(weights).map(([weight, status]) => (
                <span key={weight} className={`ml-2 ${
                  status === 'loaded' ? 'text-green-400' : 
                  status === 'loading' ? 'text-yellow-400' : 
                  status === 'error' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {weight}:{status[0]}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility component for critical font preloading
export function CriticalFontLoader({ fonts }: { fonts: FontConfig[] }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    fonts.forEach(fontConfig => {
      fontConfig.weights.forEach(weight => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = `/fonts/${fontConfig.family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2`;
        link.setAttribute('importance', 'high');
        document.head.appendChild(link);
      });
    });
  }, [fonts]);

  return null;
}

// Hook for checking font availability
export function useFontAvailability(family: string, weight: number = 400) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFont = async () => {
      setIsLoading(true);
      
      try {
        // Check if font is already loaded
        if ((document as any).fonts.check(`1em ${family}`)) {
          setIsAvailable(true);
          setIsLoading(false);
          return;
        }

        // Load font if not available
        const fontFace = new FontFace(family, `url('/fonts/${family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2')`);
        await fontFace.load();
        (document as any).fonts.add(fontFace);
        
        setIsAvailable(true);
      } catch (error) {
        console.warn(`Font ${family} ${weight} not available:`, error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFont();
  }, [family, weight]);

  return { isAvailable, isLoading };
}

// Hook for measuring font loading performance
export function useFontPerformance() {
  const [metrics, setMetrics] = useState({
    totalFonts: 0,
    loadedFonts: 0,
    failedFonts: 0,
    averageLoadTime: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor font loading using PerformanceObserver
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fontEntries = entries.filter(entry => 
        entry.name.includes('.woff2') || entry.name.includes('.woff') || 
        entry.name.includes('.ttf') || entry.name.includes('.eot')
      );

      if (fontEntries.length > 0) {
        const loadTimes = fontEntries.map(entry => entry.duration);
        const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        
        setMetrics(prev => ({
          totalFonts: prev.totalFonts + fontEntries.length,
          loadedFonts: prev.loadedFonts + fontEntries.filter(entry => entry.duration > 0).length,
          failedFonts: prev.failedFonts + fontEntries.filter(entry => entry.duration === 0).length,
          averageLoadTime: averageLoadTime || prev.averageLoadTime,
        }));
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// Predefined font configurations for common use cases
export const DEFAULT_FONTS: FontConfig[] = [
  {
    family: 'Inter',
    weights: [300, 400, 500, 600, 700],
    display: 'swap',
    preload: true,
    fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  },
  {
    family: 'JetBrains Mono',
    weights: [400, 500, 600],
    display: 'swap',
    preload: false,
    fallbacks: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
  },
];

// Utility function to generate font CSS
export function generateFontCSS(fonts: FontConfig[]): string {
  return fonts.map(font => {
    return font.weights.map(weight => `
      @font-face {
        font-family: '${font.family}';
        font-style: ${font.style || 'normal'};
        font-weight: ${weight};
        font-display: ${font.display || 'swap'};
        src: url('/fonts/${font.family.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2') format('woff2');
        ${font.fallbacks ? `font-family: '${font.family}', ${font.fallbacks.join(', ')};` : ''}
      }
    `).join('\n');
  }).join('\n');
}

// Export utility functions and hooks
export { useFontLoading };