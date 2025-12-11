'use client';

import { useState, useEffect } from 'react';
import { FlavorRecipe, Ingredient, Supplier } from '../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Beaker, Package, Euro, MapPin, Zap, Search, Filter, Grid, List, Coffee, Mountain, Sparkles } from 'lucide-react';
import { getColorHex } from '@/lib/color-utils';
import { trackAffiliateClick } from '@/lib/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<FlavorRecipe[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Ingredient[]>([]);
  const [suppliersData, setSuppliersData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sodaTypeFilter, setSodaTypeFilter] = useState('all');
  const [caffeineFilter, setCaffeineFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');

  const searchParams = useSearchParams();
  
  // Initialize category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && ['classic', 'energy', 'hybrid'].includes(categoryParam)) {
      setActiveCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load flavors
        const flavorsResponse = await fetch('/api/flavors');
        const flavorsData = await flavorsResponse.json();
        setFlavors(flavorsData);

        // Load ingredients
        const ingredientsResponse = await fetch('/api/ingredients');
        const ingredients = await ingredientsResponse.json();
        setIngredientsData(ingredients);

        // Load suppliers
        const suppliersResponse = await fetch('/api/suppliers');
        const suppliers = await suppliersResponse.json();
        setSuppliersData(suppliers);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const ingredientsMap = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing.unit]));
  const ingredientNames = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing.name]));
  const ingredientsFullMap = Object.fromEntries(ingredientsData.map((ing: Ingredient) => [ing.id, ing]));

  const handleAffiliateClick = async (flavor: FlavorRecipe) => {
    try {
      const attributionId = trackAffiliateClick('bol.com', flavor.id);
      
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          affiliate: 'bol.com',
          productId: flavor.id,
          flavorId: flavor.id,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`affiliate_attribution_${flavor.id}`, attributionId);
      }
    } catch (error) {
      console.error('Error tracking affiliate click:', error);
    }
  };

  const getAffiliateName = (flavor: FlavorRecipe): string => {
    if (flavor.affiliateLink?.includes('bol.com')) {
      return 'bol.com';
    } else if (flavor.affiliateLink?.includes('coolblue')) {
      return 'coolblue.com';
    }
    return 'partner';
  };

  const getAffiliateButtonText = (flavor: FlavorRecipe): string => {
    const affiliate = getAffiliateName(flavor);
    if (affiliate === 'bol.com') {
      return 'Buy on bol.com';
    } else if (affiliate === 'coolblue.com') {
      return 'Buy at Coolblue';
    }
    return 'Buy Now';
  };

  // Filter and sort flavors
  const filteredFlavors = flavors
    .filter(flavor => {
      // Category filter
      if (activeCategory !== 'all' && flavor.category !== activeCategory) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          flavor.name.toLowerCase().includes(query) ||
          flavor.profile.toLowerCase().includes(query) ||
          flavor.category?.toLowerCase().includes(query) ||
          flavor.sodaType?.toLowerCase().includes(query)
        );
      }
      
      // Soda type filter
      if (sodaTypeFilter !== 'all' && flavor.sodaType !== sodaTypeFilter) {
        return false;
      }
      
      // Caffeine filter
      if (caffeineFilter !== 'all' && flavor.caffeineCategory !== caffeineFilter) {
        return false;
      }
      
      // Time filter
      if (timeFilter !== 'all') {
        const agingTime = flavor.aging?.recommended || 0;
        switch (timeFilter) {
          case 'quick':
            if (agingTime > 2) return false;
            break;
          case 'moderate':
            if (agingTime <= 2 || agingTime > 24) return false;
            break;
          case 'extended':
            if (agingTime <= 24) return false;
            break;
        }
      }
      
      // Cost filter
      if (costFilter !== 'all' && flavor.priceRange !== costFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'caffeine':
          const caffeineOrder = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
          return (caffeineOrder[a.caffeineCategory || 'none'] || 0) - (caffeineOrder[b.caffeineCategory || 'none'] || 0);
        case 'time':
          return (a.aging?.recommended || 0) - (b.aging?.recommended || 0);
        default:
          return 0;
      }
    });

  const categoryInfo = {
    classic: {
      title: 'Classic Sodas',
      description: 'Traditional soda flavors that have stood the test of time',
      icon: Mountain,
      color: 'orange',
      bgGradient: 'from-orange-50 to-orange-100/50',
      borderColor: 'border-orange-200 hover:border-orange-400'
    },
    energy: {
      title: 'Energy Drinks',
      description: 'High-performance beverages designed for energy and focus',
      icon: Zap,
      color: 'blue',
      bgGradient: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200 hover:border-blue-400'
    },
    hybrid: {
      title: 'Hybrid Recipes',
      description: 'Innovative combinations blending classic and energy drink elements',
      icon: Sparkles,
      color: 'purple',
      bgGradient: 'from-purple-50 to-purple-100/50',
      borderColor: 'border-purple-200 hover:border-purple-400'
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600">
          Recipe Collection
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover our comprehensive library of classic sodas, energy drinks, and innovative hybrid recipes. 
          Each recipe includes detailed instructions, safety guidelines, and cultural variations.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 p-6 bg-background/50 backdrop-blur-sm rounded-xl border">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search flavors, profiles, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 items-center">
            <Select value={sodaTypeFilter} onValueChange={setSodaTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Soda Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cola">Cola</SelectItem>
                <SelectItem value="citrus">Citrus</SelectItem>
                <SelectItem value="fruit">Fruit</SelectItem>
                <SelectItem value="cream">Cream</SelectItem>
                <SelectItem value="root-beer">Root Beer</SelectItem>
                <SelectItem value="ginger-ale">Ginger Ale</SelectItem>
                <SelectItem value="energy-drink">Energy Drink</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={caffeineFilter} onValueChange={setCaffeineFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Caffeine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="caffeine">Caffeine</SelectItem>
                <SelectItem value="time">Prep Time</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            All Recipes
          </TabsTrigger>
          <TabsTrigger value="classic" className="flex items-center gap-2 text-orange-600">
            <Mountain className="h-4 w-4" />
            Classic
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2 text-blue-600">
            <Zap className="h-4 w-4" />
            Energy
          </TabsTrigger>
          <TabsTrigger value="hybrid" className="flex items-center gap-2 text-purple-600">
            <Sparkles className="h-4 w-4" />
            Hybrid
          </TabsTrigger>
        </TabsList>

        {/* Category-specific content */}
        {Object.entries(categoryInfo).map(([category, info]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className={`p-6 rounded-xl bg-gradient-to-br ${info.bgGradient} border ${info.borderColor}`}>
              <div className="flex items-center gap-4 mb-4">
                <info.icon className={`h-8 w-8 text-${info.color}-600`} />
                <div>
                  <h2 className={`text-2xl font-bold text-${info.color}-700`}>{info.title}</h2>
                  <p className={`text-${info.color}-600/80`}>{info.description}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Results */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {filteredFlavors.length} of {flavors.length} recipes
          {activeCategory !== 'all' && ` in ${categoryInfo[activeCategory as keyof typeof categoryInfo]?.title || activeCategory}`}
        </p>
      </div>

      {/* Recipe Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredFlavors.map(flavor => {
          const hexColor = getColorHex(flavor.color);
          const affiliateName = getAffiliateName(flavor);
          const buttonText = getAffiliateButtonText(flavor);
          
          if (viewMode === 'list') {
            return (
              <Card key={flavor.id} className={`group ${categoryInfo[flavor.category as keyof typeof categoryInfo]?.borderColor || 'border-white/10'} bg-zinc-900/40 hover:bg-zinc-900/80 transition-all duration-500 overflow-hidden backdrop-blur-sm`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Color Strip */}
                    <div className="w-4 h-20 rounded-full transition-all duration-500 group-hover:w-6" style={{ backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}` }} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {flavor.name}
                        </h3>
                        <Badge variant="outline" className="border-white/20">
                          {flavor.color.description}
                        </Badge>
                        {flavor.category && (
                          <Badge className={`${categoryInfo[flavor.category as keyof typeof categoryInfo]?.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 
                            categoryInfo[flavor.category as keyof typeof categoryInfo]?.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'} border-0`}>
                            {flavor.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 italic mb-3">"{flavor.profile}"</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Age: {flavor.aging?.recommended}h</span>
                        <span>Dilution: {flavor.dilutionRatio || 'N/A'}</span>
                        <span>Caf: {flavor.caffeineContent || flavor.caffeineCategory || 'Standard'}</span>
                        <span>Cost: {flavor.priceRange || 'Medium'}</span>
                      </div>
                    </div>
                    
                    {flavor.affiliateLink && (
                      <Button asChild>
                        <a
                          href={flavor.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleAffiliateClick(flavor)}
                          data-affiliate={affiliateName}
                          data-flavor-id={flavor.id}
                        >
                          {buttonText}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          return (
            <Card key={flavor.id} className={`group ${categoryInfo[flavor.category as keyof typeof categoryInfo]?.borderColor || 'border-white/10'} bg-zinc-900/40 hover:bg-zinc-900/80 transition-all duration-500 overflow-hidden backdrop-blur-sm`}>
              {/* Header Color Strip */}
              <div className="h-2 w-full transition-all duration-500 group-hover:h-3" style={{ backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}` }} />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                    {flavor.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="border-white/20 text-xs">
                      {flavor.color.description}
                    </Badge>
                    {flavor.category && (
                      <Badge className={`${categoryInfo[flavor.category as keyof typeof categoryInfo]?.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 
                        categoryInfo[flavor.category as keyof typeof categoryInfo]?.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'} border-0 text-xs`}>
                        {flavor.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-400 italic">
                  "{flavor.profile}"
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Age: <span className="text-white font-mono">{flavor.aging?.recommended}h</span></span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Beaker className="w-3 h-3 text-fuchsia-400" />
                    <span>Dilution: <span className="text-white font-mono">{flavor.dilutionRatio || 'N/A'}</span></span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary" />
                    <span>Caf: <span className="text-white font-mono">{flavor.caffeineContent || flavor.caffeineCategory || 'Standard'}</span></span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Euro className="w-3 h-3 text-green-400" />
                    <span>Cost: <span className="text-white font-mono">{flavor.priceRange || 'Medium'}</span></span>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-wrap gap-1">
                  {flavor.netherlandsAvailability && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-none border-orange-500/20 border text-xs">
                      <MapPin className="w-3 h-3 mr-1" /> NL
                    </Badge>
                  )}
                  {flavor.packaging && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-none border-blue-500/20 border text-xs">
                      <Package className="w-3 h-3 mr-1" /> {flavor.packaging}
                    </Badge>
                  )}
                  {flavor.sodaType && (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 shadow-none border-purple-500/20 border text-xs">
                      {flavor.sodaType}
                    </Badge>
                  )}
                </div>

                {flavor.affiliateLink && (
                  <Button asChild className="w-full">
                    <a
                      href={flavor.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleAffiliateClick(flavor)}
                      data-affiliate={affiliateName}
                      data-flavor-id={flavor.id}
                    >
                      {buttonText}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFlavors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No recipes found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setSodaTypeFilter('all');
              setCaffeineFilter('all');
              setTimeFilter('all');
              setCostFilter('all');
            }}
            className="mt-4"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}