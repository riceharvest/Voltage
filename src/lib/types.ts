/**
 * Ingredient Interface
 * 
 * Represents a single ingredient used in energy drink recipes. This includes
 * safety information, suppliers, and regulatory compliance data.
 * 
 * @example
 * ```typescript
 * const caffeine: Ingredient = {
 *   id: 'caffeine',
 *   name: 'Caffeine',
 *   nameNl: ' cafeïne',
 *   category: 'caffeine',
 *   unit: 'mg',
 *   safety: {
 *     maxDaily: 400,
 *     warningThreshold: 300,
 *     euCompliant: true,
 *     banned: false
 *   },
 *   suppliers: ['supplier1', 'supplier2']
 * };
 * ```
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
 * 
 * Represents a supplier that provides ingredients for energy drink recipes.
 * Includes location information for regulatory and shipping purposes.
 * 
 * @example
 * ```typescript
 * const supplier: Supplier = {
 *   id: 'supplier-001',
 *   name: 'Dutch Ingredients Co.',
 *   url: 'https://dutch-ingredients.nl',
 *   location: 'Netherlands'
 * };
 * ```
 */
export interface Supplier {
  id: string;
  name: string;
  url: string;
  location: string;
}

/**
 * Base Ingredient Interface
 * 
 * Represents an ingredient used in the base recipe (not flavor-specific).
 * Used for core components like caffeine, sweeteners, etc.
 * 
 * @example
 * ```typescript
 * const baseCaffeine: BaseIngredient = {
 *   ingredientId: 'caffeine',
 *   amount: 80  // 80mg
 * };
 * ```
 */
export interface BaseIngredient {
  ingredientId: string;
  amount: number;
}

/**
 * Flavor Ingredient Interface
 * 
 * Represents an ingredient used specifically in flavor recipes.
 * These are the additional ingredients that create unique flavors.
 * 
 * @example
 * ```typescript
 * const flavorIng: FlavorIngredient = {
 *   ingredientId: 'berry-extract',
 *   amount: 5  // 5ml
 * };
 * ```
 */
export interface FlavorIngredient {
  ingredientId: string;
  amount: number;
}

/**
 * Instruction Interface
 * 
 * Represents step-by-step instructions for recipe preparation.
 * Includes bilingual support for Dutch/English markets.
 * 
 * @example
 * ```typescript
 * const step: Instruction = {
 *   step: 1,
 *   description: 'Add caffeine to base',
 *   descriptionNl: 'Voeg cafeïne toe aan basis',
 *   warning: 'Handle with care',
 *   warningNl: 'Voorzichtig behandelen'
 * };
 * ```
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
 * 
 * Represents safety validation checks for recipes.
 * Used for regulatory compliance and user safety.
 * 
 * @example
 * ```typescript
 * const safetyCheck: SafetyCheck = {
 *   type: 'dosage',
 *   message: 'Caffeine content exceeds recommended daily intake',
 *   messageNl: 'Cafeïnegehalte overschrijdt aanbevolen dagelijkse inname',
 *   severity: 'warning'
 * };
 * ```
 */
export interface SafetyCheck {
  type: 'dosage' | 'compliance' | 'age';
  message: string;
  messageNl: string;
  severity: 'warning' | 'error';
}

/**
 * Base Recipe Interface
 * 
 * Represents the foundational recipe structure (classic, zero, plain).
 * Contains ingredients, instructions, and safety checks for the base syrup.
 * 
 * @example
 * ```typescript
 * const classicBase: BaseRecipe = {
 *   id: 'classic-base',
 *   name: 'Classic Energy Base',
 *   nameNl: 'Klassieke Energie Basis',
 *   type: 'classic',
 *   yield: {
 *     syrup: 1000,  // 1L syrup
 *     drink: 4000   // 4L final drink
 *   },
 *   ingredients: [...],
 *   instructions: [...],
 *   safetyChecks: [...]
 * };
 * ```
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
 * 
 * Represents the color characteristics of a flavor, including
 * regulatory information for food coloring additives.
 * 
 * @example
 * ```typescript
 * const naturalColor: ColorSpec = {
 *   type: 'natural',
 *   description: 'Natural berry extract'
 * };
 * 
 * const artificialColor: ColorSpec = {
 *   type: 'artificial',
 *   eNumber: 'E129',
 *   description: 'Allura Red AC'
 * };
 * ```
 */
export interface ColorSpec {
  type: 'natural' | 'artificial';
  eNumber?: string;
  description: string;
}

/**
 * Amazon Product Interface
 * 
 * Represents an Amazon product for beverage purchasing with affiliate support.
 * Used for sourcing premade sodas and related products through Amazon affiliate links.
 * 
 * @example
 * ```typescript
 * const product: AmazonProduct = {
 *   asin: 'B08N5WRWNW',
 *   region: 'NL',
 *   price: 4.99,
 *   currency: 'EUR',
 *   availability: 'in-stock',
 *   affiliateUrl: 'https://amazon.de/dp/B08N5WRWNW?tag=affiliate-20',
 *   rating: 4.5,
 *   brand: 'Coca-Cola',
 *   title: 'Coca-Cola Classic 330ml Can',
 *   imageUrl: 'https://example.com/image.jpg'
 * };
 * ```
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
 * 
 * Represents a complete flavor recipe including ingredients, color,
 * aging requirements, and market-specific information.
 * Enhanced for global soda platform expansion to support classic sodas,
 * premade products, and Amazon integration.
 * 
 * @example
 * ```typescript
 * const berryFlavor: FlavorRecipe = {
 *   id: 'berry-citrus-fusion',
 *   name: 'Berry Citrus Fusion',
 *   nameNl: 'Bessen Citrus Fusie',
 *   profile: 'Sweet and tangy berry blend with citrus notes',
 *   profileNl: 'Zoete en pittige bessenmix met citrustonen',
 *   category: 'energy',
 *   sodaType: 'fruit',
 *   caffeineCategory: 'medium',
 *   ingredients: [
 *     { ingredientId: 'berry-extract', amount: 10 },
 *     { ingredientId: 'citrus-oil', amount: 3 }
 *   ],
 *   color: {
 *     type: 'natural',
 *     description: 'Natural berry extract'
 *   },
 *   compatibleBases: ['classic', 'zero'],
 *   aging: {
 *     recommended: 24,
 *     optional: false
 *   },
 *   premadeProducts: [
 *     {
 *       asin: 'B08N5WRWNW',
 *       region: 'NL',
 *       price: 4.99,
 *       currency: 'EUR',
 *       availability: 'in-stock',
 *       affiliateUrl: 'https://amazon.de/dp/B08N5WRWNW?tag=affiliate-20',
 *       title: 'Energy Drink - Berry Fusion 330ml'
 *     }
 *   ]
 * };
 * 
 * const classicCola: FlavorRecipe = {
 *   id: 'classic-cola',
 *   name: 'Classic Cola',
 *   nameNl: 'Klassieke Cola',
 *   profile: 'Traditional cola flavor with caramel notes',
 *   profileNl: 'Traditionele cola-smaak met karameltonen',
 *   category: 'classic',
 *   sodaType: 'cola',
 *   caffeineCategory: 'medium',
 *   ingredients: [
 *     { ingredientId: 'cola-extract', amount: 15 },
 *     { ingredientId: 'caramel-color', amount: 2 }
 *   ],
 *   color: {
 *     type: 'artificial',
 *     eNumber: 'E150d',
 *     description: 'Caramel color IV'
 *   },
 *   compatibleBases: ['classic-soda'],
 *   aging: {
 *     recommended: 0,
 *     optional: false
 *   }
 * };
 * ```
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
 * 
 * Represents the dilution proportions for making the final drink.
 * Used for calculating serving sizes and mixing instructions.
 * 
 * @example
 * ```typescript
 * const dilution: DilutionRatio = {
 *   syrup: 1,    // 1 part syrup
 *   water: 3,    // 3 parts water
 *   total: 4     // 4 parts total
 * };
 * ```
 */
export interface DilutionRatio {
  syrup: number;
  water: number;
  total: number;
}

/**
 * Complete Recipe Interface
 * 
 * Represents a complete energy drink recipe combining base and flavor.
 * This is the final structure used for recipe display and calculations.
 * 
 * @example
 * ```typescript
 * const completeRecipe: CompleteRecipe = {
 *   base: classicBase,
 *   flavor: berryFlavor,
 *   dilution: {
 *     syrup: 1,
 *     water: 3,
 *     total: 4
 *   },
 *   caffeineContent: 80  // mg per serving
 * };
 * ```
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
 * 
 * Represents a commercial syrup product from major brands with concentration
 * ratios, compatibility data, and regional availability information.
 * 
 * @example
 * ```typescript
 * const toraniVanilla: PremadeSyrup = {
 *   id: 'torani-vanilla',
 *   brand: 'Torani',
 *   name: 'Torani Vanilla Syrup',
 *   concentration: 'concentrate',
 *   dilutionRatio: '1:1',
 *   compatibleFlavors: ['vanilla', 'cream', 'coffee'],
 *   regionalPricing: {
 *     US: { price: 12.99, currency: 'USD' },
 *     EU: { price: 11.49, currency: 'EUR' }
 *   },
 *   availability: 'in-stock',
 *   rating: 4.5,
 *   description: 'Rich vanilla syrup perfect for coffee and dessert drinks'
 * };
 * ```
 */
export interface PremadeSyrup {
  id: string;
  brand: 'SodaStream' | 'Torani' | 'DaVinci' | 'Monin' | 'Starbucks' | 'Jordan's Skinny' | 'Grove Square' | 'Caffe Amici';
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
 * 
 * Defines how a recipe should be prepared using premade ingredients.
 * Supports different preparation methods from direct use to complex hybrid approaches.
 * 
 * @example
 * ```typescript
 * const hybridMode: PremadeMode = {
 *   mode: 'hybrid',
 *   baseSyrup: 'sodastream-cola',
 *   customAdditions: [
 *     { type: 'extract', id: 'vanilla-extract', amount: 0.5 },
 *     { type: 'acid', id: 'citric-acid', amount: 0.1 }
 *   ],
 *   dilutionRatio: '1:3',
 *   estimatedCost: { amount: 0.85, currency: 'EUR' }
 * };
 * ```
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
 * 
 * Provides detailed cost analysis comparing DIY vs premade approaches
 * including ingredients, labor, and quality factors.
 * 
 * @example
 * ```typescript
 * const costAnalysis: CostComparison = {
 *   diy: {
 *     ingredients: 2.45,
 *     labor: 15,
 *     equipment: 0.5,
 *     total: 17.95
 *   },
 *   premade: {
 *     syrup: 8.99,
 *     customAdditions: 1.20,
 *     labor: 3,
 *     total: 13.19
 *   },
 *   savings: 4.76,
 *   recommendation: 'hybrid'
 * };
 * ```
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
 * 
 * Extended version of FlavorRecipe that includes premade modes,
 * syrup compatibility, and hybrid recipe capabilities.
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
 * 
 * Provides detailed dilution instructions for different syrup concentrations
 * and batch sizes with taste adjustment recommendations.
 * 
 * @example
 * ```typescript
 * const dilutionGuide: DilutionGuide = {
 *   syrupType: 'concentrate',
 *   concentration: '1:1',
 *   targetStrength: 'medium',
 *   instructions: [
 *     'Mix 1 part syrup with 3 parts water',
 *     'Add carbonation for sparkling drinks',
 *     'Taste and adjust sweetness as needed'
 *   ],
 *   batchScaling: {
 *     '250ml': { syrup: '62.5ml', water: '187.5ml' },
 *     '500ml': { syrup: '125ml', water: '375ml' },
 *     '1L': { syrup: '250ml', water: '750ml' }
 *   },
 *   carbonationNotes: 'Add carbonation after mixing for best results'
 * };
 * ```
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
 * 
 * Defines filtering options for the commercial syrup marketplace
 * with support for brand, category, concentration, and price ranges.
 * 
 * @example
 * ```typescript
 * const syrupFilter: SyrupMarketplaceFilter = {
 *   brands: ['Torani', 'DaVinci'],
 *   categories: ['flavor', 'cream'],
 *   concentrations: ['concentrate', 'ready-to-drink'],
 *   priceRange: { min: 5, max: 25 },
 *   availability: 'in-stock',
 *   rating: { min: 3.5, max: 5 }
 * };
 * ```
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
 * 
 * Provides intelligent syrup recommendations based on target flavors,
 * dietary preferences, and budget constraints.
 * 
 * @example
 * ```typescript
 * const recommendation: SyrupRecommendation = {
 *   syrup: toraniVanilla,
 *   compatibilityScore: 95,
 *   reasons: [
 *     'Excellent vanilla flavor match',
 *     'Highly rated by users (4.5/5)',
 *     'Good value for money'
 *   ],
 *   alternatives: [daVinciVanilla, moninVanilla],
 *   estimatedCost: { amount: 12.99, currency: 'EUR' },
 *   availability: 'in-stock'
 * };
 * ```
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