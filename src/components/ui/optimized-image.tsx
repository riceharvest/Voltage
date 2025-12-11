'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  priority?: boolean;
  progressive?: boolean;
  quality?: number;
  sizes?: string;
  aspectRatio?: string;
  blurDataURL?: string;
  onLoadComplete?: () => void;
  onErrorComplete?: () => void;
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Load 50px before entering viewport
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

// Progressive loading state hook
function useProgressiveLoading(src: string, progressive?: boolean) {
  const [lowQualitySrc, setLowQualitySrc] = useState<string | null>(null);
  const [highQualitySrc, setHighQualitySrc] = useState<string>(src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (progressive && !src.includes('blur')) {
      // Generate low-quality placeholder
      const params = new URLSearchParams({
        w: '20',
        q: '20',
        blur: '10',
      });
      const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : '');
      const baseUrl = src.startsWith('http') ? src : `${url.origin}${src}`;
      setLowQualitySrc(`${baseUrl}?${params.toString()}`);
    }
    setHighQualitySrc(src);
    setIsHighQualityLoaded(false);
  }, [src, progressive]);

  return {
    lowQualitySrc,
    highQualitySrc,
    isHighQualityLoaded,
    setIsHighQualityLoaded,
  };
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showSkeleton = true,
  priority = false,
  progressive = true,
  quality = 85,
  sizes,
  aspectRatio,
  blurDataURL,
  onLoadComplete,
  onErrorComplete,
  className,
  ...imageProps
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStartTime, setLoadingStartTime] = useState<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(imageRef);
  const [shouldLoad, setShouldLoad] = useState(priority);
  
  const {
    lowQualitySrc,
    highQualitySrc,
    isHighQualityLoaded,
    setIsHighQualityLoaded,
  } = useProgressiveLoading(src, progressive);

  // Handle intersection observer
  useEffect(() => {
    if (!priority && isIntersecting) {
      setShouldLoad(true);
    }
  }, [isIntersecting, priority]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setLoadingStartTime(Date.now());
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleHighQualityLoad = useCallback(() => {
    setIsHighQualityLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc && retryCount < 1) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
      setRetryCount(prev => prev + 1);
    } else {
      onErrorComplete?.();
    }
  }, [fallbackSrc, currentSrc, retryCount, onErrorComplete]);

  // Progressive image display
  const shouldShowLowQuality = progressive && !isHighQualityLoaded && lowQualitySrc && shouldLoad;
  const shouldShowHighQuality = isHighQualityLoaded && shouldLoad;

  // Generate responsive sizes if not provided
  const defaultSizes = sizes || '(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw';

  // Accessibility improvements
  const enhancedAlt = alt || (typeof src === 'string' ? src.split('/').pop()?.split('.')[0] || 'Image' : 'Image');

  return (
    <div 
      ref={imageRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatio && `aspect-[${aspectRatio}]`,
        className
      )}
    >
      {/* Loading skeleton */}
      {showSkeleton && isLoading && shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted animate-pulse rounded-md" />
      )}

      {/* Low quality placeholder */}
      {shouldShowLowQuality && (
        <Image
          src={lowQualitySrc!}
          alt={enhancedAlt}
          fill
          className="object-cover filter blur-sm scale-110 transition-opacity duration-500"
          loading="eager"
          sizes="20vw"
          priority={priority}
        />
      )}

      {/* High quality image */}
      {shouldShowHighQuality && !hasError && (
        <>
          <Image
            {...imageProps}
            src={highQualitySrc}
            alt={enhancedAlt}
            quality={quality}
            sizes={defaultSizes}
            onLoad={handleHighQualityLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            className={cn(
              'object-cover transition-opacity duration-500',
              isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
            )}
            {...(aspectRatio?.includes(':') && {
              fill: true
            })}
            {...(aspectRatio?.includes('/') && !imageProps.fill && {
              width: undefined,
              height: undefined
            })}
          />
        </>
      )}

      {/* Error fallback */}
      {hasError && (!fallbackSrc || currentSrc === fallbackSrc) && (
        <div className="flex items-center justify-center h-full bg-muted rounded-md border border-dashed border-muted-foreground/20">
          <div className="text-center p-4">
            <div className="text-muted-foreground text-sm mb-1">Image unavailable</div>
            <div className="text-muted-foreground/70 text-xs">Fallback content</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility functions for responsive image optimization

interface ResponsiveImageConfig {
  breakpoints: number[];
  sizes: Record<number, string>;
  quality: Record<number, number>;
  formats: ('webp' | 'avif' | 'jpeg')[];
}

const DEFAULT_IMAGE_CONFIG: ResponsiveImageConfig = {
  breakpoints: [480, 768, 1024, 1280, 1920],
  sizes: {
    480: '100vw',
    768: '100vw',
    1024: '50vw',
    1280: '33vw',
    1920: '25vw',
  },
  quality: {
    480: 75,
    768: 80,
    1024: 85,
    1280: 85,
    1920: 90,
  },
  formats: ['avif', 'webp', 'jpeg'],
};

/**
 * Generate responsive image props for Next.js Image component
 */
export function getResponsiveImageProps(
  src: string,
  alt: string,
  config: Partial<ResponsiveImageConfig> = {},
  priority = false
) {
  const mergedConfig = { ...DEFAULT_IMAGE_CONFIG, ...config };
  
  const sizes = Object.entries(mergedConfig.sizes)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}`)
    .join(', ');

  return {
    src,
    alt,
    sizes,
    quality: mergedConfig.quality[1920] || 85,
    placeholder: 'blur' as const,
    blurDataURL: generateBlurPlaceholder(src),
    loading: priority ? 'eager' as const : 'lazy' as const,
    priority,
    // Enable modern formats with fallbacks
    ...(mergedConfig.formats.includes('avif') && {
      formats: ['avif', 'webp', 'jpeg'] as any,
    }),
  };
}

/**
 * Generate optimized srcSet for different screen densities
 */
export function generateSrcSet(
  src: string,
  widths: number[],
  format: 'webp' | 'avif' | 'jpeg' = 'webp'
): string {
  return widths
    .map(width => {
      const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : '');
      const baseUrl = src.startsWith('http') ? src : `${url.origin}${src}`;
      return `${baseUrl}?w=${width}&q=85&fmt=${format} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate blur placeholder for progressive loading
 */
function generateBlurPlaceholder(src: string): string {
  // Generate a small, blurred placeholder
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>
      <rect width="20" height="20" fill="#f3f4f6" filter="url(#blur)" />
    </svg>`
  )}`;
}

/**
 * Get optimal image dimensions for different use cases
 */
export function getOptimalImageDimensions(
  useCase: 'avatar' | 'thumbnail' | 'hero' | 'gallery' | 'background'
) {
  const dimensions = {
    avatar: { width: 80, height: 80, quality: 80 },
    thumbnail: { width: 200, height: 200, quality: 75 },
    hero: { width: 1200, height: 600, quality: 90 },
    gallery: { width: 400, height: 300, quality: 85 },
    background: { width: 1920, height: 1080, quality: 70 },
  };

  return dimensions[useCase];
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' | 'background' = 'image'): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  
  if (as === 'image') {
    link.type = 'image/webp';
  }

  document.head.appendChild(link);
}

/**
 * Optimized image component for different use cases
 */
export function createOptimizedImage(useCase: keyof typeof getOptimalImageDimensions) {
  const { width, height, quality } = getOptimalImageDimensions(useCase);
  
  return function OptimizedUseCaseImage({
    src,
    alt,
    priority = false,
    ...props
  }: Omit<OptimizedImageProps, 'width' | 'height' | 'quality'>) {
    return (
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        {...props}
      />
    );
  };
}

// Pre-built optimized image components for common use cases
export const OptimizedAvatar = createOptimizedImage('avatar');
export const OptimizedThumbnail = createOptimizedImage('thumbnail');
export const OptimizedHero = createOptimizedImage('hero');
export const OptimizedGallery = createOptimizedImage('gallery');
export const OptimizedBackground = createOptimizedImage('background');