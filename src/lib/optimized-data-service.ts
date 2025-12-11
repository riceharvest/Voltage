/**
 * Optimized Data Service
 * 
 * This module provides a high-performance data loading and caching system with
 * background synchronization, intelligent filtering, and multi-level caching.
 * 
 * Key Features:
 * - Background data synchronization
 * - Intelligent caching with LRU eviction
 * - Concurrent data loading with duplicate prevention
 * - Client-side filtering and pagination
 * - Performance monitoring and metrics
 * - Cross-platform compatibility (server/client)
 * 
 * @module optimized-data-service
 * @author Energy Drink App Team
 * @since 2.0.0
 */

import { enhancedCache, enhancedCacheKeys } from './enhanced-cache';
import { logger } from './logger';
import { FlavorRecipe, Ingredient, Supplier } from './types';

/**
 * Optimized Data Service Class
 * 
 * Provides high-performance data loading with intelligent caching,
 * background synchronization, and comprehensive filtering capabilities.
 * Supports both server-side and client-side operations with appropriate
 * fallbacks and optimizations for each environment.
 * 
 * @class OptimizedDataService
 */
class OptimizedDataService {
  /** Tracks ongoing loading operations to prevent duplicates */
  private loadingPromises = new Map<string, Promise<any>>();
  /** Background synchronization interval for data updates */
  private backgroundSyncInterval: NodeJS.Timeout | null = null;

  /**
   * Creates an optimized data service instance
   * Automatically starts background synchronization
   */
  constructor() {
    this.startBackgroundSync();
  }

  /**
   * Starts automatic background data synchronization
   * Updates cached data every 5 minutes to keep information fresh
   * 
   * @private
   */
  private startBackgroundSync(): void {
    // Sync data every 5 minutes in the background
    this.backgroundSyncInterval = setInterval(async () => {
      await this.backgroundDataSync();
    }, 5 * 60 * 1000);
  }

  /**
   * Performs comprehensive background data synchronization
   * Updates all data sources (ingredients, suppliers, flavors) concurrently
   * 
   * @private
   */
  private async backgroundDataSync(): Promise<void> {
    try {
      await Promise.all([
        this.syncIngredients(),
        this.syncSuppliers(),
        this.syncFlavors()
      ]);
      logger.info('Background data sync completed');
    } catch (error) {
      logger.error('Background data sync failed', error);
    }
  }

  /**
   * Retrieves flavors with advanced filtering, pagination, and sorting
   * 
   * Provides comprehensive flavor retrieval with support for filtering by category,
   * caffeine content, search terms, and base type. Includes pagination and
   * configurable sorting options with intelligent caching.
   * 
   * @param options - Query options for filtering, pagination, and sorting
   * @param options.page - Page number for pagination (default: 1)
   * @param options.limit - Number of items per page (default: 20)
   * @param options.filters - Filter criteria for flavors
   * @param options.filters.category - Filter by flavor category
   * @param options.filters.caffeineRange - Filter by caffeine content range [min, max]
   * @param options.filters.search - Search term for flavor names and descriptions
   * @param options.filters.base - Filter by compatible base type
   * @param options.sortBy - Field to sort by (default: 'name')
   * @param options.sortOrder - Sort direction 'asc' or 'desc' (default: 'asc')
   * @returns Promise resolving to paginated flavors result
   * @example
   * ```typescript
   * // Get first page of energy flavors
   * const result = await optimizedDataService.getFlavors({
   *   page: 1,
   *   limit: 20,
   *   filters: { category: 'energy' },
   *   sortBy: 'caffeine',
   *   sortOrder: 'desc'
   * });
   * 
   * // Search for citrus flavors
   * const citrus = await optimizedDataService.getFlavors({
   *   filters: { search: 'citrus' }
   * });
   * ```
   */
  async getFlavors(options: {
    page?: number;
    limit?: number;
    filters?: {
      category?: string;
      caffeineRange?: [number, number];
      search?: string;
      base?: string;
    };
    sortBy?: 'name' | 'caffeine' | 'category';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    flavors: FlavorRecipe[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const {
      page = 1,
      limit = 20,
      filters = {},
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    // Generate cache key based on query parameters
    const cacheKey = enhancedCacheKeys.data.flavorsPaginated(page, limit, filters);
    
    // Check cache first for improved performance
    const cached = await enhancedCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Prevent duplicate loading for the same query
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey);
    }

    const loadingPromise = this.loadFlavorsWithFilters({
      page, limit, filters, sortBy, sortOrder
    });

    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      
      // Cache the result for 30 minutes
      await enhancedCache.set(cacheKey, result, 1800);
      
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Loads and filters flavors based on query parameters
   * Implements the core filtering, sorting, and pagination logic
   * 
   * @param options - Query options for filtering and sorting
   * @returns Promise resolving to filtered and paginated flavors
   * @private
   */
  private async loadFlavorsWithFilters(options: any): Promise<any> {
    const { flavors } = await import('../data/index');
    const allFlavors = await flavors.loadAllFlavors();
    
    // Apply filters
    let filteredFlavors = allFlavors;

    if (options.filters.search) {
      const searchTerm = options.filters.search.toLowerCase();
      filteredFlavors = filteredFlavors.filter(flavor =>
        flavor.name.toLowerCase().includes(searchTerm) ||
        flavor.description?.toLowerCase().includes(searchTerm) ||
        flavor.ingredients?.some(ing => ing.toLowerCase().includes(searchTerm))
      );
    }

    if (options.filters.category) {
      filteredFlavors = filteredFlavors.filter(flavor =>
        flavor.category?.toLowerCase() === options.filters.category.toLowerCase()
      );
    }

    if (options.filters.caffeineRange) {
      const [min, max] = options.filters.caffeineRange;
      filteredFlavors = filteredFlavors.filter(flavor =>
        flavor.caffeine >= min && flavor.caffeine <= max
      );
    }

    if (options.filters.base) {
      filteredFlavors = filteredFlavors.filter(flavor =>
        flavor.base?.toLowerCase() === options.filters.base.toLowerCase()
      );
    }

    // Apply sorting
    filteredFlavors.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (options.sortBy) {
        case 'caffeine':
          aVal = a.caffeine || 0;
          bVal = b.caffeine || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }

      if (options.sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    // Apply pagination
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedFlavors = filteredFlavors.slice(startIndex, endIndex);

    const total = filteredFlavors.length;
    const totalPages = Math.ceil(total / options.limit);

    return {
      flavors: paginatedFlavors,
      total,
      page: options.page,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1
    };
  }

  /**
   * Retrieves ingredients with optional search and category filtering
   * 
   * Provides efficient ingredient retrieval with client-side filtering
   * and server-side caching. Supports search by name and filtering by category.
   * 
   * @param options - Query options for filtering
   * @param options.search - Search term for ingredient names
   * @param options.category - Filter by ingredient category
   * @param options.limit - Maximum number of results to return
   * @returns Promise resolving to filtered ingredients array
   * @example
   * ```typescript
   * // Get all caffeine ingredients
   * const caffeine = await optimizedDataService.getIngredients({
   *   category: 'caffeine'
   * });
   * 
   * // Search for specific ingredients
   * const results = await optimizedDataService.getIngredients({
   *   search: 'taurine',
   *   limit: 10
   * });
   * ```
   */
  async getIngredients(options: {
    search?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<Ingredient[]> {
    const cacheKey = enhancedCacheKeys.data.ingredients;
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      let ingredients = cached;
      
      // Apply client-side filtering if needed
      if (options.search || options.category) {
        ingredients = this.filterIngredients(ingredients, options);
      }
      
      return ingredients.slice(0, options.limit);
    }

    // Prevent duplicate loading
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey);
    }

    const loadingPromise = this.loadIngredients();
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const ingredients = await loadingPromise;
      await enhancedCache.set(cacheKey, ingredients, 86400); // 24 hours
      return this.filterIngredients(ingredients, options).slice(0, options.limit);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Filters ingredients based on search and category criteria
   * 
   * @param ingredients - Array of ingredients to filter
   * @param options - Filter criteria
   * @returns Filtered ingredients array
   * @private
   */
  private filterIngredients(ingredients: Ingredient[], options: any): Ingredient[] {
    let filtered = ingredients;

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm) ||
        ingredient.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (options.category) {
      filtered = filtered.filter(ingredient =>
        ingredient.category?.toLowerCase() === options.category.toLowerCase()
      );
    }

    return filtered;
  }

  /**
   * Loads ingredients data from API or fallback source
   * 
   * @returns Promise resolving to ingredients array
   * @private
   */
  private async loadIngredients(): Promise<Ingredient[]> {
    try {
      const response = await fetch('/api/ingredients');
      if (!response.ok) throw new Error('Failed to load ingredients');
      return await response.json();
    } catch (error) {
      logger.error('Failed to load ingredients from API', error);
      // Fallback to direct import
      const ingredientsData = await import('../data/ingredients/ingredients.json');
      return ingredientsData.default as Ingredient[];
    }
  }

  /**
   * Retrieves suppliers with optional filtering by country, category, and search
   * 
   * Provides efficient supplier data retrieval with comprehensive filtering
   * capabilities for finding suppliers by location, category, or search terms.
   * 
   * @param options - Query options for filtering
   * @param options.country - Filter by country/location
   * @param options.category - Filter by supplier category
   * @param options.search - Search term for supplier names and descriptions
   * @returns Promise resolving to filtered suppliers array
   * @example
   * ```typescript
   * // Get Dutch suppliers
   * const dutchSuppliers = await optimizedDataService.getSuppliers({
   *   country: 'netherlands'
   * });
   * 
   * // Search for caffeine suppliers
   * const caffeineSuppliers = await optimizedDataService.getSuppliers({
   *   search: 'caffeine'
   * });
   * ```
   */
  async getSuppliers(options: {
    country?: string;
    category?: string;
    search?: string;
  } = {}): Promise<Supplier[]> {
    const cacheKey = enhancedCacheKeys.data.suppliers;
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      return this.filterSuppliers(cached, options);
    }

    // Prevent duplicate loading
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey);
    }

    const loadingPromise = this.loadSuppliers();
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const suppliers = await loadingPromise;
      await enhancedCache.set(cacheKey, suppliers, 86400); // 24 hours
      return this.filterSuppliers(suppliers, options);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Filters suppliers based on country, category, and search criteria
   * 
   * @param suppliers - Array of suppliers to filter
   * @param options - Filter criteria
   * @returns Filtered suppliers array
   * @private
   */
  private filterSuppliers(suppliers: Supplier[], options: any): Supplier[] {
    let filtered = suppliers;

    if (options.country) {
      filtered = filtered.filter(supplier =>
        supplier.country?.toLowerCase() === options.country.toLowerCase()
      );
    }

    if (options.category) {
      filtered = filtered.filter(supplier =>
        supplier.category?.toLowerCase() === options.category.toLowerCase()
      );
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm) ||
        supplier.description?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  /**
   * Loads suppliers data from API or fallback source
   * 
   * @returns Promise resolving to suppliers array
   * @private
   */
  private async loadSuppliers(): Promise<Supplier[]> {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to load suppliers');
      return await response.json();
    } catch (error) {
      logger.error('Failed to load suppliers from API', error);
      // Fallback to direct import
      const suppliersData = await import('../data/suppliers/netherlands.json');
      return suppliersData.default as Supplier[];
    }
  }

  /**
   * Intelligent search across multiple data types with caching
   * 
   * Performs concurrent searching across flavors, ingredients, and suppliers
   * with intelligent caching and configurable result limits. Supports searching
   * specific data types or all types simultaneously.
   * 
   * @param query - Search query string
   * @param options - Search configuration options
   * @param options.types - Data types to search ('flavors', 'ingredients', 'suppliers')
   * @param options.limit - Maximum results per data type
   * @returns Promise resolving to search results
   * @example
   * ```typescript
   * // Search all data types
   * const results = await optimizedDataService.search('caffeine');
   * 
   * // Search only flavors and ingredients
   * const limited = await optimizedDataService.search('berry', {
   *   types: ['flavors', 'ingredients'],
   *   limit: 5
   * });
   * ```
   */
  async search(query: string, options: {
    types?: ('flavors' | 'ingredients' | 'suppliers')[];
    limit?: number;
  } = {}): Promise<{
    flavors: FlavorRecipe[];
    ingredients: Ingredient[];
    suppliers: Supplier[];
    totalResults: number;
  }> {
    const cacheKey = enhancedCacheKeys.data.search(query, options);
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const types = options.types || ['flavors', 'ingredients', 'suppliers'];
    const results = {
      flavors: [] as FlavorRecipe[],
      ingredients: [] as Ingredient[],
      suppliers: [] as Supplier[],
      totalResults: 0
    };

    const searchPromises = [];

    if (types.includes('flavors')) {
      searchPromises.push(
        this.getFlavors({ filters: { search: query }, limit: options.limit || 10 })
          .then(result => result.flavors)
          .catch(error => {
            logger.error('Flavor search error', error);
            return [];
          })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    if (types.includes('ingredients')) {
      searchPromises.push(
        this.getIngredients({ search: query, limit: options.limit || 10 })
          .catch(error => {
            logger.error('Ingredient search error', error);
            return [];
          })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    if (types.includes('suppliers')) {
      searchPromises.push(
        this.getSuppliers({ search: query })
          .then(result => result.slice(0, options.limit || 10))
          .catch(error => {
            logger.error('Supplier search error', error);
            return [];
          })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    const [flavorResults, ingredientResults, supplierResults] = await Promise.all(searchPromises);

    results.flavors = flavorResults;
    results.ingredients = ingredientResults;
    results.suppliers = supplierResults;
    results.totalResults = flavorResults.length + ingredientResults.length + supplierResults.length;

    // Cache search results for 1 hour
    await enhancedCache.set(cacheKey, results, 3600);

    return results;
  }

  /**
   * Bulk loading of multiple flavors by ID with missing item tracking
   * 
   * Efficiently loads multiple flavors in a single operation with
   * concurrency control and missing item identification. More efficient
   * than individual lookups for multiple items.
   * 
   * @param flavorIds - Array of flavor IDs to load
   * @returns Promise resolving to bulk flavor results
   * @example
   * ```typescript
   * const { flavors, missing } = await optimizedDataService.getBulkFlavorData([
   *   'berry-citrus-fusion', 'cola-kick', 'tropical-bliss'
   * ]);
   * console.log(flavors.length); // 3 (if all found)
   * console.log(missing); // [] (if all found)
   * ```
   */
  async getBulkFlavorData(flavorIds: string[]): Promise<{
    flavors: FlavorRecipe[];
    missing: string[];
  }> {
    const cacheKey = enhancedCacheKeys.api.bulk(flavorIds);
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { getFlavor } = await import('../data/index');
    const flavors: FlavorRecipe[] = [];
    const missing: string[] = [];

    // Load flavors concurrently
    const flavorPromises = flavorIds.map(async (id) => {
      const flavor = await getFlavor(id);
      if (flavor) {
        flavors.push(flavor);
      } else {
        missing.push(id);
      }
    });

    await Promise.all(flavorPromises);

    const result = { flavors, missing };

    // Cache bulk results for 1 hour
    await enhancedCache.set(cacheKey, result, 3600);

    return result;
  }

  // Background sync methods
  /**
   * Synchronizes ingredients data in the background
   * 
   * @private
   */
  private async syncIngredients(): Promise<void> {
    try {
      await this.loadIngredients();
      logger.info('Ingredients synced successfully');
    } catch (error) {
      logger.error('Ingredients sync failed', error);
    }
  }

  /**
   * Synchronizes suppliers data in the background
   * 
   * @private
   */
  private async syncSuppliers(): Promise<void> {
    try {
      await this.loadSuppliers();
      logger.info('Suppliers synced successfully');
    } catch (error) {
      logger.error('Suppliers sync failed', error);
    }
  }

  /**
   * Synchronizes flavors data in the background
   * 
   * @private
   */
  private async syncFlavors(): Promise<void> {
    try {
      // Warm up the flavors cache
      await this.getFlavors({ limit: 10 });
      logger.info('Flavors synced successfully');
    } catch (error) {
      logger.error('Flavors sync failed', error);
    }
  }

  /**
   * Returns performance metrics for monitoring and optimization
   * 
   * Provides insights into cache hit rates, response times, memory usage,
   * and background synchronization status for performance monitoring.
   * 
   * @returns Performance metrics object
   * @example
   * ```typescript
   * const metrics = await optimizedDataService.getPerformanceMetrics();
   * console.log(metrics.cacheHitRate); // 85.2
   * console.log(metrics.backgroundSyncStatus); // 'active'
   * ```
   */
  async getPerformanceMetrics(): Promise<{
    cacheHitRate: number;
    avgResponseTime: number;
    memoryUsage: number;
    backgroundSyncStatus: string;
  }> {
    const cacheMetrics = await enhancedCache.getMetrics();
    
    return {
      cacheHitRate: cacheMetrics.memory?.hitRate || 0,
      avgResponseTime: cacheMetrics.memory?.avgResponseTime || 0,
      memoryUsage: cacheMetrics.memory?.memoryUsageMB || 0,
      backgroundSyncStatus: this.backgroundSyncInterval ? 'active' : 'inactive'
    };
  }

  /**
   * Cleans up resources and stops background processes
   * 
   * Should be called when shutting down the application to prevent
   * memory leaks and ensure proper cleanup.
   */
  async cleanup(): Promise<void> {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }
}

/**
 * Optimized Data Service Singleton Instance
 * 
 * Main entry point for all data operations. This singleton provides
 * high-performance data loading with intelligent caching and background
 * synchronization.
 * 
 * @example
 * ```typescript
 * // Get flavors with filtering
 * const flavors = await optimizedDataService.getFlavors({
 *   filters: { category: 'energy' },
 *   sortBy: 'caffeine',
 *   sortOrder: 'desc'
 * });
 * 
 * // Search across all data types
 * const results = await optimizedDataService.search('caffeine', {
 *   types: ['flavors', 'ingredients']
 * });
 * ```
 */
export const optimizedDataService = new OptimizedDataService();

/**
 * Client-Side Optimized Data Service
 * 
 * Simplified version of the data service designed for browser environments
 * with reduced functionality but better client-side performance.
 * 
 * @class ClientOptimizedDataService
 */
export class ClientOptimizedDataService {
  /** Simple in-memory cache for client-side operations */
  private cache = new Map<string, { data: any; expiry: number }>();

  /**
   * Retrieves flavors with basic client-side filtering
   * 
   * @param options - Query options for filtering
   * @returns Promise resolving to filtered flavors array
   */
  async getFlavors(options: any = {}): Promise<any> {
    // Simple client-side implementation
    const { loadAllFlavors } = await import('../data/index');
    const flavors = await loadAllFlavors();
    
    // Apply basic filtering
    if (options.filters?.search) {
      const searchTerm = options.filters.search.toLowerCase();
      return flavors.filter((flavor: FlavorRecipe) =>
        flavor.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return flavors;
  }

  /**
   * Retrieves ingredients data
   * 
   * @param options - Query options (currently unused in client version)
   * @returns Promise resolving to ingredients array
   */
  async getIngredients(options: any = {}): Promise<Ingredient[]> {
    const { default: ingredientsData } = await import('../data/ingredients/ingredients.json');
    return ingredientsData as Ingredient[];
  }

  /**
   * Retrieves suppliers data
   * 
   * @param options - Query options (currently unused in client version)
   * @returns Promise resolving to suppliers array
   */
  async getSuppliers(options: any = {}): Promise<Supplier[]> {
    const { default: suppliersData } = await import('../data/suppliers/netherlands.json');
    return suppliersData as Supplier[];
  }

  /**
   * Performs basic search across data types
   * 
   * @param query - Search query string
   * @returns Promise resolving to search results
   */
  async search(query: string): Promise<any> {
    const [flavors, ingredients, suppliers] = await Promise.all([
      this.getFlavors({ filters: { search: query } }),
      this.getIngredients({ search: query }),
      this.getSuppliers({ search: query })
    ]);

    return {
      flavors,
      ingredients,
      suppliers,
      totalResults: flavors.length + ingredients.length + suppliers.length
    };
  }
}

/**
 * Client-Side Data Service Instance
 * 
 * Simplified instance for client-side operations with reduced functionality
 * but better browser compatibility and performance.
 * 
 * @example
 * ```typescript
 * // Client-side flavor search
 * const results = await clientOptimizedDataService.search('berry');
 * console.log(results.totalResults);
 * ```
 */
export const clientOptimizedDataService = new ClientOptimizedDataService();