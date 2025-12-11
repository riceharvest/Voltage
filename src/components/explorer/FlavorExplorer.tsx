'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Zap, 
  Coffee, 
  Mountain, 
  Sparkles, 
  Star,
  TrendingUp,
  Users,
  Target,
  Lightbulb
} from 'lucide-react';
import { FlavorRecipe } from '@/lib/types';
import { getCategoryTheme } from '@/lib/design-system';

interface TasteProfile {
  sweet: number;      // 0-100
  sour: number;       // 0-100
  bitter: number;     // 0-100
  umami: number;      // 0-100
  spicy: number;      // 0-100
  fruity: number;     // 0-100
  creamy: number;     // 0-100
  refreshing: number; // 0-100
}

interface FlavorNode {
  id: string;
  name: string;
  category: string;
  sodaType?: string;
  tasteProfile: TasteProfile;
  caffeineCategory?: string;
  popularity: number;
  x: number; // position on wheel
  y: number; // position on wheel
  radius: number;
  color: string;
}

interface FlavorExplorerProps {
  flavors: FlavorRecipe[];
  onFlavorSelect?: (flavor: FlavorRecipe) => void;
  className?: string;
}

const generateTasteProfile = (flavor: FlavorRecipe): TasteProfile => {
  const profile = flavor.profile?.toLowerCase() || '';
  const name = flavor.name?.toLowerCase() || '';
  const combined = `${profile} ${name}`;
  
  // Extract taste characteristics from name and profile
  const tasteMap = {
    sweet: combined.match(/(sweet|vanilla|caramel|honeys|syrup)/g)?.length || 0,
    sour: combined.match(/(sour|tart|citrus|lemon|lime)/g)?.length || 0,
    bitter: combined.match(/(bitter|coffee|dark|rich)/g)?.length || 0,
    umami: combined.match(/(umami|savory|depth|complex)/g)?.length || 0,
    spicy: combined.match(/(spicy|ginger|pepper|cinnamon)/g)?.length || 0,
    fruity: combined.match(/(fruit|berry|cherry|tropical|citrus)/g)?.length || 0,
    creamy: combined.match(/(cream|creamy|vanilla|milky)/g)?.length || 0,
    refreshing: combined.match(/(fresh|refresh|light|crisp|bright)/g)?.length || 0,
  };

  // Normalize to 0-100 scale
  const maxValue = Math.max(...Object.values(tasteMap), 1);
  return Object.fromEntries(
    Object.entries(tasteMap).map(([key, value]) => [
      key,
      Math.min(100, Math.round((value / maxValue) * 100))
    ])
  ) as TasteProfile;
};

const calculateFlavorDistance = (profile1: TasteProfile, profile2: TasteProfile): number => {
  const keys: (keyof TasteProfile)[] = ['sweet', 'sour', 'bitter', 'umami', 'spicy', 'fruity', 'creamy', 'refreshing'];
  const squaredDiffs = keys.map(key => Math.pow(profile1[key] - profile2[key], 2));
  return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0));
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'classic': return Mountain;
    case 'energy': return Zap;
    case 'hybrid': return Sparkles;
    default: return Coffee;
  }
};

const getCategoryColor = (category?: string): string => {
  switch (category) {
    case 'classic': return '#FF8C00';
    case 'energy': return '#0066CC';
    case 'hybrid': return '#8B5CF6';
    default: return '#6B7280';
  }
};

export function FlavorExplorer({ flavors, onFlavorSelect, className }: FlavorExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTasteFilters, setSelectedTasteFilters] = useState<Partial<TasteProfile>>({});
  const [similarityThreshold, setSimilarityThreshold] = useState([30]);
  const [userPreferences, setUserPreferences] = useState<TasteProfile>({
    sweet: 50,
    sour: 50,
    bitter: 50,
    umami: 50,
    spicy: 50,
    fruity: 50,
    creamy: 50,
    refreshing: 50,
  });
  const [activeTab, setActiveTab] = useState('explorer');

  // Process flavors into flavor nodes
  const flavorNodes = useMemo((): FlavorNode[] => {
    return flavors.map((flavor, index) => {
      const tasteProfile = generateTasteProfile(flavor);
      
      // Calculate position on flavor wheel (circular layout)
      const angle = (index / flavors.length) * 2 * Math.PI;
      const radius = 150 + Math.random() * 100; // Random radius for variety
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return {
        id: flavor.id,
        name: flavor.name,
        category: flavor.category || 'unknown',
        sodaType: flavor.sodaType,
        tasteProfile,
        caffeineCategory: flavor.caffeineCategory,
        popularity: Math.random() * 100, // Mock popularity score
        x,
        y,
        radius: 8 + Math.random() * 12,
        color: getCategoryColor(flavor.category),
      };
    });
  }, [flavors]);

  // Filter flavors based on search and category
  const filteredFlavors = useMemo(() => {
    return flavorNodes.filter(node => {
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'all' && node.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [flavorNodes, searchQuery, selectedCategory]);

  // Find similar flavors based on taste profile
  const findSimilarFlavors = (targetProfile: TasteProfile, limit = 5) => {
    const distances = filteredFlavors.map(node => ({
      node,
      distance: calculateFlavorDistance(targetProfile, node.tasteProfile),
    }));
    
    return distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  };

  // Generate recommendations based on user preferences
  const recommendations = useMemo(() => {
    return findSimilarFlavors(userPreferences, 6);
  }, [filteredFlavors, userPreferences]);

  // Get trending flavors (mock implementation)
  const trendingFlavors = useMemo(() => {
    return [...filteredFlavors]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  }, [filteredFlavors]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTasteFilters({});
    setSimilarityThreshold([30]);
  };

  const updateTastePreference = (taste: keyof TasteProfile, value: number) => {
    setUserPreferences(prev => ({ ...prev, [taste]: value }));
  };

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-orange-600">
          Interactive Flavor Explorer
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover flavors through interactive taste mapping. Explore relationships between different soda and energy drink profiles.
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="explorer" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Explorer
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Flavor Explorer */}
        <TabsContent value="explorer" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search flavors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'classic', 'energy', 'hybrid'].map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Flavor Wheel */}
          <Card>
            <CardHeader>
              <CardTitle>Flavor Wheel</CardTitle>
              <CardDescription>
                Interactive map of all available flavors. Click on any flavor to learn more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 400 400" className="absolute inset-0">
                  {/* Background circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/20"
                  />
                  
                  {/* Flavor nodes */}
                  {filteredFlavors.map((node) => {
                    const IconComponent = getCategoryIcon(node.category);
                    return (
                      <g key={node.id} className="cursor-pointer group">
                        {/* Connection lines to center */}
                        <line
                          x1="200"
                          y1="200"
                          x2={200 + node.x * 0.3}
                          y2={200 + node.y * 0.3}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors"
                        />
                        
                        {/* Flavor node */}
                        <circle
                          cx={200 + node.x * 0.3}
                          cy={200 + node.y * 0.3}
                          r={node.radius}
                          fill={node.color}
                          className="group-hover:scale-125 transition-transform cursor-pointer opacity-80 group-hover:opacity-100"
                        />
                        
                        {/* Category icon */}
                        <foreignObject
                          x={200 + node.x * 0.3 - 6}
                          y={200 + node.y * 0.3 - 6}
                          width="12"
                          height="12"
                          className="pointer-events-none"
                        >
                          <IconComponent className="w-3 h-3 text-white" />
                        </foreignObject>
                        
                        {/* Tooltip */}
                        <title>{`${node.name} (${node.category})`}</title>
                      </g>
                    );
                  })}
                  
                  {/* Center point */}
                  <circle
                    cx="200"
                    cy="200"
                    r="4"
                    fill="currentColor"
                    className="text-muted-foreground"
                  />
                </svg>
                
                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Classic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Energy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Hybrid</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Flavors Discovery */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Flavors Discovery</CardTitle>
              <CardDescription>
                Find flavors with similar taste profiles based on your selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Similarity Threshold:</span>
                  <Slider
                    value={similarityThreshold}
                    onValueChange={setSimilarityThreshold}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {similarityThreshold[0]}%
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFlavors.slice(0, 6).map((node) => {
                    const IconComponent = getCategoryIcon(node.category);
                    const theme = getCategoryTheme(node.category);
                    
                    return (
                      <div
                        key={node.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => onFlavorSelect?.(flavors.find(f => f.id === node.id)!)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${node.color}20` }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color: node.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {node.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {node.category}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Taste profile bars */}
                        <div className="space-y-1 mt-3">
                          {Object.entries(node.tasteProfile).slice(0, 4).map(([taste, value]) => (
                            <div key={taste} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16 capitalize">
                                {taste}
                              </span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${value}%`,
                                    backgroundColor: node.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalized Recommendations */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Based on your taste preferences, here are flavors we think you'll love
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(({ node, distance }) => {
                  const IconComponent = getCategoryIcon(node.category);
                  const matchPercentage = Math.max(0, 100 - distance);
                  
                  return (
                    <div
                      key={node.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group relative"
                      onClick={() => onFlavorSelect?.(flavors.find(f => f.id === node.id)!)}
                    >
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: `${node.color}20`, color: node.color }}
                        >
                          {Math.round(matchPercentage)}% match
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${node.color}20` }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: node.color }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {node.name}
                          </h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {node.category} • {node.sodaType?.replace('-', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Taste compatibility */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Taste Match:</h5>
                        {Object.entries(node.tasteProfile).slice(0, 3).map(([taste, value]) => {
                          const userValue = userPreferences[taste as keyof TasteProfile];
                          const diff = Math.abs(value - userValue);
                          const match = Math.max(0, 100 - diff);
                          
                          return (
                            <div key={taste} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-12 capitalize">
                                {taste}
                              </span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${match}%`,
                                    backgroundColor: match > 70 ? '#10B981' : match > 40 ? '#F59E0B' : '#EF4444',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Flavors */}
        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Flavors
              </CardTitle>
              <CardDescription>
                Popular flavors that others are exploring right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingFlavors.map((node, index) => {
                  const IconComponent = getCategoryIcon(node.category);
                  
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => onFlavorSelect?.(flavors.find(f => f.id === node.id)!)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${node.color}20` }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: node.color }} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {node.name}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {node.category} • {node.sodaType?.replace('-', ' ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {Math.round(node.popularity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taste Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Taste Preferences
              </CardTitle>
              <CardDescription>
                Set your taste preferences to get better recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(Object.keys(userPreferences) as (keyof TasteProfile)[]).map((taste) => (
                  <div key={taste} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium capitalize">
                        {taste}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {userPreferences[taste]}
                      </span>
                    </div>
                    <Slider
                      value={[userPreferences[taste]]}
                      onValueChange={(value) => updateTastePreference(taste, value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}