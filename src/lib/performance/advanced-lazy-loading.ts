/**
 * Enhanced Lazy Loading Implementation for 100+ Recipe Library
 * Provides advanced lazy loading with intersection observer, progressive loading,
 * smart preloading, and cache warming strategies
 */

import { lazy, Suspense } from 'react';
import { cache } from '../cache';
import { logger } from '../logger';

interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  fallbackLoading: boolean;
  preloadDistance: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RecipeCategory {
  id: string;
  name: string;
  recipeCount: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  preloaded: boolean;
}

interface NavigationPattern {
  path: string;
  frequency: number;
  lastAccessed: number;
  associatedRecipes: string[];
}

class AdvancedLazyLoader {
  private intersectionObserver: IntersectionObserver | null = null;
  private loadedCategories = new Set<string>();
  private navigationPatterns = new Map<string, NavigationPattern>();
  private categoryConfigs = new Map<string, LazyLoadConfig>();
  private preloadedRecipes = new Set<string>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    preloads: 0,
    categoryLoads: 0
  };

  // Recipe categories with priority and expected usage patterns
  private readonly recipeCategories: RecipeCategory[] = [
    { id: 'classic', name: 'Classic Sodas', recipeCount: 25, priority: 'CRITICAL', preloaded: false },
    { id: 'energy', name: 'Energy Drinks', recipeCount: 30, priority: 'CRITICAL', preloaded: false },
    { id: 'hybrid', name: 'Hybrid Recipes', recipeCount: 20, priority: 'HIGH', preloaded: false },
    { id: 'citrus', name: 'Citrus Flavors', recipeCount: 15, priority: 'HIGH', preloaded: false },
    { id: 'fruit', name: 'Fruit Blends', recipeCount: 12, priority: 'MEDIUM', preloaded: false },
    { id: 'cream', name: 'Cream Sodas', recipeCount: 8, priority: 'MEDIUM', preloaded: false },
    { id: 'ginger', name: 'Ginger Ales', recipeCount: 6, priority: 'LOW', preloaded: false },
    { id: 'root-beer', name: 'Root Beers', recipeCount: 5, priority: 'LOW', preloaded: false }
  ];

  constructor() {
    this.initializeIntersectionObserver();
    this.initializeCategoryConfigs();
    this.startNavigationPatternTracking();
    this.initializeCacheWarming();
  }

  private initializeIntersectionObserver(): void {
    if (typeof window === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleElementVisible(entry.target as HTMLElement);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.1 // Trigger when 10% of element is visible
      }
    );
  }

  private initializeCategoryConfigs(): void {
    // Configure lazy loading behavior based on category priority
    const configs = {
      'CRITICAL': { threshold: 0.1, rootMargin: '100px', fallbackLoading: true, preloadDistance: 200, priority: 'HIGH' },
      'HIGH': { threshold: 0.2, rootMargin: '50px', fallbackLoading: true, preloadDistance: 150, priority: 'MEDIUM' },
      'MEDIUM': { threshold: 0.3, rootMargin: '25px', fallbackLoading: false, preloadDistance: 100, priority: 'MEDIUM' },
      'LOW': { threshold: 0.5, rootMargin: '0px', fallbackLoading: false, preloadDistance: 50, priority: 'LOW' }
    };

    this.recipeCategories.forEach(category => {
      this.categoryConfigs.set(category.id, configs[category.priority]);
    });
  }

  // Route-based code splitting for all recipe categories
  getLazyRecipeCategory(categoryId: string) {
    const category = this.recipeCategories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error(`Unknown recipe category: ${categoryId}`);
    }

    const config = this.categoryConfigs.get(categoryId);
    
    // Dynamic import based on category with priority-based loading
    const lazyComponent = lazy(async () => {
      const startTime = performance.now();
      
      try {
        // Check cache first
        const cachedComponent = await this.getCachedComponent(categoryId);
        if (cachedComponent) {
          this.cacheStats.hits++;
          return cachedComponent;
        }

        this.cacheStats.misses++;
        
        // Load component based on priority
        let module;
        switch (category.priority) {
          case 'CRITICAL':
            module = await import(`../components/recipes/critical/${categoryId}-category`);
            break;
          case 'HIGH':
            module = await import(`../components/recipes/high/${categoryId}-category`);
            break;
          case 'MEDIUM':
            module = await import(`../components/recipes/medium/${categoryId}-category`);
            break;
          case 'LOW':
            module = await import(`../components/recipes/low/${categoryId}-category`);
            break;
          default:
            module = await import(`../components/recipes/default/${categoryId}-category`);
        }

        const loadTime = performance.now() - startTime;
        logger.info(`Loaded recipe category: ${categoryId} in ${loadTime.toFixed(2)}ms`);

        // Cache the component
        await this.cacheComponent(categoryId, module);
        
        return module;
      } catch (error) {
        logger.error(`Failed to load recipe category: ${categoryId}`, error);
        // Return fallback component
        return { default: () => null };
      }
    });

    this.loadedCategories.add(categoryId);
    this.cacheStats.categoryLoads++;

    return lazyComponent;
  }

  // Component-level lazy loading with intersection observer
  createLazyComponent<T extends React.ComponentType<any>>(
    Component: T,
    categoryId: string,
    props?: React.ComponentProps<T>
  ) {
    const LazyComponent = lazy(async () => {
      try {
        // Smart preloading based on navigation patterns
        if (this.shouldPreload(categoryId)) {
          await this.preloadComponentData(categoryId);
          this.cacheStats.preloads++;
        }

        // Check if component is already loaded and cached
        const cachedData = await this.getCachedComponentData(categoryId);
        if (cachedData) {
          return { default: (props: any) => <Component {...props} {...cachedData} /> };
        }

        // Load component with enhanced error handling
        const module = await import(`../components/recipes/${categoryId}`);
        return module;
      } catch (error) {
        logger.error(`Failed to load component for category: ${categoryId}`, error);
        return { default: () => null };
      }
    });

    // Wrap with intersection observer for visibility-based loading
    return (wrapperProps: any) => {
      const elementRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (elementRef.current && this.intersectionObserver) {
          this.intersectionObserver.observe(elementRef.current);
        }

        return () => {
          if (elementRef.current && this.intersectionObserver) {
            this.intersectionObserver.unobserve(elementRef.current);
          }
        };
      }, []);

      return (
        <div ref={elementRef} data-category={categoryId}>
          <Suspense fallback={this.getCategoryFallback(categoryId)}>
            <LazyComponent {...props} {...wrapperProps} />
          </Suspense>
        </div>
      );
    };
  }

  // Progressive loading of recipe details and images
  async preloadRecipeData(recipeId: string): Promise<void> {
    try {
      // Check if already preloaded
      if (this.preloadedRecipes.has(recipeId)) return;

      // Load recipe details in parallel
      const [details, images, ingredients] = await Promise.all([
        this.loadRecipeDetails(recipeId),
        this.loadRecipeImages(recipeId),
        this.loadRecipeIngredients(recipeId)
      ]);

      // Cache all data
      await Promise.all([
        cache.set(`recipe:details:${recipeId}`, details, 3600),
        cache.set(`recipe:images:${recipeId}`, images, 86400),
        cache.set(`recipe:ingredients:${recipeId}`, ingredients, 7200)
      ]);

      this.preloadedRecipes.add(recipeId);
      logger.debug(`Preloaded recipe data: ${recipeId}`);
    } catch (error) {
      logger.error(`Failed to preload recipe data: ${recipeId}`, error);
    }
  }

  // Smart preloading based on user navigation patterns
  private shouldPreload(categoryId: string): boolean {
    const pattern = this.navigationPatterns.get(categoryId);
    if (!pattern) return false;

    // Preload if frequently accessed (more than 10 times in last hour)
    const oneHourAgo = Date.now() - 3600000;
    return pattern.frequency > 10 && pattern.lastAccessed > oneHourAgo;
  }

  private async preloadComponentData(categoryId: string): Promise<void> {
    const category = this.recipeCategories.find(c => c.id === categoryId);
    if (!category) return;

    // Preload component data based on priority
    switch (category.priority) {
      case 'CRITICAL':
        // Preload first 20 recipes
        await this.preloadRecipeBatch(categoryId, 20);
        break;
      case 'HIGH':
        // Preload first 10 recipes
        await this.preloadRecipeBatch(categoryId, 10);
        break;
      case 'MEDIUM':
        // Preload first 5 recipes
        await this.preloadRecipeBatch(categoryId, 5);
        break;
      default:
        // No preloading for low priority
        break;
    }
  }

  private async preloadRecipeBatch(categoryId: string, count: number): Promise<void> {
    // Simulate loading first N recipes in category
    // In production, this would query the database for popular recipes
    const recipes = Array.from({ length: count }, (_, i) => `${categoryId}-recipe-${i + 1}`);
    
    const preloadPromises = recipes.map(recipeId => this.preloadRecipeData(recipeId));
    await Promise.allSettled(preloadPromises);
  }

  // Cache warming strategies for frequently accessed recipes
  private initializeCacheWarming(): void {
    // Warm cache during off-peak hours
    const warmupSchedule = () => {
      const now = new Date();
      const hour = now.getUTCHours();
      
      // Warm up during off-peak hours (2-6 AM UTC)
      if (hour >= 2 && hour <= 6) {
        this.warmCriticalRecipes();
      }
    };

    // Run immediately and then every 6 hours
    setTimeout(warmupSchedule, 10000); // First run after 10 seconds
    setInterval(warmupSchedule, 21600000); // Every 6 hours
  }

  private async warmCriticalRecipes(): Promise<void> {
    const criticalCategories = this.recipeCategories
      .filter(c => c.priority === 'CRITICAL' || c.priority === 'HIGH')
      .slice(0, 3); // Top 3 categories

    for (const category of criticalCategories) {
      await this.preloadRecipeBatch(category.id, 15);
      logger.info(`Warmed cache for category: ${category.name}`);
    }
  }

  // Navigation pattern tracking
  private startNavigationPatternTracking(): void {
    if (typeof window === 'undefined') return;

    // Track navigation events
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const categoryElement = target.closest('[data-category]');
      
      if (categoryElement) {
        const categoryId = categoryElement.getAttribute('data-category');
        if (categoryId) {
          this.recordNavigation(categoryId);
        }
      }
    });

    // Track route changes (simplified)
    const trackRouteChange = () => {
      const path = window.location.pathname;
      this.recordNavigation(path);
    };

    window.addEventListener('popstate', trackRouteChange);
    
    // Initial track
    trackRouteChange();
  }

  private recordNavigation(path: string): void {
    const existing = this.navigationPatterns.get(path);
    
    if (existing) {
      existing.frequency++;
      existing.lastAccessed = Date.now();
    } else {
      this.navigationPatterns.set(path, {
        path,
        frequency: 1,
        lastAccessed: Date.now(),
        associatedRecipes: []
      });
    }

    // Clean up old patterns (older than 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    for (const [patternPath, pattern] of this.navigationPatterns.entries()) {
      if (pattern.lastAccessed < oneDayAgo) {
        this.navigationPatterns.delete(patternPath);
      }
    }
  }

  // Visibility handling
  private handleElementVisible(element: HTMLElement): void {
    const categoryId = element.getAttribute('data-category');
    if (categoryId && !this.preloadedRecipes.has(categoryId)) {
      this.preloadComponentData(categoryId);
    }
  }

  // Utility methods
  private async getCachedComponent(categoryId: string): Promise<any> {
    return await cache.get(`component:${categoryId}`);
  }

  private async cacheComponent(categoryId: string, module: any): Promise<void> {
    await cache.set(`component:${categoryId}`, module, 1800); // 30 minutes
  }

  private async getCachedComponentData(categoryId: string): Promise<any> {
    return await cache.get(`component:data:${categoryId}`);
  }

  private async cacheComponentData(categoryId: string, data: any): Promise<void> {
    await cache.set(`component:data:${categoryId}`, data, 3600); // 1 hour
  }

  private getCategoryFallback(categoryId: string): React.ReactNode {
    const config = this.categoryConfigs.get(categoryId);
    
    if (config?.fallbackLoading) {
      return (
        <div className="animate-pulse bg-gray-200 rounded-lg p-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      );
    }

    return <div className="text-gray-500 p-4">Loading recipes...</div>;
  }

  private async loadRecipeDetails(recipeId: string): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: recipeId, name: `Recipe ${recipeId}`, details: {} };
  }

  private async loadRecipeImages(recipeId: string): Promise<any> {
    // Simulate image loading
    await new Promise(resolve => setTimeout(resolve, 50));
    return { images: [] };
  }

  private async loadRecipeIngredients(recipeId: string): Promise<any> {
    // Simulate ingredient loading
    await new Promise(resolve => setTimeout(resolve, 75));
    return { ingredients: [] };
  }

  // Performance monitoring
  getLazyLoadingStats(): any {
    return {
      loadedCategories: Array.from(this.loadedCategories),
      preloadedRecipes: Array.from(this.preloadedRecipes),
      cacheStats: this.cacheStats,
      navigationPatterns: Object.fromEntries(this.navigationPatterns),
      categoryConfigs: Object.fromEntries(this.categoryConfigs)
    };
  }

  // Cleanup
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// Export singleton instance
export const advancedLazyLoader = new AdvancedLazyLoader();

// React hooks for easy usage
export function useLazyRecipeCategory(categoryId: string) {
  const [component, setComponent] = React.useState(null);

  React.useEffect(() => {
    const LazyComponent = advancedLazyLoader.getLazyRecipeCategory(categoryId);
    setComponent(() => LazyComponent);
  }, [categoryId]);

  return component;
}

export function useSmartPreload(categoryId: string) {
  React.useEffect(() => {
    const config = advancedLazyLoader.getLazyLoadingStats().categoryConfigs[categoryId];
    if (config?.priority === 'HIGH' || config?.priority === 'CRITICAL') {
      advancedLazyLoader.preloadComponentData(categoryId);
    }
  }, [categoryId]);
}

export default advancedLazyLoader;