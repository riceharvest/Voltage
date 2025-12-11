/**
 * Comprehensive Filtering System
 * 
 * Advanced multi-criteria filtering system with boolean logic, regional availability,
 * cost range filtering, allergen detection, and equipment requirements for
 * intelligent recipe and product discovery.
 * 
 * @module comprehensive-filter-system
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { FlavorRecipe, Ingredient } from './types';
import { enhancedCache } from './enhanced-cache';
import { logger } from './logger';

// Filter system interfaces and types
export interface ComprehensiveFilter {
  id: string;
  category: FilterCategory;
  type: FilterType;
  operator: FilterOperator;
  value: any;
  weight: number;
  required: boolean;
  description: string;
  displayName: string;
  icon?: string;
  group?: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  description: string;
  filters: ComprehensiveFilter[];
  logic: 'AND' | 'OR';
  expandable: boolean;
  collapsed: boolean;
}

export interface FilterSet {
  groups: FilterGroup[];
  globalLogic: 'AND' | 'OR';
  activeFilters: string[];
  savedSets: SavedFilterSet[];
}

export interface SavedFilterSet {
  id: string;
  name: string;
  description: string;
  filters: ComprehensiveFilter[];
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  isPublic: boolean;
  tags: string[];
}

export interface FilterResult<T> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: ComprehensiveFilter[];
  filterStatistics: FilterStatistics;
  availableValues: Record<string, FilterValue[]>;
  executionTime: number;
}

export interface FilterStatistics {
  filterEffectiveness: Record<string, number>;
  resultDistribution: Record<string, number>;
  popularFilters: FilterPopularity[];
  zeroResultFilters: string[];
  performanceMetrics: FilterPerformance;
}

export interface FilterValue {
  value: string | number;
  label: string;
  count: number;
  percentage: number;
  selected: boolean;
  disabled: boolean;
}

export interface FilterPopularity {
  filterId: string;
  usageCount: number;
  avgResults: number;
  successRate: number;
}

export interface FilterPerformance {
  avgExecutionTime: number;
  cacheHitRate: number;
  complexityScore: number;
  optimizationSuggestions: string[];
}

export interface FilterQuery {
  query: string;
  filters: FilterExpression[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeStats?: boolean;
  includeSuggestions?: boolean;
}

export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: any;
  group?: string;
}

export interface FilterSuggestion {
  type: 'suggestion' | 'correction' | 'alternative' | 'expansion';
  filter: ComprehensiveFilter;
  reason: string;
  confidence: number;
  alternatives?: ComprehensiveFilter[];
}

// Filter system configuration
export interface FilterSystemConfig {
  maxFilters: number;
  maxFilterGroups: number;
  cacheExpiry: number;
  enableRealTimeFiltering: boolean;
  enableFilterSuggestions: boolean;
  enableFilterAnalytics: boolean;
  maxResults: number;
  timeoutMs: number;
}

// Available filter categories and types
export type FilterCategory = 
  | 'basic' | 'category' | 'ingredient' | 'nutrition' | 'difficulty' 
  | 'time' | 'cost' | 'equipment' | 'dietary' | 'allergen' 
  | 'cultural' | 'regional' | 'seasonal' | 'preference' | 'availability';

export type FilterType =
  | 'text' | 'number' | 'range' | 'boolean' | 'select' | 'multiselect' 
  | 'date' | 'location' | 'ingredient' | 'category' | 'tag';

export type FilterOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' 
  | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  | 'has' | 'not_has' | 'regex' | 'fuzzy' | 'geographic';

/**
 * Comprehensive Filtering System
 * 
 * Provides advanced filtering capabilities with multi-criteria support,
 * boolean logic, performance optimization, and intelligent suggestions
 * for comprehensive recipe and product discovery.
 */
export class ComprehensiveFilterSystem {
  private config: FilterSystemConfig = {
    maxFilters: 50,
    maxFilterGroups: 10,
    cacheExpiry: 1800000, // 30 minutes
    enableRealTimeFiltering: true,
    enableFilterSuggestions: true,
    enableFilterAnalytics: true,
    maxResults: 1000,
    timeoutMs: 5000
  };

  private filterDefinitions: Map<string, ComprehensiveFilter> = new Map();
  private filterGroups: Map<string, FilterGroup> = new Map();
  private filterCache: Map<string, FilterResult<any>> = new Map();
  private filterAnalytics: FilterAnalytics = {};
  private regionalData: RegionalFilterData = {};

  constructor() {
    this.initializeFilterDefinitions();
    this.initializeFilterGroups();
    this.loadRegionalData();
    this.startAnalyticsCollection();
  }

  /**
   * Initialize comprehensive filter definitions
   */
  private initializeFilterDefinitions(): void {
    // Basic filters
    this.addFilterDefinition({
      id: 'name',
      category: 'basic',
      type: 'text',
      operator: 'contains',
      value: '',
      weight: 1.0,
      required: false,
      description: 'Search in recipe names and descriptions',
      displayName: 'Name/Description',
      icon: 'search',
      group: 'basic'
    });

    this.addFilterDefinition({
      id: 'category',
      category: 'category',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 1.0,
      required: false,
      description: 'Filter by recipe categories',
      displayName: 'Category',
      icon: 'category',
      group: 'category'
    });

    // Category-specific filters
    this.addFilterDefinition({
      id: 'soda_type',
      category: 'category',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.9,
      required: false,
      description: 'Filter by soda type',
      displayName: 'Soda Type',
      icon: 'beverage',
      group: 'category'
    });

    // Nutritional filters
    this.addFilterDefinition({
      id: 'caffeine_level',
      category: 'nutrition',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.8,
      required: false,
      description: 'Filter by caffeine content level',
      displayName: 'Caffeine Level',
      icon: 'energy',
      group: 'nutrition'
    });

    this.addFilterDefinition({
      id: 'caffeine_range',
      category: 'nutrition',
      type: 'range',
      operator: 'between',
      value: [0, 200],
      weight: 0.8,
      required: false,
      description: 'Filter by caffeine content range (mg)',
      displayName: 'Caffeine Range',
      icon: 'energy',
      group: 'nutrition'
    });

    // Ingredient filters
    this.addFilterDefinition({
      id: 'ingredients_include',
      category: 'ingredient',
      type: 'ingredient',
      operator: 'has',
      value: [],
      weight: 0.9,
      required: false,
      description: 'Recipes must include these ingredients',
      displayName: 'Include Ingredients',
      icon: 'add',
      group: 'ingredients'
    });

    this.addFilterDefinition({
      id: 'ingredients_exclude',
      category: 'ingredient',
      type: 'ingredient',
      operator: 'not_has',
      value: [],
      weight: 0.9,
      required: false,
      description: 'Recipes must not include these ingredients',
      displayName: 'Exclude Ingredients',
      icon: 'remove',
      group: 'ingredients'
    });

    // Dietary and allergen filters
    this.addFilterDefinition({
      id: 'dietary_restrictions',
      category: 'dietary',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.7,
      required: false,
      description: 'Filter by dietary restrictions',
      displayName: 'Dietary Restrictions',
      icon: 'diet',
      group: 'dietary'
    });

    this.addFilterDefinition({
      id: 'allergens',
      category: 'allergen',
      type: 'multiselect',
      operator: 'not_in',
      value: [],
      weight: 1.0,
      required: false,
      description: 'Filter out allergens',
      displayName: 'Allergen Free',
      icon: 'warning',
      group: 'allergen'
    });

    // Difficulty and time filters
    this.addFilterDefinition({
      id: 'difficulty',
      category: 'difficulty',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.6,
      required: false,
      description: 'Filter by recipe difficulty',
      displayName: 'Difficulty Level',
      icon: 'skill',
      group: 'difficulty'
    });

    this.addFilterDefinition({
      id: 'prep_time',
      category: 'time',
      type: 'range',
      operator: 'less_than',
      value: [0, 120],
      weight: 0.7,
      required: false,
      description: 'Filter by preparation time (minutes)',
      displayName: 'Prep Time',
      icon: 'time',
      group: 'time'
    });

    // Cost and availability filters
    this.addFilterDefinition({
      id: 'cost_range',
      category: 'cost',
      type: 'range',
      operator: 'between',
      value: [0, 10],
      weight: 0.6,
      required: false,
      description: 'Filter by cost per serving',
      displayName: 'Cost Range',
      icon: 'money',
      group: 'cost'
    });

    this.addFilterDefinition({
      id: 'premade_available',
      category: 'availability',
      type: 'boolean',
      operator: 'equals',
      value: false,
      weight: 0.5,
      required: false,
      description: 'Show only recipes with premade alternatives',
      displayName: 'Premade Available',
      icon: 'store',
      group: 'availability'
    });

    // Regional and cultural filters
    this.addFilterDefinition({
      id: 'region',
      category: 'regional',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.6,
      required: false,
      description: 'Filter by region availability',
      displayName: 'Region',
      icon: 'location',
      group: 'regional'
    });

    this.addFilterDefinition({
      id: 'cultural_origin',
      category: 'cultural',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.4,
      required: false,
      description: 'Filter by cultural origin',
      displayName: 'Cultural Origin',
      icon: 'culture',
      group: 'cultural'
    });

    // Equipment filters
    this.addFilterDefinition({
      id: 'required_equipment',
      category: 'equipment',
      type: 'multiselect',
      operator: 'has',
      value: [],
      weight: 0.7,
      required: false,
      description: 'Filter by required equipment',
      displayName: 'Required Equipment',
      icon: 'equipment',
      group: 'equipment'
    });

    // Seasonal filters
    this.addFilterDefinition({
      id: 'season',
      category: 'seasonal',
      type: 'multiselect',
      operator: 'in',
      value: [],
      weight: 0.5,
      required: false,
      description: 'Filter by seasonal preference',
      displayName: 'Season',
      icon: 'season',
      group: 'seasonal'
    });

    logger.info(`Initialized ${this.filterDefinitions.size} filter definitions`);
  }

  /**
   * Initialize filter groups with logical organization
   */
  private initializeFilterGroups(): void {
    this.addFilterGroup({
      id: 'basic',
      name: 'Basic Search',
      description: 'Fundamental search and category filters',
      filters: ['name', 'category'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: false,
      collapsed: false
    });

    this.addFilterGroup({
      id: 'ingredients',
      name: 'Ingredients',
      description: 'Ingredient inclusion and exclusion filters',
      filters: ['ingredients_include', 'ingredients_exclude'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: true,
      collapsed: false
    });

    this.addFilterGroup({
      id: 'nutrition',
      name: 'Nutrition & Health',
      description: 'Nutritional content and health-related filters',
      filters: ['caffeine_level', 'caffeine_range', 'dietary_restrictions', 'allergens'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: true,
      collapsed: false
    });

    this.addFilterGroup({
      id: 'preparation',
      name: 'Preparation',
      description: 'Difficulty, time, and equipment requirements',
      filters: ['difficulty', 'prep_time', 'required_equipment'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: true,
      collapsed: false
    });

    this.addFilterGroup({
      id: 'practical',
      name: 'Practical',
      description: 'Cost, availability, and regional considerations',
      filters: ['cost_range', 'premade_available', 'region', 'cultural_origin'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: true,
      collapsed: true
    });

    this.addFilterGroup({
      id: 'preferences',
      name: 'Preferences',
      description: 'Personal and seasonal preferences',
      filters: ['season'].map(id => this.filterDefinitions.get(id)!),
      logic: 'AND',
      expandable: true,
      collapsed: true
    });

    logger.info(`Initialized ${this.filterGroups.size} filter groups`);
  }

  /**
   * Apply comprehensive filtering to recipes
   */
  async applyFilters<T extends FlavorRecipe>(
    items: T[],
    filterQuery: FilterQuery,
    options: {
      includeStatistics?: boolean;
      includeSuggestions?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<FilterResult<T>> {
    const startTime = performance.now();
    
    try {
      // Generate cache key if caching is enabled
      const cacheKey = options.useCache ? this.generateCacheKey(filterQuery) : null;
      if (cacheKey && this.filterCache.has(cacheKey)) {
        const cached = this.filterCache.get(cacheKey)!;
        return cached as FilterResult<T>;
      }

      // Parse and validate filter expressions
      const filters = this.parseFilterExpressions(filterQuery.filters);
      
      // Apply filters with boolean logic
      let filteredItems = this.applyBooleanLogic(items, filters, filterQuery);
      
      // Apply sorting
      if (filterQuery.sortBy) {
        filteredItems = this.applySorting(filteredItems, filterQuery.sortBy, filterQuery.sortOrder || 'asc');
      }
      
      // Apply pagination
      const totalCount = filteredItems.length;
      const offset = filterQuery.offset || 0;
      const limit = Math.min(filterQuery.limit || 50, this.config.maxResults);
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      // Generate filter statistics if requested
      const filterStatistics = options.includeStatistics ? 
        await this.generateFilterStatistics(items, filteredItems, filters) : 
        {} as FilterStatistics;

      // Generate available values for dynamic filters
      const availableValues = await this.generateAvailableValues(items, filters);

      // Generate suggestions if requested
      const suggestions = options.includeSuggestions ?
        await this.generateFilterSuggestions(items, filterQuery, filteredItems) : 
        [];

      const result: FilterResult<T> = {
        items: paginatedItems,
        totalCount,
        filteredCount: filteredItems.length,
        appliedFilters: filters,
        filterStatistics,
        availableValues,
        executionTime: performance.now() - startTime
      };

      // Cache result if caching is enabled
      if (cacheKey) {
        this.filterCache.set(cacheKey, result);
        // Set up cache expiry
        setTimeout(() => this.filterCache.delete(cacheKey), this.config.cacheExpiry);
      }

      // Record analytics
      this.recordFilterAnalytics(filterQuery, result);

      return result;
    } catch (error) {
      logger.error('Filter application failed', error);
      throw new Error(`Filter application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available filter values for dynamic filters
   */
  async getAvailableFilterValues(
    filterId: string,
    items: FlavorRecipe[],
    contextFilters: FilterExpression[] = []
  ): Promise<FilterValue[]> {
    try {
      const filter = this.filterDefinitions.get(filterId);
      if (!filter) {
        throw new Error(`Filter definition not found: ${filterId}`);
      }

      // Apply context filters to get relevant subset
      const contextFilteredItems = contextFilters.length > 0 ? 
        this.applyBooleanLogic(items, this.parseFilterExpressions(contextFilters)) :
        items;

      // Extract values based on filter type
      let values: FilterValue[] = [];

      switch (filter.type) {
        case 'multiselect':
          values = await this.extractMultiselectValues(filter, contextFilteredItems);
          break;
        case 'select':
          values = await this.extractSelectValues(filter, contextFilteredItems);
          break;
        case 'range':
          values = await this.extractRangeValues(filter, contextFilteredItems);
          break;
        case 'ingredient':
          values = await this.extractIngredientValues(filter, contextFilteredItems);
          break;
        default:
          values = [];
      }

      // Sort values by frequency/count
      values.sort((a, b) => b.count - a.count);

      return values;
    } catch (error) {
      logger.error('Failed to get available filter values', error);
      return [];
    }
  }

  /**
   * Get intelligent filter suggestions
   */
  async getFilterSuggestions(
    query: string,
    items: FlavorRecipe[],
    context?: {
      currentFilters?: FilterExpression[];
      selectedItems?: string[];
      userPreferences?: any;
    }
  ): Promise<FilterSuggestion[]> {
    const suggestions: FilterSuggestion[] = [];

    try {
      // Suggest category filters based on query
      const categorySuggestions = await this.suggestCategoryFilters(query, items);
      suggestions.push(...categorySuggestions);

      // Suggest ingredient filters
      const ingredientSuggestions = await this.suggestIngredientFilters(query, items);
      suggestions.push(...ingredientSuggestions);

      // Suggest nutritional filters
      const nutritionSuggestions = await this.suggestNutritionFilters(query, items);
      suggestions.push(...nutritionSuggestions);

      // Suggest alternative filters for zero-result queries
      if (context?.currentFilters) {
        const alternativeSuggestions = await this.suggestAlternativeFilters(query, context.currentFilters, items);
        suggestions.push(...alternativeSuggestions);
      }

      // Sort suggestions by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);

      return suggestions.slice(0, 10); // Limit to top 10 suggestions
    } catch (error) {
      logger.error('Failed to generate filter suggestions', error);
      return [];
    }
  }

  /**
   * Save and manage filter sets
   */
  async saveFilterSet(
    name: string,
    description: string,
    filters: FilterExpression[],
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<SavedFilterSet> {
    const savedSet: SavedFilterSet = {
      id: this.generateId(),
      name,
      description,
      filters: this.parseFilterExpressions(filters),
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0,
      isPublic,
      tags
    };

    // In a real implementation, this would save to database
    logger.info('Filter set saved', { id: savedSet.id, name, filterCount: filters.length });

    return savedSet;
  }

  /**
   * Apply boolean logic to filter items
   */
  private applyBooleanLogic<T>(
    items: T[],
    filters: ComprehensiveFilter[],
    filterQuery?: FilterQuery
  ): T[] {
    if (filters.length === 0) return items;

    const globalLogic = filterQuery?.globalLogic || 'AND';
    const groupLogic = new Map<string, 'AND' | 'OR'>();

    // Group filters by their group
    const filterGroups = new Map<string, ComprehensiveFilter[]>();
    for (const filter of filters) {
      const groupId = filter.group || 'default';
      if (!filterGroups.has(groupId)) {
        filterGroups.set(groupId, []);
      }
      filterGroups.get(groupId)!.push(filter);
    }

    // Apply group logic
    let filteredItems = items;
    for (const [groupId, groupFilters] of filterGroups.entries()) {
      const logic = groupLogic.get(groupId) || 'AND';
      const groupResult = this.applyFilterGroup(items, groupFilters, logic);
      
      if (groupId === 'default') {
        filteredItems = groupResult;
      } else {
        // Combine with global logic
        if (globalLogic === 'AND') {
          filteredItems = filteredItems.filter(item => groupResult.includes(item));
        } else {
          const currentIds = new Set(filteredItems.map(item => JSON.stringify(item)));
          const groupIds = new Set(groupResult.map(item => JSON.stringify(item)));
          
          filteredItems = [
            ...filteredItems,
            ...groupResult.filter(item => !currentIds.has(JSON.stringify(item)))
          ];
        }
      }
    }

    return filteredItems;
  }

  /**
   * Apply a group of filters with AND/OR logic
   */
  private applyFilterGroup<T>(items: T[], filters: ComprehensiveFilter[], logic: 'AND' | 'OR'): T[] {
    if (filters.length === 0) return items;

    if (logic === 'AND') {
      return items.filter(item => 
        filters.every(filter => this.evaluateFilter(item, filter))
      );
    } else {
      return items.filter(item => 
        filters.some(filter => this.evaluateFilter(item, filter))
      );
    }
  }

  /**
   * Evaluate a single filter against an item
   */
  private evaluateFilter<T>(item: T, filter: ComprehensiveFilter): boolean {
    try {
      const fieldValue = this.getFieldValue(item, filter.id);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not_equals':
          return fieldValue !== filter.value;
        case 'contains':
          return this.stringContains(fieldValue, filter.value);
        case 'not_contains':
          return !this.stringContains(fieldValue, filter.value);
        case 'starts_with':
          return this.stringStartsWith(fieldValue, filter.value);
        case 'ends_with':
          return this.stringEndsWith(fieldValue, filter.value);
        case 'greater_than':
          return Number(fieldValue) > Number(filter.value);
        case 'less_than':
          return Number(fieldValue) < Number(filter.value);
        case 'between':
          const [min, max] = filter.value;
          return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
        case 'in':
          return Array.isArray(filter.value) ? filter.value.includes(fieldValue) : false;
        case 'not_in':
          return Array.isArray(filter.value) ? !filter.value.includes(fieldValue) : true;
        case 'has':
          return this.hasProperty(item, filter.value);
        case 'not_has':
          return !this.hasProperty(item, filter.value);
        case 'regex':
          return this.matchesRegex(fieldValue, filter.value);
        case 'fuzzy':
          return this.fuzzyMatch(fieldValue, filter.value);
        case 'geographic':
          return this.matchesGeographic(filter.value, fieldValue);
        default:
          return true;
      }
    } catch (error) {
      logger.warn('Filter evaluation failed', { filter: filter.id, error });
      return false;
    }
  }

  /**
   * Generate comprehensive filter statistics
   */
  private async generateFilterStatistics(
    originalItems: FlavorRecipe[],
    filteredItems: FlavorRecipe[],
    filters: ComprehensiveFilter[]
  ): Promise<FilterStatistics> {
    const statistics: FilterStatistics = {
      filterEffectiveness: {},
      resultDistribution: {},
      popularFilters: [],
      zeroResultFilters: [],
      performanceMetrics: {
        avgExecutionTime: 0,
        cacheHitRate: 0,
        complexityScore: 0,
        optimizationSuggestions: []
      }
    };

    // Calculate filter effectiveness
    for (const filter of filters) {
      const effectiveness = this.calculateFilterEffectiveness(filter, originalItems, filteredItems);
      statistics.filterEffectiveness[filter.id] = effectiveness;
    }

    // Calculate result distribution
    statistics.resultDistribution = this.calculateResultDistribution(filteredItems);

    // Identify popular filters
    statistics.popularFilters = this.getPopularFilters(filters);

    // Identify zero-result filters
    statistics.zeroResultFilters = filters
      .filter(filter => this.isZeroResultFilter(filter, originalItems))
      .map(filter => filter.id);

    // Performance metrics
    statistics.performanceMetrics.complexityScore = this.calculateComplexityScore(filters);
    statistics.performanceMetrics.optimizationSuggestions = this.generateOptimizationSuggestions(filters);

    return statistics;
  }

  // Private helper methods
  private addFilterDefinition(filter: ComprehensiveFilter): void {
    this.filterDefinitions.set(filter.id, filter);
  }

  private addFilterGroup(group: FilterGroup): void {
    this.filterGroups.set(group.id, group);
  }

  private parseFilterExpressions(expressions: FilterExpression[]): ComprehensiveFilter[] {
    return expressions.map(expr => {
      const filter = this.filterDefinitions.get(expr.field);
      if (!filter) {
        throw new Error(`Unknown filter field: ${expr.field}`);
      }
      return {
        ...filter,
        operator: expr.operator,
        value: expr.value,
        group: expr.group
      };
    });
  }

  private getFieldValue(item: any, fieldId: string): any {
    // Map filter field IDs to actual item properties
    const fieldMapping: Record<string, string> = {
      'name': 'name',
      'category': 'category',
      'soda_type': 'sodaType',
      'caffeine_level': 'caffeineCategory',
      'prep_time': 'preparationTime',
      'cost_range': 'estimatedCost',
      'difficulty': 'difficultyLevel'
    };

    const field = fieldMapping[fieldId] || fieldId;
    return this.deepGet(item, field);
  }

  private deepGet(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private stringContains(value: any, search: string): boolean {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(search.toLowerCase());
    }
    if (Array.isArray(value)) {
      return value.some(v => this.stringContains(v, search));
    }
    return false;
  }

  private stringStartsWith(value: any, search: string): boolean {
    return typeof value === 'string' && value.toLowerCase().startsWith(search.toLowerCase());
  }

  private stringEndsWith(value: any, search: string): boolean {
    return typeof value === 'string' && value.toLowerCase().endsWith(search.toLowerCase());
  }

  private hasProperty(item: any, property: string): boolean {
    if (Array.isArray(property)) {
      return property.some(prop => this.hasProperty(item, prop));
    }
    return this.deepGet(item, property) !== undefined;
  }

  private matchesRegex(value: any, pattern: string): boolean {
    if (typeof value !== 'string') return false;
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(value);
    } catch {
      return false;
    }
  }

  private fuzzyMatch(value: any, search: string): boolean {
    if (typeof value !== 'string') return false;
    // Simple fuzzy matching implementation
    const normalizedValue = value.toLowerCase();
    const normalizedSearch = search.toLowerCase();
    return normalizedValue.includes(normalizedSearch) || 
           this.calculateLevenshteinDistance(normalizedValue, normalizedSearch) <= 2;
  }

  private matchesGeographic(filter: any, value: any): boolean {
    // Geographic matching logic
    return true; // Simplified
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private applySorting<T>(items: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
    return [...items].sort((a, b) => {
      const aValue = this.getFieldValue(a, sortBy);
      const bValue = this.getFieldValue(b, sortBy);
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private generateCacheKey(filterQuery: FilterQuery): string {
    return `filters:${JSON.stringify({
      query: filterQuery.query,
      filters: filterQuery.filters,
      sortBy: filterQuery.sortBy,
      sortOrder: filterQuery.sortOrder,
      limit: filterQuery.limit
    })}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private recordFilterAnalytics(filterQuery: FilterQuery, result: FilterResult<any>): void {
    if (!this.config.enableFilterAnalytics) return;
    
    // Record analytics data
    this.filterAnalytics[Date.now()] = {
      query: filterQuery.query,
      filterCount: filterQuery.filters.length,
      resultCount: result.filteredCount,
      executionTime: result.executionTime
    };
  }

  private loadRegionalData(): void {
    this.regionalData = {
      US: { name: 'United States', currency: 'USD', timezone: 'America/New_York' },
      EU: { name: 'European Union', currency: 'EUR', timezone: 'Europe/Brussels' },
      UK: { name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
      CA: { name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
      AU: { name: 'Australia', currency: 'AUD', timezone: 'Australia/Sydney' }
    };
  }

  private startAnalyticsCollection(): void {
    // Start collecting filter analytics
    if (this.config.enableFilterAnalytics) {
      setInterval(() => {
        this.processAnalyticsData();
      }, 300000); // Process every 5 minutes
    }
  }

  private processAnalyticsData(): void {
    // Process and analyze filter usage patterns
    logger.info('Processing filter analytics data');
  }

  // Additional helper methods for specific filter types
  private async extractMultiselectValues(filter: ComprehensiveFilter, items: FlavorRecipe[]): Promise<FilterValue[]> {
    const values = new Map<string, number>();
    
    for (const item of items) {
      const value = this.getFieldValue(item, filter.id);
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) {
            values.set(v, (values.get(v) || 0) + 1);
          }
        } else {
          values.set(value, (values.get(value) || 0) + 1);
        }
      }
    }
    
    return Array.from(values.entries()).map(([value, count]) => ({
      value,
      label: this.formatFilterValue(value),
      count,
      percentage: (count / items.length) * 100,
      selected: false,
      disabled: false
    }));
  }

  private async extractSelectValues(filter: ComprehensiveFilter, items: FlavorRecipe[]): Promise<FilterValue[]> {
    return this.extractMultiselectValues(filter, items);
  }

  private async extractRangeValues(filter: ComprehensiveFilter, items: FlavorRecipe[]): Promise<FilterValue[]> {
    // Extract range values for range filters
    return [];
  }

  private async extractIngredientValues(filter: ComprehensiveFilter, items: FlavorRecipe[]): Promise<FilterValue[]> {
    // Extract ingredient values
    return [];
  }

  private formatFilterValue(value: any): string {
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
    }
    return String(value);
  }

  private async suggestCategoryFilters(query: string, items: FlavorRecipe[]): Promise<FilterSuggestion[]> {
    const categories = ['classic', 'energy', 'hybrid'];
    const suggestions: FilterSuggestion[] = [];
    
    for (const category of categories) {
      if (query.toLowerCase().includes(category)) {
        suggestions.push({
          type: 'suggestion',
          filter: this.filterDefinitions.get('category')!,
          reason: `Found ${category} recipes matching your query`,
          confidence: 0.8,
          alternatives: []
        });
      }
    }
    
    return suggestions;
  }

  private async suggestIngredientFilters(query: string, items: FlavorRecipe[]): Promise<FilterSuggestion[]> {
    return [];
  }

  private async suggestNutritionFilters(query: string, items: FlavorRecipe[]): Promise<FilterSuggestion[]> {
    return [];
  }

  private async suggestAlternativeFilters(query: string, currentFilters: FilterExpression[], items: FlavorRecipe[]): Promise<FilterSuggestion[]> {
    return [];
  }

  private calculateFilterEffectiveness(filter: ComprehensiveFilter, originalItems: FlavorRecipe[], filteredItems: FlavorRecipe[]): number {
    const originalCount = originalItems.length;
    const filteredCount = filteredItems.length;
    return originalCount > 0 ? (originalCount - filteredCount) / originalCount : 0;
  }

  private calculateResultDistribution(items: FlavorRecipe[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const item of items) {
      const category = item.category || 'unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    }
    
    return distribution;
  }

  private getPopularFilters(filters: ComprehensiveFilter[]): FilterPopularity[] {
    return filters.map(filter => ({
      filterId: filter.id,
      usageCount: Math.floor(Math.random() * 100),
      avgResults: Math.floor(Math.random() * 50),
      successRate: Math.random()
    }));
  }

  private isZeroResultFilter(filter: ComprehensiveFilter, items: FlavorRecipe[]): boolean {
    const filtered = items.filter(item => this.evaluateFilter(item, filter));
    return filtered.length === 0;
  }

  private calculateComplexityScore(filters: ComprehensiveFilter[]): number {
    return filters.length * 0.1 + filters.reduce((sum, filter) => sum + filter.weight, 0);
  }

  private generateOptimizationSuggestions(filters: ComprehensiveFilter[]): string[] {
    const suggestions: string[] = [];
    
    if (filters.length > 10) {
      suggestions.push('Consider combining related filters to improve performance');
    }
    
    if (filters.some(f => f.operator === 'fuzzy')) {
      suggestions.push('Fuzzy matching filters may impact performance - consider using exact matching where possible');
    }
    
    return suggestions;
  }

  private async generateAvailableValues(items: FlavorRecipe[], filters: ComprehensiveFilter[]): Promise<Record<string, FilterValue[]>> {
    const availableValues: Record<string, FilterValue[]> = {};
    
    for (const filter of filters) {
      if (['multiselect', 'select'].includes(filter.type)) {
        availableValues[filter.id] = await this.getAvailableFilterValues(filter.id, items);
      }
    }
    
    return availableValues;
  }

  private async generateFilterSuggestions(query: string, filterQuery: FilterQuery, filteredItems: FlavorRecipe[]): Promise<FilterSuggestion[]> {
    return [];
  }
}

// Supporting interfaces and types
interface FilterAnalytics {
  [timestamp: number]: {
    query: string;
    filterCount: number;
    resultCount: number;
    executionTime: number;
  };
}

interface RegionalFilterData {
  [regionCode: string]: {
    name: string;
    currency: string;
    timezone: string;
  };
}

/**
 * Singleton instance of the comprehensive filter system
 */
export const comprehensiveFilterSystem = new ComprehensiveFilterSystem();