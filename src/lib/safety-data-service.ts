/**
 * Safety Data Service
 * 
 * This module provides comprehensive safety data management for energy drink recipes,
 * including ingredient limits, safety calculations, and regulatory compliance validation.
 * 
 * Key Features:
 * - Enhanced caching with performance monitoring
 * - Bulk ingredient data loading for efficiency
 * - Safety calculation algorithms
 * - Fallback mechanisms for reliability
 * - Performance metrics tracking
 * 
 * @module safety-data-service
 * @author Energy Drink App Team
 * @since 2.0.0
 */

import limitsData from '@/data/safety/limits.json';
import ingredientsData from '@/data/ingredients/ingredients.json';
import { Ingredient } from '@/lib/types';
import { enhancedCache, enhancedCacheKeys } from './enhanced-cache';
import { optimizedDataService } from './optimized-data-service';
import { performanceMonitor } from './performance-monitor';
import { logger } from './logger';

/**
 * Retrieves safety limits data with enhanced caching
 * 
 * This function provides access to regulatory safety limits for ingredients,
 * with intelligent caching and performance monitoring. The data includes
 * maximum daily intake limits, warning thresholds, and EU compliance status.
 * 
 * @returns Promise that resolves to safety limits data
 * @example
 * ```typescript
 * const limits = await getLimitsData();
 * console.log(limits.caffeine.maxDaily); // 400 (mg)
 * ```
 */
export async function getLimitsData() {
  const startTime = performance.now();
  
  try {
    // Check enhanced cache first for improved performance
    const cached = await enhancedCache.get(enhancedCacheKeys.data.safetyLimits);
    if (cached) {
      performanceMonitor.recordMetric('safety.limits.hit', performance.now() - startTime);
      return cached;
    }

    // Load and cache the data with 24-hour TTL for safety limits
    await enhancedCache.set(enhancedCacheKeys.data.safetyLimits, limitsData, 86400);
    performanceMonitor.recordMetric('safety.limits.miss', performance.now() - startTime);
    
    return limitsData;
  } catch (error) {
    logger.error('Failed to get limits data', error);
    performanceMonitor.recordMetric('safety.limits.error', performance.now() - startTime);
    return limitsData; // Fallback to static data
  }
}

/**
 * Retrieves ingredients data with optional filtering and performance monitoring
 * 
 * Provides access to the complete ingredients database with support for
 * search, category filtering, and result limiting. Uses the optimized
 * data service for enhanced performance and caching.
 * 
 * @param options - Optional filtering and pagination parameters
 * @param options.search - Search term for ingredient names
 * @param options.category - Filter by ingredient category
 * @param options.limit - Maximum number of results to return
 * @returns Promise that resolves to filtered ingredients array
 * @example
 * ```typescript
 * // Get all caffeine ingredients
 * const caffeineIngredients = await getIngredientsData({ 
 *   category: 'caffeine' 
 * });
 * 
 * // Search for specific ingredients
 * const results = await getIngredientsData({ 
 *   search: 'caffeine',
 *   limit: 10
 * });
 * ```
 */
export async function getIngredientsData(options: {
  search?: string;
  category?: string;
  limit?: number;
} = {}): Promise<Ingredient[]> {
  const startTime = performance.now();
  
  try {
    // Use the optimized data service for better performance
    const ingredients = await optimizedDataService.getIngredients(options);
    performanceMonitor.recordMetric('safety.ingredients.load', performance.now() - startTime, {
      count: ingredients.length.toString(),
      filtered: (options.search || options.category) ? 'true' : 'false'
    });
    
    return ingredients;
  } catch (error) {
    logger.error('Failed to get ingredients data', error);
    performanceMonitor.recordMetric('safety.ingredients.error', performance.now() - startTime);
    return ingredientsData as Ingredient[]; // Fallback to static data
  }
}

/**
 * Optimized bulk ingredient data retrieval
 * 
 * Efficiently loads multiple ingredients by ID in a single operation,
 * with fallback handling and missing ingredient tracking. This is more
 * efficient than individual lookups for multiple ingredients.
 * 
 * @param ingredientIds - Array of ingredient IDs to retrieve
 * @returns Promise that resolves to bulk ingredients result
 * @example
 * ```typescript
 * const { ingredients, missing } = await getBulkIngredientData([
 *   'caffeine', 'taurine', 'guarana'
 * ]);
 * console.log(ingredients.length); // 3 (if all found)
 * console.log(missing); // [] (if all found)
 * ```
 */
export async function getBulkIngredientData(ingredientIds: string[]): Promise<{
  ingredients: Ingredient[];
  missing: string[];
}> {
  const startTime = performance.now();
  
  try {
    const allIngredients = await optimizedDataService.getIngredients({ limit: 1000 });
    const foundIngredients = allIngredients.filter(ing => ingredientIds.includes(ing.id));
    const missing = ingredientIds.filter(id => !foundIngredients.find(ing => ing.id === id));
    
    performanceMonitor.recordMetric('safety.ingredients.bulk', performance.now() - startTime, {
      requested: ingredientIds.length.toString(),
      found: foundIngredients.length.toString()
    });
    
    return {
      ingredients: foundIngredients,
      missing
    };
  } catch (error) {
    logger.error('Failed to get bulk ingredient data', error);
    performanceMonitor.recordMetric('safety.ingredients.bulk_error', performance.now() - startTime);
    
    // Fallback to static data
    const foundIngredients = (ingredientsData as Ingredient[]).filter(ing => ingredientIds.includes(ing.id));
    const missing = ingredientIds.filter(id => !foundIngredients.find(ing => ing.id === id));
    
    return {
      ingredients: foundIngredients,
      missing
    };
  }
}

/**
 * Enhanced safety calculation with comprehensive metrics
 * 
 * Performs safety analysis for a set of ingredients, calculating total
 * caffeine content, risk levels, warnings, and recommendations. Includes
 * performance monitoring and comprehensive error handling.
 * 
 * @param ingredientIds - Array of ingredient IDs to analyze
 * @returns Promise that resolves to safety analysis results
 * @example
 * ```typescript
 * const safetyAnalysis = await calculateSafetyMetrics([
 *   'caffeine', 'taurine', 'guarana'
 * ]);
 * console.log(safetyAnalysis.totalCaffeine); // 320 (mg)
 * console.log(safetyAnalysis.riskLevel); // 'low' | 'medium' | 'high'
 * ```
 */
export async function calculateSafetyMetrics(ingredientIds: string[]) {
  const startTime = performance.now();
  
  try {
    const [limits, ingredientData] = await Promise.all([
      getLimitsData(),
      getBulkIngredientData(ingredientIds)
    ]);
    
    // Perform safety calculations
    const safetyMetrics = performSafetyCalculation(ingredientData.ingredients, limits);
    
    performanceMonitor.recordMetric('safety.calculation', performance.now() - startTime, {
      ingredientCount: ingredientIds.length.toString(),
      calculationType: 'comprehensive'
    });
    
    return {
      ...safetyMetrics,
      metadata: {
        calculatedAt: new Date().toISOString(),
        ingredientCount: ingredientIds.length,
        missingIngredients: ingredientData.missing
      }
    };
  } catch (error) {
    logger.error('Safety calculation failed', error);
    performanceMonitor.recordMetric('safety.calculation_error', performance.now() - startTime);
    throw error;
  }
}

/**
 * Core safety calculation algorithm
 * 
 * Implements the core safety calculation logic for ingredient combinations.
 * This function analyzes ingredient data against safety limits to determine
 * risk levels, generate warnings, and provide recommendations.
 * 
 * @param ingredients - Array of ingredients to analyze
 * @param limits - Safety limits data
 * @returns Safety calculation results
 * @private
 */
function performSafetyCalculation(ingredients: Ingredient[], limits: any) {
  // This would contain the actual safety calculation logic
  // For now, return a basic structure that demonstrates the pattern
  
  const totalCaffeine = ingredients.reduce((sum, ing) => {
    // Assuming caffeine content is stored in the ingredient data
    return sum + (ing.caffeine || 0);
  }, 0);

  // Determine risk level based on caffeine content
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (totalCaffeine > 300) {
    riskLevel = 'high';
  } else if (totalCaffeine > 150) {
    riskLevel = 'medium';
  }

  // Generate warnings based on risk level and regulatory limits
  const warnings = [];
  if (totalCaffeine > limits.caffeine?.maxDaily) {
    warnings.push({
      type: 'dosage',
      message: 'Caffeine content exceeds recommended daily intake',
      severity: 'error' as const
    });
  } else if (totalCaffeine > limits.caffeine?.warningThreshold) {
    warnings.push({
      type: 'dosage',
      message: 'Caffeine content approaches daily limit',
      severity: 'warning' as const
    });
  }

  // Generate recommendations based on analysis
  const recommendations = [];
  if (riskLevel === 'high') {
    recommendations.push('Consider reducing caffeine content');
  } else if (riskLevel === 'medium') {
    recommendations.push('Monitor total daily caffeine intake');
  }

  return {
    totalCaffeine,
    riskLevel,
    warnings,
    recommendations
  };
}

// Legacy exports for backward compatibility
/**
 * Safety limits data (legacy export)
 * @deprecated Use getLimitsData() instead for better performance and caching
 */
export const limits = limitsData;

/**
 * Ingredients data (legacy export)
 * @deprecated Use getIngredientsData() instead for better performance and filtering
 */
export const ingredients: Ingredient[] = ingredientsData as Ingredient[];

/**
 * Adds an ingredient ID to an array if not already present
 * 
 * Utility function for managing ingredient selections with duplicate prevention.
 * 
 * @param current - Current array of ingredient IDs
 * @param id - Ingredient ID to add
 * @returns New array with the ingredient ID added (if not duplicate)
 * @example
 * ```typescript
 * const selected = ['caffeine', 'taurine'];
 * const updated = addIngredient(selected, 'guarana');
 * // updated: ['caffeine', 'taurine', 'guarana']
 * ```
 */
export function addIngredient(current: string[], id: string): string[] {
  if (!current.includes(id)) {
    return [...current, id];
  }
  return current;
}

/**
 * Removes an ingredient ID from an array
 * 
 * Utility function for managing ingredient selections with safe removal.
 * 
 * @param current - Current array of ingredient IDs
 * @param id - Ingredient ID to remove
 * @returns New array with the ingredient ID removed
 * @example
 * ```typescript
 * const selected = ['caffeine', 'taurine', 'guarana'];
 * const updated = removeIngredient(selected, 'taurine');
 * // updated: ['caffeine', 'guarana']
 * ```
 */
export function removeIngredient(current: string[], id: string): string[] {
  return current.filter(i => i !== id);
}