'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Coffee, 
  Zap, 
  Sparkles, 
  Shield, 
  Calculator,
  Globe,
  MapPin,
  AlertTriangle,
  Star,
  Users,
  BookOpen,
  Settings,
  Target
} from 'lucide-react';
import { getCategoryTheme } from '@/lib/design-system';

interface OnboardingData {
  categoryPreference: string[];
  region: string;
  language: string;
  experienceLevel: string;
  primaryGoals: string[];
  safetyAcknowledgment: boolean;
  notificationsEnabled: boolean;
  dataCollectionConsent: boolean;
}

const categories = [
  {
    id: 'classic',
    name: 'Classic Sodas',
    description: 'Traditional cola, lemon-lime, root beer and timeless flavors',
    icon: Coffee,
    color: '#FF8C00',
    features: ['Authentic recipes', 'Cultural variations', 'Nostalgic appeal'],
    popular: ['Cola', 'Lemon-Lime', 'Root Beer', 'Cream Soda']
  },
  {
    id: 'energy',
    name: 'Energy Drinks',
    description: 'High-performance beverages for energy and focus',
    icon: Zap,
    color: '#0066CC',
    features: ['Precise caffeine control', 'Safety validated', 'Performance optimized'],
    popular: ['High Caffeine', 'Sugar-Free', 'Fruit Blends', 'Pre-Workout']
  },
  {
    id: 'hybrid',
    name: 'Hybrid Recipes',
    description: 'Innovative combinations blending classic and modern elements',
    icon: Sparkles,
    color: '#8B5CF6',
    features: ['Creative fusion', 'Unique flavors', 'Best of both worlds'],
    popular: ['Caffeinated Cola', 'Energy Lemonade', 'Performance Root Beer']
  }
];

const regions = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' }
];

const experienceLevels = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to DIY beverage creation',
    icon: BookOpen,
    color: '#10B981'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Some experience with home brewing',
    icon: Target,
    color: '#F59E0B'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Experienced with complex formulations',
    icon: Star,
    color: '#EF4444'
  }
];

const primaryGoals = [
  { id: 'health', name: 'Healthier alternatives', description: 'Control ingredients and sugar content' },
  { id: 'cost', name: 'Cost savings', description: 'Make beverages at home for less' },
  { id: 'convenience', name: 'Convenience', description: 'Quick and easy preparation' },
  { id: 'customization', name: 'Customization', description: 'Create unique flavors' },
  { id: 'safety', name: 'Safety', description: 'Ensure safe consumption' },
  { id: 'learning', name: 'Learning', description: 'Understand beverage science' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    categoryPreference: [],
    region: 'US',
    language: 'en',
    experienceLevel: '',
    primaryGoals: [],
    safetyAcknowledgment: false,
    notificationsEnabled: false,
    dataCollectionConsent: false
  });

  const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Get to know the platform' },
    { id: 'preferences', title: 'Preferences', description: 'Tell us what you like' },
    { id: 'region', title: 'Region & Language', description: 'Set your location' },
    { id: 'experience', title: 'Experience Level', description: 'Help us customize' },
    { id: 'goals', title: 'Your Goals', description: 'What do you want to achieve?' },
    { id: 'safety', title: 'Safety First', description: 'Important safety information' },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleCategory = (categoryId: string) => {
    setData(prev => ({
      ...prev,
      categoryPreference: prev.categoryPreference.includes(categoryId)
        ? prev.categoryPreference.filter(id => id !== categoryId)
        : [...prev.categoryPreference, categoryId]
    }));
  };

  const toggleGoal = (goalId: string) => {
    setData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goalId)
        ? prev.primaryGoals.filter(id => id !== goalId)
        : [...prev.primaryGoals, goalId]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Preferences
        return data.categoryPreference.length > 0;
      case 2: // Region
        return data.region && data.language;
      case 3: // Experience
        return data.experienceLevel;
      case 4: // Goals
        return data.primaryGoals.length > 0;
      case 5: // Safety
        return data.safetyAcknowledgment && data.dataCollectionConsent;
      case 6: // Complete
        return true;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    // Save onboarding data to localStorage or send to API
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('user_preferences', JSON.stringify(data));
    }
    
    // Redirect to main app
    router.push('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Coffee className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Welcome to Voltage</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The complete soda and energy drink platform. Create EU-compliant, safe, and delicious beverages at home with precision recipes and safety validation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <Card key={category.id} className="border-2 hover:border-primary transition-colors cursor-pointer">
                    <CardHeader className="text-center">
                      <div 
                        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent className="w-8 h-8" style={{ color: category.color }} />
                      </div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Let's get you set up in just a few quick steps
              </p>
              <Button onClick={() => setCurrentStep(1)} size="lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 1: // Category Preferences
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What interests you most?</h2>
              <p className="text-muted-foreground">Select the beverage categories you'd like to explore (you can change this later)</p>
            </div>

            <div className="grid gap-4">
              {categories.map(category => {
                const IconComponent = category.icon;
                const isSelected = data.categoryPreference.includes(category.id);
                
                return (
                  <Card 
                    key={category.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-primary text-white' : ''
                          }`}
                          style={!isSelected ? { backgroundColor: `${category.color}20` } : undefined}
                        >
                          <IconComponent 
                            className="w-6 h-6" 
                            style={!isSelected ? { color: category.color } : undefined}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => toggleCategory(category.id)}
                            />
                          </div>
                          <p className="text-muted-foreground mb-3">{category.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">Popular:</Badge>
                            {category.popular.map(item => (
                              <Badge key={item} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2: // Region & Language
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Where are you located?</h2>
              <p className="text-muted-foreground">This helps us show you local pricing, shipping options, and regulatory information</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Select your region</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regions.map(region => (
                    <Button
                      key={region.code}
                      variant={data.region === region.code ? "default" : "outline"}
                      onClick={() => updateData({ region: region.code })}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">{region.flag}</span>
                      <div className="text-center">
                        <div className="font-medium text-sm">{region.name}</div>
                        <div className="text-xs text-muted-foreground">{region.currency}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Language preference</label>
                <Tabs value={data.language} onValueChange={(value) => updateData({ language: value })}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="nl">Nederlands</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        );

      case 3: // Experience Level
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What's your experience level?</h2>
              <p className="text-muted-foreground">This helps us customize the interface and recommendations for you</p>
            </div>

            <div className="grid gap-4">
              {experienceLevels.map(level => {
                const IconComponent = level.icon;
                const isSelected = data.experienceLevel === level.id;
                
                return (
                  <Card 
                    key={level.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => updateData({ experienceLevel: level.id })}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-primary text-white' : ''
                          }`}
                          style={!isSelected ? { backgroundColor: `${level.color}20` } : undefined}
                        >
                          <IconComponent 
                            className="w-6 h-6" 
                            style={!isSelected ? { color: level.color } : undefined}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{level.name}</h3>
                          <p className="text-muted-foreground">{level.description}</p>
                        </div>
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => updateData({ experienceLevel: level.id })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 4: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What are your main goals?</h2>
              <p className="text-muted-foreground">Help us understand what you want to achieve (select all that apply)</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {primaryGoals.map(goal => {
                const isSelected = data.primaryGoals.includes(goal.id);
                
                return (
                  <Card 
                    key={goal.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => toggleGoal(goal.id)}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 5: // Safety
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Safety First</h2>
              <p className="text-muted-foreground">Important information before you get started</p>
            </div>

            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-3">Critical Safety Information</h3>
                    <div className="space-y-3 text-sm text-orange-700 dark:text-orange-300">
                      <p>• <strong>Precise measurement is mandatory</strong> - Use a 0.001g precision scale for all ingredients</p>
                      <p>• <strong>Caffeine safety</strong> - Never exceed EU daily limits (400mg for healthy adults)</p>
                      <p>• <strong>Quality ingredients</strong> - Only use food-grade ingredients from reputable suppliers</p>
                      <p>• <strong>Storage and handling</strong> - Follow proper storage guidelines to prevent contamination</p>
                      <p>• <strong>Age restrictions</strong> - Energy drinks are not suitable for children, pregnant women, or people with certain health conditions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={data.safetyAcknowledgment}
                  onChange={(checked) => updateData({ safetyAcknowledgment: checked })}
                />
                <label className="text-sm">
                  I acknowledge that I have read and understood the safety information, and I will follow all safety guidelines when creating beverages.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={data.dataCollectionConsent}
                  onChange={(checked) => updateData({ dataCollectionConsent: checked })}
                />
                <label className="text-sm">
                  I consent to the collection and use of my preferences and usage data to improve the platform experience and provide personalized recommendations.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={data.notificationsEnabled}
                  onChange={(checked) => updateData({ notificationsEnabled: checked })}
                />
                <label className="text-sm">
                  I would like to receive notifications about new recipes, safety updates, and platform improvements (optional).
                </label>
              </div>
            </div>
          </div>
        );

      case 6: // Complete
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Welcome to Voltage! Your preferences have been saved and the platform is customized just for you.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Setup Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Categories:</span>
                    <div className="mt-1">
                      {data.categoryPreference.map(catId => {
                        const category = categories.find(c => c.id === catId);
                        return (
                          <Badge key={catId} variant="outline" className="mr-2 mb-1">
                            {category?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Region:</span>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {regions.find(r => r.code === data.region)?.flag} {regions.find(r => r.code === data.region)?.name}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Experience:</span>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {experienceLevels.find(l => l.id === data.experienceLevel)?.name}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Language:</span>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {data.language === 'en' ? 'English' : 'Nederlands'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {data.primaryGoals.length > 0 && (
                  <div>
                    <span className="font-medium">Your Goals:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {data.primaryGoals.map(goalId => {
                        const goal = primaryGoals.find(g => g.id === goalId);
                        return (
                          <Badge key={goalId} variant="secondary" className="text-xs">
                            {goal?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You can change these preferences anytime in your settings
              </p>
              <Button onClick={handleComplete} size="lg" className="w-full md:w-auto">
                Enter Voltage Platform <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup</h1>
            <Badge variant="outline">{currentStep + 1} of {steps.length}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{steps[currentStep].title}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                handleComplete();
              } else {
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
              }
            }}
            disabled={!canProceed()}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}