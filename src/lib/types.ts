/**
 * Ingredient Interface
 * 
 * Represents a single ingredient used in energy drink recipes. This includes
 * safety information, suppliers, and regulatory compliance data.
 */
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

/**
 * Supplier Interface
 */
export interface Supplier {
  id: string;
  name: string;
  url: string;
  location: string;
}

/**
 * Base Ingredient Interface
 */
export interface BaseIngredient {
  ingredientId: string;
  amount: number;
}

/**
 * Flavor Ingredient Interface
 */
export interface FlavorIngredient {
  ingredientId: string;
  amount: number;
}

/**
 * Instruction Interface
 */
export interface Instruction {
  step: number;
  description: string;
  descriptionNl: string;
  warning?: string;
  warningNl?: string;
}

/**
 * Safety Check Interface
 */
export interface SafetyCheck {
  type: 'dosage' | 'compliance' | 'age';
  message: string;
  messageNl: string;
  severity: 'warning' | 'error';
}

/**
 * Base Recipe Interface
 */
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

/**
 * Color Specification Interface
 */
export interface ColorSpec {
  type: 'natural' | 'artificial';
  eNumber?: string;
  description: string;
}

/**
 * Amazon Product Interface
 */
export interface AmazonProduct {
  asin: string;
  region: 'US' | 'UK' | 'DE' | 'FR' | 'NL' | 'CA' | 'AU' | 'JP';
  price: number;
  currency: string;
  availability: 'in-stock' | 'out-of-stock' | 'pre-order';
  affiliateUrl: string;
  rating?: number;
  brand?: string;
  title: string;
  imageUrl?: string;
}

/**
 * Flavor Recipe Interface
 */
export interface FlavorRecipe {
  id: string;
  name: string;
  nameNl: string;
  profile: string;
  profileNl: string;
  category?: 'classic' | 'energy' | 'hybrid';
  sodaType?: 'cola' | 'citrus' | 'fruit' | 'cream' | 'root-beer' | 'ginger-ale' | 'energy-drink';
  caffeineCategory?: 'none' | 'low' | 'medium' | 'high';
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
  premadeProducts?: AmazonProduct[];
}

/**
 * Dilution Ratio Interface
 */
export interface DilutionRatio {
  syrup: number;
  water: number;
  total: number;
}

/**
 * Complete Recipe Interface
 */
export interface CompleteRecipe {
  base: BaseRecipe;
  flavor: FlavorRecipe;
  dilution: DilutionRatio;
  caffeineContent: number; // mg per serving
  premadeMode?: PremadeMode;
  syrupData?: PremadeSyrup[];
  costAnalysis?: CostComparison;
}

/**
 * Premade Syrup Interface
 */
export interface PremadeSyrup {
  id: string;
  brand: 'SodaStream' | 'Torani' | 'DaVinci' | 'Monin' | 'Starbucks' | 'Jordan\'s Skinny' | 'Grove Square' | 'Caffe Amici';
  name: string;
  category: 'flavor' | 'cream' | 'coffee' | 'tea' | 'spice' | 'fruit' | 'nut' | 'candy';
  concentration: 'concentrate' | 'ready-to-drink' | 'powder' | 'liquid';
  dilutionRatio: string; // e.g., '1:1', '1:2', '1:4', '1:8', '1:16'
  compatibleFlavors: string[];
  regionalPricing: Record<string, {
    price: number;
    currency: string;
    retailer: string;
    availability: 'in-stock' | 'limited' | 'out-of-stock';
    affiliateUrl?: string;
  }>;
  availability: 'in-stock' | 'limited' | 'out-of-stock' | 'discontinued';
  rating: number; // 0-5 stars
  reviewCount: number;
  description: string;
  tasteProfile: {
    sweetness: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    intensity: 'subtle' | 'moderate' | 'strong' | 'very-strong';
    notes: string[];
  };
  usageGuide: {
    recommendedRatio: string;
    maxDaily: number; // ml
    storage: string;
    shelfLife: string;
  };
  amazonAsins?: Record<string, string>; // region -> ASIN mapping
  imageUrl?: string;
}

/**
 * Premade Mode Interface
 */
export interface PremadeMode {
  mode: 'none' | 'direct' | 'hybrid' | 'concentrate';
  baseSyrup?: string; // PremadeSyrup ID
  customAdditions?: Array<{
    type: 'extract' | 'oil' | 'acid' | 'sweetener' | 'preservative';
    id: string;
    amount: number;
    unit: 'ml' | 'g' | 'tsp' | 'drops';
  }>;
  dilutionRatio: string;
  estimatedCost: {
    amount: number;
    currency: string;
    breakdown?: Record<string, number>; // component -> cost
  };
  preparationTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  qualityScore: number; // 0-100
  tasteAccuracy: number; // 0-100
}

/**
 * Cost Comparison Interface
 */
export interface CostComparison {
  diy: {
    ingredients: number;
    labor: number; // minutes * hourly rate
    equipment: number; // amortized cost
    total: number;
    costPerServing: number;
  };
  premade: {
    syrup: number;
    customAdditions: number;
    labor: number;
    total: number;
    costPerServing: number;
  };
  hybrid: {
    syrup: number;
    customAdditions: number;
    labor: number;
    total: number;
    costPerServing: number;
  };
  savings: number;
  recommendation: 'diy' | 'premade' | 'hybrid';
  qualityFactors: {
    tasteMatch: number; // 0-100
    convenience: number; // 0-100
    customization: number; // 0-100
    freshness: number; // 0-100
  };
}

/**
 * Enhanced FlavorRecipe with Premade Support
 */
export interface EnhancedFlavorRecipe extends FlavorRecipe {
  premadeMode?: PremadeMode;
  syrupData?: PremadeSyrup[];
  costAnalysis?: CostComparison;
  preparationMethod: 'diy' | 'premade' | 'hybrid';
  dilutionGuides?: DilutionGuide[];
  compatibilityMatrix?: Record<string, number>; // syrupId -> compatibility score
}

/**
 * Dilution Guide Interface
 */
export interface DilutionGuide {
  syrupType: 'concentrate' | 'ready-to-drink' | 'powder';
  concentration: string;
  targetStrength: 'very-light' | 'light' | 'medium' | 'strong' | 'very-strong';
  instructions: string[];
  batchScaling: Record<string, {
    syrup: string;
    water: string;
  }>;
  tasteAdjustments?: {
    tooSweet: string[];
    tooWeak: string[];
    tooStrong: string[];
  };
  carbonationNotes?: string;
  storageTips: string[];
}

/**
 * Syrup Marketplace Filter Interface
 */
export interface SyrupMarketplaceFilter {
  brands?: Array<PremadeSyrup['brand']>;
  categories?: Array<PremadeSyrup['category']>;
  concentrations?: Array<PremadeSyrup['concentration']>;
  priceRange?: { min: number; max: number; currency: string };
  availability?: Array<PremadeSyrup['availability']>;
  rating?: { min: number; max: number };
  compatibleFlavors?: string[];
  searchQuery?: string;
  sortBy: 'price' | 'rating' | 'popularity' | 'newest';
  sortOrder: 'asc' | 'desc';
}

/**
 * Syrup Recommendation Interface
 */
export interface SyrupRecommendation {
  syrup: PremadeSyrup;
  compatibilityScore: number; // 0-100
  reasons: string[];
  alternatives: PremadeSyrup[];
  estimatedCost: {
    amount: number;
    currency: string;
    pricePerMl: number;
  };
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  regionalAvailability: Record<string, PremadeSyrup['availability']>;
}
