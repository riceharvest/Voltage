import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FlavorRecipe, Ingredient, Supplier } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Beaker, Package, Euro, MapPin, Zap, Mountain, Sparkles, Share2, ExternalLink, ShoppingCart, AlertTriangle, Star, Globe } from 'lucide-react';

const flavorsDir = path.join(process.cwd(), 'src/data/flavors');
let files: string[] = [];
let flavors: FlavorRecipe[] = [];
try {
  files = fs.readdirSync(flavorsDir).filter(file => file.endsWith('.json'));
  flavors = files.map(file => {
    try {
      const filePath = path.join(flavorsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as FlavorRecipe;
    } catch (error) {
      console.error(`Error reading/parsing ${file}:`, error);
      return null;
    }
  }).filter(f => f !== null) as FlavorRecipe[];
} catch (error) {
  console.error('Error reading flavors directory:', error);
}

const ingredientsPath = path.join(process.cwd(), 'src/data/ingredients/ingredients.json');
let ingredientsData: Ingredient[] = [];
try {
  const content = fs.readFileSync(ingredientsPath, 'utf-8');
  ingredientsData = JSON.parse(content);
} catch (error) {
  console.error('Error reading/parsing ingredients:', error);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ingredientsMap = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing.unit]));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ingredientNames = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing.name]));
const suppliersPath = path.join(process.cwd(), 'src/data/suppliers/netherlands.json');
let suppliersData: Supplier[] = [];
try {
  const content = fs.readFileSync(suppliersPath, 'utf-8');
  suppliersData = JSON.parse(content);
} catch (error) {
  console.error('Error reading/parsing suppliers:', error);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vendorMap = Object.fromEntries(suppliersData.map((s: Supplier) => [s.id, s.url]));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ingredientSuppliersMap = Object.fromEntries(ingredientsData.map((i: Ingredient) => [i.id, i.suppliers]));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ingredientsFullMap = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing]));

// Helper to map color descriptions to hex
const getColorHex = (color: any): string => {
  if (typeof color === 'string') return color
  if (color && color.description) {
    if (color.description.toLowerCase().includes('red')) return '#FF6B6B'
    if (color.description.toLowerCase().includes('green')) return '#32CD32'
    if (color.description.toLowerCase().includes('blue')) return '#0000FF'
    if (color.description.toLowerCase().includes('orange')) return '#FFA500'
    if (color.description.toLowerCase().includes('purple')) return '#800080'
    if (color.description.toLowerCase().includes('pink')) return '#FFC0CB'
    if (color.description.toLowerCase().includes('yellow')) return '#FFFF00'
    if (color.description.toLowerCase().includes('brown')) return '#A52A2A'
    if (color.description.toLowerCase().includes('clear')) return '#FFFFFF'
    return '#E0E0E0' // Default grey for unknown
  }
  return '#FFFFFF'
}

// Category-specific design system
const getCategoryInfo = (category?: string) => {
  const categoryMap = {
    classic: {
      title: 'Classic Soda',
      description: 'Traditional soda recipe',
      icon: Mountain,
      gradient: 'from-orange-600 via-orange-500 to-yellow-500',
      bgGradient: 'from-orange-50/50 to-yellow-50/50',
      borderColor: 'border-orange-200 hover:border-orange-300',
      cardBg: 'bg-gradient-to-br from-orange-50/30 to-yellow-50/30',
      textColor: 'text-orange-700',
      buttonBg: 'bg-orange-600 hover:bg-orange-700',
      accentColor: '#FF8C00'
    },
    energy: {
      title: 'Energy Drink',
      description: 'High-performance beverage',
      icon: Zap,
      gradient: 'from-blue-600 via-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50/50 to-cyan-50/50',
      borderColor: 'border-blue-200 hover:border-blue-300',
      cardBg: 'bg-gradient-to-br from-blue-50/30 to-cyan-50/30',
      textColor: 'text-blue-700',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      accentColor: '#0080FF'
    },
    hybrid: {
      title: 'Hybrid Recipe',
      description: 'Innovative fusion creation',
      icon: Sparkles,
      gradient: 'from-purple-600 via-purple-500 to-pink-500',
      bgGradient: 'from-purple-50/50 to-pink-50/50',
      borderColor: 'border-purple-200 hover:border-purple-300',
      cardBg: 'bg-gradient-to-br from-purple-50/30 to-pink-50/30',
      textColor: 'text-purple-700',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      accentColor: '#8000FF'
    }
  };
  
  return categoryMap[category as keyof typeof categoryMap] || categoryMap.classic;
};

// Safety warnings by category
const getSafetyWarning = (category?: string, caffeineCategory?: string) => {
  if (category === 'energy' || caffeineCategory === 'high') {
    return {
      title: "High Caffeine Warning",
      message: "This recipe contains significant caffeine. Do not consume if sensitive to stimulants. Consult healthcare provider if you have heart conditions, high blood pressure, or are pregnant.",
      severity: "warning"
    };
  }
  return null;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FlavorPage({ params }: PageProps) {
  const { id } = await params;
  const flavor = flavors.find(f => f.id === id);

  if (!flavor) {
    notFound();
  }

  const hexColor = getColorHex(flavor.color);
  const categoryInfo = getCategoryInfo(flavor.category);
  const CategoryIcon = categoryInfo.icon;
  const safetyWarning = getSafetyWarning(flavor.category, flavor.caffeineCategory);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <Link href="/flavors" className="hover:text-foreground transition-colors">Recipes</Link>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <Link href={`/flavors?category=${flavor.category}`} className="hover:text-foreground transition-colors capitalize">
              {flavor.category} Recipes
            </Link>
          </li>
          <li className="text-muted-foreground">/</li>
          <li className="text-foreground font-medium">{flavor.name}</li>
        </ol>
      </nav>

      {/* Header Section with Category-specific Design */}
      <div className={`mb-8 p-8 rounded-2xl bg-gradient-to-r ${categoryInfo.bgGradient} border ${categoryInfo.borderColor}`}>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0`}>
            <CategoryIcon className={`w-10 h-10 ${categoryInfo.textColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge className={`${categoryInfo.buttonBg} text-white border-0`}>
                <CategoryIcon className="w-4 h-4 mr-1" />
                {categoryInfo.title}
              </Badge>
              {flavor.sodaType && (
                <Badge variant="outline" className={categoryInfo.borderColor}>
                  {flavor.sodaType.replace('-', ' ')}
                </Badge>
              )}
              {flavor.caffeineCategory && (
                <Badge variant="outline" className={categoryInfo.borderColor}>
                  {flavor.caffeineCategory} caffeine
                </Badge>
              )}
            </div>
            <h1 className={`text-4xl md:text-5xl font-black mb-3 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${categoryInfo.gradient}`}>
              {flavor.name}
            </h1>
            <p className={`text-xl ${categoryInfo.textColor} mb-4 italic`}>
              "{flavor.profile}"
            </p>
            <p className="text-muted-foreground max-w-2xl">
              {flavor.profileNl || flavor.profile}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Recipe Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Safety Warning */}
          {safetyWarning && (
            <Card className={`border-orange-200 bg-orange-50/50 dark:bg-orange-950/20`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">{safetyWarning.title}</h3>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">{safetyWarning.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recipe Details Tabs */}
          <Card className={`${categoryInfo.cardBg} border ${categoryInfo.borderColor}`}>
            <Tabs defaultValue="ingredients" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="variations">Variations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ingredients" className="p-6">
                <h3 className="text-lg font-bold mb-4">Recipe Formulation</h3>
                <div className="space-y-4">
                  {Array.isArray(flavor.ingredients) && flavor.ingredients.map(ing => (
                    <div key={ing.ingredientId} className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                      <div className="flex-1">
                        {ingredientSuppliersMap?.[ing.ingredientId] && ingredientSuppliersMap[ing.ingredientId].length > 0 ? (
                          <a 
                            href={ingredientsFullMap?.[ing.ingredientId]?.supplierProducts?.[ingredientSuppliersMap[ing.ingredientId][0]] || vendorMap?.[ingredientSuppliersMap[ing.ingredientId][0]]} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-medium hover:underline flex items-center gap-2"
                            title={ingredientNames?.[ing.ingredientId] || ing.ingredientId}
                          >
                            {ingredientNames?.[ing.ingredientId] || ing.ingredientId}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="font-medium" title={ingredientNames?.[ing.ingredientId] || ing.ingredientId}>
                            {ingredientNames?.[ing.ingredientId] || ing.ingredientId}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-lg font-bold" style={{ color: categoryInfo.accentColor }}>
                          {ing.amount} {ingredientsMap?.[ing.ingredientId] || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="instructions" className="p-6">
                <h3 className="text-lg font-bold mb-4">Preparation Instructions</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 1: Base Preparation</h4>
                    <p className="text-muted-foreground">Prepare your base syrup according to the selected base recipe (classic, zero, or plain).</p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 2: Flavor Integration</h4>
                    <p className="text-muted-foreground">Add flavoring ingredients in the specified amounts. Mix thoroughly to ensure even distribution.</p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 3: Aging & Carbonation</h4>
                    <p className="text-muted-foreground">
                      Allow to age for {flavor.aging?.recommended || 0} hours for optimal flavor development. 
                      {flavor.dilutionRatio && ` Dilute at ratio ${flavor.dilutionRatio} before carbonation.`}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="variations" className="p-6">
                <h3 className="text-lg font-bold mb-4">Cultural Variations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      European Version
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Adapted for EU regulations with reduced artificial coloring and alternative natural sweeteners.
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      North American Version
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Traditional formulation with full-strength flavors and classic carbonation levels.
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Sugar-Free Alternative
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Modified recipe using stevia and monk fruit for reduced calorie content while maintaining flavor profile.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Quick Info & Actions */}
        <div className="space-y-6">
          
          {/* Recipe Stats */}
          <Card className={`${categoryInfo.cardBg} border ${categoryInfo.borderColor}`}>
            <CardHeader>
              <CardTitle className={categoryInfo.textColor}>Recipe Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Aging:</span>
                  <span className="font-mono font-bold">{flavor.aging?.recommended || 0}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dilution:</span>
                  <span className="font-mono font-bold">{flavor.dilutionRatio || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Caffeine:</span>
                  <span className="font-mono font-bold">{flavor.caffeineContent || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-mono font-bold">{flavor.priceRange || 'Medium'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {flavor.netherlandsAvailability && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      NL Available
                    </Badge>
                  )}
                  {flavor.packaging && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      <Package className="w-3 h-3 mr-1" />
                      {flavor.packaging}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className={`${categoryInfo.cardBg} border ${categoryInfo.borderColor}`}>
            <CardHeader>
              <CardTitle className={categoryInfo.textColor}>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className={`w-full ${categoryInfo.buttonBg} text-white`}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Calculator
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Recipe
              </Button>
              <Button variant="outline" className="w-full">
                <Star className="w-4 h-4 mr-2" />
                Save to Favorites
              </Button>
            </CardContent>
          </Card>

          {/* Amazon Products Section */}
          {flavor.affiliateLink && (
            <Card className={`${categoryInfo.cardBg} border ${categoryInfo.borderColor}`}>
              <CardHeader>
                <CardTitle className={categoryInfo.textColor}>Buy Ingredients</CardTitle>
                <CardDescription>Available from our partners</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className={`w-full ${categoryInfo.buttonBg} text-white`}>
                  <a
                    href={flavor.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buy on Partner Store
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Prices and availability may vary by region
                </p>
              </CardContent>
            </Card>
          )}

          {/* Premade Alternatives */}
          <Card className={`${categoryInfo.cardBg} border ${categoryInfo.borderColor}`}>
            <CardHeader>
              <CardTitle className={categoryInfo.textColor}>Premade Alternatives</CardTitle>
              <CardDescription>Save time with ready-made options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">Commercial Syrup</span>
                  <Badge variant="outline" className="text-xs">~€8.99</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Ready-to-use concentrate</p>
                <Button size="sm" variant="outline" className="w-full">
                  View Options
                </Button>
              </div>
              <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">Complete Kit</span>
                  <Badge variant="outline" className="text-xs">~€24.99</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">All ingredients included</p>
                <Button size="sm" variant="outline" className="w-full">
                  View Options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}