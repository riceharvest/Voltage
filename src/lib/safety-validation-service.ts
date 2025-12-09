import { limits, ingredients } from './safety-data-service'

export function validateAge(age: number): boolean {
  return age >= limits.ageRestriction
}

export function validateCaffeine(caffeineMg: number): boolean {
  return caffeineMg <= limits.caffeine.maxPerServingMg
}

export function validateIngredients(selectedIds: string[]): { valid: boolean, banned: string[] } {
  const banned = selectedIds.filter(id => limits.bannedIngredients.includes(id))
  const nonCompliant = selectedIds.filter(id => {
    const ing = ingredients.find(i => i.id === id)
    return ing && (!ing.safety.euCompliant || ing.safety.banned)
  })
  return { valid: banned.length === 0 && nonCompliant.length === 0, banned }
}

export function calculateComplianceScore(age: number, caffeineMg: number, selectedIngredients: string[]): number {
  let score = 100

  if (!validateAge(age)) score -= 30
  if (!validateCaffeine(caffeineMg)) score -= 40

  const ingValidation = validateIngredients(selectedIngredients)
  if (!ingValidation.valid) score -= 50

  return Math.max(0, score)
}