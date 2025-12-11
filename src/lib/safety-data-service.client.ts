import limitsData from '@/data/safety/limits.json'
import ingredientsData from '@/data/ingredients/ingredients.json'
import { Ingredient } from '@/lib/types'

// Client-safe version that doesn't use cache
export async function getLimitsData() {
  return limitsData
}

export async function getIngredientsData(): Promise<Ingredient[]> {
  return ingredientsData as Ingredient[]
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