import limitsData from '@/data/safety/limits.json'
import ingredientsData from '@/data/ingredients/ingredients.json'
import { Ingredient } from '@/lib/types'
import { cache, cacheKeys, CACHE_TTL } from './cache'

export async function getLimitsData() {
  const cached = await cache.get(cacheKeys.data.safetyLimits);
  if (cached) return cached;

  await cache.set(cacheKeys.data.safetyLimits, limitsData, CACHE_TTL.LONG);
  return limitsData;
}

export async function getIngredientsData(): Promise<Ingredient[]> {
  const cached = await cache.get(cacheKeys.data.ingredients);
  if (cached) return cached;

  await cache.set(cacheKeys.data.ingredients, ingredientsData, CACHE_TTL.LONG);
  return ingredientsData as Ingredient[];
}

// Legacy exports for backward compatibility
export const limits = limitsData
export const ingredients: Ingredient[] = ingredientsData as Ingredient[]

export function addIngredient(current: string[], id: string): string[] {
  if (!current.includes(id)) {
    return [...current, id]
  }
  return current
}

export function removeIngredient(current: string[], id: string): string[] {
  return current.filter(i => i !== id)
}