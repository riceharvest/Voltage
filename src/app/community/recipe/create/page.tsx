'use client';

/**
 * Community Recipe Creation Page
 * Enables users to create and share their own recipes with the community
 */

import React, { useState } from 'react';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Upload, 
  Eye, 
  Save, 
  Share2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Thermometer,
  ChefHat,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  optional: boolean;
}

interface RecipeInstruction {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number;
  temperature?: number;
  tips: string[];
}

export default function CreateRecipePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Recipe basic info
  const [recipeData, setRecipeData] = useState({
    title: '',
    description: '',
    category: 'classic' as 'classic' | 'energy' | 'hybrid',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    prepTime: 0,
    totalTime: 0,
    servings: 1,
    caffeineContent: 0,
    tags: [] as string[],
    safetyWarnings: [] as string[]
  });

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    {
      id: '1',
      name: '',
      amount: 0,
      unit: '',
      category: '',
      optional: false
    }
  ]);

  // Instructions
  const [instructions, setInstructions] = useState<RecipeInstruction[]>([
    {
      id: '1',
      stepNumber: 1,
      instruction: '',
      duration: undefined,
      temperature: undefined,
      tips: []
    }
  ]);

  // Add new ingredient
  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      unit: '',
      category: '',
      optional: false
    };
    setIngredients([...ingredients, newIngredient]);
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  // Update ingredient
  const updateIngredient = (id: string, field: keyof RecipeIngredient, value: any) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  // Add new instruction
  const addInstruction = () => {
    const newInstruction: RecipeInstruction = {
      id: Date.now().toString(),
      stepNumber: instructions.length + 1,
      instruction: '',
      duration: undefined,
      temperature: undefined,
      tips: []
    };
    setInstructions([...instructions, newInstruction]);
  };

  // Remove instruction
  const removeInstruction = (id: string) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter(inst => inst.id !== id));
    }
  };

  // Update instruction
  const updateInstruction = (id: string, field: keyof RecipeInstruction, value: any) => {
    setInstructions(instructions.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  // Save draft
  const saveDraft = async () => {
    try {
      const userId = 'user_123'; // In real app, get from auth context
      const recipe = await communitySocialPlatform.createUserRecipe(userId, recipeData);
      console.log('Recipe saved as draft:', recipe);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Publish recipe
  const publishRecipe = async () => {
    setIsPublishing(true);
    try {
      const userId = 'user_123'; // In real app, get from auth context
      const recipe = await communitySocialPlatform.createUserRecipe(userId, recipeData);
      const publishedRecipe = await communitySocialPlatform.publishRecipe(userId, recipe.id);
      console.log('Recipe published:', publishedRecipe);
      // Navigate to published recipe page
    } catch (error) {
      console.error('Failed to publish recipe:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Validate recipe data
  const isRecipeValid = () => {
    return (
      recipeData.title.trim() !== '' &&
      recipeData.description.trim() !== '' &&
      ingredients.every(ing => ing.name.trim() !== '' && ing.amount > 0) &&
      instructions.every(inst => inst.instruction.trim() !== '')
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Your Recipe</h1>
            <p className="text-muted-foreground">
              Share your amazing creation with the community
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" onClick={saveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 5 && (
                <div className={`
                  w-12 h-1 mx-2
                  ${currentStep > step ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{recipeData.title || 'Untitled Recipe'}</h2>
                <p className="text-muted-foreground">{recipeData.description || 'No description provided'}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipeData.totalTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipeData.servings} servings
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {recipeData.caffeineContent}mg caffeine
                  </span>
                  <Badge variant="outline">{recipeData.difficulty}</Badge>
                  <Badge variant="secondary">{recipeData.category}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ingredients.filter(ing => ing.name).map((ingredient) => (
                    <li key={ingredient.id} className="flex justify-between">
                      <span>{ingredient.name}</span>
                      <span className="text-muted-foreground">
                        {ingredient.amount} {ingredient.unit}
                        {ingredient.optional && <span className="text-xs ml-1">(optional)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {instructions.filter(inst => inst.instruction).map((instruction) => (
                    <li key={instruction.id} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                        {instruction.stepNumber}
                      </span>
                      <div>
                        <p>{instruction.instruction}</p>
                        {(instruction.duration || instruction.temperature) && (
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            {instruction.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {instruction.duration} min
                              </span>
                            )}
                            {instruction.temperature && (
                              <span className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                {instruction.temperature}°C
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              Back to Edit
            </Button>
            <Button 
              onClick={publishRecipe} 
              disabled={!isRecipeValid() || isPublishing}
              className="gap-2"
            >
              {isPublishing ? 'Publishing...' : 'Publish Recipe'}
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Tell us about your amazing recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Recipe Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter your recipe title"
                      value={recipeData.title}
                      onChange={(e) => setRecipeData({...recipeData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={recipeData.category} onValueChange={(value: any) => setRecipeData({...recipeData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic Soda</SelectItem>
                        <SelectItem value="energy">Energy Drink</SelectItem>
                        <SelectItem value="hybrid">Hybrid Recipe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level *</Label>
                    <Select value={recipeData.difficulty} onValueChange={(value: any) => setRecipeData({...recipeData, difficulty: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings *</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      value={recipeData.servings}
                      onChange={(e) => setRecipeData({...recipeData, servings: parseInt(e.target.value) || 1})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      min="0"
                      value={recipeData.prepTime}
                      onChange={(e) => setRecipeData({...recipeData, prepTime: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalTime">Total Time (minutes)</Label>
                    <Input
                      id="totalTime"
                      type="number"
                      min="0"
                      value={recipeData.totalTime}
                      onChange={(e) => setRecipeData({...recipeData, totalTime: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your recipe, its unique features, and what makes it special..."
                    value={recipeData.description}
                    onChange={(e) => setRecipeData({...recipeData, description: e.target.value})}
                    rows={4}
                  />
                </div>

                {recipeData.category === 'energy' && (
                  <div className="space-y-2">
                    <Label htmlFor="caffeine">Caffeine Content (mg per serving)</Label>
                    <Input
                      id="caffeine"
                      type="number"
                      min="0"
                      max="500"
                      value={recipeData.caffeineContent}
                      onChange={(e) => setRecipeData({...recipeData, caffeineContent: parseInt(e.target.value) || 0})}
                    />
                    <p className="text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Please provide accurate caffeine information for safety warnings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Ingredients */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Ingredients
                </CardTitle>
                <CardDescription>
                  List all ingredients needed for your recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Label>Ingredient Name *</Label>
                      <Input
                        placeholder="e.g., Carbonated water"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        placeholder="e.g., ml, g, tsp"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        placeholder="e.g., base, flavoring"
                        value={ingredient.category}
                        onChange={(e) => updateIngredient(ingredient.id, 'category', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateIngredient(ingredient.id, 'optional', !ingredient.optional)}
                        className={ingredient.optional ? 'bg-secondary' : ''}
                      >
                        Optional
                      </Button>
                      {ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(ingredient.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addIngredient} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Instructions */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Instructions
                </CardTitle>
                <CardDescription>
                  Step-by-step instructions for making your recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {instructions.map((instruction, index) => (
                  <div key={instruction.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Step {instruction.stepNumber}</h4>
                      {instructions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInstruction(instruction.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Instructions *</Label>
                        <Textarea
                          placeholder="Describe this step in detail..."
                          value={instruction.instruction}
                          onChange={(e) => updateInstruction(instruction.id, 'instruction', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={instruction.duration || ''}
                            onChange={(e) => updateInstruction(instruction.id, 'duration', parseInt(e.target.value) || undefined)}
                          />
                        </div>
                        <div>
                          <Label>Temperature (°C)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={instruction.temperature || ''}
                            onChange={(e) => updateInstruction(instruction.id, 'temperature', parseInt(e.target.value) || undefined)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addInstruction} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Photos and Media */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos and Media
                </CardTitle>
                <CardDescription>
                  Add photos to showcase your recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your recipe photos here, or click to browse
                  </p>
                  <Button variant="outline">
                    Upload Photos
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports JPG, PNG up to 10MB each
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Photo {index}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Safety and Publishing */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Safety Information & Publishing
                </CardTitle>
                <CardDescription>
                  Ensure your recipe meets safety standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Safety Checklist</h4>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        All ingredients are food-safe and properly measured
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        Caffeine content is accurately calculated (if applicable)
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        Allergen information is clearly stated
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        Recipe follows proper safety guidelines
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="Add tags separated by commas (e.g., summer, tropical, refreshing)"
                      value={recipeData.tags.join(', ')}
                      onChange={(e) => setRecipeData({
                        ...recipeData, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="safetyWarnings">Safety Warnings</Label>
                    <Textarea
                      id="safetyWarnings"
                      placeholder="Add any important safety warnings or notes..."
                      value={recipeData.safetyWarnings.join('\n')}
                      onChange={(e) => setRecipeData({
                        ...recipeData, 
                        safetyWarnings: e.target.value.split('\n').filter(warning => warning.trim())
                      })}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Ready to Publish!</p>
                    <p className="text-sm text-green-600">
                      Your recipe will be reviewed by our safety team before appearing in the community feed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft}>
                Save Draft
              </Button>
              
              {currentStep < 5 ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !recipeData.title.trim()) ||
                    (currentStep === 1 && !recipeData.description.trim()) ||
                    (currentStep === 2 && !ingredients.every(ing => ing.name.trim() && ing.amount > 0)) ||
                    (currentStep === 3 && !instructions.every(inst => inst.instruction.trim()))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={publishRecipe}
                  disabled={!isRecipeValid() || isPublishing}
                  className="gap-2"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Recipe'}
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}