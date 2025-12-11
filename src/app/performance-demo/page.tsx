'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage, getResponsiveImageProps, OptimizedHero, OptimizedGallery } from '@/components/ui/optimized-image';
import { AssetOptimizer, useAssetPerformance } from '@/components/performance/asset-optimizer';
import { FontOptimizer, useFontPerformance } from '@/components/performance/font-optimizer';
import { ImagePreloader } from '@/components/performance/asset-optimizer';
import { EXTERNAL_RESOURCE_HINTS, CriticalAssetPreloader } from '@/components/performance/asset-optimizer';
import { DEFAULT_FONTS } from '@/components/performance/font-optimizer';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Commented out until tabs component is available

// Demo images for testing
const DEMO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    alt: 'Mountain landscape for hero demo',
    priority: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
    alt: 'Coffee cup for gallery demo',
  },
  {
    src: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&h=300&fit=crop',
    alt: 'Energy drink can for thumbnail demo',
  },
];

// Performance metrics component
function PerformanceMetrics() {
  const assetMetrics = useAssetPerformance();
  const fontMetrics = useFontPerformance();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => Math.min(100, prev + Math.random() * 10));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 Performance Metrics
          <Badge variant="secondary">Live</Badge>
        </CardTitle>
        <CardDescription>
          Real-time performance monitoring of asset loading and optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Asset Loading</h4>
            <div className="text-2xl font-bold text-green-600">{assetMetrics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Total requests</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Success Rate</h4>
            <div className="text-2xl font-bold text-blue-600">
              {assetMetrics.totalRequests > 0 
                ? Math.round((assetMetrics.successfulRequests / assetMetrics.totalRequests) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Assets loaded successfully</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Font Loading</h4>
            <div className="text-2xl font-bold text-purple-600">{fontMetrics.loadedFonts}</div>
            <p className="text-xs text-muted-foreground">Fonts loaded</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Load Time</h4>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(assetMetrics.averageLoadTime)}ms
            </div>
            <p className="text-xs text-muted-foreground">Average load time</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Optimization Progress</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Image optimization demo
function ImageOptimizationDemo() {
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});

  const handleImageLoad = (imageId: string) => {
    setImageStates(prev => ({ ...prev, [imageId]: 'loaded' }));
  };

  const handleImageError = (imageId: string) => {
    setImageStates(prev => ({ ...prev, [imageId]: 'error' }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">🖼️ Image Optimization Demo</h2>
        <p className="text-muted-foreground mb-6">
          Demonstrating progressive loading, responsive sizing, error handling, and modern format support (WebP/AVIF).
        </p>
      </div>

      {/* Hero Image with Priority Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Image (Priority Loading)</CardTitle>
          <CardDescription>
            This image loads with high priority and includes progressive loading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden">
            <OptimizedImage
              {...getResponsiveImageProps(DEMO_IMAGES[0].src, DEMO_IMAGES[0].alt, {}, true)}
              priority={true}
              progressive={true}
              quality={90}
              onLoadComplete={() => handleImageLoad('hero')}
              onErrorComplete={() => handleImageError('hero')}
              className="w-full h-full"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant={imageStates.hero === 'loaded' ? 'default' : 'secondary'}>
              {imageStates.hero || 'loading'} 
            </Badge>
            <span className="text-sm text-muted-foreground">
              Priority: High | Progressive: Enabled | Quality: 90
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Images with Lazy Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images (Lazy Loading)</CardTitle>
          <CardDescription>
            These images load as they enter the viewport with intersection observer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_IMAGES.slice(1).map((image, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <OptimizedImage
                    {...getResponsiveImageProps(image.src, image.alt)}
                    priority={false}
                    progressive={true}
                    quality={85}
                    showSkeleton={true}
                    onLoadComplete={() => handleImageLoad(`gallery-${index}`)}
                    onErrorComplete={() => handleImageError(`gallery-${index}`)}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={imageStates[`gallery-${index}`] === 'loaded' ? 'default' : 'secondary'}>
                    {imageStates[`gallery-${index}`] || 'loading'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Lazy: Enabled | Progressive: Enabled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Handling Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Error Handling & Fallbacks</CardTitle>
          <CardDescription>
            Demonstrating error handling with fallback images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Valid Image</h4>
              <div className="aspect-square rounded-lg overflow-hidden">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop"
                  alt="Valid image demo"
                  fallbackSrc="/file.svg"
                  showSkeleton={true}
                  quality={80}
                  className="w-full h-full"
                />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Invalid Image (with Fallback)</h4>
              <div className="aspect-square rounded-lg overflow-hidden">
                <OptimizedImage
                  src="https://invalid-url-that-will-fail.com/image.jpg"
                  alt="Invalid image demo"
                  fallbackSrc="/file.svg"
                  showSkeleton={true}
                  quality={80}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Asset optimization demo
function AssetOptimizationDemo() {
  const [criticalAssets] = useState([
    '/_next/static/css/app/layout.css',
    '/fonts/inter-400.woff2',
    '/file.svg',
  ]);

  const [prefetchImages] = useState([
    '/globe.svg',
    '/next.svg',
    '/vercel.svg',
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">⚡ Static Asset Optimization</h2>
        <p className="text-muted-foreground mb-6">
          Resource hints, preloading, prefetching, and performance monitoring for static assets.
        </p>
      </div>

      {/* Resource Hints */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Hints & Preloading</CardTitle>
          <CardDescription>
            DNS prefetch, preconnect, and preload optimizations for external resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Active Resource Hints:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXTERNAL_RESOURCE_HINTS.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Badge variant="outline">{hint.rel}</Badge>
                    <span className="text-sm font-mono">{hint.href}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Critical Assets Preloaded:</h4>
              <div className="space-y-1">
                {criticalAssets.map((asset, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">preload</Badge>
                    <span className="font-mono">{asset}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Prefetching */}
      <Card>
        <CardHeader>
          <CardTitle>Image Prefetching</CardTitle>
          <CardDescription>
            Non-critical images prefetched for faster subsequent loads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Prefetched Images:</h4>
              <div className="grid grid-cols-3 gap-4">
                {prefetchImages.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <ImagePreloader src={image} priority={false} />
                    <img 
                      src={image} 
                      alt={`Prefetched ${image}`} 
                      className="w-full h-16 object-contain bg-muted rounded"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{image}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Font optimization demo
function FontOptimizationDemo() {
  const [fontStates, setFontStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Simulate font loading states
    const timers = [
      setTimeout(() => setFontStates(prev => ({ ...prev, 'Inter-400': true })), 1000),
      setTimeout(() => setFontStates(prev => ({ ...prev, 'Inter-500': true })), 1500),
      setTimeout(() => setFontStates(prev => ({ ...prev, 'Inter-600': true })), 2000),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">🔤 Font Optimization Demo</h2>
        <p className="text-muted-foreground mb-6">
          Font loading optimization with display: swap, preloading, and performance monitoring.
        </p>
      </div>

      {/* Font Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Font Loading States</CardTitle>
          <CardDescription>
            Real-time font loading status with display: swap optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEFAULT_FONTS[0].weights.map(weight => (
              <div key={weight} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-semibold">Inter {weight}</span>
                  <span className="text-muted-foreground ml-2">({weight} weight)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={fontStates[`Inter-${weight}`] ? 'default' : 'secondary'}>
                    {fontStates[`Inter-${weight}`] ? 'loaded' : 'loading'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">display: swap</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Performance Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Font Performance Examples</CardTitle>
          <CardDescription>
            Different font weights and styles demonstrating optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Inter Font Family (Primary)</h4>
              <div className="space-y-2">
                <div className="text-2xl font-light">The quick brown fox jumps over the lazy dog</div>
                <div className="text-2xl font-normal">The quick brown fox jumps over the lazy dog</div>
                <div className="text-2xl font-medium">The quick brown fox jumps over the lazy dog</div>
                <div className="text-2xl font-semibold">The quick brown fox jumps over the lazy dog</div>
                <div className="text-2xl font-bold">The quick brown fox jumps over the lazy dog</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">JetBrains Mono (Monospace)</h4>
              <div className="font-mono text-lg space-y-1">
                <div>function optimizeAssets() {`{`}</div>
                <div className="ml-4">return performance.metrics;</div>
                <div>{`}`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main demo page
export default function PerformanceDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Performance Optimization Demo</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive demonstration of image and static asset delivery optimizations
        </p>
      </div>

      <PerformanceMetrics />

      {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="images">Image Optimization</TabsTrigger>
          <TabsTrigger value="assets">Asset Optimization</TabsTrigger>
          <TabsTrigger value="fonts">Font Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6"> */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Optimization Features</CardTitle>
              <CardDescription>
                Overview of all implemented performance optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">🖼️ Image Optimizations</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Progressive loading with blur placeholders
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      WebP/AVIF format support with fallbacks
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Responsive image sizing with multiple breakpoints
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Intersection Observer for lazy loading
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Error handling with fallback images
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Accessibility improvements (alt text, ARIA)
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">⚡ Asset Optimizations</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Resource hints (dns-prefetch, preconnect)
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Critical asset preloading
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Image and font prefetching
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Performance monitoring and metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      CDN-ready asset structure
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Asset compression and optimization
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">🔤 Font Optimizations</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Font-display: swap for FOIT prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Critical font preloading
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      WOFF2 format optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Font performance monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Fallback font strategies
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">⚙️ Next.js Configuration</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Enhanced image optimization settings
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Asset compression and minification
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Proper caching headers for static assets
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      Performance budgets and webpack optimizations
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="default">✓</Badge>
                      SWC compiler optimizations
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Demo Sections */}
        <div className="space-y-12">
          <ImageOptimizationDemo />
          <AssetOptimizationDemo />
          <FontOptimizationDemo />
        </div>
        
      {/* </Tabs> */}
    </div>
  );
}