/**
 * Enhanced Calculator Page
 * 
 * Comprehensive calculator interface with all new platform capabilities
 * including multi-mode support, batch scaling, Amazon integration,
 * cultural adaptations, and advanced analytics.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  ShieldCheck, 
  Settings, 
  DollarSign, 
  Clock, 
  Zap, 
  ChefHat, 
  Coffee, 
  Home, 
  Wrench, 
  Package, 
  Sparkles,
  TrendingUp,
  Globe,
  Smartphone,
  BarChart3,
  ShoppingCart,
  Award,
  Users,
  Thermometer,
  Scale,
  Beaker,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Download,
  Share2,
  Save,
  RefreshCw,
  Eye,
  Lightbulb,
  Target,
  Star
} from 'lucide-react';
import { EnhancedCalculatorService, CalculatorInput } from '@/lib/enhanced-calculator-service';
import { loadAllFlavors } from '@/data/index';
import { trackCalculatorUsage, trackFlavorSelection, trackRecipeGeneration, trackSafetyWarning } from '@/lib/analytics';
import { FlavorRecipe } from '@/lib/types';

/**
 * Enhanced Calculator Page Component
 */
export default function EnhancedCalculatorPage() {
  const [calculatorInput, setCalculatorInput] = useState<CalculatorInput>({
    category: 'classic',
    mode: 'diy',
    targetFlavor: '',
    targetVolume: 500,
    servingSize: 250,
    batchSize: 2,
    region: 'EU',
    currency: 'EUR',
    language: 'en',
    qualityPreference: 'standard',
    timePreference: 'monthly',
    culturalPreference: 'european',
    age: 25,
    healthConditions: [],
    caffeineSensitivity: 'medium',
    useAmazonIntegration: true,
    enableBatchOptimization: true,
    enableCostAnalysis: true,
    enableRegionalAdaptation: true
  });
  
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [allFlavors, setAllFlavors] = useState<FlavorRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [mobileMode, setMobileMode] = useState(false);

  const calculatorService = useMemo(() => new EnhancedCalculatorService(), []);

  // Load flavors on component mount
  useEffect(() => {
    const loadData = async () => {
      const flavors = await loadAllFlavors();
      setAllFlavors(flavors);
    };
    loadData();
  }, []);

  // Track page view
  useEffect(() => {
    trackCalculatorUsage('enhanced_page_view');
  }, []);

  // Perform calculation
  const performCalculation = async () => {
    if (!calculatorInput.targetFlavor) return;
    
    setLoading(true);
    try {
      const result = await calculatorService.performEnhancedCalculation(calculatorInput);
      setCalculationResult(result);
      trackRecipeGeneration({
        base: calculatorInput.category,
        flavors: [calculatorInput.targetFlavor],
        caffeine: result.basic.caffeine,
        volume: calculatorInput.targetVolume,
        mode: calculatorInput.mode,
        category: calculatorInput.category
      });
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get category-specific recommendations
  const categoryRecommendations = useMemo(() => {
    const categoryFlavors = allFlavors.filter(f => f.category === calculatorInput.category);
    return {
      classic: {
        title: 'Classic Soda Favorites',
        description: 'Timeless flavors that never go out of style',
        flavors: categoryFlavors.slice(0, 6),
        defaultCaffeine: 0,
        recommendedVolume: 330,
        culturalNote: 'Perfect for those who love traditional soda experiences'
      },
      energy: {
        title: 'Energy Drink Blends',
        description: 'High-performance formulas for maximum energy',
        flavors: categoryFlavors.slice(0, 6),
        defaultCaffeine: 80,
        recommendedVolume: 250,
        culturalNote: 'Optimized for peak performance and alertness'
      },
      hybrid: {
        title: 'Innovative Combinations',
        description: 'Creative blends of classic and modern flavors',
        flavors: categoryFlavors.slice(0, 6),
        defaultCaffeine: 40,
        recommendedVolume: 300,
        culturalNote: 'For adventurous taste explorers seeking something unique'
      }
    }[calculatorInput.category];
  }, [calculatorInput.category, allFlavors]);

  return (
    <div className={`container mx-auto px-4 py-8 max-w-7xl ${mobileMode ? 'max-w-sm' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600">
            Enhanced Calculator
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={mobileMode ? "default" : "outline"}
              size="sm"
              onClick={() => setMobileMode(!mobileMode)}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              {mobileMode ? 'Desktop' : 'Mobile'}
            </Button>
          </div>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Comprehensive beverage calculator with multi-mode support, advanced batch scaling, 
          real-time Amazon pricing, cultural adaptations, and intelligent optimization.
        </p>
      </div>

      {/* Main Calculator Interface */}
      {!mobileMode ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-6 h-6" />
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category and Mode Selection */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Beverage Category</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {(['classic', 'energy', 'hybrid'] as const).map(category => (
                        <Button
                          key={category}
                          variant={calculatorInput.category === category ? "default" : "outline"}
                          onClick={() => setCalculatorInput(prev => ({ ...prev, category }))}
                          className="justify-start h-auto p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Coffee className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold capitalize">{category}</div>
                              <div className="text-xs opacity-80">
                                {category === 'classic' && 'Traditional Sodas'}
                                {category === 'energy' && 'High Performance'}
                                {category === 'hybrid' && 'Creative Fusion'}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Calculation Mode</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {([
                        { id: 'diy', title: 'DIY', desc: 'From scratch', icon: Wrench },
                        { id: 'premade', title: 'Premade', desc: 'Commercial', icon: Package },
                        { id: 'hybrid', title: 'Hybrid', desc: 'Blended', icon: Sparkles }
                      ] as const).map(mode => (
                        <Button
                          key={mode.id}
                          variant={calculatorInput.mode === mode.id ? "default" : "outline"}
                          onClick={() => setCalculatorInput(prev => ({ ...prev, mode: mode.id }))}
                          className="justify-start h-auto p-4"
                        >
                          <div className="flex items-center gap-3">
                            <mode.icon className="w-5 h-5" />
                            <div className="text-left">
                              <div className="font-semibold">{mode.title}</div>
                              <div className="text-xs opacity-80">{mode.desc}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Flavor Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Flavor Profile</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {categoryRecommendations.flavors.slice(0, 6).map(flavor => (
                      <Button
                        key={flavor.id}
                        variant={calculatorInput.targetFlavor === flavor.id ? "default" : "outline"}
                        onClick={() => setCalculatorInput(prev => ({ ...prev, targetFlavor: flavor.id }))}
                        className="h-auto p-3 flex flex-col items-center gap-2"
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
                </div>

                {/* Volume Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Volume & Batch Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Volume (ml)</label>
                      <input
                        type="number"
                        value={calculatorInput.targetVolume}
                        onChange={(e) => setCalculatorInput(prev => ({ 
                          ...prev, 
                          targetVolume: Number(e.target.value),
                          batchSize: Math.floor(Number(e.target.value) / prev.servingSize)
                        }))}
                        className="w-full p-2 border rounded-md"
                        min="100"
                        max="10000"
                        step="50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Serving Size (ml)</label>
                      <input
                        type="number"
                        value={calculatorInput.servingSize}
                        onChange={(e) => setCalculatorInput(prev => ({ 
                          ...prev, 
                          servingSize: Number(e.target.value),
                          batchSize: Math.floor(prev.targetVolume / Number(e.target.value))
                        }))}
                        className="w-full p-2 border rounded-md"
                        min="100"
                        max="500"
                        step="50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Batch Size</label>
                      <div className="w-full p-2 border rounded-md bg-gray-50 flex items-center">
                        <span className="font-medium">{calculatorInput.batchSize}</span>
                        <span className="text-sm text-gray-500 ml-1">servings</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regional Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Regional Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Region</label>
                      <select
                        value={calculatorInput.region}
                        onChange={(e) => setCalculatorInput(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="EU">Europe</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="JP">Japan</option>
                        <option value="NL">Netherlands</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Currency</label>
                      <select
                        value={calculatorInput.currency}
                        onChange={(e) => setCalculatorInput(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Language</label>
                      <select
                        value={calculatorInput.language}
                        onChange={(e) => setCalculatorInput(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="nl">Nederlands</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Feature Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'useAmazonIntegration', label: 'Amazon Pricing', icon: ShoppingCart },
                    { key: 'enableBatchOptimization', label: 'Batch Optimization', icon: TrendingUp },
                    { key: 'enableCostAnalysis', label: 'Cost Analysis', icon: DollarSign },
                    { key: 'enableRegionalAdaptation', label: 'Regional Adaptation', icon: Globe }
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{feature.label}</span>
                      </div>
                      <Button
                        variant={calculatorInput[feature.key as keyof CalculatorInput] ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCalculatorInput(prev => ({ 
                          ...prev, 
                          [feature.key]: !prev[feature.key as keyof CalculatorInput] 
                        }))}
                      >
                        {calculatorInput[feature.key as keyof CalculatorInput] ? 'On' : 'Off'}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Quality Preferences */}
                <div>
                  <h4 className="text-md font-semibold mb-2">Quality Preference</h4>
                  <div className="flex space-x-2">
                    {(['budget', 'standard', 'premium'] as const).map(pref => (
                      <Button
                        key={pref}
                        variant={calculatorInput.qualityPreference === pref ? "default" : "outline"}
                        onClick={() => setCalculatorInput(prev => ({ ...prev, qualityPreference: pref }))}
                      >
                        {pref.charAt(0).toUpperCase() + pref.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* User Profile */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Age</label>
                    <input
                      type="number"
                      value={calculatorInput.age}
                      onChange={(e) => setCalculatorInput(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full p-2 border rounded-md"
                      min="13"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Caffeine Sensitivity</label>
                    <select
                      value={calculatorInput.caffeineSensitivity}
                      onChange={(e) => setCalculatorInput(prev => ({ ...prev, caffeineSensitivity: e.target.value as any }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Calculate Button */}
                <Button 
                  className="w-full h-12 text-lg" 
                  onClick={performCalculation}
                  disabled={loading || !calculatorInput.targetFlavor}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-2" />
                      Perform Enhanced Calculation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Calculation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  Calculation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!calculationResult ? (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Configure your parameters and click calculate</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Basic Results */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Zap className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-blue-600">{calculationResult.basic.caffeine}mg</div>
                        <div className="text-sm text-blue-600">Caffeine</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-green-600">
                          {calculationResult.basic.valid ? '✓' : '⚠'}
                        </div>
                        <div className="text-sm text-green-600">Valid</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <Badge variant="outline" className="text-sm">
                        Recommended: {calculationResult.recommendations.approach.toUpperCase()}
                      </Badge>
                      <div className="space-y-1">
                        {calculationResult.recommendations.reasoning.slice(0, 2).map((reason: string, index: number) => (
                          <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Results */}
            {calculationResult && (
              <>
                {/* Batch Optimization Results */}
                {calculationResult.batchOptimization && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Batch Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Optimal Size:</span>
                          <span className="ml-2 font-medium">{calculationResult.batchOptimization.optimalBatchSize}ml</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost/Serving:</span>
                          <span className="ml-2 font-medium">€{calculationResult.batchOptimization.costPerServing.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Equipment Recommendations</h5>
                        {calculationResult.batchOptimization.equipmentRecommendations.map((rec: any, index: number) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded flex justify-between">
                            <span>{rec.type}</span>
                            <Badge variant="outline">{rec.efficiency}%</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Amazon Integration Results */}
                {calculationResult.amazonIntegration && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-orange-500" />
                        Amazon Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Price Range:</span>
                          <span className="ml-2 font-medium">
                            €{calculationResult.amazonIntegration.priceComparison.lowest.toFixed(2)} - 
                            €{calculationResult.amazonIntegration.priceComparison.highest.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Products:</span>
                          <span className="ml-2 font-medium">{calculationResult.amazonIntegration.products.length}</span>
                        </div>
                      </div>
                      {calculationResult.amazonIntegration.recommendations.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">Recommendations</h5>
                          {calculationResult.amazonIntegration.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                              <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Regional Adaptation Results */}
                {calculationResult.regionalAdaptation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Globe className="w-6 h-6 text-blue-500" />
                        Regional Adaptation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Compliance Status:</span>
                        <Badge variant={calculationResult.regionalAdaptation.regulatoryCompliance.compliant ? "default" : "destructive"}>
                          {calculationResult.regionalAdaptation.regulatoryCompliance.compliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                      </div>
                      {calculationResult.regionalAdaptation.culturalNotes.preparation.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">Cultural Notes</h5>
                          {calculationResult.regionalAdaptation.culturalNotes.preparation.slice(0, 2).map((note: string, index: number) => (
                            <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {note}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Cost Analysis Results */}
                {calculationResult.costAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-green-500" />
                        Cost Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: 'DIY Cost', value: calculationResult.costAnalysis.diy.totalCost },
                          { label: 'Premade Cost', value: calculationResult.costAnalysis.premade.totalCost },
                          { label: 'Hybrid Cost', value: calculationResult.costAnalysis.hybrid.totalCost }
                        ].map((cost, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{cost.label}:</span>
                            <span className="font-medium">€{cost.value.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Recommended:</span>
                          <Badge>{calculationResult.costAnalysis.recommendation.preferred.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Analytics Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-purple-500" />
                      Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Mode Usage:</span>
                        <div className="space-y-1 mt-1">
                          {Object.entries(calculationResult.analytics.usage.mode).map(([mode, count]) => (
                            <div key={mode} className="flex justify-between">
                              <span className="capitalize">{mode}:</span>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Feature Adoption:</span>
                        <div className="space-y-1 mt-1">
                          {Object.entries(calculationResult.analytics.usage.features).map(([feature, count]) => (
                            <div key={feature} className="flex justify-between">
                              <span className="text-xs">{feature}:</span>
                              <span className="font-medium text-xs">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Mobile Mode - Use Mobile Calculator Component */
        <div className="max-w-sm mx-auto">
          <EnhancedMobileCalculator 
            onCalculationComplete={(result) => setCalculationResult(result)}
            initialInput={calculatorInput}
          />
        </div>
      )}

      {/* Action Buttons */}
      {calculationResult && !mobileMode && (
        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Recipe
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      )}
    </div>
  );
}

// Import mobile calculator component
import { EnhancedMobileCalculator } from '@/components/calculator/enhanced-mobile-calculator';