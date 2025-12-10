import suppliersData from '@/data/suppliers/netherlands.json'
import ingredientsData from '@/data/ingredients/ingredients.json'
import { flavors } from '@/data/index'

// Direct data access functions (no caching for now to avoid Redis issues)
export function getSuppliersData() {
  return suppliersData;
}

export function getIngredientsData() {
  return ingredientsData;
}

export function getFlavorsData() {
  return flavors;
}

// Legacy exports for backward compatibility
export { suppliersData, ingredientsData, flavors }