"use client"

import { useState, useMemo, useEffect } from 'react'
import { CaffeineCalculatorLazy } from '@/components/calculator/caffeine-calculator-lazy'
import { SafetyValidatorLazy } from '@/components/safety/safety-validator-lazy'
import { FlavorSelectorLazy } from '@/components/recipes/flavor-selector-lazy'
import { loadAllFlavors } from '@/data/index'
import { trackCalculatorUsage, trackFlavorSelection, trackRecipeGeneration, trackSafetyWarning } from '@/lib/analytics';
import { Calculator, ShieldCheck, Settings, DollarSign, Clock, Zap, ChefHat, Coffee, Home, Wrench, Package, Sparkles } from 'lucide-react'
import { FlavorRecipe, PremadeMode } from '@/lib/types'
import { PremadeSyrupService } from '@/lib/premade-syrups'
import { DilutionGuideService } from '@/lib/dilution-guides'
import { HybridRecipeService } from '@/lib/hybrid-recipes'
import { PremadeCostAnalysis } from '@/lib/premade-cost-analysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryTheme } from '@/lib/design-system'

// Import enhanced calculator components
import EnhancedCalculatorPage from './enhanced-calculator-page'

// Enhanced Calculator Page - Comprehensive multi-mode calculator system
export default function CalculatorPage() {
  // Redirect to enhanced calculator with feature flag support
  const [useEnhanced, setUseEnhanced] = useState(true);
  
  // Feature flag to control enhanced calculator rollout
  useEffect(() => {
    // Check if enhanced calculator is enabled via environment or feature flag
    const enhancedEnabled = process.env.NEXT_PUBLIC_ENHANCED_CALCULATOR === 'true' || 
                           localStorage.getItem('enhanced-calculator') === 'true';
    setUseEnhanced(enhancedEnabled);
  }, []);
  
  if (useEnhanced) {
    return <EnhancedCalculatorPage />;
  }
  
  // Fallback to original calculator if enhanced version is disabled
  return <OriginalCalculatorPage />;
}

// Original calculator page component (preserved for fallback)
function OriginalCalculatorPage() {
  const [caffeineMg, setCaffeineMg] = useState(0)
  const [selectedBase] = useState('classic')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [allFlavors, setAllFlavors] = useState<FlavorRecipe[]>([])
  
  // Enhanced mode selection state
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('diy')
  const [calculatorCategory, setCalculatorCategory] = useState<CalculatorCategory>('classic')
  
  // Premade mode state
  const [selectedSyrup, setSelectedSyrup] = useState<any>(null)
  const [costAnalysis, setCostAnalysis] = useState<any>(null)
  const [preparationTime, setPreparationTime] = useState(0)
  const [qualityScore, setQualityScore] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Volume and serving settings
  const [targetVolume, setTargetVolume] = useState(500) // ml
  const [servingSize, setServingSize] = useState(250) // ml per serving
  
  // Regional settings
  const [userRegion, setUserRegion] = useState('EU')
  const [currency, setCurrency] = useState('EUR')
  
  // Initialize services
  const syrupService = useMemo(() => new PremadeSyrupService(), [])
  const dilutionService = useMemo(() => new DilutionGuideService(), [])
  const hybridService = useMemo(() => new HybridRecipeService(syrupService), [syrupService])
  const costAnalyzer = useMemo(() => new PremadeCostAnalysis(syrupService), [syrupService])

  // Track page view
  useEffect(() => {
    trackCalculatorUsage('page_view');
  }, []);

  // Track flavor selection
  useEffect(() => {
    if (selectedFlavor) {
      const flavor = allFlavors.find(f => f.id === selectedFlavor);
      if (flavor) {
        trackFlavorSelection(selectedFlavor, flavor.name);
      }
    }
  }, [selectedFlavor, allFlavors]);

  // Track recipe generation when valid
  useEffect(() => {
    if (isValid && caffeineMg > 0 && selectedFlavor) {
      const flavor = allFlavors.find(f => f.id === selectedFlavor);
      if (flavor) {
        trackRecipeGeneration({
          base: selectedBase,
          flavors: [flavor.name],
          caffeine: caffeineMg,
          volume: targetVolume,
          mode: calculatorMode,
          category: calculatorCategory
        });
      }
    }
  }, [isValid, caffeineMg, selectedFlavor, selectedBase, targetVolume, calculatorMode, calculatorCategory, allFlavors]);

  // Load flavors on component mount
  useEffect(() => {
    loadAllFlavors().then(setAllFlavors)
  }, [])

  // Memoize ingredients to prevent excessive re-checks in SafetyValidator
  const ingredients = useMemo(() => {
    if (!selectedFlavor || allFlavors.length === 0) return []
    const flavor = allFlavors.find(f => f.id === selectedFlavor)
    return flavor ? flavor.ingredients.map(ing => ing.ingredientId) : []
  }, [selectedFlavor, allFlavors])

  // Calculate mode-specific settings
  const modeSettings = useMemo(() => {
    const theme = getCategoryTheme(calculatorCategory);
    
    switch (calculatorMode) {
      case 'diy':
        return {
          title: 'DIY Mode',
          description: 'Create from scratch with precise ingredient control',
          icon: Wrench,
          color: theme.colors.primary,
          features: ['Complete control', 'Cost-effective', 'Educational', 'Customizable']
        };
      case 'premade':
        return {
          title: 'Premade Mode',
          description: 'Use commercial syrups for convenience and consistency',
          icon: Package,
          color: theme.colors.secondary,
          features: ['Time-saving', 'Consistent taste', 'Easy preparation', 'Commercial quality']
        };
      case 'hybrid':
        return {
          title: 'Hybrid Mode',
          description: 'Blend premade bases with custom adjustments',
          icon: Sparkles,
          color: theme.colors.accent,
          features: ['Best of both', 'Flexible', 'Cost-optimized', 'Customizable results']
        };
      default:
        return modeSettings;
    }
  }, [calculatorMode, calculatorCategory]);

  // Category-specific recommendations
  const categoryRecommendations = useMemo(() => {
    const categoryFlavors = allFlavors.filter(f => f.category === calculatorCategory);
    
    switch (calculatorCategory) {
      case 'classic':
        return {
          title: 'Classic Soda Favorites',
          description: 'Timeless flavors that never go out of style',
          flavors: categoryFlavors.slice(0, 4),
          defaultCaffeine: 0,
          recommendedVolume: 330,
          culturalNote: 'Perfect for those who love traditional soda experiences'
        };
      case 'energy':
        return {
          title: 'Energy Drink Blends',
          description: 'High-performance formulas for maximum energy',
          flavors: categoryFlavors.slice(0, 4),
          defaultCaffeine: 80,
          recommendedVolume: 250,
          culturalNote: 'Optimized for peak performance and alertness'
        };
      case 'hybrid':
        return {
          title: 'Innovative Combinations',
          description: 'Creative blends of classic and modern flavors',
          flavors: categoryFlavors.slice(0, 4),
          defaultCaffeine: 40,
          recommendedVolume: 300,
          culturalNote: 'For adventurous taste explorers seeking something unique'
        };
      default:
        return categoryRecommendations;
    }
  }, [calculatorCategory, allFlavors]);

  const IconComponent = modeSettings.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section with Mode Selection */}
      <div className="mb-12">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600">
          Smart Calculator
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Design your custom {calculatorCategory} beverages with precision. Choose your approach: DIY creativity, premade convenience, or hybrid optimization.
        </p>
      </div>

      {/* Mode Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Calculator Mode & Category
          </CardTitle>
          <CardDescription>
            Select your preferred calculation approach and beverage category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Beverage Category</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['classic', 'energy', 'hybrid'] as CalculatorCategory[]).map(category => {
                const theme = getCategoryTheme(category);
                const isSelected = calculatorCategory === category;
                
                return (
                  <Button
                    key={category}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setCalculatorCategory(category)}
                    className={`h-auto p-4 flex flex-col items-center gap-2 ${
                      isSelected ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary : undefined,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: `${theme.colors.primary}20` }}>
                      <Coffee className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold capitalize">{category}</div>
                      <div className="text-xs opacity-80">
                        {category === 'classic' && 'Traditional Sodas'}
                        {category === 'energy' && 'High Performance'}
                        {category === 'hybrid' && 'Creative Fusion'}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Calculation Mode</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['diy', 'premade', 'hybrid'] as CalculatorMode[]).map(mode => {
                const isSelected = calculatorMode === mode;
                const modeInfo = {
                  diy: { icon: Wrench, title: 'DIY', desc: 'From scratch' },
                  premade: { icon: Package, title: 'Premade', desc: 'Commercial' },
                  hybrid: { icon: Sparkles, title: 'Hybrid', desc: 'Blended' }
                }[mode];
                
                return (
                  <Button
                    key={mode}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setCalculatorMode(mode)}
                    className={`h-auto p-4 flex flex-col items-center gap-2 ${
                      isSelected ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? modeSettings.color : undefined,
                      borderColor: isSelected ? modeSettings.color : undefined
                    }}
                  >
                    <modeInfo.icon className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold">{modeInfo.title}</div>
                      <div className="text-xs opacity-80">{modeInfo.desc}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mode Description */}
          <div className={`p-4 rounded-lg border-l-4`} style={{ 
            backgroundColor: `${modeSettings.color}10`,
            borderLeftColor: modeSettings.color 
          }}>
            <div className="flex items-center gap-3 mb-2">
              <IconComponent className="w-5 h-5" style={{ color: modeSettings.color }} />
              <h4 className="font-semibold" style={{ color: modeSettings.color }}>
                {modeSettings.title}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {modeSettings.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {modeSettings.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ChefHat className="w-6 h-6" />
            {categoryRecommendations.title}
          </CardTitle>
          <CardDescription>{categoryRecommendations.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {categoryRecommendations.flavors.map(flavor => (
              <Button
                key={flavor.id}
                variant="outline"
                onClick={() => setSelectedFlavor(flavor.id)}
                className={`h-auto p-3 flex flex-col items-center gap-2 ${
                  selectedFlavor === flavor.id ? 'bg-primary text-white' : ''
                }`}
              >
                <Coffee className="w-5 h-5" />
                <div className="text-center text-xs">
                  <div className="font-medium truncate w-full">{flavor.name}</div>
                  <div className="opacity-80">{flavor.sodaType?.replace('-', ' ')}</div>
                </div>
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground italic">
            {categoryRecommendations.culturalNote}
          </p>
        </CardContent>
      </Card>

      {/* Main Calculator Interface */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Volume & Serving Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Home className="w-6 h-6" />
                Volume Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Volume (ml)</label>
                  <input
                    type="number"
                    value={targetVolume}
                    onChange={(e) => setTargetVolume(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                    min="100"
                    max="2000"
                    step="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Serving Size (ml)</label>
                  <input
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                    min="100"
                    max="500"
                    step="50"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Servings per batch: {Math.floor(targetVolume / servingSize)}
              </div>
            </CardContent>
          </Card>

          {/* Caffeine Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-500" />
                1. Caffeine Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CaffeineCalculatorLazy 
                onCaffeineChange={setCaffeineMg} 
                baseId={selectedBase}
                category={calculatorCategory}
                targetVolume={targetVolume}
              />
            </CardContent>
          </Card>

          {/* Flavor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Coffee className="w-6 h-6 text-orange-500" />
                2. Flavor Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlavorSelectorLazy
                onFlavorSelect={setSelectedFlavor}
                selectedBase={selectedBase}
                category={calculatorCategory}
                recommendedFlavors={categoryRecommendations.flavors}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Safety Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                3. Safety Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SafetyValidatorLazy
                caffeineMg={caffeineMg}
                ingredients={ingredients}
                onValidationChange={setIsValid}
                category={calculatorCategory}
                mode={calculatorMode}
              />
            </CardContent>
          </Card>

          {/* Mode-specific Results */}
          {isValid && caffeineMg > 0 && selectedFlavor && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <ShieldCheck className="w-6 h-6" />
                  {modeSettings.title} - Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Caffeine: {caffeineMg}mg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Volume: {targetVolume}ml</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-purple-500" />
                    <span>Servings: {Math.floor(targetVolume / servingSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span>Est. Cost: €{(targetVolume * 0.15 / 1000).toFixed(2)}</span>
                  </div>
                </div>

                {/* Mode-specific additional info */}
                {calculatorMode === 'premade' && (
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Premade Syrup Required</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      We'll recommend commercial syrups that match your selected flavor profile.
                    </p>
                  </div>
                )}

                {calculatorMode === 'hybrid' && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Hybrid Approach</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Blend premade base with custom flavoring for optimal cost-to-quality ratio.
                    </p>
                  </div>
                )}

                <Button className="w-full" style={{ backgroundColor: modeSettings.color }}>
                  Generate {modeSettings.title} Recipe
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cost Analysis (for premade/hybrid modes) */}
          {(calculatorMode === 'premade' || calculatorMode === 'hybrid') && selectedFlavor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">DIY Approach:</span>
                    <span className="font-medium">€{(targetVolume * 0.25 / 1000).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Premade Syrup:</span>
                    <span className="font-medium">€{(targetVolume * 0.45 / 1000).toFixed(2)}</span>
                  </div>
                  {calculatorMode === 'hybrid' && (
                    <div className="flex justify-between">
                      <span className="text-sm">Hybrid Approach:</span>
                      <span className="font-medium">€{(targetVolume * 0.35 / 1000).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Cost per serving:</div>
                  <div className="text-lg font-bold">
                    €{((targetVolume * 0.35 / 1000) / (targetVolume / servingSize)).toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}