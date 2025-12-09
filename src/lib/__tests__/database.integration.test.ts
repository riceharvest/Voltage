import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createBackup } from '../../../scripts/backup-data.js'
import { listBackups, restoreFromBackup } from '../../../scripts/restore-data.js'

describe('Database Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Data Persistence and Validation', () => {
    it('should validate JSON data integrity', async () => {
      // Test that data files contain valid JSON
      const { getSuppliersData, getIngredientsData, getFlavorsData } = await import('../guide-data-service')

      const suppliers = await getSuppliersData()
      const ingredients = await getIngredientsData()
      const flavors = await getFlavorsData()

      expect(() => JSON.stringify(suppliers)).not.toThrow()
      expect(() => JSON.stringify(ingredients)).not.toThrow()
      expect(() => JSON.stringify(flavors)).not.toThrow()

      expect(Array.isArray(suppliers)).toBe(true)
      expect(Array.isArray(ingredients)).toBe(true)
      expect(Array.isArray(flavors)).toBe(true)
    })

    it('should maintain data consistency across operations', async () => {
      const { getSuppliersData } = await import('../guide-data-service')

      const data1 = await getSuppliersData()
      const data2 = await getSuppliersData()

      expect(data1).toEqual(data2)
      expect(data1.length).toBeGreaterThan(0)
    })

    it('should handle concurrent data access', async () => {
      const { getSuppliersData, getIngredientsData } = await import('../guide-data-service')

      const [suppliers, ingredients] = await Promise.all([
        getSuppliersData(),
        getIngredientsData()
      ])

      expect(suppliers).toBeDefined()
      expect(ingredients).toBeDefined()
      expect(Array.isArray(suppliers)).toBe(true)
      expect(Array.isArray(ingredients)).toBe(true)
    })
  })

  describe('Data Migration and Updates', () => {
    it('should validate data schema consistency', async () => {
      const { getIngredientsData } = await import('../guide-data-service')

      const ingredients = await getIngredientsData()

      // Validate that ingredients have required fields
      ingredients.forEach((ingredient: any) => {
        expect(ingredient).toHaveProperty('id')
        expect(ingredient).toHaveProperty('name')
        expect(ingredient).toHaveProperty('category')
        expect(ingredient).toHaveProperty('safety')
      })
    })
  })
})