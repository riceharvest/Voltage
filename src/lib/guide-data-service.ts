import suppliersData from '@/data/suppliers/netherlands.json'
import ingredientsData from '@/data/ingredients/ingredients.json'
import { flavors } from '@/data/index'
import { cache, cacheKeys, CACHE_TTL } from './cache'

// Cached data access functions
export async function getSuppliersData() {
  const cached = await cache.get(cacheKeys.data.suppliers);
  if (cached) return cached;

  // Cache miss - store and return
  await cache.set(cacheKeys.data.suppliers, suppliersData, CACHE_TTL.LONG);
  return suppliersData;
}

export async function getIngredientsData() {
  const cached = await cache.get(cacheKeys.data.ingredients);
  if (cached) return cached;

  await cache.set(cacheKeys.data.ingredients, ingredientsData, CACHE_TTL.LONG);
  return ingredientsData;
}

export async function getFlavorsData() {
  const cached = await cache.get(cacheKeys.data.flavors);
  if (cached) return cached;

  await cache.set(cacheKeys.data.flavors, flavors, CACHE_TTL.LONG);
  return flavors;
}

// Legacy exports for backward compatibility
export { suppliersData, ingredientsData, flavors }