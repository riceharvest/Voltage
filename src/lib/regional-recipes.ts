/**
 * Regional Recipe Variations and Cultural Adaptations
 * 
 * Implements region-specific recipe adaptations including:
 * - Ingredient substitutions for local availability
 * - Cultural flavor preferences and adaptations
 * - Regional brand alternatives in syrup system
 * - Local pricing and cost optimization
 * - Traditional regional beverage styles
 * 
 * @example
 * ```typescript
 * const adaptedRecipe = await adaptRecipeForRegion(baseRecipe, 'DE');
 * const culturalFlavors = getCulturalFlavors('JP', 'spring');
 * ```
 */

import { getCurrency, convertCurrency } from './currency-system';

export interface RegionalIngredient {
  name: string;
  localName: string;
  availability: 'high' | 'medium' | 'low' | 'seasonal';
  substitute?: string;
  price: {
    amount: number;
    currency: string;
    unit: string;
  };
  culturalSignificance?: string;
  seasonalAvailability?: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
}

export interface CulturalFlavorProfile {
  region: string;
  base: {
    sweetness: number; // 1-10 scale
    acidity: number;
    carbonation: number;
    body: number;
    intensity: number;
  };
  preferredFlavors: string[];
  avoidedFlavors: string[];
  traditionalCombinations: Array<{
    primary: string;
    secondary: string[];
    description: string;
  }>;
  modernPreferences: {
    trending: string[];
    health: string[];
    premium: string[];
  };
}

export interface RegionalBrandMapping {
  original: string;
  alternatives: Array<{
    name: string;
    region: string;
    availability: 'high' | 'medium' | 'low';
    priceMultiplier: number;
    quality: 'equivalent' | 'better' | 'inferior';
    notes?: string;
  }>;
}

export interface TraditionalRecipe {
  name: string;
  region: string;
  style: 'modern' | 'traditional' | 'fusion';
  baseIngredients: string[];
  adaptations: {
    ingredient: string;
    original: string;
    alternative: string;
    reason: string;
  }[];
  preparation: string[];
  culturalNotes: string[];
  modernEquivalent?: string;
}

export interface RecipeAdaptation {
  original: any;
  adapted: {
    name: string;
    description: string;
    ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
      substitute?: string;
      localAlternative?: string;
      culturalNote?: string;
    }>;
    instructions: string[];
    culturalAdaptations: string[];
    costAnalysis: {
      originalCost: number;
      adaptedCost: number;
      savings: number;
      currency: string;
    };
  };
  adaptations: Array<{
    type: 'ingredient' | 'flavor' | 'method' | 'cultural';
    description: string;
    reason: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
}

/**
 * Regional ingredient database
 */
const REGIONAL_INGREDIENTS: Record<string, RegionalIngredient[]> = {
  'US': [
    {
      name: 'High Fructose Corn Syrup',
      localName: 'Corn Syrup',
      availability: 'high',
      substitute: 'Cane Sugar',
      price: { amount: 2.50, currency: 'USD', unit: 'lb' },
      culturalSignificance: 'Common in American beverages'
    },
    {
      name: 'Natural Flavors',
      localName: 'Natural Flavors',
      availability: 'high',
      price: { amount: 15.00, currency: 'USD', unit: 'oz' }
    },
    {
      name: 'Caffeine Anhydrous',
      localName: 'Caffeine Powder',
      availability: 'high',
      price: { amount: 25.00, currency: 'USD', unit: '100g' }
    }
  ],
  'DE': [
    {
      name: 'Cane Sugar',
      localName: 'Rohrzucker',
      availability: 'high',
      substitute: 'White Sugar',
      price: { amount: 2.20, currency: 'EUR', unit: 'kg' },
      culturalSignificance: 'Preferred over corn syrup in EU'
    },
    {
      name: 'Natural Extracts',
      localName: 'Natürliche Extrakte',
      availability: 'medium',
      substitute: 'Natural Flavors',
      price: { amount: 18.00, currency: 'EUR', unit: '100ml' },
      culturalSignificance: 'EU preference for natural extracts'
    },
    {
      name: 'Organic Caffeine',
      localName: 'Bio-Koffein',
      availability: 'medium',
      price: { amount: 35.00, currency: 'EUR', unit: '100g' },
      culturalSignificance: 'Growing organic preference in Germany'
    }
  ],
  'JP': [
    {
      name: 'Yuzu Extract',
      localName: '柚子エキストラクト',
      availability: 'medium',
      price: { amount: 2500, currency: 'JPY', unit: '100ml' },
      culturalSignificance: 'Traditional Japanese citrus',
      seasonalAvailability: {
        spring: 3,
        summer: 2,
        autumn: 10,
        winter: 8
      }
    },
    {
      name: 'Matcha Powder',
      localName: '抹茶パウダー',
      availability: 'high',
      price: { amount: 800, currency: 'JPY', unit: '30g' },
      culturalSignificance: 'Traditional Japanese green tea'
    },
    {
      name: 'Natural Citrus Extracts',
      localName: '自然柑橘エキストラクト',
      availability: 'medium',
      price: { amount: 1500, currency: 'JPY', unit: '100ml' }
    }
  ],
  'IN': [
    {
      name: 'Jaggery',
      localName: 'गुड़',
      availability: 'high',
      substitute: 'Cane Sugar',
      price: { amount: 80, currency: 'INR', unit: 'kg' },
      culturalSignificance: 'Traditional Indian sweetener'
    },
    {
      name: 'Cardamom Extract',
      localName: 'इलायची экстракт',
      availability: 'high',
      price: { amount: 1200, currency: 'INR', unit: '100g' },
      culturalSignificance: 'Traditional Indian spice'
    },
    {
      name: 'Turmeric Extract',
      localName: 'हल्दी экстракт',
      availability: 'high',
      price: { amount: 600, currency: 'INR', unit: '100g' },
      culturalSignificance: 'Traditional Indian spice with health benefits'
    }
  ]
};

/**
 * Cultural flavor profiles database
 */
const CULTURAL_FLAVOR_PROFILES: Record<string, CulturalFlavorProfile> = {
  'US': {
    region: 'United States',
    base: {
      sweetness: 7,
      acidity: 4,
      carbonation: 8,
      body: 6,
      intensity: 8
    },
    preferredFlavors: ['citrus', 'berry', 'tropical', 'cola', 'grape', 'orange'],
    avoidedFlavors: ['bitter', 'sour', 'subtle'],
    traditionalCombinations: [
      {
        primary: 'citrus',
        secondary: ['tropical', 'berry'],
        description: 'Bright, refreshing combinations'
      },
      {
        primary: 'cola',
        secondary: ['vanilla', 'caramel'],
        description: 'Classic American cola profile'
      }
    ],
    modernPreferences: {
      trending: ['natural flavors', 'less sugar', 'functional ingredients'],
      health: ['low calorie', 'natural sweeteners', 'vitamin added'],
      premium: ['craft sodas', 'artisanal flavors', 'small batch']
    }
  },
  'DE': {
    region: 'Germany',
    base: {
      sweetness: 5,
      acidity: 6,
      carbonation: 7,
      body: 5,
      intensity: 6
    },
    preferredFlavors: ['elderflower', 'rhubarb', 'black currant', 'apple', 'lemon'],
    avoidedFlavors: ['overly sweet', 'artificial', 'high fructose corn syrup'],
    traditionalCombinations: [
      {
        primary: 'elderflower',
        secondary: ['lemon', 'lime'],
        description: 'Traditional German floral-citrus profile'
      },
      {
        primary: 'rhubarb',
        secondary: ['strawberry', 'vanilla'],
        description: 'Classic German spring flavors'
      }
    ],
    modernPreferences: {
      trending: ['organic ingredients', 'natural extracts', 'traditional herbs'],
      health: ['low sugar', 'natural sweeteners', 'no artificial additives'],
      premium: ['organic certification', 'natural extracts', 'artisanal quality']
    }
  },
  'JP': {
    region: 'Japan',
    base: {
      sweetness: 3,
      acidity: 5,
      carbonation: 6,
      body: 4,
      intensity: 4
    },
    preferredFlavors: ['green tea', 'yuzu', 'citrus', 'subtle fruit', 'matcha'],
    avoidedFlavors: ['overly sweet', 'artificial', 'heavy', 'bitter'],
    traditionalCombinations: [
      {
        primary: 'green tea',
        secondary: ['citrus', 'honey'],
        description: 'Balanced Japanese tea profile'
      },
      {
        primary: 'yuzu',
        secondary: ['lemon', 'honey'],
        description: 'Traditional Japanese citrus profile'
      }
    ],
    modernPreferences: {
      trending: ['matcha', 'yuzu', 'functional ingredients', 'low sugar'],
      health: ['natural ingredients', 'low calorie', 'functional benefits'],
      premium: ['ceremonial grade matcha', 'traditional flavors', 'authentic ingredients']
    }
  },
  'IN': {
    region: 'India',
    base: {
      sweetness: 6,
      acidity: 5,
      carbonation: 5,
      body: 6,
      intensity: 7
    },
    preferredFlavors: ['cardamom', 'ginger', 'mango', 'tamarind', 'mint', 'turmeric'],
    avoidedFlavors: ['artificial', 'unfamiliar', 'overly sweet'],
    traditionalCombinations: [
      {
        primary: 'cardamom',
        secondary: ['ginger', 'lemon'],
        description: 'Traditional Indian spice profile'
      },
      {
        primary: 'mango',
        secondary: ['cardamom', 'turmeric'],
        description: 'Classic Indian fruit-spice combination'
      }
    ],
    modernPreferences: {
      trending: ['traditional spices', 'functional ingredients', 'Ayurvedic herbs'],
      health: ['natural sweeteners', 'spice benefits', 'traditional medicine'],
      premium: ['authentic spices', 'organic certification', 'traditional preparation']
    }
  }
};

/**
 * Regional brand mappings
 */
const REGIONAL_BRANDS: Record<string, RegionalBrandMapping> = {
  'Monin': {
    original: 'Monin Syrups',
    alternatives: [
      {
        name: 'Monin',
        region: 'EU',
        availability: 'high',
        priceMultiplier: 1.0,
        quality: 'equivalent'
      },
      {
        name: 'Torani',
        region: 'US',
        availability: 'high',
        priceMultiplier: 0.8,
        quality: 'equivalent',
        notes: 'More affordable alternative'
      },
      {
        name: 'Da Vinci',
        region: 'US',
        availability: 'medium',
        priceMultiplier: 0.9,
        quality: 'equivalent'
      }
    ]
  },
  'Starbucks': {
    original: 'Starbucks Syrups',
    alternatives: [
      {
        name: 'Starbucks',
        region: 'US',
        availability: 'high',
        priceMultiplier: 1.0,
        quality: 'equivalent'
      },
      {
        name: 'Grove Square',
        region: 'US',
        availability: 'high',
        priceMultiplier: 0.6,
        quality: 'inferior',
        notes: 'Budget alternative with similar flavors'
      }
    ]
  }
};

/**
 * Get regional ingredients
 */
export function getRegionalIngredients(region: string): RegionalIngredient[] {
  return REGIONAL_INGREDIENTS[region] || REGIONAL_INGREDIENTS['US'];
}

/**
 * Get cultural flavor profile
 */
export function getCulturalFlavorProfile(region: string): CulturalFlavorProfile | null {
  return CULTURAL_FLAVOR_PROFILES[region] || null;
}

/**
 * Get seasonal flavor preferences
 */
export function getSeasonalFlavors(region: string, season: 'spring' | 'summer' | 'autumn' | 'winter'): string[] {
  const profile = getCulturalFlavorProfile(region);
  if (!profile) return [];

  // Map season to cultural preferences
  const seasonalMap: Record<string, Record<string, string[]>> = {
    'US': {
      spring: ['citrus', 'berry', 'fresh', 'light'],
      summer: ['watermelon', 'pineapple', 'citrus', 'tropical'],
      autumn: ['apple', 'pumpkin spice', 'cranberry', 'cinnamon'],
      winter: ['peppermint', 'cranberry', 'spiced', 'warming']
    },
    'DE': {
      spring: ['elderflower', 'rhubarb', 'strawberry', 'light'],
      summer: ['elderflower', 'citrus', 'berry', 'refreshing'],
      autumn: ['apple', 'pear', 'blackberry', 'spiced'],
      winter: ['cranberry', 'apple', 'winter spice', 'warming']
    },
    'JP': {
      spring: ['sakura', 'green tea', 'light citrus', 'fresh'],
      summer: ['citrus', 'yuzu', 'cooling', 'refreshing'],
      autumn: ['apple', 'pear', 'warm spices', 'earthy'],
      winter: ['spiced', 'warming', 'traditional', 'comforting']
    }
  };

  return seasonalMap[region]?.[season] || [];
}

/**
 * Find ingredient substitutes
 */
export function findIngredientSubstitutes(
  ingredient: string,
  region: string,
  preference: 'availability' | 'cost' | 'cultural' | 'quality' = 'availability'
): string[] {
  const regionalIngredients = getRegionalIngredients(region);
  const found = regionalIngredients.find(r => 
    r.name.toLowerCase().includes(ingredient.toLowerCase()) ||
    ingredient.toLowerCase().includes(r.name.toLowerCase())
  );

  if (!found || !found.substitute) {
    return [];
  }

  return [found.substitute];
}

/**
 * Get regional brand alternatives
 */
export function getRegionalBrandAlternatives(
  brand: string,
  region: string
): Array<{
  name: string;
  region: string;
  availability: 'high' | 'medium' | 'low';
  priceMultiplier: number;
  quality: 'equivalent' | 'better' | 'inferior';
  notes?: string;
}> {
  const brandMapping = REGIONAL_BRANDS[brand];
  if (!brandMapping) {
    return [];
  }

  return brandMapping.alternatives.filter(alt => 
    alt.region === region || region === 'US'
  );
}

/**
 * Calculate recipe cost in local currency
 */
export async function calculateRegionalCost(
  recipe: any,
  region: string,
  baseCurrency: string = 'USD'
): Promise<{
  originalCost: number;
  regionalCost: number;
  currency: string;
  savings: number;
}> {
  const currency = getCurrency(getDefaultCurrencyForRegion(region));
  if (!currency) {
    return {
      originalCost: 0,
      regionalCost: 0,
      currency: baseCurrency,
      savings: 0
    };
  }

  const regionalIngredients = getRegionalIngredients(region);
  let originalCost = 0;
  let regionalCost = 0;

  // Calculate costs based on ingredients
  for (const ingredient of recipe.ingredients || []) {
    const regionalIngredient = regionalIngredients.find(r => 
      r.name.toLowerCase().includes(ingredient.name.toLowerCase())
    );

    if (regionalIngredient) {
      regionalCost += regionalIngredient.price.amount;
    }
    originalCost += ingredient.cost || 10; // Default cost
  }

  // Convert to target currency
  const convertedRegionalCost = await convertCurrency(regionalCost, 'USD', currency.code);

  return {
    originalCost,
    regionalCost: convertedRegionalCost,
    currency: currency.code,
    savings: originalCost - convertedRegionalCost
  };
}

/**
 * Get default currency for region
 */
function getDefaultCurrencyForRegion(region: string): string {
  const mappings: Record<string, string> = {
    'US': 'USD',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'JP': 'JPY',
    'IN': 'INR',
    'GB': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD'
  };

  return mappings[region] || 'USD';
}

/**
 * Adapt recipe for regional preferences
 */
export async function adaptRecipeForRegion(
  baseRecipe: any,
  region: string,
  style: 'traditional' | 'modern' | 'fusion' = 'modern'
): Promise<RecipeAdaptation> {
  const culturalProfile = getCulturalFlavorProfile(region);
  const regionalIngredients = getRegionalIngredients(region);
  const costAnalysis = await calculateRegionalCost(baseRecipe, region);

  const adaptations: RecipeAdaptation['adaptations'] = [];
  const adaptedIngredients = [];

  // Adapt ingredients
  for (const ingredient of baseRecipe.ingredients || []) {
    const regionalIngredient = regionalIngredients.find(r => 
      r.name.toLowerCase().includes(ingredient.name.toLowerCase())
    );

    let adaptedIngredient = {
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      substitute: undefined,
      localAlternative: undefined,
      culturalNote: undefined
    };

    if (regionalIngredient && regionalIngredient.substitute) {
      adaptedIngredient.substitute = regionalIngredient.substitute;
      adaptations.push({
        type: 'ingredient',
        description: `Replaced ${ingredient.name} with ${regionalIngredient.substitute}`,
        reason: regionalIngredient.culturalSignificance || 'Regional preference',
        impact: 'positive'
      });
    }

    if (culturalProfile && !culturalProfile.preferredFlavors.some(flavor => 
      ingredient.name.toLowerCase().includes(flavor.toLowerCase())
    )) {
      adaptedIngredient.culturalNote = `Not traditionally preferred in ${region}`;
    }

    adaptedIngredients.push(adaptedIngredient);
  }

  // Add cultural adaptations
  if (culturalProfile) {
    const preferredFlavor = culturalProfile.preferredFlavors[0];
    adaptations.push({
      type: 'cultural',
      description: `Enhanced with ${preferredFlavor} profile preferred in ${region}`,
      reason: `Cultural flavor preference in ${culturalProfile.region}`,
      impact: 'positive'
    });
  }

  const adaptedRecipe = {
    name: `${baseRecipe.name} (${region} Style)`,
    description: `${baseRecipe.description} Adapted for ${region} preferences.`,
    ingredients: adaptedIngredients,
    instructions: baseRecipe.instructions || [],
    culturalAdaptations: culturalProfile ? [
      `Sweetness level adjusted to ${culturalProfile.base.sweetness}/10`,
      `Carbonation level adjusted to ${culturalProfile.base.carbonation}/10`,
      `Flavor profile optimized for ${region} preferences`
    ] : [],
    costAnalysis
  };

  return {
    original: baseRecipe,
    adapted: adaptedRecipe,
    adaptations
  };
}

/**
 * Get traditional regional recipes
 */
export function getTraditionalRecipes(region: string): TraditionalRecipe[] {
  const traditionalRecipes: Record<string, TraditionalRecipe[]> = {
    'DE': [
      {
        name: 'German Elderflower Energy',
        region: 'Germany',
        style: 'traditional',
        baseIngredients: ['elderflower extract', 'lemon', 'natural caffeine', 'carbonated water'],
        adaptations: [
          {
            ingredient: 'caffeine',
            original: 'artificial caffeine',
            alternative: 'natural green tea extract',
            reason: 'Preference for natural ingredients'
          }
        ],
        preparation: [
          'Steep elderflower in warm water',
          'Add green tea extract for natural caffeine',
          'Cool and carbonate',
          'Serve with lemon twist'
        ],
        culturalNotes: [
          'Elderflower is traditional in German beverages',
          'Natural ingredients preferred over artificial',
          'Light, floral profile typical of German tastes'
        ]
      }
    ],
    'JP': [
      {
        name: 'Matcha Yuzu Energy',
        region: 'Japan',
        style: 'traditional',
        baseIngredients: ['matcha powder', 'yuzu extract', 'honey', 'carbonated water'],
        adaptations: [
          {
            ingredient: 'sweetener',
            original: 'white sugar',
            alternative: 'honey',
            reason: 'Traditional Japanese preference for natural sweeteners'
          }
        ],
        preparation: [
          'Whisk matcha powder with warm water',
          'Add yuzu extract and honey',
          'Cool mixture',
          'Carbonate and serve over ice'
        ],
        culturalNotes: [
          'Matcha is central to Japanese tea culture',
          'Yuzu represents seasonal Japanese flavors',
          'Balance of sweet and tart is key'
        ]
      }
    ]
  };

  return traditionalRecipes[region] || [];
}

/**
 * Get cultural adaptation suggestions
 */
export function getCulturalAdaptationSuggestions(
  region: string,
  baseRecipe: any
): Array<{
  category: string;
  suggestion: string;
  impact: 'positive' | 'neutral' | 'negative';
  reasoning: string;
}> {
  const suggestions = [];
  const culturalProfile = getCulturalFlavorProfile(region);

  if (culturalProfile) {
    suggestions.push({
      category: 'Flavor Profile',
      suggestion: `Adjust sweetness to ${culturalProfile.base.sweetness}/10 for regional preference`,
      impact: 'positive',
      reasoning: `${region} consumers prefer ${culturalProfile.base.sweetness > 5 ? 'higher' : 'lower'} sweetness levels`
    });

    suggestions.push({
      category: 'Flavor Selection',
      suggestion: `Incorporate ${culturalProfile.preferredFlavors.slice(0, 2).join(' and ')} for authentic taste`,
      impact: 'positive',
      reasoning: `Traditional flavor preferences in ${region}`
    });

    if (culturalProfile.avoidedFlavors.length > 0) {
      suggestions.push({
        category: 'Flavor Avoidance',
        suggestion: `Avoid ${culturalProfile.avoidedFlavors.join(', ')} as they are not preferred`,
        impact: 'positive',
        reasoning: `These flavors are generally avoided in ${region}`
      });
    }
  }

  return suggestions;
}

export default {
  getRegionalIngredients,
  getCulturalFlavorProfile,
  getSeasonalFlavors,
  findIngredientSubstitutes,
  getRegionalBrandAlternatives,
  calculateRegionalCost,
  adaptRecipeForRegion,
  getTraditionalRecipes,
  getCulturalAdaptationSuggestions
};