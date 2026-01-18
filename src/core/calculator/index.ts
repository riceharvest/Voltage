
import { BaseRecipe, FlavorRecipe } from '../types'

export interface CalculatorSettings {
  volume: number; // Final drink volume in ml
  targetCaffeine: number; // Target caffeine in mg/serving
  servingSize: number; // Serving size in ml (e.g. 250ml)
}

export interface CalculatedIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  type: 'base' | 'flavor';
}

export interface CalculationResult {
  ingredients: CalculatedIngredient[];
  totalCaffeine: number;
  caffeinePerServing: number;
  volume: number;
  syrupVolume: number;
  waterVolume: number;
}

export function calculateRecipe(
  base: BaseRecipe,
  flavor: FlavorRecipe,
  settings: CalculatorSettings
): CalculationResult {
  const { volume, targetCaffeine, servingSize } = settings;

  // Base yield is typically 1000ml syrup -> 5000ml drink (1:4 dilution)
  // We assume the base recipe numbers are for 1000ml of Syrup.

  const baseSyrupYield = base.yield.syrup; // 1000
  const baseDrinkYield = base.yield.drink; // 5000
  const dilutionFactor = baseDrinkYield / baseSyrupYield; // 5

  // Calculate how much syrup we need for the target volume
  const requiredSyrup = volume / dilutionFactor;
  const requiredWater = volume - requiredSyrup;

  // Scaling factor for Base ingredients (based on syrup volume)
  // Base ingredients are defined for 1000ml syrup.
  const baseScalingFactor = requiredSyrup / baseSyrupYield;

  const calculatedIngredients: CalculatedIngredient[] = [];

  // 1. Base Ingredients
  base.ingredients.forEach((ing) => {
    calculatedIngredients.push({
      id: ing.ingredientId,
      name: ing.ingredientId, // We'll resolve names later or pass full objects
      amount: ing.amount * baseScalingFactor,
      unit: 'g', // Assuming base ingredients are in grams unless specified
      type: 'base'
    });
  });

  // 2. Flavor Ingredients
  // Flavor ingredients are also assumed to be per 1000ml Syrup Batch?
  // Let's assume standard behavior: Flavor recipe is added to Base Syrup.
  // So they scale with the Syrup Volume.

  flavor.ingredients.forEach((ing) => {
     calculatedIngredients.push({
      id: ing.ingredientId,
      name: ing.ingredientId,
      amount: ing.amount * baseScalingFactor,
      unit: 'g', // Assuming flavor ingredients are in grams/ml
      type: 'flavor'
    });
  });

  // 3. Caffeine Adjustment
  // Base usually has caffeine.
  // Classic Base: 1.6g (1600mg) per 1000ml Syrup -> 5000ml Drink.
  // 1600mg / 5000ml = 0.32 mg/ml = 80mg / 250ml.

  // If user wants custom caffeine, we need to adjust the caffeine ingredient.
  // Find caffeine ingredient in the list
  const caffeineIngIndex = calculatedIngredients.findIndex(i => i.id.includes('caffeine'));

  let totalCaffeine = 0;

  if (caffeineIngIndex >= 0) {
    // Calculate required total caffeine for the batch
    const totalTargetCaffeine = (targetCaffeine / servingSize) * volume;

    // Update the caffeine ingredient amount
    // Assuming caffeine ingredient is pure caffeine (or close to it)
    // If it's "caffeine-anhydrous", it's 100%.

    calculatedIngredients[caffeineIngIndex].amount = totalTargetCaffeine / 1000; // mg to g
    totalCaffeine = totalTargetCaffeine;
  } else {
    // If no caffeine in base (e.g. Plain?), maybe add it?
    // For now, if not present, we don't add it magically unless logic demands.
    // But "Classic" base has it.
  }

  return {
    ingredients: calculatedIngredients,
    totalCaffeine,
    caffeinePerServing: (totalCaffeine / volume) * servingSize,
    volume,
    syrupVolume: requiredSyrup,
    waterVolume: requiredWater
  };
}
