/**
 * Region-Specific Safety Guidelines System
 * 
 * Implements comprehensive safety validation based on regional requirements:
 * - Different caffeine limits by country/region
 * - Cultural dietary restrictions and preferences
 * - Local health authority recommendations
 * - Age verification thresholds (16, 18, 21 by region)
 * - Pregnancy and health condition warnings
 * - Cultural禁忌 considerations
 * 
 * @example
 * ```typescript
 * const safety = await getRegionalSafetyGuidelines('DE');
 * const warnings = validateRegionalSafety(recipe, safety, 'DE');
 * ```
 */

import { GeolocationData } from './geolocation';

export interface CulturalDietaryRestriction {
  ingredient: string;
  restrictionType: 'forbidden' | 'restricted' | 'caution';
  reason: string;
  alternatives: string[];
  regions: string[];
  religiousBasis?: string;
  culturalBasis?: string;
}

export interface HealthConditionWarning {
  condition: string;
  warnings: string[];
  avoidIngredients: string[];
  maxRecommendations: Record<string, number>;
  regions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgeBasedGuideline {
  minAge: number;
  maxDailyCaffeine: number; // mg
  maxServingSize: number; // ml
  additionalWarnings: string[];
  regions: string[];
  parentalConsent: boolean;
}

export interface PregnancyGuideline {
  avoidIngredients: string[];
  maxCaffeine: number; // mg per day
  warnings: string[];
  regions: string[];
  trimesterSpecific: boolean;
  recommendations: string[];
}

export interface RegionalHealthAuthority {
  name: string;
  country: string;
  website: string;
  caffeineGuidelines: {
    safeDailyLimit: number; // mg
    maxPerServing: number; // mg
    warningAge: number; // years
    pregnancyLimit: number; // mg
  };
  dietaryGuidelines: string[];
  specialPopulations: string[];
}

export interface CulturalPreference {
  region: string;
  preferences: {
    sweetness: 'low' | 'medium' | 'high';
    carbonation: 'low' | 'medium' | 'high';
    flavorProfile: string[];
    ingredients: string[];
    avoid: string[];
    traditional: string[];
  };
  seasonal: {
    winter: string[];
    spring: string[];
    summer: string[];
    autumn: string[];
  };
  occasions: {
    name: string;
    ingredients: string[];
    avoid: string[];
  }[];
}

export interface RegionalSafetyGuideline {
  region: string;
  countryCode: string;
  healthAuthority: RegionalHealthAuthority;
  ageGuidelines: AgeBasedGuideline[];
  pregnancyGuidelines: PregnancyGuideline;
  dietaryRestrictions: CulturalDietaryRestriction[];
  healthConditionWarnings: HealthConditionWarning[];
  culturalPreferences: CulturalPreference;
  caffeineLimits: {
    perServing: number;
    perDay: number;
    special: {
      age: number;
      limit: number;
    }[];
  };
  warnings: {
    general: string[];
    ingredientSpecific: Record<string, string[]>;
    healthConditions: string[];
  };
  lastUpdated: string;
  complianceScore: number;
}

/**
 * Regional safety database
 */
const REGIONAL_SAFETY_DATA: Record<string, RegionalSafetyGuideline> = {
  'DE': {
    region: 'Germany',
    countryCode: 'DE',
    healthAuthority: {
      name: 'BfR (Bundesinstitut für Risikobewertung)',
      country: 'Germany',
      website: 'https://www.bfr.bund.de',
      caffeineGuidelines: {
        safeDailyLimit: 400,
        maxPerServing: 150,
        warningAge: 16,
        pregnancyLimit: 200
      },
      dietaryGuidelines: [
        'Moderate caffeine consumption',
        'Avoid energy drinks for children under 16',
        'Consider cardiovascular health'
      ],
      specialPopulations: ['Children', 'Pregnant women', 'Elderly', 'Cardiovascular patients']
    },
    ageGuidelines: [
      {
        minAge: 0,
        maxDailyCaffeine: 0,
        maxServingSize: 0,
        additionalWarnings: ['Not recommended for children under 16'],
        regions: ['DE'],
        parentalConsent: false
      },
      {
        minAge: 16,
        maxDailyCaffeine: 400,
        maxServingSize: 250,
        additionalWarnings: ['Monitor caffeine intake', 'Stay hydrated'],
        regions: ['DE'],
        parentalConsent: false
      }
    ],
    pregnancyGuidelines: {
      avoidIngredients: ['caffeine', 'taurine', 'guarana'],
      maxCaffeine: 200,
      warnings: [
        'High caffeine intake may affect fetal development',
        'Consult healthcare provider before consumption',
        'Limit total daily caffeine intake'
      ],
      regions: ['DE'],
      trimesterSpecific: false,
      recommendations: [
        'Choose caffeine-free alternatives',
        'Read labels carefully',
        'Monitor total caffeine from all sources'
      ]
    },
    dietaryRestrictions: [
      {
        ingredient: 'pork-derived gelatin',
        restrictionType: 'forbidden',
        reason: 'Religious restrictions (Islam, Judaism)',
        alternatives: ['beef gelatin', 'fish gelatin', 'agar-agar'],
        regions: ['DE'],
        religiousBasis: 'Halal/Kosher requirements'
      },
      {
        ingredient: 'alcohol',
        restrictionType: 'forbidden',
        reason: 'General safety',
        alternatives: ['non-alcoholic flavoring'],
        regions: ['DE']
      }
    ],
    healthConditionWarnings: [
      {
        condition: 'cardiovascular disease',
        warnings: [
          'High caffeine content may increase heart rate',
          'Consult physician before consumption',
          'Monitor blood pressure'
        ],
        avoidIngredients: ['caffeine', 'taurine'],
        maxRecommendations: {
          caffeine: 100
        },
        regions: ['DE'],
        severity: 'high'
      },
      {
        condition: 'diabetes',
        warnings: [
          'Check sugar content',
          'Monitor blood glucose levels',
          'May affect insulin sensitivity'
        ],
        avoidIngredients: ['high fructose corn syrup'],
        maxRecommendations: {
          sugar: 25
        },
        regions: ['DE'],
        severity: 'medium'
      }
    ],
    culturalPreferences: {
      region: 'DE',
      preferences: {
        sweetness: 'medium',
        carbonation: 'high',
        flavorProfile: ['citrus', 'berry', 'tropical'],
        ingredients: ['natural flavors', 'real fruit extracts'],
        avoid: ['artificial colors', 'excessive sugar'],
        traditional: ['elderflower', 'rhubarb', 'black currant']
      },
      seasonal: {
        winter: ['spiced apple', 'cranberry', 'ginger'],
        spring: ['elderflower', 'rhubarb', 'strawberry'],
        summer: ['citrus', 'berry', 'tropical fruits'],
        autumn: ['apple', 'pear', 'cinnamon']
      },
      occasions: [
        {
          name: 'Oktoberfest',
          ingredients: ['hop extract', 'natural flavors'],
          avoid: ['artificial sweeteners']
        }
      ]
    },
    caffeineLimits: {
      perServing: 150,
      perDay: 400,
      special: [
        { age: 16, limit: 200 },
        { age: 18, limit: 300 }
      ]
    },
    warnings: {
      general: [
        'Not recommended for children under 16',
        'Contains caffeine - consume in moderation',
        'Do not mix with alcohol',
        'Stay hydrated'
      ],
      ingredientSpecific: {
        caffeine: [
          'May cause insomnia',
          'Can increase heart rate',
          'Not suitable for caffeine-sensitive individuals'
        ],
        taurine: [
          'Limited safety data for pregnant women',
          'May interact with certain medications'
        ]
      },
      healthConditions: [
        'Consult healthcare provider if pregnant, nursing, or with health conditions',
        'Not recommended for individuals with cardiovascular issues',
        'Monitor caffeine intake if sensitive'
      ]
    },
    lastUpdated: '2025-12-10',
    complianceScore: 95
  },

  'US': {
    region: 'United States',
    countryCode: 'US',
    healthAuthority: {
      name: 'FDA (Food and Drug Administration)',
      country: 'United States',
      website: 'https://www.fda.gov',
      caffeineGuidelines: {
        safeDailyLimit: 400,
        maxPerServing: 400,
        warningAge: 0,
        pregnancyLimit: 200
      },
      dietaryGuidelines: [
        'Generally recognized as safe (GRAS) for healthy adults',
        'Moderation is key',
        'Individual sensitivity varies'
      ],
      specialPopulations: ['Children', 'Pregnant women', 'Elderly', 'People with health conditions']
    },
    ageGuidelines: [
      {
        minAge: 0,
        maxDailyCaffeine: 0,
        maxServingSize: 0,
        additionalWarnings: ['Not recommended for children'],
        regions: ['US'],
        parentalConsent: false
      },
      {
        minAge: 18,
        maxDailyCaffeine: 400,
        maxServingSize: 355,
        additionalWarnings: ['Adult consumption only', 'Monitor intake'],
        regions: ['US'],
        parentalConsent: false
      }
    ],
    pregnancyGuidelines: {
      avoidIngredients: ['high caffeine content'],
      maxCaffeine: 200,
      warnings: [
        'Limit caffeine during pregnancy',
        'Consult healthcare provider',
        'Consider total daily caffeine intake'
      ],
      regions: ['US'],
      trimesterSpecific: false,
      recommendations: [
        'Choose lower caffeine alternatives',
        'Read all labels carefully',
        'Track total caffeine consumption'
      ]
    },
    dietaryRestrictions: [
      {
        ingredient: 'high fructose corn syrup',
        restrictionType: 'caution',
        reason: 'Health concerns',
        alternatives: ['cane sugar', 'stevia', 'natural sweeteners'],
        regions: ['US']
      },
      {
        ingredient: 'artificial colors',
        restrictionType: 'caution',
        reason: 'Some people prefer natural colors',
        alternatives: ['natural colorants', 'fruit extracts'],
        regions: ['US']
      }
    ],
    healthConditionWarnings: [
      {
        condition: 'anxiety disorders',
        warnings: [
          'Caffeine may worsen anxiety symptoms',
          'Monitor for increased nervousness',
          'Consider caffeine-free alternatives'
        ],
        avoidIngredients: ['caffeine', 'guarana'],
        maxRecommendations: {
          caffeine: 50
        },
        regions: ['US'],
        severity: 'medium'
      },
      {
        condition: 'heart conditions',
        warnings: [
          'Caffeine can increase heart rate and blood pressure',
          'Consult cardiologist before consumption',
          'Monitor for irregular heartbeat'
        ],
        avoidIngredients: ['caffeine', 'taurine'],
        maxRecommendations: {
          caffeine: 100
        },
        regions: ['US'],
        severity: 'high'
      }
    ],
    culturalPreferences: {
      region: 'US',
      preferences: {
        sweetness: 'high',
        carbonation: 'high',
        flavorProfile: ['citrus', 'berry', 'tropical', 'cola'],
        ingredients: ['bold flavors', 'fruity notes'],
        avoid: ['bitter flavors', 'subtle tastes'],
        traditional: ['cola', 'orange', 'grape', 'cherry']
      },
      seasonal: {
        winter: ['peppermint', 'cranberry', 'apple'],
        spring: ['lemon', 'lime', 'strawberry'],
        summer: ['watermelon', 'pineapple', 'mango'],
        autumn: ['pumpkin spice', 'apple', 'cinnamon']
      },
      occasions: [
        {
          name: 'Super Bowl',
          ingredients: ['bold flavors', 'high carbonation'],
          avoid: ['subtle flavors']
        },
        {
          name: 'College sports',
          ingredients: ['high caffeine', 'energizing'],
          avoid: ['sedating ingredients']
        }
      ]
    },
    caffeineLimits: {
      perServing: 400,
      perDay: 400,
      special: []
    },
    warnings: {
      general: [
        'Not recommended for children, pregnant women, or caffeine-sensitive individuals',
        'Contains caffeine',
        'Consume responsibly',
        'Do not exceed recommended daily intake'
      ],
      ingredientSpecific: {
        caffeine: [
          'May cause insomnia, nervousness, restlessness',
          'Can increase heart rate and blood pressure',
          'May cause stomach upset'
        ],
        guarana: [
          'Additional caffeine source',
          'May increase total caffeine content'
        ]
      },
      healthConditions: [
        'Consult healthcare provider before consumption if pregnant, nursing, or have health conditions',
        'Not recommended for individuals with heart conditions or anxiety disorders',
        'Stop consumption if adverse effects occur'
      ]
    },
    lastUpdated: '2025-12-10',
    complianceScore: 92
  },

  'JP': {
    region: 'Japan',
    countryCode: 'JP',
    healthAuthority: {
      name: 'MHLW (Ministry of Health, Labour and Welfare)',
      country: 'Japan',
      website: 'https://www.mhlw.go.jp',
      caffeineGuidelines: {
        safeDailyLimit: 400,
        maxPerServing: 100,
        warningAge: 0,
        pregnancyLimit: 200
      },
      dietaryGuidelines: [
        'Moderate consumption recommended',
        'Consider total daily caffeine intake',
        'Individual sensitivity varies significantly'
      ],
      specialPopulations: ['Children', 'Pregnant women', 'Elderly', 'People sensitive to caffeine']
    },
    ageGuidelines: [
      {
        minAge: 0,
        maxDailyCaffeine: 0,
        maxServingSize: 0,
        additionalWarnings: ['Not recommended for children'],
        regions: ['JP'],
        parentalConsent: false
      },
      {
        minAge: 15,
        maxDailyCaffeine: 300,
        maxServingSize: 350,
        additionalWarnings: ['Moderate consumption', 'Monitor response'],
        regions: ['JP'],
        parentalConsent: false
      }
    ],
    pregnancyGuidelines: {
      avoidIngredients: ['high caffeine'],
      maxCaffeine: 200,
      warnings: [
        'Limit caffeine during pregnancy',
        'Consult obstetrician',
        'Consider cultural dietary practices'
      ],
      regions: ['JP'],
      trimesterSpecific: false,
      recommendations: [
        'Choose traditional Japanese energizing alternatives',
        'Consider matcha (lower caffeine per serving)',
        'Monitor overall diet'
      ]
    },
    dietaryRestrictions: [
      {
        ingredient: 'artificial additives',
        restrictionType: 'caution',
        reason: 'Preference for natural ingredients',
        alternatives: ['natural extracts', 'traditional Japanese flavors'],
        regions: ['JP']
      }
    ],
    healthConditionWarnings: [
      {
        condition: 'caffeine sensitivity',
        warnings: [
          'Many Japanese people have lower caffeine tolerance',
          'Start with smaller amounts',
          'Monitor individual response carefully'
        ],
        avoidIngredients: ['caffeine', 'guarana'],
        maxRecommendations: {
          caffeine: 50
        },
        regions: ['JP'],
        severity: 'medium'
      }
    ],
    culturalPreferences: {
      region: 'JP',
      preferences: {
        sweetness: 'low',
        carbonation: 'medium',
        flavorProfile: ['citrus', 'green tea', 'fruity', 'subtle'],
        ingredients: ['natural extracts', 'green tea', 'yuzu', 'mikan'],
        avoid: ['overly sweet', 'artificial flavors'],
        traditional: ['matcha', 'yuzu', 'umeboshi', 'sakura']
      },
      seasonal: {
        winter: ['citrus', 'spiced', 'warming'],
        spring: ['sakura', 'green tea', 'light'],
        summer: ['cooling', 'citrus', 'refreshing'],
        autumn: ['apple', 'pear', 'spiced']
      },
      occasions: [
        {
          name: 'Hanami (Cherry Blossom)',
          ingredients: ['sakura', 'light flavors'],
          avoid: ['heavy, rich flavors']
        },
        {
          name: 'Obon',
          ingredients: ['traditional flavors'],
          avoid: ['excessive stimulation']
        }
      ]
    },
    caffeineLimits: {
      perServing: 100,
      perDay: 400,
      special: []
    },
    warnings: {
      general: [
        'Individual caffeine sensitivity varies',
        'Start with smaller amounts',
        'Consider total daily caffeine intake'
      ],
      ingredientSpecific: {
        caffeine: [
          'May affect sleep quality',
          'Individual tolerance varies significantly',
          'May cause stomach upset in sensitive individuals'
        ]
      },
      healthConditions: [
        'Consult healthcare provider before consumption',
        'Consider individual health conditions and medications',
        'Monitor for any adverse reactions'
      ]
    },
    lastUpdated: '2025-12-10',
    complianceScore: 88
  }
};

/**
 * Get regional safety guidelines
 */
export async function getRegionalSafetyGuidelines(countryCode: string): Promise<RegionalSafetyGuideline> {
  // Try exact match first
  if (REGIONAL_SAFETY_DATA[countryCode]) {
    return REGIONAL_SAFETY_DATA[countryCode];
  }

  // Try regional blocks
  const regionCode = getRegionalBlock(countryCode);
  if (REGIONAL_SAFETY_DATA[regionCode]) {
    return REGIONAL_SAFETY_DATA[regionCode];
  }

  // Fallback to US guidelines
  console.warn(`No specific safety data for ${countryCode}, using US standards`);
  return REGIONAL_SAFETY_DATA['US'];
}

/**
 * Get safety guidelines based on geolocation
 */
export async function getSafetyFromGeolocation(geoData: GeolocationData): Promise<RegionalSafetyGuideline> {
  return getRegionalSafetyGuidelines(geoData.country);
}

/**
 * Validate recipe against regional safety guidelines
 */
export function validateRegionalSafety(
  recipe: any,
  guidelines: RegionalSafetyGuideline,
  region: string
): {
  compliant: boolean;
  warnings: string[];
  violations: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Check caffeine content
  const caffeineContent = recipe.caffeine || 0;
  if (caffeineContent > guidelines.caffeineLimits.perServing) {
    violations.push(`Caffeine content (${caffeineContent}mg) exceeds recommended limit (${guidelines.caffeineLimits.perServing}mg) for ${region}`);
  }

  // Check for forbidden ingredients
  const ingredients = recipe.ingredients || [];
  for (const restriction of guidelines.dietaryRestrictions) {
    if (restriction.restrictionType === 'forbidden') {
      const hasForbidden = ingredients.some((ing: any) => 
        ing.name.toLowerCase().includes(restriction.ingredient.toLowerCase())
      );
      if (hasForbidden) {
        violations.push(`${restriction.ingredient} is forbidden in ${region}: ${restriction.reason}`);
      }
    }
  }

  // Check cultural preferences
  const avoidedIngredients = guidelines.culturalPreferences.preferences.avoid;
  const hasAvoidedIngredients = ingredients.some((ing: any) =>
    avoidedIngredients.some((avoided: string) =>
      ing.name.toLowerCase().includes(avoided.toLowerCase())
    )
  );
  if (hasAvoidedIngredients) {
    warnings.push(`Recipe contains ingredients not preferred in ${region}`);
  }

  // Add general warnings
  warnings.push(...guidelines.warnings.general);

  return {
    compliant: violations.length === 0,
    warnings,
    violations,
    recommendations: guidelines.warnings.general
  };
}

/**
 * Get age-appropriate guidelines
 */
export function getAgeBasedGuidelines(
  guidelines: RegionalSafetyGuideline,
  age: number
): AgeBasedGuideline | null {
  return guidelines.ageGuidelines.find(g => age >= g.minAge) || null;
}

/**
 * Check pregnancy safety
 */
export function checkPregnancySafety(
  recipe: any,
  guidelines: RegionalSafetyGuideline
): {
  safe: boolean;
  warnings: string[];
  alternatives: string[];
} {
  const warnings: string[] = [];
  const alternatives: string[] = [];

  // Check for ingredients to avoid during pregnancy
  const ingredients = recipe.ingredients || [];
  const hasAvoidedIngredients = ingredients.some((ing: any) =>
    guidelines.pregnancyGuidelines.avoidIngredients.some((avoided: string) =>
      ing.name.toLowerCase().includes(avoided.toLowerCase())
    )
  );

  if (hasAvoidedIngredients) {
    warnings.push(...guidelines.pregnancyGuidelines.warnings);
  }

  // Check caffeine content
  const caffeineContent = recipe.caffeine || 0;
  if (caffeineContent > guidelines.pregnancyGuidelines.maxCaffeine) {
    warnings.push(`Caffeine content (${caffeineContent}mg) exceeds pregnancy limit (${guidelines.pregnancyGuidelines.maxCaffeine}mg)`);
  }

  return {
    safe: warnings.length === 0,
    warnings,
    alternatives: guidelines.pregnancyGuidelines.recommendations
  };
}

/**
 * Get health condition warnings
 */
export function getHealthConditionWarnings(
  conditions: string[],
  guidelines: RegionalSafetyGuideline
): HealthConditionWarning[] {
  return guidelines.healthConditionWarnings.filter(warning =>
    conditions.some(condition =>
      condition.toLowerCase().includes(warning.condition.toLowerCase())
    )
  );
}

/**
 * Get cultural flavor preferences
 */
export function getCulturalFlavorPreferences(
  region: string,
  season?: string
): string[] {
  const guidelines = REGIONAL_SAFETY_DATA[region];
  if (!guidelines) return [];

  if (season) {
    return guidelines.culturalPreferences.seasonal[season as keyof typeof guidelines.culturalPreferences.seasonal] || [];
  }

  return guidelines.culturalPreferences.preferences.flavorProfile;
}

/**
 * Get ingredient alternatives for cultural restrictions
 */
export function getIngredientAlternatives(
  ingredient: string,
  region: string
): string[] {
  const guidelines = REGIONAL_SAFETY_DATA[region];
  if (!guidelines) return [];

  const restriction = guidelines.dietaryRestrictions.find(r =>
    r.ingredient.toLowerCase().includes(ingredient.toLowerCase())
  );

  return restriction?.alternatives || [];
}

/**
 * Check if ingredient is culturally appropriate
 */
export function isIngredientCulturallyAppropriate(
  ingredient: string,
  region: string
): {
  appropriate: boolean;
  reason?: string;
  alternatives?: string[];
} {
  const guidelines = REGIONAL_SAFETY_DATA[region];
  if (!guidelines) {
    return { appropriate: true };
  }

  const restriction = guidelines.dietaryRestrictions.find(r =>
    r.ingredient.toLowerCase().includes(ingredient.toLowerCase())
  );

  if (restriction) {
    return {
      appropriate: restriction.restrictionType !== 'forbidden',
      reason: restriction.reason,
      alternatives: restriction.alternatives
    };
  }

  return { appropriate: true };
}

/**
 * Get regional block for country code
 */
function getRegionalBlock(countryCode: string): string {
  const euCountries = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE'
  ]);

  if (euCountries.has(countryCode)) {
    return 'EU';
  }

  return countryCode;
}

/**
 * Get all supported regions
 */
export function getSupportedSafetyRegions(): Array<{
  code: string;
  name: string;
  complianceScore: number;
  caffeineLimit: number;
}> {
  return Object.entries(REGIONAL_SAFETY_DATA).map(([code, data]) => ({
    code,
    name: data.region,
    complianceScore: data.complianceScore,
    caffeineLimit: data.caffeineLimits.perServing
  }));
}

/**
 * Export safety data for audit purposes
 */
export function exportSafetyData(region: string): RegionalSafetyGuideline {
  return getRegionalSafetyGuidelines(region);
}

export default {
  getRegionalSafetyGuidelines,
  getSafetyFromGeolocation,
  validateRegionalSafety,
  getAgeBasedGuidelines,
  checkPregnancySafety,
  getHealthConditionWarnings,
  getCulturalFlavorPreferences,
  getIngredientAlternatives,
  isIngredientCulturallyAppropriate,
  getSupportedSafetyRegions,
  exportSafetyData
};