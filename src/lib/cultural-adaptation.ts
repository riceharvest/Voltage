/**
 * Cultural Adaptation Service
 * 
 * Provides comprehensive cultural and regional adaptations for beverages
 * including taste preferences, ingredient substitutions, regulatory compliance,
 * and local unit systems.
 */

import { FlavorRecipe } from './types';

/**
 * Cultural Profile Interface
 */
export interface CulturalProfile {
  region: string;
  country: string;
  language: string;
  culturalPreferences: {
    sweetness: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    acidity: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    carbonation: 'still' | 'light' | 'medium' | 'high';
    caffeine: 'none' | 'low' | 'medium' | 'high';
  };
  tastePreferences: string[];
  dietaryRestrictions: string[];
  unitSystem: {
    primary: string;
    temperature: string;
    volume: string;
    weight: string;
  };
  regulatoryRequirements: {
    caffeine: { max: number; unit: string };
    sugar: { max: number; unit: string };
    labeling: string[];
    ageRestrictions: number;
  };
  seasonalPreferences: {
    spring: string[];
    summer: string[];
    autumn: string[];
    winter: string[];
  };
  localIngredients: Array<{
    id: string;
    name: string;
    availability: 'abundant' | 'common' | 'limited' | 'rare';
    cost: number;
    substitute?: string;
  }>;
}

/**
 * Adaptation Result Interface
 */
export interface AdaptationResult {
  adaptedFlavor: FlavorRecipe;
  modifications: {
    ingredients: Array<{
      original: string;
      adapted: string;
      reason: string;
      cost: number;
    }>;
    proportions: Array<{
      ingredient: string;
      originalAmount: number;
      adaptedAmount: number;
      unit: string;
      reason: string;
    }>;
    taste: Array<{
      aspect: string;
      adjustment: string;
      reason: string;
    }>;
  };
  culturalNotes: {
    preparation: string[];
    serving: string[];
    occasions: string[];
    etiquette: string[];
  };
  complianceCheck: {
    compliant: boolean;
    warnings: string[];
    requirements: string[];
    certifications: string[];
  };
  nutritionalAdaptation: {
    calories: number;
    sugar: number;
    caffeine: number;
    vitamins: Record<string, number>;
  };
}

/**
 * Cultural Adaptation Service
 */
export class CulturalAdaptationService {
  private culturalProfiles: Map<string, CulturalProfile> = new Map();
  private ingredientSubstitutions: Map<string, Record<string, string>> = new Map();

  constructor() {
    this.initializeCulturalProfiles();
    this.initializeIngredientSubstitutions();
  }

  /**
   * Initialize cultural profiles for major regions
   */
  private initializeCulturalProfiles(): void {
    // European profiles
    this.culturalProfiles.set('EU', {
      region: 'Europe',
      country: 'European Union',
      language: 'en',
      culturalPreferences: {
        sweetness: 'medium',
        acidity: 'medium',
        carbonation: 'high',
        caffeine: 'medium'
      },
      tastePreferences: ['balanced', 'natural', 'refreshing'],
      dietaryRestrictions: ['vegetarian', 'vegan'],
      unitSystem: {
        primary: 'metric',
        temperature: 'celsius',
        volume: 'liters',
        weight: 'grams'
      },
      regulatoryRequirements: {
        caffeine: { max: 320, unit: 'mg' },
        sugar: { max: 25, unit: 'g' },
        labeling: ['EU nutrition facts', 'allergen warnings', 'origin'],
        ageRestrictions: 16
      },
      seasonalPreferences: {
        spring: ['citrus', 'light', 'refreshing'],
        summer: ['fruity', 'sparkling', 'cold'],
        autumn: ['spiced', 'warm', 'cozy'],
        winter: ['rich', 'bold', 'comforting']
      },
      localIngredients: [
        { id: 'alpine-water', name: 'Alpine Spring Water', availability: 'abundant', cost: 1.2 },
        { id: 'mediterranean-citrus', name: 'Mediterranean Citrus', availability: 'common', cost: 3.5 },
        { id: 'herbal-extracts', name: 'European Herbal Extracts', availability: 'common', cost: 8.0 }
      ]
    });

    this.culturalProfiles.set('NL', {
      region: 'Western Europe',
      country: 'Netherlands',
      language: 'nl',
      culturalPreferences: {
        sweetness: 'low',
        acidity: 'medium',
        carbonation: 'high',
        caffeine: 'low'
      },
      tastePreferences: ['refreshing', 'clean', 'minimalist'],
      dietaryRestrictions: ['vegetarian', 'organic-preferred'],
      unitSystem: {
        primary: 'metric',
        temperature: 'celsius',
        volume: 'milliliters',
        weight: 'grams'
      },
      regulatoryRequirements: {
        caffeine: { max: 320, unit: 'mg' },
        sugar: { max: 25, unit: 'g' },
        labeling: ['Dutch nutrition facts', 'allergen warnings', 'origin'],
        ageRestrictions: 16
      },
      seasonalPreferences: {
        spring: ['citrus', 'light', 'refreshing'],
        summer: ['fruity', 'sparkling', 'cold'],
        autumn: ['spiced', 'warm', 'cozy'],
        winter: ['rich', 'bold', 'comforting']
      },
      localIngredients: [
        { id: 'dutch-water', name: 'Dutch Spring Water', availability: 'abundant', cost: 1.0 },
        { id: 'citrus-oil', name: 'Dutch Citrus Oils', availability: 'common', cost: 4.0 },
        { id: 'herbs', name: 'Dutch Herbs', availability: 'common', cost: 6.0 }
      ]
    });

    // North American profiles
    this.culturalProfiles.set('US', {
      region: 'North America',
      country: 'United States',
      language: 'en',
      culturalPreferences: {
        sweetness: 'high',
        acidity: 'medium',
        carbonation: 'very-high',
        caffeine: 'high'
      },
      tastePreferences: ['bold', 'sweet', 'intense'],
      dietaryRestrictions: ['gluten-free', 'low-carb', 'organic'],
      unitSystem: {
        primary: 'imperial',
        temperature: 'fahrenheit',
        volume: 'fl-oz',
        weight: 'pounds'
      },
      regulatoryRequirements: {
        caffeine: { max: 400, unit: 'mg' },
        sugar: { max: 30, unit: 'g' },
        labeling: ['FDA nutrition facts', 'serving sizes', 'health claims'],
        ageRestrictions: 18
      },
      seasonalPreferences: {
        spring: ['citrus', 'light', 'refreshing'],
        summer: ['fruity', 'sparkling', 'cold'],
        autumn: ['spiced', 'warm', 'cozy'],
        winter: ['rich', 'bold', 'comforting']
      },
      localIngredients: [
        { id: 'california-citrus', name: 'California Citrus', availability: 'abundant', cost: 2.5 },
        { id: 'texas-pepper', name: 'Texas Pepper Extracts', availability: 'common', cost: 7.0 },
        { id: 'pacific-herbs', name: 'Pacific Coast Herbs', availability: 'common', cost: 9.0 }
      ]
    });

    // Asian profiles
    this.culturalProfiles.set('JP', {
      region: 'East Asia',
      country: 'Japan',
      language: 'ja',
      culturalPreferences: {
        sweetness: 'low',
        acidity: 'low',
        carbonation: 'light',
        caffeine: 'medium'
      },
      tastePreferences: ['subtle', 'umami', 'refined'],
      dietaryRestrictions: [' MSG-free', 'low-sodium'],
      unitSystem: {
        primary: 'metric',
        temperature: 'celsius',
        volume: 'milliliters',
        weight: 'grams'
      },
      regulatoryRequirements: {
        caffeine: { max: 300, unit: 'mg' },
        sugar: { max: 20, unit: 'g' },
        labeling: ['Japanese nutrition facts', 'allergen warnings'],
        ageRestrictions: 20
      },
      seasonalPreferences: {
        spring: ['sakura', 'light', 'floral'],
        summer: ['mint', 'cool', 'refreshing'],
        autumn: ['yuzu', 'citrus', 'warm'],
        winter: ['ginger', 'spiced', 'comforting']
      },
      localIngredients: [
        { id: 'japanese-citrus', name: 'Yuzu & Sudachi', availability: 'abundant', cost: 12.0 },
        { id: 'matcha', name: 'Japanese Matcha', availability: 'common', cost: 15.0 },
        { id: 'umami-extracts', name: 'Umami Extracts', availability: 'limited', cost: 20.0 }
      ]
    });
  }

  /**
   * Initialize ingredient substitution mappings
   */
  private initializeIngredientSubstitutions(): void {
    // European substitutions
    this.ingredientSubstitutions.set('EU', {
      'artificial-sweetener': 'stevia-extract',
      'high-fructose-corn-syrup': 'cane-sugar-syrup',
      'artificial-color': 'natural-fruit-extract',
      'caffeine-synthetic': 'green-tea-extract'
    });

    // North American substitutions
    this.ingredientSubstitutions.set('US', {
      'cane-sugar': 'organic-cane-sugar',
      'natural-extract': 'concentrated-natural-extract',
      'citrus-oil': 'california-citrus-oil',
      'herbal-extract': 'premium-herbal-extract'
    });

    // Asian substitutions
    this.ingredientSubstitutions.set('JP', {
      'western-citrus': 'yuzu-extract',
      'artificial-sweetener': 'natural-stevia',
      'strong-caffeine': 'matcha-powder',
      'bold-flavor': 'subtle-umami'
    });
  }

  /**
   * Adapt flavor to specific region
   */
  public adaptFlavor(flavor: FlavorRecipe, region: string): FlavorRecipe {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    const substitutions = this.ingredientSubstitutions.get(region) || this.ingredientSubstitutions.get('EU')!;
    
    // Create adapted copy
    const adapted: FlavorRecipe = {
      ...flavor,
      name: this.translateName(flavor.name, profile.language),
      nameNl: this.translateName(flavor.nameNl || flavor.name, profile.language),
      profile: this.translateProfile(flavor.profile, profile.language),
      profileNl: this.translateProfile(flavor.profileNl || flavor.profile, profile.language)
    };

    // Adapt ingredients
    adapted.ingredients = flavor.ingredients.map(ingredient => {
      const substitution = substitutions[ingredient.ingredientId];
      if (substitution) {
        return {
          ...ingredient,
          ingredientId: substitution,
          amount: this.adjustAmount(ingredient.amount, ingredient.ingredientId, substitution, profile)
        };
      }
      return ingredient;
    });

    // Adapt taste profile based on cultural preferences
    adapted.color = this.adaptColor(flavor.color, profile);

    return adapted;
  }

  /**
   * Perform comprehensive cultural adaptation
   */
  public performAdaptation(flavor: FlavorRecipe, region: string): AdaptationResult {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    const adaptedFlavor = this.adaptFlavor(flavor, region);
    
    const modifications = this.analyzeModifications(flavor, adaptedFlavor, profile);
    const culturalNotes = this.generateCulturalNotes(adaptedFlavor, profile);
    const complianceCheck = this.checkCompliance(adaptedFlavor, profile);
    const nutritionalAdaptation = this.adaptNutritionalProfile(adaptedFlavor, profile);

    return {
      adaptedFlavor,
      modifications,
      culturalNotes,
      complianceCheck,
      nutritionalAdaptation
    };
  }

  /**
   * Get cultural profile for region
   */
  public getCulturalProfile(region: string): CulturalProfile | null {
    return this.culturalProfiles.get(region) || null;
  }

  /**
   * Get available regions
   */
  public getAvailableRegions(): string[] {
    return Array.from(this.culturalProfiles.keys());
  }

  /**
   * Check regulatory compliance
   */
  public checkCompliance(flavor: FlavorRecipe, region: string): AdaptationResult['complianceCheck'] {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    const warnings: string[] = [];
    const requirements: string[] = [];
    let compliant = true;

    // Check caffeine limits
    const caffeineContent = this.estimateCaffeineContent(flavor);
    if (caffeineContent > profile.regulatoryRequirements.caffeine.max) {
      warnings.push(`Caffeine content (${caffeineContent}mg) exceeds ${region} limit (${profile.regulatoryRequirements.caffeine.max}mg)`);
      compliant = false;
    }

    // Check sugar content
    const sugarContent = this.estimateSugarContent(flavor);
    if (sugarContent > profile.regulatoryRequirements.sugar.max) {
      warnings.push(`Sugar content (${sugarContent}g) exceeds ${region} recommendation (${profile.regulatoryRequirements.sugar.max}g)`);
    }

    // Check age restrictions
    requirements.push(`Age restriction: ${profile.regulatoryRequirements.ageRestrictions}+`);
    
    // Generate certifications
    const certifications = this.generateCertifications(flavor, profile);

    return {
      compliant,
      warnings,
      requirements,
      certifications
    };
  }

  /**
   * Generate cultural notes for preparation and serving
   */
  public generateCulturalNotes(flavor: FlavorRecipe, region: string): AdaptationResult['culturalNotes'] {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    
    return {
      preparation: this.getPreparationNotes(flavor, profile),
      serving: this.getServingNotes(flavor, profile),
      occasions: this.getOccasionNotes(flavor, profile),
      etiquette: this.getEtiquetteNotes(flavor, profile)
    };
  }

  /**
   * Convert units to regional preferences
   */
  public convertUnits(value: number, fromUnit: string, toUnit: string, region: string): number {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    
    const conversions: Record<string, Record<string, number>> = {
      metric: {
        celsius: 1,
        fahrenheit: (c: number) => (c * 9/5) + 32,
        milliliters: 1,
        liters: 0.001,
        grams: 1,
        kilograms: 0.001
      },
      imperial: {
        fahrenheit: 1,
        celsius: (f: number) => (f - 32) * 5/9,
        'fl-oz': 1,
        'gallons': 0.0078125,
        pounds: 1,
        ounces: 16
      }
    };

    const unitSystem = profile.unitSystem.primary;
    const conversionMap = conversions[unitSystem];
    
    if (conversionMap[fromUnit] && conversionMap[toUnit]) {
      const from = conversionMap[fromUnit];
      const to = conversionMap[toUnit];
      
      if (typeof from === 'function') {
        return typeof to === 'function' ? to(from(value)) : to * from(value);
      }
      
      return (value / from) * to;
    }
    
    return value; // Return original if no conversion found
  }

  /**
   * Get seasonal recommendations
   */
  public getSeasonalRecommendations(region: string, season: 'spring' | 'summer' | 'autumn' | 'winter'): string[] {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    return profile.seasonalPreferences[season];
  }

  /**
   * Get local ingredient availability
   */
  public getLocalIngredients(region: string): CulturalProfile['localIngredients'] {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    return profile.localIngredients;
  }

  /**
   * Validate dietary restrictions
   */
  public validateDietaryRestrictions(flavor: FlavorRecipe, restrictions: string[], region: string): {
    compliant: boolean;
    violations: string[];
    alternatives: string[];
  } {
    const profile = this.culturalProfiles.get(region) || this.culturalProfiles.get('EU')!;
    const violations: string[] = [];
    const alternatives: string[] = [];

    // Check against common dietary restrictions
    restrictions.forEach(restriction => {
      switch (restriction.toLowerCase()) {
        case 'vegetarian':
          if (this.containsNonVegetarianIngredients(flavor)) {
            violations.push('Contains non-vegetarian ingredients');
            alternatives.push('Use vegetarian-certified ingredients');
          }
          break;
        case 'vegan':
          if (this.containsAnimalProducts(flavor)) {
            violations.push('Contains animal products');
            alternatives.push('Use plant-based alternatives');
          }
          break;
        case 'gluten-free':
          if (this.containsGluten(flavor)) {
            violations.push('Contains gluten');
            alternatives.push('Use gluten-free substitutes');
          }
          break;
        case 'low-sodium':
          if (this.isHighSodium(flavor)) {
            violations.push('High sodium content');
            alternatives.push('Use low-sodium alternatives');
          }
          break;
      }
    });

    return {
      compliant: violations.length === 0,
      violations,
      alternatives
    };
  }

  // Private helper methods

  private translateName(name: string, language: string): string {
    // Simple translation - in real implementation, this would use a translation service
    const translations: Record<string, Record<string, string>> = {
      'Berry Citrus Fusion': {
        'nl': 'Bessen Citrus Fusie',
        'ja': 'ベリーシトラスFusion',
        'de': 'Beeren-Zitrus-Fusion'
      }
    };
    
    return translations[name]?.[language] || name;
  }

  private translateProfile(profile: string, language: string): string {
    // Simple translation - in real implementation, this would use a translation service
    const translations: Record<string, Record<string, string>> = {
      'Sweet and tangy berry blend with citrus notes': {
        'nl': 'Zoete en pittige bessenmix met citrustonen',
        'ja': '柑橘類 notes とタيفيةで甘くて酸っぱいベリーブレンド',
        'de': 'Süße und würzige Beerennote mit Zitrusgeschmack'
      }
    };
    
    return translations[profile]?.[language] || profile;
  }

  private adjustAmount(originalAmount: number, originalIngredient: string, substitute: string, profile: CulturalProfile): number {
    // Adjust amounts based on cultural taste preferences
    const preferences = profile.culturalPreferences;
    
    switch (substitute) {
      case 'stevia-extract':
        return originalAmount * 0.3; // Stevia is sweeter
      case 'natural-fruit-extract':
        return originalAmount * 1.5; // Natural extracts are less concentrated
      case 'green-tea-extract':
        return originalAmount * 0.8; // Gentler caffeine
      default:
        return originalAmount;
    }
  }

  private adaptColor(color: any, profile: CulturalProfile): any {
    // Adapt color based on cultural preferences
    if (profile.region === 'Japan') {
      return {
        ...color,
        type: 'natural' as const,
        description: 'Natural, subtle coloring preferred in Japanese culture'
      };
    }
    
    return color;
  }

  private analyzeModifications(original: FlavorRecipe, adapted: FlavorRecipe, profile: CulturalProfile): AdaptationResult['modifications'] {
    const modifications = {
      ingredients: [] as any[],
      proportions: [] as any[],
      taste: [] as any[]
    };

    // Analyze ingredient substitutions
    original.ingredients.forEach((originalIng, index) => {
      const adaptedIng = adapted.ingredients[index];
      if (originalIng.ingredientId !== adaptedIng.ingredientId) {
        modifications.ingredients.push({
          original: originalIng.ingredientId,
          adapted: adaptedIng.ingredientId,
          reason: `${profile.region} cultural preference`,
          cost: 0 // Would calculate actual cost difference
        });
      }
    });

    // Analyze proportion changes
    original.ingredients.forEach((originalIng, index) => {
      const adaptedIng = adapted.ingredients[index];
      if (originalIng.amount !== adaptedIng.amount) {
        modifications.proportions.push({
          ingredient: adaptedIng.ingredientId,
          originalAmount: originalIng.amount,
          adaptedAmount: adaptedIng.amount,
          unit: 'ml',
          reason: `Adjusted for ${profile.culturalPreferences.sweetness} sweetness preference`
        });
      }
    });

    // Add taste adjustments
    modifications.taste.push({
      aspect: 'sweetness',
      adjustment: `Adapted to ${profile.culturalPreferences.sweetness} preference`,
      reason: `${profile.region} taste culture`
    });

    return modifications;
  }

  private generateCulturalNotes(flavor: FlavorRecipe, profile: CulturalProfile): AdaptationResult['culturalNotes'] {
    return {
      preparation: this.getPreparationNotes(flavor, profile),
      serving: this.getServingNotes(flavor, profile),
      occasions: this.getOccasionNotes(flavor, profile),
      etiquette: this.getEtiquetteNotes(flavor, profile)
    };
  }

  private getPreparationNotes(flavor: FlavorRecipe, profile: CulturalProfile): string[] {
    const notes = [];
    
    if (profile.region === 'Japan') {
      notes.push('Prepare with attention to detail and presentation');
      notes.push('Use precise measurements for authentic taste');
    } else if (profile.region === 'Netherlands') {
      notes.push('Emphasize freshness and natural ingredients');
      notes.push('Keep preparation simple and clean');
    } else {
      notes.push('Follow standard preparation methods');
      notes.push('Adjust to local taste preferences');
    }
    
    return notes;
  }

  private getServingNotes(flavor: FlavorRecipe, profile: CulturalProfile): string[] {
    const notes = [];
    
    if (profile.culturalPreferences.carbonation === 'high') {
      notes.push('Serve well chilled with high carbonation');
    }
    
    if (profile.region === 'Japan') {
      notes.push('Serve in elegant, small portions');
      notes.push('Present with attention to visual appeal');
    }
    
    return notes;
  }

  private getOccasionNotes(flavor: FlavorRecipe, profile: CulturalProfile): string[] {
    return [
      'Perfect for daily consumption',
      'Suitable for social gatherings',
      'Can be enjoyed year-round'
    ];
  }

  private getEtiquetteNotes(flavor: FlavorRecipe, profile: CulturalProfile): string[] {
    const notes = [];
    
    if (profile.regulatoryRequirements.ageRestrictions > 16) {
      notes.push(`Restricted to consumers ${profile.regulatoryRequirements.ageRestrictions}+`);
    }
    
    notes.push('Consume responsibly');
    
    return notes;
  }

  private generateCertifications(flavor: FlavorRecipe, profile: CulturalProfile): string[] {
    const certifications = ['FDA Approved'];
    
    if (profile.region === 'EU') {
      certifications.push('EU Organic', 'CE Marking');
    }
    
    if (profile.culturalPreferences.caffeine === 'low') {
      certifications.push('Low Caffeine');
    }
    
    return certifications;
  }

  private estimateCaffeineContent(flavor: FlavorRecipe): number {
    // Simplified caffeine estimation
    return flavor.ingredients.reduce((total, ing) => {
      if (ing.ingredientId.includes('caffeine')) {
        return total + ing.amount;
      }
      return total;
    }, 0);
  }

  private estimateSugarContent(flavor: FlavorRecipe): number {
    // Simplified sugar estimation
    return flavor.ingredients.reduce((total, ing) => {
      if (ing.ingredientId.includes('syrup') || ing.ingredientId.includes('sugar')) {
        return total + ing.amount * 0.8; // Assuming 80% sugar content
      }
      return total;
    }, 0);
  }

  private containsNonVegetarianIngredients(flavor: FlavorRecipe): boolean {
    const nonVegetarian = ['gelatin', 'carmine', 'shellac'];
    return flavor.ingredients.some(ing => 
      nonVegetarian.some(nonVeg => ing.ingredientId.includes(nonVeg))
    );
  }

  private containsAnimalProducts(flavor: FlavorRecipe): boolean {
    const animalProducts = ['gelatin', 'carmine', 'shellac', 'honey'];
    return flavor.ingredients.some(ing => 
      animalProducts.some(animal => ing.ingredientId.includes(animal))
    );
  }

  private containsGluten(flavor: FlavorRecipe): boolean {
    const glutenIngredients = ['wheat', 'barley', 'rye', 'malt'];
    return flavor.ingredients.some(ing => 
      glutenIngredients.some(gluten => ing.ingredientId.includes(gluten))
    );
  }

  private isHighSodium(flavor: FlavorRecipe): boolean {
    const sodiumIngredients = ['salt', 'sodium', 'preservative'];
    const sodiumContent = flavor.ingredients
      .filter(ing => sodiumIngredients.some(sodium => ing.ingredientId.includes(sodium)))
      .reduce((total, ing) => total + ing.amount, 0);
    
    return sodiumContent > 100; // mg threshold
  }
}