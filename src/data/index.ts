/**
 * Data Management Evaluation
 *
 * Current Implementation: JSON-based data storage
 *
 * Evaluation for Database Migration:
 * - Data Characteristics: Static reference data (ingredients, suppliers, recipes)
 * - Update Frequency: Low (manual updates via scripts)
 * - Query Patterns: Simple lookups, no complex joins or aggregations
 * - Performance Requirements: Static data served via Next.js build
 * - Scalability Needs: Currently sufficient for application scope
 *
 * Recommendation: JSON files are adequate for current needs.
 * - Benefits: Simple, version-controllable, no additional infrastructure
 * - Future Consideration: Migrate to database if dynamic user data or complex queries needed
 * - Backup/Recovery: Implemented via scripts/backup-data.js and scripts/restore-data.js
 * - Validation: Implemented via scripts/validate-data.js
 * - Sync: Implemented via scripts/sync-suppliers.js for supplier data
 */

import classicBase from '@/data/bases/classic.json'
import zeroBase from '@/data/bases/zero.json'
import plainBase from '@/data/bases/plain.json'

import { BaseRecipe, FlavorRecipe } from '@/lib/types'

export const bases: BaseRecipe[] = [
  classicBase as BaseRecipe,
  zeroBase as BaseRecipe,
  plainBase as BaseRecipe
]

// Lazy-loaded flavor imports for bundle optimization
const flavorModules = {
  'berry-citrus-fusion': () => import('./flavors/berry-citrus-fusion.json'),
  'berry-natural': () => import('./flavors/berry-natural.json'),
  'best-body-nutrition-vital-drink-zerop': () => import('./flavors/best-body-nutrition-vital-drink-zerop.json'),
  'blue-voltage': () => import('./flavors/blue-voltage.json'),
  'bolero-energy': () => import('./flavors/bolero-energy.json'),
  'cherry-blast': () => import('./flavors/cherry-blast.json'),
  'cherry-limeade': () => import('./flavors/cherry-limeade.json'),
  'citrus-berry-zest': () => import('./flavors/citrus-berry-zest.json'),
  'citrus-sunburst': () => import('./flavors/citrus-sunburst.json'),
  'coconut-charge': () => import('./flavors/coconut-charge.json'),
  'cola-kick': () => import('./flavors/cola-kick.json'),
  'extra-joss-active': () => import('./flavors/extra-joss-active.json'),
  'ginger-lime-spark': () => import('./flavors/ginger-lime-spark.json'),
  'grape-rush': () => import('./flavors/grape-rush.json'),
  'grapefruit-hibiscus-glow': () => import('./flavors/grapefruit-hibiscus-glow.json'),
  'green-beast': () => import('./flavors/green-beast.json'),
  'green-tea-grip': () => import('./flavors/green-tea-grip.json'),
  'herbal-mint-harmony': () => import('./flavors/herbal-mint-harmony.json'),
  'hibiscus-hype': () => import('./flavors/hibiscus-hype.json'),
  'holy-energy-citrus-cobra': () => import('./flavors/holy-energy-citrus-cobra.json'),
  'peach-paradise': () => import('./flavors/peach-paradise.json'),
  'pomegranate-mint-chill': () => import('./flavors/pomegranate-mint-chill.json'),
  'pomegranate-power': () => import('./flavors/pomegranate-power.json'),
  'powerbar-caffeine-boost': () => import('./flavors/powerbar-caffeine-boost.json'),
  'red-bull': () => import('./flavors/red-bull.json'),
  'sodastream-energy-sugar-free': () => import('./flavors/sodastream-energy-sugar-free.json'),
  'sodastream-energy': () => import('./flavors/sodastream-energy.json'),
  'spiced-apple': () => import('./flavors/spiced-apple.json'),
  'tropical-berry-wave': () => import('./flavors/tropical-berry-wave.json'),
  'tropical-bliss': () => import('./flavors/tropical-bliss.json'),
  'tropical-chaos': () => import('./flavors/tropical-chaos.json'),
  'tropical-ginger': () => import('./flavors/tropical-ginger.json'),
  'ultra-white': () => import('./flavors/ultra-white.json'),
  'watermelon-mint': () => import('./flavors/watermelon-mint.json'),
  'watermelon-wave': () => import('./flavors/watermelon-wave.json')
}

// Cache for loaded flavors
const flavorCache = new Map<string, FlavorRecipe>()

export const getFlavor = async (id: string): Promise<FlavorRecipe | null> => {
  if (flavorCache.has(id)) {
    return flavorCache.get(id)!
  }

  const importFn = flavorModules[id as keyof typeof flavorModules]
  if (!importFn) return null

  try {
    const module = await importFn()
    const flavor = module.default as FlavorRecipe
    flavorCache.set(id, flavor)
    return flavor
  } catch (error) {
    console.error(`Failed to load flavor ${id}:`, error)
    return null
  }
}

export const getAllFlavorIds = (): string[] => {
  return Object.keys(flavorModules)
}

// For components that need all flavors at once (like the flavor selector)
// This will still load all flavors but in separate chunks
export const loadAllFlavors = async (): Promise<FlavorRecipe[]> => {
  const flavorIds = getAllFlavorIds()
  const flavorPromises = flavorIds.map(id => getFlavor(id))
  const flavors = await Promise.all(flavorPromises)
  return flavors.filter((f): f is FlavorRecipe => f !== null)
}

// Synchronous version for backward compatibility (loads all at once)
let allFlavorsCache: FlavorRecipe[] | null = null

export const getAllFlavorsSync = (): FlavorRecipe[] => {
  if (allFlavorsCache) return allFlavorsCache

  // Fallback to static imports if dynamic loading fails
  const staticFlavors = [
    require('./flavors/berry-citrus-fusion.json'),
    require('./flavors/berry-natural.json'),
    require('./flavors/best-body-nutrition-vital-drink-zerop.json'),
    require('./flavors/blue-voltage.json'),
    require('./flavors/bolero-energy.json'),
    require('./flavors/cherry-blast.json'),
    require('./flavors/cherry-limeade.json'),
    require('./flavors/citrus-berry-zest.json'),
    require('./flavors/citrus-sunburst.json'),
    require('./flavors/coconut-charge.json'),
    require('./flavors/cola-kick.json'),
    require('./flavors/extra-joss-active.json'),
    require('./flavors/ginger-lime-spark.json'),
    require('./flavors/grape-rush.json'),
    require('./flavors/grapefruit-hibiscus-glow.json'),
    require('./flavors/green-beast.json'),
    require('./flavors/green-tea-grip.json'),
    require('./flavors/herbal-mint-harmony.json'),
    require('./flavors/hibiscus-hype.json'),
    require('./flavors/holy-energy-citrus-cobra.json'),
    require('./flavors/peach-paradise.json'),
    require('./flavors/pomegranate-mint-chill.json'),
    require('./flavors/pomegranate-power.json'),
    require('./flavors/powerbar-caffeine-boost.json'),
    require('./flavors/red-bull.json'),
    require('./flavors/sodastream-energy-sugar-free.json'),
    require('./flavors/sodastream-energy.json'),
    require('./flavors/spiced-apple.json'),
    require('./flavors/tropical-berry-wave.json'),
    require('./flavors/tropical-bliss.json'),
    require('./flavors/tropical-chaos.json'),
    require('./flavors/tropical-ginger.json'),
    require('./flavors/ultra-white.json'),
    require('./flavors/watermelon-mint.json'),
    require('./flavors/watermelon-wave.json')
  ].map(f => f as FlavorRecipe).filter(f => f != null)

  allFlavorsCache = staticFlavors
  return staticFlavors
}

// Export flavors for backward compatibility (synchronous)
export const flavors = getAllFlavorsSync()
