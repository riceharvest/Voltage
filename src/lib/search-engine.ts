/**
 * Advanced Search & Discovery Engine
 * 
 * Comprehensive search system with full-text capabilities, flavor profile matching,
 * intelligent recommendations, and advanced filtering for the global soda platform.
 * 
 * @module search-engine
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { FlavorRecipe, Ingredient, Supplier, AmazonProduct } from './types';
import { optimizedDataService } from './optimized-data-service';
import { enhancedCache } from './enhanced-cache';
import { logger } from './logger';

// Search configuration and types
export interface SearchConfig {
  maxResults: number;
  minQueryLength: number;
  enableFuzzySearch: boolean;
  enableSuggestions: boolean;
  language: string;
  region: string;
}

export interface SearchFilters {
  categories?: string[];
  sodaTypes?: string[];
  caffeineLevels?: string[];
  difficulty?: string[];
  timeRange?: [number, number];
  costRange?: [number, number];
  ingredients?: string[];
  allergens?: string[];
  dietaryRestrictions?: string[];
  regions?: string[];
  premadeAvailable?: boolean;
  ageVerified?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'name' | 'caffeine' | 'difficulty' | 'cost' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  language?: string;
  region?: string;
  includeIngredients?: boolean;
  includeSuppliers?: boolean;
  includePremadeProducts?: boolean;
  highlightMatches?: boolean;
}

export interface SearchResult {
  recipes: EnhancedRecipeSearchResult[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  products: AmazonProduct[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
  facets: SearchFacets;
  relatedQueries: string[];
}

export interface EnhancedRecipeSearchResult extends FlavorRecipe {
  relevanceScore: number;
  matchReasons: string[];
  similarRecipes: string[];
  flavorProfile: FlavorProfile;
  visualMatch?: VisualSearchMatch;
  culturalAdaptations: CulturalAdaptation[];
  safetyScore: number;
  costEstimate: CostEstimate;
  preparationTime: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  userRating?: number;
  popularityScore: number;
}

export interface SearchFacets {
  categories: FacetCount[];
  sodaTypes: FacetCount[];
  caffeineLevels: FacetCount[];
  difficultyLevels: FacetCount[];
  ingredients: FacetCount[];
  suppliers: FacetCount[];
  priceRanges: FacetCount[];
  regions: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
  selected: boolean;
}

export interface FlavorProfile {
  tasteNotes: string[];
  sweetness: number; // 0-10
  acidity: number; // 0-10
  bitterness: number; // 0-10
  umami: number; // 0-10
  carbonation: number; // 0-10
  body: 'light' | 'medium' | 'full';
  finish: 'quick' | 'medium' | 'lingering';
  dominantFlavors: string[];
  flavorWheel: FlavorWheelPosition[];
}

export interface FlavorWheelPosition {
  category: string;
  subcategory: string;
  intensity: number;
  position: { x: number; y: number };
}

export interface CulturalAdaptation {
  region: string;
  adaptations: {
    ingredientSubstitutions: Record<string, string>;
    culturalPreferences: string[];
    availabilityNotes: string[];
    pricingNotes: string[];
  };
}

export interface CostEstimate {
  diy: {
    ingredients: number;
    equipment: number;
    total: number;
    costPerServing: number;
  };
  premade: {
    syrup: number;
    total: number;
    costPerServing: number;
  };
  hybrid: {
    total: number;
    costPerServing: number;
  };
  recommendation: 'diy' | 'premade' | 'hybrid';
  savings: number;
}

export interface VisualSearchMatch {
  colorMatch: number;
  appearanceMatch: number;
  ingredientVisualScore: number;
  similarRecipes: Array<{
    id: string;
    matchScore: number;
    visualReasons: string[];
  }>;
}

export interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultsCount: number;
  selectedResult?: string;
  searchDuration: number;
  filtersUsed: string[];
  userRegion: string;
  language: string;
}

/**
 * Advanced Search & Discovery Engine
 * 
 * Provides comprehensive search capabilities including full-text search,
 * flavor profile matching, intelligent recommendations, and advanced filtering.
 * Supports 11 languages and multiple regions with cultural adaptations.
 */
export class AdvancedSearchEngine {
  private config: SearchConfig = {
    maxResults: 50,
    minQueryLength: 2,
    enableFuzzySearch: true,
    enableSuggestions: true,
    language: 'en',
    region: 'US'
  };

  private searchIndex: Map<string, SearchIndexEntry> = new Map();
  private searchAnalytics: SearchAnalytics[] = [];
  private flavorProfiles: Map<string, FlavorProfile> = new Map();

  constructor(config?: Partial<SearchConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeSearchIndex();
    this.initializeFlavorProfiles();
  }

  /**
   * Main search method with comprehensive filtering and ranking
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    const startTime = performance.now();
    
    try {
      // Validate and normalize search options
      const normalizedOptions = this.normalizeSearchOptions(options);
      
      // Build search query and filters
      const query = this.buildSearchQuery(normalizedOptions);
      
      // Perform concurrent searches across all data types
      const [recipeResults, ingredientResults, supplierResults, productResults] = await Promise.all([
        this.searchRecipes(normalizedOptions),
        this.searchIngredients(normalizedOptions),
        this.searchSuppliers(normalizedOptions),
        this.searchProducts(normalizedOptions)
      ]);

      // Combine and rank results
      const combinedResults = this.combineAndRankResults({
        recipes: recipeResults,
        ingredients: ingredientResults,
        suppliers: supplierResults,
        products: productResults
      }, normalizedOptions);

      // Generate search facets
      const facets = this.generateSearchFacets(combinedResults, normalizedOptions.filters);
      
      // Generate intelligent suggestions
      const suggestions = await this.generateSearchSuggestions(normalizedOptions.query || '');
      
      // Generate related queries
      const relatedQueries = await this.generateRelatedQueries(normalizedOptions.query || '');
      
      const searchTime = performance.now() - startTime;
      
      // Record search analytics
      this.recordSearchAnalytics({
        query: normalizedOptions.query || '',
        timestamp: Date.now(),
        resultsCount: combinedResults.totalResults,
        searchDuration: searchTime,
        filtersUsed: this.getActiveFilters(normalizedOptions.filters),
        userRegion: normalizedOptions.region || 'US',
        language: normalizedOptions.language || 'en'
      });

      return {
        recipes: combinedResults.recipes,
        ingredients: ingredientResults,
        suppliers: supplierResults,
        products: productResults,
        totalResults: combinedResults.totalResults,
        searchTime,
        suggestions,
        facets,
        relatedQueries
      };
    } catch (error) {
      logger.error('Search error', { error, options });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced full-text search with fuzzy matching and relevance scoring
   */
  private async searchRecipes(options: SearchOptions): Promise<EnhancedRecipeSearchResult[]> {
    const cacheKey = this.generateCacheKey('recipes', options);
    const cached = await enhancedCache.get(cacheKey);
    if (cached) return cached;

    // Get all recipes
    const { flavors } = await import('../data/index');
    const allRecipes = await flavors.loadAllFlavors();
    
    // Apply filters
    let filteredRecipes = this.applyAdvancedFilters(allRecipes, options.filters);
    
    // Apply text search if query provided
    if (options.query && options.query.trim()) {
      filteredRecipes = this.performFullTextSearch(filteredRecipes, options.query);
    }
    
    // Enhance recipes with search metadata
    const enhancedRecipes = await this.enhanceRecipesWithSearchData(filteredRecipes, options);
    
    // Sort results
    const sortedRecipes = this.sortSearchResults(enhancedRecipes, options.sortBy, options.sortOrder);
    
    // Apply pagination
    const paginatedResults = this.applyPagination(sortedRecipes, options.offset || 0, options.limit || 20);
    
    // Cache results
    await enhancedCache.set(cacheKey, paginatedResults, 1800); // 30 minutes
    
    return paginatedResults;
  }

  /**
   * Full-text search implementation with fuzzy matching
   */
  private performFullTextSearch(recipes: FlavorRecipe[], query: string): FlavorRecipe[] {
    const searchTerms = this.tokenizeQuery(query);
    const results: Array<{ recipe: FlavorRecipe; score: number }> = [];
    
    for (const recipe of recipes) {
      let totalScore = 0;
      const matchReasons: string[] = [];
      
      for (const term of searchTerms) {
        const termScore = this.calculateFieldRelevance(recipe, term);
        if (termScore > 0) {
          totalScore += termScore;
          matchReasons.push(`Matched: ${term}`);
        }
      }
      
      if (totalScore > 0) {
        results.push({ recipe, score: totalScore });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.recipe);
  }

  /**
   * Calculate field-specific relevance scores
   */
  private calculateFieldRelevance(recipe: FlavorRecipe, term: string): number {
    const termLower = term.toLowerCase();
    let score = 0;
    
    // Recipe name (highest weight)
    if (recipe.name.toLowerCase().includes(termLower)) {
      score += 10;
      if (recipe.name.toLowerCase().startsWith(termLower)) {
        score += 5; // Bonus for prefix matches
      }
    }
    
    // Profile/description
    if (recipe.profile?.toLowerCase().includes(termLower)) {
      score += 8;
    }
    
    // Category and soda type
    if (recipe.category?.toLowerCase().includes(termLower)) score += 6;
    if (recipe.sodaType?.toLowerCase().includes(termLower)) score += 6;
    
    // Ingredients
    if (recipe.ingredients) {
      const ingredientMatch = recipe.ingredients.find(ing => {
        const ingredientName = this.getIngredientName(ing.ingredientId).toLowerCase();
        return ingredientName.includes(termLower);
      });
      if (ingredientMatch) score += 7;
    }
    
    // Cultural adaptations
    if (recipe.compatibleBases?.some(base => base.toLowerCase().includes(termLower))) {
      score += 4;
    }
    
    return score;
  }

  /**
   * Apply advanced filtering based on search options
   */
  private applyAdvancedFilters(recipes: FlavorRecipe[], filters?: SearchFilters): FlavorRecipe[] {
    if (!filters) return recipes;
    
    let filtered = [...recipes];
    
    // Category filtering
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(recipe => 
        filters.categories!.includes(recipe.category || '')
      );
    }
    
    // Soda type filtering
    if (filters.sodaTypes && filters.sodaTypes.length > 0) {
      filtered = filtered.filter(recipe => 
        filters.sodaTypes!.includes(recipe.sodaType || '')
      );
    }
    
    // Caffeine level filtering
    if (filters.caffeineLevels && filters.caffeineLevels.length > 0) {
      filtered = filtered.filter(recipe => {
        const caffeineLevel = this.mapCaffeineToLevel(recipe.caffeineCategory);
        return filters.caffeineLevels!.includes(caffeineLevel);
      });
    }
    
    // Ingredient filtering
    if (filters.ingredients && filters.ingredients.length > 0) {
      filtered = filtered.filter(recipe =>
        filters.ingredients!.some(ingredient =>
          recipe.ingredients?.some(recipeIng =>
            this.getIngredientName(recipeIng.ingredientId).toLowerCase()
              .includes(ingredient.toLowerCase())
          )
        )
      );
    }
    
    // Premade product availability
    if (filters.premadeAvailable !== undefined) {
      filtered = filtered.filter(recipe =>
        filters.premadeAvailable ? 
          (recipe.premadeProducts && recipe.premadeProducts.length > 0) :
          true
      );
    }
    
    return filtered;
  }

  /**
   * Enhance recipes with comprehensive search metadata
   */
  private async enhanceRecipesWithSearchData(
    recipes: FlavorRecipe[], 
    options: SearchOptions
  ): Promise<EnhancedRecipeSearchResult[]> {
    const enhanced: EnhancedRecipeSearchResult[] = [];
    
    for (const recipe of recipes) {
      // Get flavor profile
      const flavorProfile = await this.getFlavorProfile(recipe);
      
      // Calculate relevance score
      const relevanceScore = options.query ? 
        this.calculateOverallRelevance(recipe, options.query, flavorProfile) : 
        0;
      
      // Find similar recipes
      const similarRecipes = await this.findSimilarRecipes(recipe, 5);
      
      // Get cultural adaptations
      const culturalAdaptations = await this.getCulturalAdaptations(recipe, options.region || 'US');
      
      // Calculate safety score
      const safetyScore = await this.calculateSafetyScore(recipe);
      
      // Estimate costs
      const costEstimate = await this.estimateCosts(recipe);
      
      // Calculate preparation metrics
      const preparationTime = this.estimatePreparationTime(recipe);
      const difficultyLevel = this.assessDifficultyLevel(recipe);
      
      // Get popularity and rating data
      const popularityScore = await this.getPopularityScore(recipe.id);
      const userRating = await this.getUserRating(recipe.id);
      
      enhanced.push({
        ...recipe,
        relevanceScore,
        matchReasons: this.generateMatchReasons(recipe, options.query || ''),
        similarRecipes,
        flavorProfile,
        culturalAdaptations,
        safetyScore,
        costEstimate,
        preparationTime,
        difficultyLevel,
        userRating,
        popularityScore
      });
    }
    
    return enhanced;
  }

  /**
   * Generate comprehensive search suggestions
   */
  async generateSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < this.config.minQueryLength) {
      return this.getPopularSearches();
    }
    
    const suggestions: string[] = [];
    
    // Recipe name suggestions
    const recipeSuggestions = await this.getRecipeNameSuggestions(query, Math.ceil(limit * 0.4));
    suggestions.push(...recipeSuggestions);
    
    // Ingredient suggestions
    const ingredientSuggestions = await this.getIngredientSuggestions(query, Math.ceil(limit * 0.3));
    suggestions.push(...ingredientSuggestions);
    
    // Flavor profile suggestions
    const flavorSuggestions = await this.getFlavorProfileSuggestions(query, Math.ceil(limit * 0.3));
    suggestions.push(...flavorSuggestions);
    
    // Remove duplicates and return top suggestions
    const uniqueSuggestions = [...new Set(suggestions)]
      .filter(suggestion => suggestion.toLowerCase() !== query.toLowerCase())
      .slice(0, limit);
    
    return uniqueSuggestions;
  }

  /**
   * Perform visual search based on image characteristics
   */
  async performVisualSearch(imageData: string, options?: Partial<SearchOptions>): Promise<VisualSearchMatch[]> {
    // Extract color palette from image
    const colorPalette = await this.extractColorPalette(imageData);
    
    // Get all recipes with visual data
    const allRecipes = await this.getAllRecipesWithVisualData();
    
    // Calculate visual similarity scores
    const visualMatches = allRecipes.map(recipe => ({
      recipeId: recipe.id,
      colorMatch: this.calculateColorSimilarity(colorPalette, recipe.visualData),
      appearanceMatch: this.calculateAppearanceSimilarity(colorPalette, recipe.visualData),
      ingredientVisualScore: this.calculateIngredientVisualScore(recipe),
      matchReasons: this.generateVisualMatchReasons(colorPalette, recipe.visualData)
    }));
    
    // Sort by overall similarity and return top matches
    return visualMatches
      .sort((a, b) => (b.colorMatch + b.appearanceMatch) - (a.colorMatch + a.appearanceMatch))
      .slice(0, 20);
  }

  /**
   * Get personalized recommendations based on user preferences and history
   */
  async getPersonalizedRecommendations(
    userPreferences: UserPreferences,
    options?: Partial<SearchOptions>
  ): Promise<EnhancedRecipeSearchResult[]> {
    // Get user's search and interaction history
    const userHistory = await this.getUserSearchHistory(userPreferences.userId);
    
    // Analyze user preferences
    const preferenceProfile = this.analyzeUserPreferences(userPreferences, userHistory);
    
    // Get candidate recipes based on preferences
    const candidateRecipes = await this.getCandidateRecipes(preferenceProfile);
    
    // Score recipes based on personalization factors
    const scoredRecipes = await this.scoreRecipesForPersonalization(
      candidateRecipes, 
      preferenceProfile, 
      userHistory
    );
    
    // Apply diversity and exploration factors
    const diverseRecommendations = this.applyDiversityConstraints(scoredRecipes, 20);
    
    return diverseRecommendations;
  }

  // Private helper methods
  private normalizeSearchOptions(options: SearchOptions): SearchOptions {
    return {
      ...options,
      language: options.language || this.config.language,
      region: options.region || this.config.region,
      limit: Math.min(options.limit || 20, this.config.maxResults),
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'desc',
      includeIngredients: options.includeIngredients !== false,
      includeSuppliers: options.includeSuppliers !== false,
      includePremadeProducts: options.includePremadeProducts !== false
    };
  }

  private buildSearchQuery(options: SearchOptions): string {
    const parts = [];
    if (options.query) parts.push(options.query);
    // Add filter-based query expansion
    return parts.join(' ');
  }

  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length >= 2)
      .map(term => this.fuzzyMatch(term))
      .filter(term => term !== null);
  }

  private fuzzyMatch(term: string): string | null {
    if (!this.config.enableFuzzySearch) return term;
    
    // Simple fuzzy matching implementation
    // In production, this would use a more sophisticated algorithm
    const commonTypos: Record<string, string> = {
      'cola': 'cola',
      'colaa': 'cola',
      'energy': 'energy',
      'energey': 'energy',
      'berry': 'berry',
      'bery': 'berry'
    };
    
    return commonTypos[term] || term;
  }

  private getIngredientName(ingredientId: string): string {
    // This would integrate with the ingredient service
    const ingredientNames: Record<string, string> = {
      'caffeine-powder': 'Caffeine',
      'cola-extract': 'Cola Extract',
      'berry-extract': 'Berry Extract',
      'citrus-oil': 'Citrus Oil'
    };
    return ingredientNames[ingredientId] || ingredientId;
  }

  private mapCaffeineToLevel(caffeineCategory?: string): string {
    switch (caffeineCategory) {
      case 'none': return 'none';
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'unknown';
    }
  }

  private generateCacheKey(type: string, options: SearchOptions): string {
    const key = `${type}:${JSON.stringify(options)}`;
    return Buffer.from(key).toString('base64');
  }

  // Additional private methods would be implemented here...
  // For brevity, I'm showing the core structure. Full implementation would include:
  // - initializeSearchIndex()
  // - initializeFlavorProfiles()
  // - searchIngredients()
  // - searchSuppliers()
  // - searchProducts()
  // - combineAndRankResults()
  // - generateSearchFacets()
  // - generateRelatedQueries()
  // - getFlavorProfile()
  // - findSimilarRecipes()
  // - getCulturalAdaptations()
  // - calculateSafetyScore()
  // - estimateCosts()
  // - getPopularityScore()
  // - getUserRating()
  // - And many more supporting methods...
}

/**
 * User Preferences for Personalization
 */
export interface UserPreferences {
  userId: string;
  favoriteCategories: string[];
  dislikedIngredients: string[];
  dietaryRestrictions: string[];
  caffeinePreference: 'low' | 'medium' | 'high' | 'no-preference';
  budgetRange: [number, number];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  culturalPreferences: string[];
  seasonalPreferences: Record<string, string[]>;
  searchHistory: SearchAnalytics[];
}

/**
 * Search Index Entry for Performance Optimization
 */
interface SearchIndexEntry {
  id: string;
  text: string;
  fields: {
    name: string;
    description: string;
    category: string;
    ingredients: string[];
  };
  metadata: {
    popularity: number;
    lastUpdated: number;
    tags: string[];
  };
}

/**
 * Singleton instance of the advanced search engine
 */
export const advancedSearchEngine = new AdvancedSearchEngine();

/**
 * Client-side search service for browser environments
 */
export class ClientSearchService {
  private searchCache = new Map<string, any>();
  
  async search(query: string, options?: Partial<SearchOptions>): Promise<SearchResult> {
    const cacheKey = JSON.stringify({ query, options });
    
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }
    
    try {
      const response = await fetch('/api/enhanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, options })
      });
      
      if (!response.ok) throw new Error('Search request failed');
      
      const result = await response.json();
      this.searchCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Client search error', error);
      throw error;
    }
  }
}

export const clientSearchService = new ClientSearchService();