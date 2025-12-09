export interface Ingredient {
  id: string;
  name: string;
  nameNl: string; // Dutch name
  category: 'caffeine' | 'sweetener' | 'acid' | 'preservative' | 'flavor' | 'amino acid' | 'herb';
  unit: 'g' | 'ml' | 'mg' | 'tsp';
  safety: {
    maxDaily: number;
    warningThreshold: number;
    euCompliant: boolean;
    banned: boolean;
  };
  suppliers: string[];
  supplierProducts?: Record<string, string>; // specific product URLs
  supplierUrls?: string[]; // additional supplier URLs
}

export interface Supplier {
  id: string;
  name: string;
  url: string;
  location: string;
}

export interface BaseIngredient {
  ingredientId: string;
  amount: number;
}

export interface FlavorIngredient {
  ingredientId: string;
  amount: number;
}

export interface Instruction {
  step: number;
  description: string;
  descriptionNl: string;
  warning?: string;
  warningNl?: string;
}

export interface SafetyCheck {
  type: 'dosage' | 'compliance' | 'age';
  message: string;
  messageNl: string;
  severity: 'warning' | 'error';
}

export interface BaseRecipe {
  id: string;
  name: string;
  nameNl: string;
  type: 'classic' | 'zero' | 'plain';
  yield: {
    syrup: number; // ml
    drink: number; // ml
  };
  ingredients: BaseIngredient[];
  instructions: Instruction[];
  safetyChecks: SafetyCheck[];
}

export interface ColorSpec {
  type: 'natural' | 'artificial';
  eNumber?: string;
  description: string;
}

export interface FlavorRecipe {
  id: string;
  name: string;
  nameNl: string;
  profile: string;
  profileNl: string;
  ingredients: FlavorIngredient[];
  color: ColorSpec;
  compatibleBases: string[]; // base IDs
  aging: {
    recommended: number; // hours
    optional: boolean;
  };
  dilutionRatio?: string; // for premade concentrates
  packaging?: string;
  priceRange?: string;
  netherlandsAvailability?: string;
  caffeineContent?: string; // mg per serving for premade concentrates
  affiliateLink?: string;
}

export interface DilutionRatio {
  syrup: number;
  water: number;
  total: number;
}

export interface CompleteRecipe {
  base: BaseRecipe;
  flavor: FlavorRecipe;
  dilution: DilutionRatio;
  caffeineContent: number; // mg per serving
}