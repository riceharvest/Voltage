import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { FlavorRecipe, Ingredient, Supplier } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Beaker, Package, Euro, MapPin, Zap } from 'lucide-react';

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400">
          Flavor Details
        </h1>
      </div>

      <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-sm">
        {/* Header Color Strip */}
        <div className="h-3 w-full" style={{ backgroundColor: hexColor, boxShadow: `0 0 15px ${hexColor}` }} />

        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold text-white uppercase tracking-tight">
              {flavor.name}
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-lg px-3 py-1">
              {flavor.color.description}
            </Badge>
          </div>
          <CardDescription className="text-lg text-gray-400 italic">
            "{flavor.profile}"
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="block text-sm">Aging</span>
                <span className="text-white font-mono text-lg">{flavor.aging?.recommended}h</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Beaker className="w-5 h-5 text-fuchsia-400" />
              <div>
                <span className="block text-sm">Dilution</span>
                <span className="text-white font-mono text-lg">{flavor.dilutionRatio || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <span className="block text-sm">Caffeine</span>
                <span className="text-white font-mono text-lg">{flavor.caffeineContent || 'Standard'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Euro className="w-5 h-5 text-green-400" />
              <div>
                <span className="block text-sm">Cost</span>
                <span className="text-white font-mono text-lg">{flavor.priceRange || 'Medium'}</span>
              </div>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="p-6 rounded-lg bg-black/20 border border-white/5">
            <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 tracking-wider">Formulation</h3>
            <ul className="space-y-3 text-base font-mono text-white/80">
              {Array.isArray(flavor.ingredients) && flavor.ingredients.map(ing => (
                <li key={ing.ingredientId} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  {ingredientSuppliersMap?.[ing.ingredientId] && ingredientSuppliersMap[ing.ingredientId].length > 0 ? (() => {
                    const supplierId = ingredientSuppliersMap[ing.ingredientId][0];
                    const ingredient = ingredientsFullMap?.[ing.ingredientId];
                    return (
                      <a href={ingredient?.supplierProducts?.[supplierId] || vendorMap?.[supplierId]} target="_blank" rel="noopener noreferrer" className="truncate mr-4 text-white hover:underline" title={ingredientNames?.[ing.ingredientId] || ing.ingredientId}>
                        {ingredientNames?.[ing.ingredientId] || ing.ingredientId}
                      </a>
                    );
                  })() : (
                    <span className="truncate mr-4" title={ingredientNames?.[ing.ingredientId] || ing.ingredientId}>
                      {ingredientNames?.[ing.ingredientId] || ing.ingredientId}
                    </span>
                  )}
                  <span className="text-cyan-400 whitespace-nowrap text-lg">
                    {ing.amount} {ingredientsMap?.[ing.ingredientId] || ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap gap-3 pt-4">
            {flavor.netherlandsAvailability && (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-none border-orange-500/20 border text-base px-3 py-1">
                <MapPin className="w-4 h-4 mr-2" /> NL Available
              </Badge>
            )}
            {flavor.packaging && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-none border-blue-500/20 border text-base px-3 py-1">
                <Package className="w-4 h-4 mr-2" /> {flavor.packaging}
              </Badge>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}