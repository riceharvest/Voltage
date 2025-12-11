/**
 * Regional Regulatory Compliance System
 * 
 * Implements comprehensive regulatory compliance for global operations including:
 * - Region-specific food safety regulations (FDA, EU, Health Canada, etc.)
 * - Age verification requirements by region
 * - Caffeine content limits by jurisdiction
 * - Labeling and disclaimer requirements
 * - Import/export restrictions for ingredients
 * 
 * @example
 * ```typescript
 * const compliance = await getRegionalCompliance('US');
 * const ageLimit = compliance.ageVerification.required ? compliance.ageVerification.threshold : 0;
 * ```
 */

import { GeolocationData } from './geolocation';

export interface RegulatoryRequirement {
  region: string;
  category: 'safety' | 'age_verification' | 'labeling' | 'import_export' | 'caffeine_limit';
  requirement: string;
  value: any;
  mandatory: boolean;
  source: string;
  lastUpdated: string;
}

export interface AgeVerificationRequirement {
  required: boolean;
  threshold: number; // Age in years
  method: 'declaration' | 'id_verification' | 'credit_card' | 'none';
  documentation: boolean;
  penalties: string[];
}

export interface CaffeineLimit {
  maxPerServing: number; // mg per serving
  maxPerDay: number; // mg per day
  servingSize: number; // ml per serving
  warningRequired: boolean;
  specificWarnings: string[];
}

export interface LabelingRequirement {
  language: string[];
  requiredElements: string[];
  fontSize: {
    minimum: number;
    units: 'mm' | 'px' | 'pt';
  };
  colorContrast: number; // ratio
  warnings: string[];
  allergens: string[];
  nutritionalFacts: boolean;
}

export interface ImportExportRestriction {
  ingredient: string;
  restrictedRegions: string[];
  requiresLicense: boolean;
  customsDeclarations: boolean[];
  maxQuantity?: number;
  unit?: 'kg' | 'g' | 'l' | 'ml';
}

export interface RegionalCompliance {
  region: string;
  countryCode: string;
  regulatoryBody: string;
  lastUpdated: string;
  ageVerification: AgeVerificationRequirement;
  caffeineLimits: CaffeineLimit;
  labeling: LabelingRequirement;
  importExportRestrictions: ImportExportRestriction[];
  requiredCertifications: string[];
  complianceScore: number; // 0-100
}

/**
 * Regional regulatory compliance database
 */
const REGIONAL_COMPLIANCE_DATA: Record<string, RegionalCompliance> = {
  'US': {
    region: 'United States',
    countryCode: 'US',
    regulatoryBody: 'FDA (Food and Drug Administration)',
    lastUpdated: '2025-12-10',
    ageVerification: {
      required: false,
      threshold: 0,
      method: 'none',
      documentation: false,
      penalties: []
    },
    caffeineLimits: {
      maxPerServing: 400, // FDA guidance for healthy adults
      maxPerDay: 400,
      servingSize: 240,
      warningRequired: true,
      specificWarnings: [
        'This product contains caffeine',
        'Not recommended for children, pregnant women, or individuals sensitive to caffeine',
        'Do not exceed 400mg caffeine per day'
      ]
    },
    labeling: {
      language: ['English', 'Spanish'],
      requiredElements: [
        'Product name',
        'Net quantity',
        'Ingredients in descending order',
        'Nutritional facts',
        'Allergen information',
        'Caffeine content',
        'Manufacturer information',
        'Country of origin'
      ],
      fontSize: {
        minimum: 1.5,
        units: 'mm'
      },
      colorContrast: 4.5,
      warnings: [
        'This product contains caffeine',
        'May not be suitable for children, pregnant women, or individuals sensitive to caffeine'
      ],
      allergens: [
        'milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame'
      ],
      nutritionalFacts: true
    },
    importExportRestrictions: [
      {
        ingredient: 'caffeine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 25,
        unit: 'kg'
      },
      {
        ingredient: 'taurine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 100,
        unit: 'kg'
      }
    ],
    requiredCertifications: [
      'FDA Registration',
      'GMP Compliance',
      'FSMA Compliance'
    ],
    complianceScore: 95
  },

  'EU': {
    region: 'European Union',
    countryCode: 'EU',
    regulatoryBody: 'EFSA (European Food Safety Authority)',
    lastUpdated: '2025-12-10',
    ageVerification: {
      required: true,
      threshold: 16,
      method: 'declaration',
      documentation: false,
      penalties: [
        'Administrative fines',
        'License suspension'
      ]
    },
    caffeineLimits: {
      maxPerServing: 150, // EFSA recommendation
      maxPerDay: 400,
      servingSize: 250,
      warningRequired: true,
      specificWarnings: [
        'High caffeine content',
        'Not recommended for children, pregnant or breastfeeding women',
        'Do not exceed 400mg caffeine per day',
        'Consume in moderation'
      ]
    },
    labeling: {
      language: ['Any EU official language'],
      requiredElements: [
        'Product name',
        'Net quantity',
        'Ingredients in descending order',
        'Nutritional information',
        'Allergen information (highlighted)',
        'Caffeine content per serving',
        'Manufacturer/distributor details',
        'Country of origin/origin place',
        'Best before date',
        'Batch number'
      ],
      fontSize: {
        minimum: 1.2,
        units: 'mm'
      },
      colorContrast: 7,
      warnings: [
        'High caffeine content',
        'Not recommended for children, pregnant or breastfeeding women',
        'Do not exceed 400mg caffeine per day'
      ],
      allergens: [
        'celery', 'cereals containing gluten', 'crustaceans', 'eggs', 'fish', 'lupin', 'milk', 'molluscs', 'mustard', 'nuts', 'peanuts', 'sesame seeds', 'soybeans', 'sulphur dioxide'
      ],
      nutritionalFacts: true
    },
    importExportRestrictions: [
      {
        ingredient: 'caffeine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 20,
        unit: 'kg'
      },
      {
        ingredient: 'taurine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 50,
        unit: 'kg'
      }
    ],
    requiredCertifications: [
      'EU Food Business Registration',
      'HACCP Compliance',
      'ISO 22000',
      'REACH Registration (for certain ingredients)'
    ],
    complianceScore: 98
  },

  'CA': {
    region: 'Canada',
    countryCode: 'CA',
    regulatoryBody: 'Health Canada',
    lastUpdated: '2025-12-10',
    ageVerification: {
      required: false,
      threshold: 0,
      method: 'none',
      documentation: false,
      penalties: []
    },
    caffeineLimits: {
      maxPerServing: 180,
      maxPerDay: 400,
      servingSize: 355,
      warningRequired: true,
      specificWarnings: [
        'This product contains caffeine',
        'Not recommended for children, pregnant women, or individuals sensitive to caffeine',
        'Limit intake to 400mg caffeine per day'
      ]
    },
    labeling: {
      language: ['English', 'French'],
      requiredElements: [
        'Common name',
        'Net quantity',
        'List of ingredients',
        'Nutrition facts table',
        'Allergen declaration',
        'Caffeine content',
        'Name and principal place of business',
        'Country of origin'
      ],
      fontSize: {
        minimum: 6,
        units: 'pt'
      },
      colorContrast: 4.5,
      warnings: [
        'This product contains caffeine',
        'Not recommended for children, pregnant women, or individuals sensitive to caffeine'
      ],
      allergens: [
        'milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame seeds', 'sulphites'
      ],
      nutritionalFacts: true
    },
    importExportRestrictions: [
      {
        ingredient: 'caffeine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 25,
        unit: 'kg'
      }
    ],
    requiredCertifications: [
      'Health Canada Product License',
      'Canadian Food Inspection Agency Registration'
    ],
    complianceScore: 92
  },

  'AU': {
    region: 'Australia',
    countryCode: 'AU',
    regulatoryBody: 'FSANZ (Food Standards Australia New Zealand)',
    lastUpdated: '2025-12-10',
    ageVerification: {
      required: true,
      threshold: 18,
      method: 'id_verification',
      documentation: true,
      penalties: [
        'Fines up to AUD 1.1M',
        'Imprisonment up to 10 years'
      ]
    },
    caffeineLimits: {
      maxPerServing: 320,
      maxPerDay: 400,
      servingSize: 250,
      warningRequired: true,
      specificWarnings: [
        'High caffeine product',
        'Not recommended for children, pregnant women, or individuals sensitive to caffeine',
        'Do not consume more than 400mg caffeine per day'
      ]
    },
    labeling: {
      language: ['English'],
      requiredElements: [
        'Product name',
        'Net quantity',
        'Ingredients list',
        'Nutritional information',
        'Allergen declaration',
        'Caffeine content',
        'Manufacturer details',
        'Country of origin'
      ],
      fontSize: {
        minimum: 1.5,
        units: 'mm'
      },
      colorContrast: 4.5,
      warnings: [
        'High caffeine product',
        'Not recommended for children, pregnant women, or individuals sensitive to caffeine'
      ],
      allergens: [
        'milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame seeds'
      ],
      nutritionalFacts: true
    },
    importExportRestrictions: [
      {
        ingredient: 'caffeine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 30,
        unit: 'kg'
      }
    ],
    requiredCertifications: [
      'FSANZ Approval',
        'TGA Registration (if therapeutic claims)'
    ],
    complianceScore: 94
  },

  'JP': {
    region: 'Japan',
    countryCode: 'JP',
    regulatoryBody: 'MHLW (Ministry of Health, Labour and Welfare)',
    lastUpdated: '2025-12-10',
    ageVerification: {
      required: false,
      threshold: 0,
      method: 'none',
      documentation: false,
      penalties: []
    },
    caffeineLimits: {
      maxPerServing: 100,
      maxPerDay: 400,
      servingSize: 350,
      warningRequired: true,
      specificWarnings: [
        'contains caffeine',
        'not recommended for children, pregnant women',
        'excessive consumption may be harmful'
      ]
    },
    labeling: {
      language: ['Japanese'],
      requiredElements: [
        'Product name',
        'Net quantity',
        'Ingredients',
        'Nutritional information',
        'Allergen information',
        'Caffeine content',
        'Manufacturer information',
        'Country of origin'
      ],
      fontSize: {
        minimum: 6,
        units: 'pt'
      },
      colorContrast: 4.5,
      warnings: [
        'contains caffeine',
        'not recommended for children, pregnant women'
      ],
      allergens: [
        'milk', 'eggs', 'wheat', 'soba (buckwheat)', 'peanuts', 'aburaage (soybeans)', 'natto (soybeans)'
      ],
      nutritionalFacts: true
    },
    importExportRestrictions: [
      {
        ingredient: 'caffeine',
        restrictedRegions: [],
        requiresLicense: false,
        customsDeclarations: [true],
        maxQuantity: 20,
        unit: 'kg'
      }
    ],
    requiredCertifications: [
      'MHLW Notification',
      'Japan Food Sanitation Law Compliance'
    ],
    complianceScore: 90
  }
};

/**
 * Get regional compliance information
 */
export async function getRegionalCompliance(countryCode: string): Promise<RegionalCompliance> {
  // Try exact match first
  if (REGIONAL_COMPLIANCE_DATA[countryCode]) {
    return REGIONAL_COMPLIANCE_DATA[countryCode];
  }

  // Try regional blocks (EU, etc.)
  const regionCode = getRegionalBlock(countryCode);
  if (REGIONAL_COMPLIANCE_DATA[regionCode]) {
    return REGIONAL_COMPLIANCE_DATA[regionCode];
  }

  // Fallback to US compliance
  console.warn(`No specific compliance data for ${countryCode}, using US standards`);
  return REGIONAL_COMPLIANCE_DATA['US'];
}

/**
 * Get regional compliance based on geolocation data
 */
export async function getComplianceFromGeolocation(geoData: GeolocationData): Promise<RegionalCompliance> {
  return getRegionalCompliance(geoData.country);
}

/**
 * Check if ingredient is restricted in a region
 */
export function isIngredientRestricted(ingredient: string, region: string): boolean {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return false;
  }

  return compliance.importExportRestrictions.some(
    restriction => restriction.ingredient.toLowerCase() === ingredient.toLowerCase()
  );
}

/**
 * Get ingredient restrictions for a region
 */
export function getIngredientRestrictions(ingredient: string, region: string): ImportExportRestriction | null {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return null;
  }

  return compliance.importExportRestrictions.find(
    restriction => restriction.ingredient.toLowerCase() === ingredient.toLowerCase()
  ) || null;
}

/**
 * Get required warnings for a region
 */
export function getRequiredWarnings(region: string): string[] {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return REGIONAL_COMPLIANCE_DATA['US'].caffeineLimits.specificWarnings;
  }

  return compliance.caffeineLimits.specificWarnings;
}

/**
 * Get age verification requirements
 */
export function getAgeVerificationRequirement(region: string): AgeVerificationRequirement {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return REGIONAL_COMPLIANCE_DATA['US'].ageVerification;
  }

  return compliance.ageVerification;
}

/**
 * Check if caffeine limits are exceeded
 */
export function checkCaffeineCompliance(
  caffeineContent: number,
  region: string,
  dailyConsumption: number = 0
): { compliant: boolean; warnings: string[] } {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return {
      compliant: true,
      warnings: []
    };
  }

  const warnings: string[] = [];
  const limits = compliance.caffeineLimits;

  // Check per-serving limit
  if (caffeineContent > limits.maxPerServing) {
    warnings.push(`Exceeds recommended caffeine per serving for ${region} (${limits.maxPerServing}mg)`);
  }

  // Check daily limit
  if (dailyConsumption > limits.maxPerDay) {
    warnings.push(`Exceeds recommended daily caffeine for ${region} (${limits.maxPerDay}mg)`);
  }

  return {
    compliant: warnings.length === 0,
    warnings
  };
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
export function getSupportedRegions(): Array<{code: string, name: string, complianceScore: number}> {
  return Object.entries(REGIONAL_COMPLIANCE_DATA).map(([code, data]) => ({
    code,
    name: data.region,
    complianceScore: data.complianceScore
  }));
}

/**
 * Validate labeling compliance
 */
export function validateLabelingCompliance(
  labelText: string,
  region: string,
  language: string
): { compliant: boolean; missingElements: string[]; issues: string[] } {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  if (!compliance) {
    return {
      compliant: true,
      missingElements: [],
      issues: []
    };
  }

  const issues: string[] = [];
  const requiredElements = compliance.labeling.requiredElements;
  const missingElements: string[] = [];

  // Check if required elements are present
  for (const element of requiredElements) {
    if (!labelText.toLowerCase().includes(element.toLowerCase())) {
      missingElements.push(element);
    }
  }

  // Check language support
  if (!compliance.labeling.language.includes(language)) {
    issues.push(`Label must be in one of: ${compliance.labeling.language.join(', ')}`);
  }

  // Check caffeine content disclosure
  if (!/caffeine\s+\d+\s*mg/i.test(labelText)) {
    issues.push('Caffeine content must be clearly stated in mg');
  }

  return {
    compliant: missingElements.length === 0 && issues.length === 0,
    missingElements,
    issues
  };
}

/**
 * Get compliance score for a region
 */
export function getComplianceScore(region: string): number {
  const compliance = REGIONAL_COMPLIANCE_DATA[region];
  return compliance?.complianceScore || 0;
}

/**
 * Export compliance data for audit purposes
 */
export function exportComplianceData(region: string): RegionalCompliance {
  return getRegionalCompliance(region);
}

export default {
  getRegionalCompliance,
  getComplianceFromGeolocation,
  isIngredientRestricted,
  getIngredientRestrictions,
  getRequiredWarnings,
  getAgeVerificationRequirement,
  checkCaffeineCompliance,
  getSupportedRegions,
  validateLabelingCompliance,
  getComplianceScore,
  exportComplianceData
};