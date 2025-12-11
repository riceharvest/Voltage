/**
 * Flavor Profile Matching System
 * 
 * Advanced taste-based discovery system with flavor wheel mapping,
 * taste profile matching, and intelligent recipe recommendations
 * based on flavor preferences and similarity algorithms.
 * 
 * @module flavor-profile-matcher
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { FlavorRecipe } from './types';
import { FlavorProfile, FlavorWheelPosition } from './search-engine';
import { enhancedCache } from './enhanced-cache';
import { logger } from './logger';

// Flavor profile configuration
export interface FlavorProfileConfig {
  sweetnessLevels: number[];
  acidityLevels: number[];
  bitternessLevels: number[];
  umamiLevels: number[];
  carbonationLevels: number[];
  bodyTypes: ('light' | 'medium' | 'full')[];
  finishTypes: ('quick' | 'medium' | 'lingering')[];
}

export interface TastePreferences {
  targetSweetness: number; // 0-10
  targetAcidity: number; // 0-10
  targetBitterness: number; // 0-10
  targetUmami: number; // 0-10
  targetCarbonation: number; // 0-10
  preferredBody: 'light' | 'medium' | 'full';
  preferredFinish: 'quick' | 'medium' | 'lingering';
  dominantFlavorNotes: string[];
  avoidFlavors: string[];
  culturalPreferences: string[];
  seasonalPreferences: string[];
}

export interface FlavorMatchResult {
  recipe: FlavorRecipe;
  flavorProfile: FlavorProfile;
  matchScore: number; // 0-100
  similarityReasons: string[];
  adaptationSuggestions: string[];
  complementaryRecipes: string[];
}

export interface FlavorWheelNode {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  position: { x: number; y: number };
  intensity: number;
  color: string;
  children?: FlavorWheelNode[];
}

export interface FlavorSimilarityMatrix {
  [flavorId: string]: {
    [otherFlavorId: string]: number; // similarity score 0-1
  };
}

/**
 * Flavor Profile Matching System
 * 
 * Provides comprehensive taste-based discovery with flavor wheel mapping,
 * taste profile matching, based on
 * and intelligent recommendations flavor preferences and similarity algorithms.
 */
export class FlavorProfileMatcher {
  private flavorProfiles: Map<string, FlavorProfile> = new Map();
  private flavorWheel: FlavorWheelNode[] = [];
  private similarityMatrix: FlavorSimilarityMatrix = {};
  private config: FlavorProfileConfig = {
    sweetnessLevels: [0, 2, 4, 6, 8, 10],
    acidityLevels: [0, 2, 4, 6, 8, 10],
    bitternessLevels: [0, 2, 4, 6, 8, 10],
    umamiLevels: [0, 2, 4, 6, 8, 10],
    carbonationLevels: [0, 2, 4, 6, 8, 10],
    bodyTypes: ['light', 'medium', 'full'],
    finishTypes: ['quick', 'medium', 'lingering']
  };

  constructor() {
    this.initializeFlavorProfiles();
    this.initializeFlavorWheel();
    this.calculateSimilarityMatrix();
  }

  /**
   * Initialize comprehensive flavor profiles for all recipes
   */
  private async initializeFlavorProfiles(): Promise<void> {
    try {
      // Load all recipes
      const { flavors } = await import('../data/index');
      const allRecipes = await flavors.loadAllFlavors();

      // Generate flavor profiles for each recipe
      for (const recipe of allRecipes) {
        const profile = await this.generateFlavorProfile(recipe);
        this.flavorProfiles.set(recipe.id, profile);
      }

      logger.info(`Initialized ${this.flavorProfiles.size} flavor profiles`);
    } catch (error) {
      logger.error('Failed to initialize flavor profiles', error);
    }
  }

  /**
   * Generate comprehensive flavor profile for a recipe
   */
  private async generateFlavorProfile(recipe: FlavorRecipe): Promise<FlavorProfile> {
    const baseProfile = this.extractBaseFlavorProfile(recipe);
    const enhancedProfile = await this.enhanceWithIngredientData(baseProfile, recipe);
    const culturalProfile = await this.applyCulturalAdaptations(enhancedProfile, recipe);
    
    return {
      ...culturalProfile,
      flavorWheel: await this.generateFlavorWheelPositions(culturalProfile, recipe)
    };
  }

  /**
   * Extract base flavor profile from recipe data
   */
  private extractBaseFlavorProfile(recipe: FlavorRecipe): FlavorProfile {
    // Analyze recipe name and description for flavor clues
    const flavorText = `${recipe.name} ${recipe.profile}`.toLowerCase();
    
    // Determine sweetness level based on profile text and category
    let sweetness = this.inferSweetnessLevel(flavorText, recipe.category);
    
    // Determine acidity level from citrus and sour indicators
    let acidity = this.inferAcidityLevel(flavorText);
    
    // Determine bitterness from bitter ingredients and descriptions
    let bitterness = this.inferBitternessLevel(flavorText, recipe.ingredients);
    
    // Determine umami from savory indicators
    let umami = this.inferUmamiLevel(flavorText);
    
    // Determine carbonation from soda type and carbonated indicators
    let carbonation = this.inferCarbonationLevel(flavorText, recipe.sodaType);
    
    // Determine body and finish from recipe characteristics
    const body = this.inferBodyType(flavorText, recipe.ingredients);
    const finish = this.inferFinishType(flavorText);
    
    // Extract dominant flavors
    const dominantFlavors = this.extractDominantFlavors(flavorText, recipe.ingredients);
    
    // Generate taste notes
    const tasteNotes = this.generateTasteNotes(flavorText, dominantFlavors);

    return {
      tasteNotes,
      sweetness,
      acidity,
      bitterness,
      umami,
      carbonation,
      body,
      finish,
      dominantFlavors,
      flavorWheel: []
    };
  }

  /**
   * Enhance profile with detailed ingredient analysis
   */
  private async enhanceWithIngredientData(
    profile: FlavorProfile, 
    recipe: FlavorRecipe
  ): Promise<FlavorProfile> {
    const enhancedProfile = { ...profile };
    
    // Analyze ingredient list for flavor contributions
    if (recipe.ingredients) {
      for (const ingredient of recipe.ingredients) {
        const ingredientProfile = await this.getIngredientFlavorProfile(ingredient.ingredientId);
        if (ingredientProfile) {
          // Adjust profile based on ingredient amounts and types
          this.blendFlavorProfiles(enhancedProfile, ingredientProfile, ingredient.amount);
        }
      }
    }
    
    return enhancedProfile;
  }

  /**
   * Apply cultural and regional flavor adaptations
   */
  private async applyCulturalAdaptations(
    profile: FlavorProfile, 
    recipe: FlavorRecipe
  ): Promise<FlavorProfile> {
    const culturalProfile = { ...profile };
    
    // Apply regional flavor preferences
    if (recipe.category === 'classic') {
      // Classic sodas have regional variations
      switch (recipe.sodaType) {
        case 'cola':
          culturalProfile.dominantFlavors = this.adjustColaProfile(culturalProfile.dominantFlavors);
          break;
        case 'citrus':
          culturalProfile.dominantFlavors = this.adjustCitrusProfile(culturalProfile.dominantFlavors);
          break;
        case 'ginger-ale':
          culturalProfile.dominantFlavors = this.adjustGingerProfile(culturalProfile.dominantFlavors);
          break;
      }
    }
    
    return culturalProfile;
  }

  /**
   * Generate flavor wheel positions for visual representation
   */
  private async generateFlavorWheelPositions(
    profile: FlavorProfile, 
    recipe: FlavorRecipe
  ): Promise<FlavorWheelPosition[]> {
    const positions: FlavorWheelPosition[] = [];
    
    // Map dominant flavors to wheel positions
    for (const flavor of profile.dominantFlavors) {
      const wheelNode = this.findFlavorWheelNode(flavor);
      if (wheelNode) {
        positions.push({
          category: wheelNode.category,
          subcategory: wheelNode.subcategory,
          intensity: this.calculateFlavorIntensity(flavor, profile),
          position: wheelNode.position
        });
      }
    }
    
    return positions;
  }

  /**
   * Find recipes matching specific taste preferences
   */
  async findRecipesByTastePreferences(
    preferences: TastePreferences,
    options: {
      minMatchScore?: number;
      limit?: number;
      excludeIds?: string[];
      includeCategories?: string[];
    } = {}
  ): Promise<FlavorMatchResult[]> {
    const {
      minMatchScore = 70,
      limit = 20,
      excludeIds = [],
      includeCategories = []
    } = options;

    const matches: FlavorMatchResult[] = [];
    
    // Get all recipes with flavor profiles
    for (const [recipeId, flavorProfile] of this.flavorProfiles.entries()) {
      // Skip excluded recipes
      if (excludeIds.includes(recipeId)) continue;
      
      // Calculate taste match score
      const matchScore = this.calculateTasteMatchScore(flavorProfile, preferences);
      
      if (matchScore >= minMatchScore) {
        // Get the actual recipe (would be loaded from data service)
        const recipe = await this.getRecipeById(recipeId);
        if (recipe && (includeCategories.length === 0 || includeCategories.includes(recipe.category || ''))) {
          matches.push({
            recipe,
            flavorProfile,
            matchScore,
            similarityReasons: this.generateSimilarityReasons(flavorProfile, preferences),
            adaptationSuggestions: this.generateAdaptationSuggestions(flavorProfile, preferences),
            complementaryRecipes: await this.findComplementaryRecipes(recipeId, 3)
          });
        }
      }
    }
    
    // Sort by match score and return top results
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Find similar recipes based on flavor profile similarity
   */
  async findSimilarRecipes(
    recipeId: string,
    options: {
      limit?: number;
      similarityThreshold?: number;
      includeCategoryVariants?: boolean;
    } = {}
  ): Promise<FlavorMatchResult[]> {
    const { limit = 10, similarityThreshold = 0.6, includeCategoryVariants = true } = options;
    
    const targetProfile = this.flavorProfiles.get(recipeId);
    if (!targetProfile) return [];
    
    const similarRecipes: FlavorMatchResult[] = [];
    
    // Calculate similarity with all other recipes
    for (const [otherId, otherProfile] of this.flavorProfiles.entries()) {
      if (otherId === recipeId) continue;
      
      const similarityScore = this.calculateFlavorSimilarity(targetProfile, otherProfile);
      
      if (similarityScore >= similarityThreshold) {
        const recipe = await this.getRecipeById(otherId);
        if (recipe) {
          similarRecipes.push({
            recipe,
            flavorProfile: otherProfile,
            matchScore: similarityScore * 100,
            similarityReasons: this.generateSimilarityReasons(targetProfile, otherProfile),
            adaptationSuggestions: [],
            complementaryRecipes: []
          });
        }
      }
    }
    
    // Sort by similarity and return top matches
    return similarRecipes
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Get personalized flavor recommendations based on user history
   */
  async getPersonalizedFlavorRecommendations(
    userId: string,
    options: {
      limit?: number;
      explorationFactor?: number; // 0-1, higher = more exploration
      diversityFactor?: number; // 0-1, higher = more diversity
    } = {}
  ): Promise<FlavorMatchResult[]> {
    const { limit = 15, explorationFactor = 0.3, diversityFactor = 0.4 } = options;
    
    // Get user's flavor preference profile
    const userProfile = await this.buildUserFlavorProfile(userId);
    
    // Get candidate recipes
    const candidates = await this.findRecipesByTastePreferences(userProfile, { limit: limit * 2 });
    
    // Score recipes for personalization
    const scoredRecipes = this.scoreRecipesForPersonalization(
      candidates,
      userProfile,
      explorationFactor,
      diversityFactor
    );
    
    // Apply diversity constraints
    const diverseRecommendations = this.applyFlavorDiversity(scoredRecipes, limit);
    
    return diverseRecommendations;
  }

  /**
   * Generate flavor pairing suggestions
   */
  async generateFlavorPairings(
    baseRecipeId: string,
    options: {
      pairingType?: 'complementary' | 'contrasting' | 'enhancing';
      limit?: number;
    } = {}
  ): Promise<FlavorMatchResult[]> {
    const { pairingType = 'complementary', limit = 8 } = options;
    
    const baseProfile = this.flavorProfiles.get(baseRecipeId);
    if (!baseProfile) return [];
    
    const baseRecipe = await this.getRecipeById(baseRecipeId);
    if (!baseRecipe) return [];
    
    const pairingResults: FlavorMatchResult[] = [];
    
    for (const [otherId, otherProfile] of this.flavorProfiles.entries()) {
      if (otherId === baseRecipeId) continue;
      
      let pairingScore: number;
      let similarityReasons: string[];
      
      switch (pairingType) {
        case 'complementary':
          pairingScore = this.calculateComplementaryScore(baseProfile, otherProfile);
          similarityReasons = this.generateComplementaryReasons(baseProfile, otherProfile);
          break;
        case 'contrasting':
          pairingScore = this.calculateContrastingScore(baseProfile, otherProfile);
          similarityReasons = this.generateContrastingReasons(baseProfile, otherProfile);
          break;
        case 'enhancing':
          pairingScore = this.calculateEnhancingScore(baseProfile, otherProfile);
          similarityReasons = this.generateEnhancingReasons(baseProfile, otherProfile);
          break;
        default:
          continue;
      }
      
      if (pairingScore > 0.6) {
        const recipe = await this.getRecipeById(otherId);
        if (recipe) {
          pairingResults.push({
            recipe,
            flavorProfile: otherProfile,
            matchScore: pairingScore * 100,
            similarityReasons,
            adaptationSuggestions: this.generatePairingAdaptations(baseProfile, otherProfile),
            complementaryRecipes: []
          });
        }
      }
    }
    
    return pairingResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Get flavor wheel data for visualization
   */
  getFlavorWheel(): FlavorWheelNode[] {
    return [...this.flavorWheel];
  }

  /**
   * Calculate flavor similarity between two profiles
   */
  private calculateFlavorSimilarity(profile1: FlavorProfile, profile2: FlavorProfile): number {
    // Calculate taste dimension similarities
    const sweetnessSimilarity = 1 - Math.abs(profile1.sweetness - profile2.sweetness) / 10;
    const aciditySimilarity = 1 - Math.abs(profile1.acidity - profile2.acidity) / 10;
    const bitternessSimilarity = 1 - Math.abs(profile1.bitterness - profile2.bitterness) / 10;
    const umamiSimilarity = 1 - Math.abs(profile1.umami - profile2.umami) / 10;
    const carbonationSimilarity = 1 - Math.abs(profile1.carbonation - profile2.carbonation) / 10;
    
    // Body and finish similarities
    const bodySimilarity = profile1.body === profile2.body ? 1 : 0.5;
    const finishSimilarity = profile1.finish === profile2.finish ? 1 : 0.5;
    
    // Dominant flavor overlap
    const flavorOverlap = this.calculateFlavorOverlap(profile1.dominantFlavors, profile2.dominantFlavors);
    
    // Weighted average
    const similarities = [
      sweetnessSimilarity * 0.2,
      aciditySimilarity * 0.2,
      bitternessSimilarity * 0.15,
      umamiSimilarity * 0.15,
      carbonationSimilarity * 0.15,
      bodySimilarity * 0.1,
      finishSimilarity * 0.05,
      flavorOverlap * 0.1
    ];
    
    return similarities.reduce((sum, sim) => sum + sim, 0);
  }

  /**
   * Calculate taste match score between profile and preferences
   */
  private calculateTasteMatchScore(profile: FlavorProfile, preferences: TastePreferences): number {
    let score = 0;
    let weightSum = 0;
    
    // Sweetness match
    const sweetnessDiff = Math.abs(profile.sweetness - preferences.targetSweetness);
    const sweetnessScore = Math.max(0, 1 - sweetnessDiff / 10);
    score += sweetnessScore * 0.2;
    weightSum += 0.2;
    
    // Acidity match
    const acidityDiff = Math.abs(profile.acidity - preferences.targetAcidity);
    const acidityScore = Math.max(0, 1 - acidityDiff / 10);
    score += acidityScore * 0.2;
    weightSum += 0.2;
    
    // Bitterness match
    const bitternessDiff = Math.abs(profile.bitterness - preferences.targetBitterness);
    const bitternessScore = Math.max(0, 1 - bitternessDiff / 10);
    score += bitternessScore * 0.15;
    weightSum += 0.15;
    
    // Umami match
    const umamiDiff = Math.abs(profile.umami - preferences.targetUmami);
    const umamiScore = Math.max(0, 1 - umamiDiff / 10);
    score += umamiScore * 0.1;
    weightSum += 0.1;
    
    // Carbonation match
    const carbonationDiff = Math.abs(profile.carbonation - preferences.targetCarbonation);
    const carbonationScore = Math.max(0, 1 - carbonationDiff / 10);
    score += carbonationScore * 0.15;
    weightSum += 0.15;
    
    // Body match
    const bodyScore = profile.body === preferences.preferredBody ? 1 : 0.3;
    score += bodyScore * 0.05;
    weightSum += 0.05;
    
    // Finish match
    const finishScore = profile.finish === preferences.preferredFinish ? 1 : 0.3;
    score += finishScore * 0.05;
    weightSum += 0.05;
    
    // Flavor preference bonuses/penalties
    const flavorScore = this.calculateFlavorPreferenceScore(profile, preferences);
    score += flavorScore * 0.1;
    weightSum += 0.1;
    
    return (score / weightSum) * 100;
  }

  /**
   * Initialize comprehensive flavor wheel
   */
  private initializeFlavorWheel(): void {
    this.flavorWheel = [
      {
        id: 'sweet',
        name: 'Sweet',
        category: 'basic',
        subcategory: 'sweet',
        position: { x: 0, y: -1 },
        intensity: 5,
        color: '#FFB6C1',
        children: [
          { id: 'fruity-sweet', name: 'Fruity Sweet', category: 'sweet', subcategory: 'fruity', position: { x: -0.3, y: -0.7 }, intensity: 6, color: '#FF69B4' },
          { id: 'vanilla-sweet', name: 'Vanilla Sweet', category: 'sweet', subcategory: 'vanilla', position: { x: 0.3, y: -0.7 }, intensity: 4, color: '#F0E68C' },
          { id: 'caramel-sweet', name: 'Caramel Sweet', category: 'sweet', subcategory: 'caramel', position: { x: 0, y: -0.5 }, intensity: 7, color: '#D2691E' }
        ]
      },
      {
        id: 'sour',
        name: 'Sour',
        category: 'basic',
        subcategory: 'sour',
        position: { x: 1, y: 0 },
        intensity: 6,
        color: '#32CD32',
        children: [
          { id: 'citrus-sour', name: 'Citrus Sour', category: 'sour', subcategory: 'citrus', position: { x: 0.7, y: 0.3 }, intensity: 8, color: '#00FF00' },
          { id: 'tart-sour', name: 'Tart Sour', category: 'sour', subcategory: 'tart', position: { x: 0.7, y: -0.3 }, intensity: 7, color: '#ADFF2F' }
        ]
      },
      {
        id: 'bitter',
        name: 'Bitter',
        category: 'basic',
        subcategory: 'bitter',
        position: { x: 0, y: 1 },
        intensity: 3,
        color: '#8B4513',
        children: [
          { id: 'herbal-bitter', name: 'Herbal Bitter', category: 'bitter', subcategory: 'herbal', position: { x: 0.3, y: 0.7 }, intensity: 4, color: '#228B22' },
          { id: 'coffee-bitter', name: 'Coffee Bitter', category: 'bitter', subcategory: 'coffee', position: { x: -0.3, y: 0.7 }, intensity: 5, color: '#654321' }
        ]
      },
      {
        id: 'savory',
        name: 'Savory',
        category: 'basic',
        subcategory: 'savory',
        position: { x: -1, y: 0 },
        intensity: 2,
        color: '#DAA520',
        children: [
          { id: 'umami-savory', name: 'Umami Savory', category: 'savory', subcategory: 'umami', position: { x: -0.7, y: 0.3 }, intensity: 3, color: '#B8860B' },
          { id: 'spice-savory', name: 'Spice Savory', category: 'savory', subcategory: 'spice', position: { x: -0.7, y: -0.3 }, intensity: 4, color: '#D2691E' }
        ]
      }
    ];
  }

  // Helper methods for flavor inference and calculation
  private inferSweetnessLevel(text: string, category?: string): number {
    let sweetness = 5; // default medium sweetness
    
    if (text.includes('very sweet') || text.includes('extremely sweet')) sweetness = 9;
    else if (text.includes('sweet') || text.includes('dessert')) sweetness = 7;
    else if (text.includes('lightly sweet') || text.includes('subtle sweetness')) sweetness = 3;
    else if (text.includes('unsweet') || text.includes('dry')) sweetness = 1;
    
    // Category adjustments
    if (category === 'classic' && text.includes('cola')) sweetness = 6;
    if (category === 'energy' && text.includes('sugar-free')) sweetness = 2;
    
    return sweetness;
  }

  private inferAcidityLevel(text: string): number {
    let acidity = 3; // default low acidity
    
    if (text.includes('very sour') || text.includes('extremely tart')) acidity = 9;
    else if (text.includes('sour') || text.includes('tart')) acidity = 7;
    else if (text.includes('slightly sour') || text.includes('subtle acidity')) acidity = 4;
    else if (text.includes('citrus')) acidity += 3;
    else if (text.includes('lime') || text.includes('lemon')) acidity += 4;
    
    return Math.min(acidity, 10);
  }

  private inferBitternessLevel(text: string, ingredients?: any[]): number {
    let bitterness = 2; // default low bitterness
    
    if (text.includes('very bitter') || text.includes('extremely bitter')) bitterness = 8;
    else if (text.includes('bitter')) bitterness = 6;
    else if (text.includes('slightly bitter')) bitterness = 3;
    
    // Check ingredients for bitter compounds
    if (ingredients) {
      const bitterIngredients = ['coffee', 'cocoa', 'quinine', 'hops', 'herbal'];
      for (const ingredient of ingredients) {
        if (bitterIngredients.some(bitter => 
          ingredient.ingredientId.includes(bitter)
        )) {
          bitterness += 2;
        }
      }
    }
    
    return Math.min(bitterness, 10);
  }

  private inferUmamiLevel(text: string): number {
    let umami = 1; // default very low umami
    
    if (text.includes('savory') || text.includes('umami')) umami = 6;
    else if (text.includes('rich') || text.includes('full-bodied')) umami = 4;
    else if (text.includes('brothy') || text.includes('meaty')) umami = 8;
    
    return Math.min(umami, 10);
  }

  private inferCarbonationLevel(text: string, sodaType?: string): number {
    let carbonation = 7; // default high carbonation (it's a soda app)
    
    if (text.includes('still') || text.includes('flat')) carbonation = 1;
    else if (text.includes('lightly carbonated') || text.includes('gentle fizz')) carbonation = 4;
    else if (text.includes('highly carbonated') || text.includes('aggressive fizz')) carbonation = 9;
    
    // Soda type adjustments
    switch (sodaType) {
      case 'energy-drink': carbonation = 8; break;
      case 'cola': carbonation = 7; break;
      case 'ginger-ale': carbonation = 6; break;
      case 'cream': carbonation = 4; break;
    }
    
    return Math.min(carbonation, 10);
  }

  private inferBodyType(text: string, ingredients?: any[]): 'light' | 'medium' | 'full' {
    if (text.includes('light') || text.includes('thin') || text.includes('watery')) return 'light';
    if (text.includes('full') || text.includes('rich') || text.includes('thick')) return 'full';
    return 'medium';
  }

  private inferFinishType(text: string): 'quick' | 'medium' | 'lingering' {
    if (text.includes('quick finish') || text.includes('clean finish')) return 'quick';
    if (text.includes('lingering') || text.includes('long finish') || text.includes('persistent')) return 'lingering';
    return 'medium';
  }

  private extractDominantFlavors(text: string, ingredients?: any[]): string[] {
    const flavors: string[] = [];
    
    // Extract from text
    const flavorKeywords = [
      'berry', 'citrus', 'tropical', 'vanilla', 'caramel', 'chocolate',
      'coffee', 'herbal', 'spice', 'mint', 'ginger', 'cinnamon',
      'apple', 'grape', 'orange', 'lemon', 'lime', 'peach'
    ];
    
    for (const keyword of flavorKeywords) {
      if (text.includes(keyword)) {
        flavors.push(keyword);
      }
    }
    
    // Extract from ingredients
    if (ingredients) {
      for (const ingredient of ingredients) {
        const ingredientName = ingredient.ingredientId.toLowerCase();
        for (const keyword of flavorKeywords) {
          if (ingredientName.includes(keyword) && !flavors.includes(keyword)) {
            flavors.push(keyword);
          }
        }
      }
    }
    
    return flavors.length > 0 ? flavors : ['neutral'];
  }

  private generateTasteNotes(text: string, dominantFlavors: string[]): string[] {
    const notes: string[] = [];
    
    // Generate descriptive notes based on dominant flavors
    for (const flavor of dominantFlavors) {
      switch (flavor) {
        case 'berry':
          notes.push('Sweet-tart berry notes', 'Fruity complexity');
          break;
        case 'citrus':
          notes.push('Bright citrus zest', 'Refreshing acidity');
          break;
        case 'tropical':
          notes.push('Exotic tropical fruits', 'Island-inspired sweetness');
          break;
        case 'vanilla':
          notes.push('Smooth vanilla sweetness', 'Creamy undertones');
          break;
        case 'caramel':
          notes.push('Rich caramel notes', 'Toasty sweetness');
          break;
        case 'ginger':
          notes.push('Spicy ginger warmth', 'Digestive-friendly spice');
          break;
        case 'mint':
          notes.push('Cool mint freshness', 'Crisp aftertaste');
          break;
        default:
          notes.push(`${flavor} undertones`);
      }
    }
    
    return notes;
  }

  private calculateFlavorOverlap(flavors1: string[], flavors2: string[]): number {
    const set1 = new Set(flavors1);
    const set2 = new Set(flavors2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private calculateFlavorPreferenceScore(profile: FlavorProfile, preferences: TastePreferences): number {
    let score = 0;
    
    // Bonus for preferred flavors
    for (const preference of preferences.dominantFlavorNotes) {
      if (profile.dominantFlavors.includes(preference)) {
        score += 0.2;
      }
    }
    
    // Penalty for avoided flavors
    for (const avoid of preferences.avoidFlavors) {
      if (profile.dominantFlavors.includes(avoid)) {
        score -= 0.3;
      }
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  // Additional helper methods would be implemented here...
  private async getIngredientFlavorProfile(ingredientId: string): Promise<Partial<FlavorProfile> | null> {
    // This would integrate with ingredient database
    return null;
  }

  private blendFlavorProfiles(base: FlavorProfile, ingredient: Partial<FlavorProfile>, amount: number): void {
    // Blend ingredient flavor profile with base
  }

  private adjustColaProfile(flavors: string[]): string[] {
    // Apply regional cola adaptations
    return flavors;
  }

  private adjustCitrusProfile(flavors: string[]): string[] {
    // Apply regional citrus adaptations
    return flavors;
  }

  private adjustGingerProfile(flavors: string[]): string[] {
    // Apply regional ginger adaptations
    return flavors;
  }

  private findFlavorWheelNode(flavor: string): FlavorWheelNode | undefined {
    // Find flavor wheel node by name
    return undefined;
  }

  private calculateFlavorIntensity(flavor: string, profile: FlavorProfile): number {
    return profile.dominantFlavors.indexOf(flavor) + 1;
  }

  private async getRecipeById(id: string): Promise<FlavorRecipe | null> {
    // This would load recipe from data service
    return null;
  }

  private generateSimilarityReasons(profile1: FlavorProfile, profile2: FlavorProfile | TastePreferences): string[] {
    return ['Similar flavor profile'];
  }

  private generateAdaptationSuggestions(profile: FlavorProfile, preferences: TastePreferences): string[] {
    return ['Add more citrus for brightness', 'Reduce sweetness for better balance'];
  }

  private async findComplementaryRecipes(recipeId: string, limit: number): Promise<string[]> {
    return [];
  }

  private async buildUserFlavorProfile(userId: string): Promise<TastePreferences> {
    // Build profile from user history and preferences
    return {
      targetSweetness: 5,
      targetAcidity: 4,
      targetBitterness: 2,
      targetUmami: 1,
      targetCarbonation: 7,
      preferredBody: 'medium',
      preferredFinish: 'medium',
      dominantFlavorNotes: ['citrus', 'berry'],
      avoidFlavors: [],
      culturalPreferences: [],
      seasonalPreferences: []
    };
  }

  private scoreRecipesForPersonalization(
    recipes: FlavorMatchResult[],
    userProfile: TastePreferences,
    explorationFactor: number,
    diversityFactor: number
  ): FlavorMatchResult[] {
    // Score recipes for personalization with exploration and diversity
    return recipes;
  }

  private applyFlavorDiversity(recipes: FlavorMatchResult[], limit: number): FlavorMatchResult[] {
    // Apply diversity constraints to recommendations
    return recipes.slice(0, limit);
  }

  private calculateComplementaryScore(profile1: FlavorProfile, profile2: FlavorProfile): number {
    return 0.7;
  }

  private calculateContrastingScore(profile1: FlavorProfile, profile2: FlavorProfile): number {
    return 0.6;
  }

  private calculateEnhancingScore(profile1: FlavorProfile, profile2: FlavorProfile): number {
    return 0.8;
  }

  private generateComplementaryReasons(profile1: FlavorProfile, profile2: FlavorProfile): string[] {
    return ['Complementary flavor profiles'];
  }

  private generateContrastingReasons(profile1: FlavorProfile, profile2: FlavorProfile): string[] {
    return ['Contrasting flavor profiles'];
  }

  private generateEnhancingReasons(profile1: FlavorProfile, profile2: FlavorProfile): string[] {
    return ['Enhancing flavor profiles'];
  }

  private generatePairingAdaptations(profile1: FlavorProfile, profile2: FlavorProfile): string[] {
    return ['Perfect pairing combination'];
  }

  private calculateSimilarityMatrix(): void {
    // Pre-calculate similarity matrix for performance
    this.similarityMatrix = {};
  }
}

/**
 * Singleton instance of the flavor profile matcher
 */
export const flavorProfileMatcher = new FlavorProfileMatcher();