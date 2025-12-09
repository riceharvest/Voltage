import { suppliersData, ingredientsData } from './guide-data-service'
import { Ingredient, Supplier } from '@/lib/types'

export const getSupplierById = (id: string): Supplier | undefined => suppliersData.find(s => s.id === id)

export const getIngredientById = (id: string): Ingredient | undefined => (ingredientsData as unknown as Ingredient[]).find(i => i.id === id)

export const energyBaseIngredients: Ingredient[] = (ingredientsData as unknown as Ingredient[]).filter(i =>
  ['caffeine-anhydrous', 'taurine', 'citric-acid', 'sodium-citrate', 'sugar', 'erythritol', 'sodium-benzoate', 'potassium-sorbate'].includes(i.id)
)

export const flavorIngredients: Ingredient[] = (ingredientsData as unknown as Ingredient[]).filter(i => i.category === 'flavor')