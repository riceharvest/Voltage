'use client';

import { useState, useEffect } from 'react';
import { FlavorRecipe, Ingredient, Supplier } from '../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Beaker, Package, Euro, MapPin, Zap } from 'lucide-react';
import { getColorHex } from '@/lib/color-utils';
import { trackAffiliateClick } from '@/lib/analytics';

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<FlavorRecipe[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Ingredient[]>([]);
  const [suppliersData, setSuppliersData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Track the click and get attribution ID
      const attributionId = trackAffiliateClick('bol.com', flavor.id);
      
      // Send detailed click data to our tracking API
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
      
      // Store attribution ID for potential conversion tracking
      if (typeof window !== 'undefined') {
        localStorage.setItem(`affiliate_attribution_${flavor.id}`, attributionId);
      }
    } catch (error) {
      console.error('Error tracking affiliate click:', error);
      // Still allow the link to work even if tracking fails
    }
  };

  const getAffiliateName = (flavor: FlavorRecipe): string => {
    // Determine affiliate partner based on affiliate link URL
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
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400 animate-pulse-slow">
          Flavor Laboratory
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experimental and classic profiles for your energy base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {flavors.map(flavor => {
          const hexColor = getColorHex(flavor.color);
          const affiliateName = getAffiliateName(flavor);
          const buttonText = getAffiliateButtonText(flavor);
          
          return (
          <Card key={flavor.id} className="group border-white/10 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden backdrop-blur-sm">

            {/* Header Color Strip */}
            <div className="h-2 w-full transition-all duration-500 group-hover:h-3" style={{ backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}` }} />

            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                  {flavor.name}
                </CardTitle>
                <Badge variant="outline" className="border-white/20">
                  {flavor.color.description}
                </Badge>
              </div>
              <CardDescription className="text-base text-gray-400 italic">
                "{flavor.profile}"
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Age: <span className="text-white font-mono">{flavor.aging?.recommended}h</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beaker className="w-4 h-4 text-fuchsia-400" />
                  <span>Dilution: <span className="text-white font-mono">{flavor.dilutionRatio || 'N/A'}</span></span>
                </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Caf: <span className="text-white font-mono">{flavor.caffeineContent || 'Standard'}</span></span>
                </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                  <Euro className="w-4 h-4 text-green-400" />
                  <span>Cost: <span className="text-white font-mono">{flavor.priceRange || 'Medium'}</span></span>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-wider">Formulation</h3>
                <ul className="space-y-2 text-sm font-mono text-white/80">
                  {flavor.ingredients && Array.isArray(flavor.ingredients) && flavor.ingredients.map(ing => (
                    <li key={ing.ingredientId} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
                      {(() => {
                        const ingredient = ingredientsFullMap[ing.ingredientId] ?? {};
                        const supplierUrl = ingredient?.supplierUrls?.[0];

                        if (supplierUrl) {
                          return (
                            <a href={supplierUrl} target="_blank" rel="noopener noreferrer" className="truncate mr-2 text-white hover:underline" title={ingredientNames[ing.ingredientId] || ing.ingredientId}>
                              {ingredientNames[ing.ingredientId] || ing.ingredientId}
                            </a>
                          );
                        } else {
                          return (
                            <span className="truncate mr-2" title={ingredientNames[ing.ingredientId] || ing.ingredientId}>
                              {ingredientNames[ing.ingredientId] || ing.ingredientId}
                            </span>
                          );
                        }
                      })()}
                      <span className="text-cyan-400 whitespace-nowrap">
                        {ing.amount} {ingredientsMap[ing.ingredientId] || ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {flavor.affiliateLink && (
                <div className="pt-4">
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
                </div>
              )}

              {/* Footer Metadata */}
              <div className="flex flex-wrap gap-2 pt-2">
                  {flavor.netherlandsAvailability && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-none border-orange-500/20 border">
                      <MapPin className="w-3 h-3 mr-1" /> NL Available
                    </Badge>
                  )}
                  {flavor.packaging && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-none border-blue-500/20 border">
                      <Package className="w-3 h-3 mr-1" /> {flavor.packaging}
                    </Badge>
                  )}
              </div>

            </CardContent>
          </Card>
          )
        })}
      </div>
    </div>
  );
}