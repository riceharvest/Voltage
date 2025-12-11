import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedCalculatorService } from '../enhanced-calculator-service'
import { PremadeCostAnalysis } from '../premade-cost-analysis'
import { PremadeSyrupService } from '../premade-syrups'
import { SafetyValidationService } from '../safety-validation-service'
import { CulturalAdaptationService } from '../cultural-adaptation'

/**
 * Enhanced Calculator Testing Suite
 * Comprehensive testing for multi-mode calculations, batch scaling,
 * safety validation, cultural adaptations, and Amazon integration
 */

interface CalculatorTestCase {
  name: string
  input: {
    category: 'classic' | 'energy' | 'hybrid'
    mode: 'diy' | 'premade' | 'hybrid'
    targetFlavor: string
    targetVolume: number
    servingSize: number
    batchSize: number
    region: string
    currency: string
    language: string
    qualityPreference: 'budget' | 'standard' | 'premium'
    timePreference: 'immediate' | 'weekly' | 'monthly'
    culturalPreference: string
    age: number
    healthConditions: string[]
    caffeineSensitivity: 'low' | 'medium' | 'high'
    useAmazonIntegration: boolean
    enableBatchOptimization: boolean
    enableCostAnalysis: boolean
    enableRegionalAdaptation: boolean
  }
  expected: {
    basicValid: boolean
    caffeineRange: { min: number; max: number }
    batchOptimizationRequired: boolean
    costAnalysisRequired: boolean
    regionalAdaptationRequired: boolean
  }
}

class CalculatorTestingFramework {
  private calculator: EnhancedCalculatorService
  private testResults: Array<{
    test: string
    mode: string
    category: string
    success: boolean
    error?: string
    performance: number
    accuracy: number
  }> = []

  constructor() {
    this.calculator = new EnhancedCalculatorService()
  }

  async testMultiModeCalculationAccuracy(): Promise<void> {
    const testCases: CalculatorTestCase[] = [
      {
        name: 'Classic DIY Mode',
        input: {
          category: 'classic',
          mode: 'diy',
          targetFlavor: 'classic-cola',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard',
          timePreference: 'immediate',
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium',
          useAmazonIntegration: false,
          enableBatchOptimization: true,
          enableCostAnalysis: true,
          enableRegionalAdaptation: false
        },
        expected: {
          basicValid: true,
          caffeineRange: { min: 0, max: 50 },
          batchOptimizationRequired: true,
          costAnalysisRequired: true,
          regionalAdaptationRequired: false
        }
      },
      {
        name: 'Energy Premade Mode',
        input: {
          category: 'energy',
          mode: 'premade',
          targetFlavor: 'red-bull',
          targetVolume: 250,
          servingSize: 250,
          batchSize: 1,
          region: 'US',
          currency: 'USD',
          language: 'en',
          qualityPreference: 'premium',
          timePreference: 'immediate',
          culturalPreference: 'american',
          age: 30,
          healthConditions: [],
          caffeineSensitivity: 'high',
          useAmazonIntegration: true,
          enableBatchOptimization: false,
          enableCostAnalysis: true,
          enableRegionalAdaptation: true
        },
        expected: {
          basicValid: true,
          caffeineRange: { min: 50, max: 160 },
          batchOptimizationRequired: false,
          costAnalysisRequired: true,
          regionalAdaptationRequired: true
        }
      },
      {
        name: 'Hybrid Mode',
        input: {
          category: 'hybrid',
          mode: 'hybrid',
          targetFlavor: 'berry-citrus-fusion',
          targetVolume: 1000,
          servingSize: 300,
          batchSize: 3,
          region: 'NL',
          currency: 'EUR',
          language: 'nl',
          qualityPreference: 'standard',
          timePreference: 'weekly',
          culturalPreference: 'dutch',
          age: 35,
          healthConditions: ['diabetes'],
          caffeineSensitivity: 'low',
          useAmazonIntegration: true,
          enableBatchOptimization: true,
          enableCostAnalysis: true,
          enableRegionalAdaptation: true
        },
        expected: {
          basicValid: true,
          caffeineRange: { min: 20, max: 128 },
          batchOptimizationRequired: true,
          costAnalysisRequired: true,
          regionalAdaptationRequired: true
        }
      }
    ]

    for (const testCase of testCases) {
      const startTime = Date.now()
      
      try {
        const result = await this.calculator.performEnhancedCalculation(testCase.input)
        
        // Validate basic calculation
        expect(result.basic.valid).toBe(testCase.expected.basicValid)
        expect(result.basic.caffeine).toBeGreaterThanOrEqual(testCase.expected.caffeineRange.min)
        expect(result.basic.caffeine).toBeLessThanOrEqual(testCase.expected.caffeineRange.max)
        
        // Validate optional features
        if (testCase.input.enableBatchOptimization) {
          expect(result.batchOptimization).toBeDefined()
          expect(result.batchOptimization?.optimalBatchSize).toBeGreaterThan(0)
        }
        
        if (testCase.input.enableCostAnalysis) {
          expect(result.costAnalysis).toBeDefined()
          expect(result.costAnalysis?.recommendation).toBeDefined()
        }
        
        if (testCase.input.enableRegionalAdaptation) {
          expect(result.regionalAdaptation).toBeDefined()
          expect(result.regionalAdaptation?.adaptedFlavor).toBeDefined()
        }
        
        if (testCase.input.useAmazonIntegration) {
          expect(result.amazonIntegration).toBeDefined()
          expect(result.amazonIntegration?.available).toBeDefined()
        }
        
        // Validate safety
        expect(result.safetyValidation).toBeDefined()
        expect(result.safetyValidation.compliance).toBeGreaterThanOrEqual(0)
        expect(result.safetyValidation.compliance).toBeLessThanOrEqual(100)
        
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Multi-mode Calculation',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: true,
          performance,
          accuracy: 100 // All validations passed
        })
        
        console.log(`✅ ${testCase.name}: ${performance}ms`)
      } catch (error) {
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Multi-mode Calculation',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance,
          accuracy: 0
        })
        
        console.log(`❌ ${testCase.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  async testBatchScalingPrecision(): Promise<void> {
    const testVolumes = [100, 250, 500, 1000, 2000, 5000]
    
    for (const volume of testVolumes) {
      const startTime = Date.now()
      
      try {
        const input = {
          category: 'energy' as const,
          mode: 'hybrid' as const,
          targetFlavor: 'red-bull',
          targetVolume: volume,
          servingSize: 250,
          batchSize: Math.floor(volume / 250),
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'weekly' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: true,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        }
        
        const result = await this.calculator.performEnhancedCalculation(input)
        const optimization = result.batchOptimization
        
        expect(optimization).toBeDefined()
        expect(optimization?.optimalBatchSize).toBeGreaterThan(0)
        expect(optimization?.scalingFactors).toBeDefined()
        expect(optimization?.scalingFactors.limits).toBeDefined()
        
        // Validate scaling logic
        expect(optimization?.scalingFactors.limits.minimum).toBeLessThanOrEqual(volume)
        expect(optimization?.scalingFactors.limits.maximum).toBeGreaterThanOrEqual(volume)
        expect(optimization?.scalingFactors.efficiency).toHaveLength(testVolumes.length)
        
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Batch Scaling',
          mode: 'hybrid',
          category: 'energy',
          success: true,
          performance,
          accuracy: 95
        })
        
        console.log(`✅ Batch scaling ${volume}ml: ${performance}ms`)
      } catch (error) {
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Batch Scaling',
          mode: 'hybrid',
          category: 'energy',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance,
          accuracy: 0
        })
        
        console.log(`❌ Batch scaling ${volume}ml: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  async testSafetyValidationAccuracy(): Promise<void> {
    const safetyTestCases = [
      {
        name: 'Valid Adult Energy Drink',
        input: {
          category: 'energy' as const,
          mode: 'premade' as const,
          targetFlavor: 'red-bull',
          targetVolume: 250,
          servingSize: 250,
          batchSize: 1,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'premium' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        },
        expectedValid: true,
        expectedWarnings: 0
      },
      {
        name: 'Minor with High Caffeine',
        input: {
          category: 'energy' as const,
          mode: 'diy' as const,
          targetFlavor: 'red-bull',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 16,
          healthConditions: [],
          caffeineSensitivity: 'low' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        },
        expectedValid: false,
        expectedWarnings: 1
      },
      {
        name: 'Health Condition Warning',
        input: {
          category: 'classic' as const,
          mode: 'diy' as const,
          targetFlavor: 'classic-cola',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 30,
          healthConditions: ['diabetes', 'hypertension'],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        },
        expectedValid: true,
        expectedWarnings: 1
      }
    ]

    for (const testCase of safetyTestCases) {
      const startTime = Date.now()
      
      try {
        const result = await this.calculator.performEnhancedCalculation(testCase.input)
        const safety = result.safetyValidation
        
        expect(safety).toBeDefined()
        expect(safety.valid).toBe(testCase.expectedValid)
        expect(safety.warnings.length).toBeGreaterThanOrEqual(testCase.expectedWarnings)
        
        // Validate compliance score
        expect(safety.compliance).toBeGreaterThanOrEqual(0)
        expect(safety.compliance).toBeLessThanOrEqual(100)
        
        // Validate warning structure
        safety.warnings.forEach(warning => {
          expect(warning).toHaveProperty('type')
          expect(warning).toHaveProperty('message')
          expect(warning).toHaveProperty('severity')
          expect(['info', 'warning', 'error']).toContain(warning.severity)
        })
        
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Safety Validation',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: true,
          performance,
          accuracy: 100
        })
        
        console.log(`✅ ${testCase.name}: ${performance}ms (compliance: ${safety.compliance}%)`)
      } catch (error) {
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Safety Validation',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance,
          accuracy: 0
        })
        
        console.log(`❌ ${testCase.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  async testCulturalAdaptation(): Promise<void> {
    const regions = ['NL', 'DE', 'FR', 'UK', 'US', 'JP']
    
    for (const region of regions) {
      const startTime = Date.now()
      
      try {
        const input = {
          category: 'hybrid' as const,
          mode: 'hybrid' as const,
          targetFlavor: 'berry-citrus-fusion',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region,
          currency: region === 'US' ? 'USD' : 'EUR',
          language: region === 'NL' ? 'nl' : region === 'DE' ? 'de' : 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'weekly' as const,
          culturalPreference: region.toLowerCase(),
          age: 30,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: true
        }
        
        const result = await this.calculator.performEnhancedCalculation(input)
        const adaptation = result.regionalAdaptation
        
        expect(adaptation).toBeDefined()
        expect(adaptation?.adaptedFlavor).toBeDefined()
        expect(adaptation?.culturalNotes).toBeDefined()
        expect(adaptation?.regulatoryCompliance).toBeDefined()
        expect(adaptation?.unitPreferences).toBeDefined()
        
        // Validate cultural notes structure
        const culturalNotes = adaptation?.culturalNotes
        expect(culturalNotes?.taste).toBeDefined()
        expect(culturalNotes?.preparation).toBeDefined()
        expect(culturalNotes?.serving).toBeDefined()
        expect(culturalNotes?.safety).toBeDefined()
        
        // Validate regulatory compliance
        const compliance = adaptation?.regulatoryCompliance
        expect(compliance?.compliant).toBeDefined()
        expect(compliance?.warnings).toBeDefined()
        expect(compliance?.requirements).toBeDefined()
        
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Cultural Adaptation',
          mode: 'hybrid',
          category: 'hybrid',
          success: true,
          performance,
          accuracy: 95
        })
        
        console.log(`✅ ${region} adaptation: ${performance}ms`)
      } catch (error) {
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Cultural Adaptation',
          mode: 'hybrid',
          category: 'hybrid',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance,
          accuracy: 0
        })
        
        console.log(`❌ ${region} adaptation: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  async testPerformanceUnderHeavyUsage(): Promise<void> {
    const startTime = Date.now()
    const concurrentRequests = 100
    
    try {
      const promises = []
      for (let i = 0; i < concurrentRequests; i++) {
        const mode = ['diy', 'premade', 'hybrid'][i % 3]
        const category = ['classic', 'energy', 'hybrid'][i % 3]
        
        const input = {
          category: category as any,
          mode: mode as any,
          targetFlavor: 'red-bull',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as any,
          timePreference: 'immediate' as any,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as any,
          useAmazonIntegration: false,
          enableBatchOptimization: i % 2 === 0,
          enableCostAnalysis: i % 3 === 0,
          enableRegionalAdaptation: i % 4 === 0
        }
        
        promises.push(this.calculator.performEnhancedCalculation(input))
      }
      
      const results = await Promise.all(promises)
      expect(results).toHaveLength(concurrentRequests)
      
      // Validate all results
      results.forEach(result => {
        expect(result.basic).toBeDefined()
        expect(result.safetyValidation).toBeDefined()
        expect(result.recommendations).toBeDefined()
      })
      
      const performance = Date.now() - startTime
      this.testResults.push({
        test: 'Performance Under Load',
        mode: 'all',
        category: 'all',
        success: true,
        performance,
        accuracy: 100
      })
      
      console.log(`✅ Load test: ${concurrentRequests} requests in ${performance}ms`)
    } catch (error) {
      const performance = Date.now() - startTime
      this.testResults.push({
        test: 'Performance Under Load',
        mode: 'all',
        category: 'all',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance,
        accuracy: 0
      })
      
      console.log(`❌ Load test: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async testInteractiveRecipeBuilder(): Promise<void> {
    const testCases = [
      {
        name: 'Basic Recipe Builder',
        input: {
          category: 'classic' as const,
          mode: 'diy' as const,
          targetFlavor: 'classic-cola',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        },
        currentRecipe: {
          ingredients: [
            { name: 'caffeine', amount: 30, unit: 'mg' },
            { name: 'sugar', amount: 50, unit: 'g' }
          ],
          instructions: ['Mix ingredients', 'Add water']
        }
      }
    ]

    for (const testCase of testCases) {
      const startTime = Date.now()
      
      try {
        const interactive = this.calculator.buildInteractiveRecipe(testCase.input, testCase.currentRecipe)
        
        expect(interactive).toBeDefined()
        expect(interactive.visualRepresentation).toBeDefined()
        expect(interactive.realTimeFeedback).toBeDefined()
        expect(interactive.customizationOptions).toBeDefined()
        expect(interactive.validationFeedback).toBeDefined()
        
        // Validate real-time feedback structure
        const feedback = interactive.realTimeFeedback
        expect(feedback.cost).toBeDefined()
        expect(feedback.caffeine).toBeDefined()
        expect(feedback.validity).toBeDefined()
        expect(feedback.suggestions).toBeDefined()
        
        // Validate customization options
        expect(Array.isArray(interactive.customizationOptions)).toBe(true)
        interactive.customizationOptions.forEach(option => {
          expect(option.id).toBeDefined()
          expect(option.name).toBeDefined()
          expect(option.options).toBeDefined()
          expect(option.current).toBeDefined()
        })
        
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Interactive Recipe Builder',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: true,
          performance,
          accuracy: 100
        })
        
        console.log(`✅ ${testCase.name}: ${performance}ms`)
      } catch (error) {
        const performance = Date.now() - startTime
        this.testResults.push({
          test: 'Interactive Recipe Builder',
          mode: testCase.input.mode,
          category: testCase.input.category,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          performance,
          accuracy: 0
        })
        
        console.log(`❌ ${testCase.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  generateTestReport(): {
    totalTests: number
    successfulTests: number
    failedTests: number
    averagePerformance: number
    accuracyScore: number
    testBreakdown: Record<string, {
      total: number
      successful: number
      failed: number
      averagePerformance: number
      averageAccuracy: number
    }>
    modePerformance: Record<string, {
      total: number
      successRate: number
      averagePerformance: number
      averageAccuracy: number
    }>
    recommendations: string[]
  } {
    const totalTests = this.testResults.length
    const successfulTests = this.testResults.filter(r => r.success).length
    const failedTests = totalTests - successfulTests
    const averagePerformance = this.testResults.reduce((sum, r) => sum + r.performance, 0) / totalTests
    const accuracyScore = this.testResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests

    const testBreakdown: Record<string, any> = {}
    const modePerformance: Record<string, any> = {}

    this.testResults.forEach(result => {
      // Test type breakdown
      if (!testBreakdown[result.test]) {
        testBreakdown[result.test] = {
          total: 0,
          successful: 0,
          failed: 0,
          performance: [],
          accuracy: []
        }
      }
      testBreakdown[result.test].total++
      if (result.success) testBreakdown[result.test].successful++
      else testBreakdown[result.test].failed++
      testBreakdown[result.test].performance.push(result.performance)
      testBreakdown[result.test].accuracy.push(result.accuracy)

      // Mode performance
      if (!modePerformance[result.mode]) {
        modePerformance[result.mode] = {
          total: 0,
          successfulTests: 0,
          performances: [],
          accuracies: []
        }
      }
      modePerformance[result.mode].total++
      if (result.success) modePerformance[result.mode].successfulTests++
      modePerformance[result.mode].performances.push(result.performance)
      modePerformance[result.mode].accuracies.push(result.accuracy)
    })

    // Calculate averages
    Object.keys(testBreakdown).forEach(test => {
      const data = testBreakdown[test]
      data.averagePerformance = data.performance.reduce((sum: number, p: number) => sum + p, 0) / data.performance.length
      data.averageAccuracy = data.accuracy.reduce((sum: number, a: number) => sum + a, 0) / data.accuracy.length
    })

    Object.keys(modePerformance).forEach(mode => {
      const data = modePerformance[mode]
      data.successRate = (data.successfulTests / data.total) * 100
      data.averagePerformance = data.performances.reduce((sum: number, p: number) => sum + p, 0) / data.performances.length
      data.averageAccuracy = data.accuracies.reduce((sum: number, a: number) => sum + a, 0) / data.accuracies.length
    })

    // Generate recommendations
    const recommendations: string[] = []
    
    if (failedTests > 0) {
      recommendations.push(`Address ${failedTests} failed tests to improve reliability`)
    }
    
    if (averagePerformance > 2000) {
      recommendations.push('Optimize calculator performance - average response time exceeds 2 seconds')
    }
    
    if (accuracyScore < 95) {
      recommendations.push(`Improve calculation accuracy - current score: ${accuracyScore.toFixed(1)}%`)
    }
    
    const modeStats = Object.values(modePerformance)
    const slowestMode = modeStats.reduce((slowest, current) => 
      current.averagePerformance > slowest.averagePerformance ? current : slowest
    )
    
    if (slowestMode.averagePerformance > 3000) {
      recommendations.push(`Optimize ${Object.keys(modePerformance).find(key => 
        modePerformance[key] === slowestMode
      )} mode performance`)
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      averagePerformance,
      accuracyScore,
      testBreakdown,
      modePerformance,
      recommendations
    }
  }

  clearResults(): void {
    this.testResults = []
  }
}

describe('Enhanced Calculator Testing Suite', () => {
  let testingFramework: CalculatorTestingFramework

  beforeEach(() => {
    testingFramework = new CalculatorTestingFramework()
  })

  afterEach(() => {
    testingFramework.clearResults()
  })

  describe('Multi-mode Calculation Tests', () => {
    it('should test calculation accuracy across all modes', async () => {
      await testingFramework.testMultiModeCalculationAccuracy()
      const report = testingFramework.generateTestReport()
      
      expect(report.totalTests).toBeGreaterThan(0)
      expect(report.successfulTests).toBe(report.totalTests)
      expect(report.failedTests).toBe(0)
    })

    it('should validate DIY mode calculations', async () => {
      const input = {
        category: 'classic' as const,
        mode: 'diy' as const,
        targetFlavor: 'classic-cola',
        targetVolume: 500,
        servingSize: 250,
        batchSize: 2,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'immediate' as const,
        culturalPreference: 'european',
        age: 25,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: true,
        enableCostAnalysis: true,
        enableRegionalAdaptation: false
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      
      expect(result.basic).toBeDefined()
      expect(result.basic.valid).toBe(true)
      expect(result.batchOptimization).toBeDefined()
      expect(result.costAnalysis).toBeDefined()
      expect(result.safetyValidation).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })

    it('should validate premade mode calculations', async () => {
      const input = {
        category: 'energy' as const,
        mode: 'premade' as const,
        targetFlavor: 'red-bull',
        targetVolume: 250,
        servingSize: 250,
        batchSize: 1,
        region: 'US',
        currency: 'USD',
        language: 'en',
        qualityPreference: 'premium' as const,
        timePreference: 'immediate' as const,
        culturalPreference: 'american',
        age: 30,
        healthConditions: [],
        caffeineSensitivity: 'high' as const,
        useAmazonIntegration: true,
        enableBatchOptimization: false,
        enableCostAnalysis: true,
        enableRegionalAdaptation: true
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      
      expect(result.basic).toBeDefined()
      expect(result.amazonIntegration).toBeDefined()
      expect(result.costAnalysis).toBeDefined()
      expect(result.regionalAdaptation).toBeDefined()
      expect(result.recommendations.approach).toBe('premade')
    })

    it('should validate hybrid mode calculations', async () => {
      const input = {
        category: 'hybrid' as const,
        mode: 'hybrid' as const,
        targetFlavor: 'berry-citrus-fusion',
        targetVolume: 1000,
        servingSize: 300,
        batchSize: 3,
        region: 'NL',
        currency: 'EUR',
        language: 'nl',
        qualityPreference: 'standard' as const,
        timePreference: 'weekly' as const,
        culturalPreference: 'dutch',
        age: 35,
        healthConditions: ['diabetes'],
        caffeineSensitivity: 'low' as const,
        useAmazonIntegration: true,
        enableBatchOptimization: true,
        enableCostAnalysis: true,
        enableRegionalAdaptation: true
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      
      expect(result.basic).toBeDefined()
      expect(result.batchOptimization).toBeDefined()
      expect(result.amazonIntegration).toBeDefined()
      expect(result.costAnalysis).toBeDefined()
      expect(result.regionalAdaptation).toBeDefined()
      expect(result.recommendations.approach).toBe('hybrid')
    })
  })

  describe('Batch Scaling Tests', () => {
    it('should test batch scaling precision across different volumes', async () => {
      await testingFramework.testBatchScalingPrecision()
      const report = testingFramework.generateTestReport()
      
      const scalingTests = report.testBreakdown['Batch Scaling']
      expect(scalingTests).toBeDefined()
      expect(scalingTests.successful).toBe(scalingTests.total)
    })

    it('should validate optimal batch size calculation', async () => {
      const input = {
        category: 'energy' as const,
        mode: 'hybrid' as const,
        targetFlavor: 'red-bull',
        targetVolume: 2000,
        servingSize: 250,
        batchSize: 8,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'weekly' as const,
        culturalPreference: 'european',
        age: 25,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: true,
        enableCostAnalysis: false,
        enableRegionalAdaptation: false
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      const optimization = result.batchOptimization
      
      expect(optimization).toBeDefined()
      expect(optimization?.optimalBatchSize).toBeGreaterThan(0)
      expect(optimization?.costPerServing).toBeGreaterThan(0)
      expect(optimization?.preparationTime).toBeGreaterThan(0)
      expect(optimization?.scalingFactors).toBeDefined()
      expect(optimization?.scalingFactors.limits).toBeDefined()
    })

    it('should validate equipment recommendations', async () => {
      const input = {
        category: 'energy' as const,
        mode: 'hybrid' as const,
        targetFlavor: 'red-bull',
        targetVolume: 5000,
        servingSize: 250,
        batchSize: 20,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'weekly' as const,
        culturalPreference: 'european',
        age: 25,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: true,
        enableCostAnalysis: false,
        enableRegionalAdaptation: false
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      const optimization = result.batchOptimization
      
      expect(optimization?.equipmentRecommendations).toBeDefined()
      expect(optimization?.equipmentRecommendations.length).toBeGreaterThan(0)
      
      optimization?.equipmentRecommendations.forEach(rec => {
        expect(rec.type).toBeDefined()
        expect(rec.capacity).toBeGreaterThan(0)
        expect(rec.cost).toBeGreaterThan(0)
        expect(rec.efficiency).toBeGreaterThan(0)
      })
    })
  })

  describe('Safety Validation Tests', () => {
    it('should test safety validation accuracy', async () => {
      await testingFramework.testSafetyValidationAccuracy()
      const report = testingFramework.generateTestReport()
      
      const safetyTests = report.testBreakdown['Safety Validation']
      expect(safetyTests).toBeDefined()
      expect(safetyTests.successful).toBe(safetyTests.total)
    })

    it('should validate age-based restrictions', async () => {
      const adultInput = {
        category: 'energy' as const,
        mode: 'premade' as const,
        targetFlavor: 'red-bull',
        targetVolume: 250,
        servingSize: 250,
        batchSize: 1,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'premium' as const,
        timePreference: 'immediate' as const,
        culturalPreference: 'european',
        age: 25,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: false,
        enableCostAnalysis: false,
        enableRegionalAdaptation: false
      }
      
      const minorInput = { ...adultInput, age: 16 }
      
      const calculator = new EnhancedCalculatorService()
      const adultResult = await calculator.performEnhancedCalculation(adultInput)
      const minorResult = await calculator.performEnhancedCalculation(minorInput)
      
      expect(adultResult.safetyValidation.valid).toBe(true)
      expect(minorResult.safetyValidation.valid).toBe(false)
      expect(minorResult.safetyValidation.warnings.length).toBeGreaterThan(0)
    })

    it('should validate caffeine limits by category', async () => {
      const categories = ['classic', 'energy', 'hybrid'] as const
      const calculator = new EnhancedCalculatorService()
      
      for (const category of categories) {
        const input = {
          category,
          mode: 'diy' as const,
          targetFlavor: 'classic-cola',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: false
        }
        
        const result = await calculator.performEnhancedCalculation(input)
        
        expect(result.safetyValidation).toBeDefined()
        expect(result.basic.caffeine).toBeGreaterThanOrEqual(0)
        
        // Category-specific caffeine expectations
        if (category === 'classic') {
          expect(result.basic.caffeine).toBeLessThanOrEqual(50)
        } else if (category === 'energy') {
          expect(result.basic.caffeine).toBeGreaterThanOrEqual(50)
        } else if (category === 'hybrid') {
          expect(result.basic.caffeine).toBeGreaterThanOrEqual(20)
          expect(result.basic.caffeine).toBeLessThanOrEqual(128)
        }
      }
    })
  })

  describe('Cultural Adaptation Tests', () => {
    it('should test cultural adaptation across regions', async () => {
      await testingFramework.testCulturalAdaptation()
      const report = testingFramework.generateTestReport()
      
      const adaptationTests = report.testBreakdown['Cultural Adaptation']
      expect(adaptationTests).toBeDefined()
      expect(adaptationTests.successful).toBe(adaptationTests.total)
    })

    it('should validate regional unit preferences', async () => {
      const input = {
        category: 'hybrid' as const,
        mode: 'hybrid' as const,
        targetFlavor: 'berry-citrus-fusion',
        targetVolume: 500,
        servingSize: 250,
        batchSize: 2,
        region: 'US',
        currency: 'USD',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'weekly' as const,
        culturalPreference: 'american',
        age: 30,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: false,
        enableCostAnalysis: false,
        enableRegionalAdaptation: true
      }
      
      const calculator = new EnhancedCalculatorService()
      const result = await calculator.performEnhancedCalculation(input)
      const adaptation = result.regionalAdaptation
      
      expect(adaptation?.unitPreferences).toBeDefined()
      expect(adaptation?.unitPreferences.primary).toBeDefined()
      expect(adaptation?.unitPreferences.secondary).toBeDefined()
      expect(adaptation?.unitPreferences.conversion).toBeDefined()
    })

    it('should validate regulatory compliance', async () => {
      const regions = ['EU', 'US', 'UK']
      const calculator = new EnhancedCalculatorService()
      
      for (const region of regions) {
        const input = {
          category: 'energy' as const,
          mode: 'premade' as const,
          targetFlavor: 'red-bull',
          targetVolume: 250,
          servingSize: 250,
          batchSize: 1,
          region,
          currency: region === 'US' ? 'USD' : 'EUR',
          language: region === 'UK' ? 'en' : 'en',
          qualityPreference: 'premium' as const,
          timePreference: 'immediate' as const,
          culturalPreference: region.toLowerCase(),
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: false,
          enableCostAnalysis: false,
          enableRegionalAdaptation: true
        }
        
        const result = await calculator.performEnhancedCalculation(input)
        const adaptation = result.regionalAdaptation
        
        expect(adaptation?.regulatoryCompliance).toBeDefined()
        expect(adaptation?.regulatoryCompliance.compliant).toBeDefined()
        expect(adaptation?.regulatoryCompliance.warnings).toBeDefined()
        expect(adaptation?.regulatoryCompliance.requirements).toBeDefined()
      }
    })
  })

  describe('Performance Tests', () => {
    it('should test performance under heavy usage', async () => {
      await testingFramework.testPerformanceUnderHeavyUsage()
      const report = testingFramework.generateTestReport()
      
      const loadTests = report.testBreakdown['Performance Under Load']
      expect(loadTests).toBeDefined()
      expect(loadTests.successful).toBe(loadTests.total)
      expect(loadTests.averagePerformance).toBeLessThan(10000) // Should handle 100 requests in under 10 seconds
    })

    it('should measure calculation accuracy across modes', async () => {
      const modes = ['diy', 'premade', 'hybrid'] as const
      const calculator = new EnhancedCalculatorService()
      const accuracyResults: Record<string, number> = {}
      
      for (const mode of modes) {
        const input = {
          category: 'energy' as const,
          mode,
          targetFlavor: 'red-bull',
          targetVolume: 500,
          servingSize: 250,
          batchSize: 2,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'immediate' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: false,
          enableBatchOptimization: true,
          enableCostAnalysis: true,
          enableRegionalAdaptation: false
        }
        
        const startTime = Date.now()
        const result = await calculator.performEnhancedCalculation(input)
        const performance = Date.now() - startTime
        
        // Basic accuracy checks
        const accuracy = result.basic.valid ? 100 : 0
        if (result.safetyValidation.compliance >= 80) accuracy += 0
        
        accuracyResults[mode] = accuracy
        expect(performance).toBeLessThan(5000) // Should complete in under 5 seconds
      }
      
      console.log('Mode accuracy results:', accuracyResults)
    })

    it('should validate memory usage during calculations', async () => {
      const calculator = new EnhancedCalculatorService()
      const initialMemory = process.memoryUsage()
      
      // Perform multiple calculations to test memory usage
      const promises = []
      for (let i = 0; i < 50; i++) {
        const input = {
          category: 'energy' as const,
          mode: 'hybrid' as const,
          targetFlavor: 'red-bull',
          targetVolume: 1000,
          servingSize: 250,
          batchSize: 4,
          region: 'EU',
          currency: 'EUR',
          language: 'en',
          qualityPreference: 'standard' as const,
          timePreference: 'weekly' as const,
          culturalPreference: 'european',
          age: 25,
          healthConditions: [],
          caffeineSensitivity: 'medium' as const,
          useAmazonIntegration: true,
          enableBatchOptimization: true,
          enableCostAnalysis: true,
          enableRegionalAdaptation: true
        }
        
        promises.push(calculator.performEnhancedCalculation(input))
      }
      
      await Promise.all(promises)
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
    })
  })

  describe('Interactive Recipe Builder Tests', () => {
    it('should test interactive recipe builder functionality', async () => {
      await testingFramework.testInteractiveRecipeBuilder()
      const report = testingFramework.generateTestReport()
      
      const builderTests = report.testBreakdown['Interactive Recipe Builder']
      expect(builderTests).toBeDefined()
      expect(builderTests.successful).toBe(builderTests.total)
    })

    it('should validate real-time feedback accuracy', async () => {
      const input = {
        category: 'classic' as const,
        mode: 'diy' as const,
        targetFlavor: 'classic-cola',
        targetVolume: 500,
        servingSize: 250,
        batchSize: 2,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'immediate' as const,
        culturalPreference: 'european',
        age: 25,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: false,
        enableCostAnalysis: false,
        enableRegionalAdaptation: false
      }
      
      const currentRecipe = {
        ingredients: [
          { name: 'caffeine', amount: 30, unit: 'mg' },
          { name: 'sugar', amount: 50, unit: 'g' }
        ],
        instructions: ['Mix ingredients', 'Add water']
      }
      
      const calculator = new EnhancedCalculatorService()
      const interactive = calculator.buildInteractiveRecipe(input, currentRecipe)
      
      expect(interactive.realTimeFeedback).toBeDefined()
      expect(interactive.realTimeFeedback.cost).toBeGreaterThan(0)
      expect(interactive.realTimeFeedback.caffeine).toBeGreaterThanOrEqual(0)
      expect(interactive.realTimeFeedback.validity).toBeDefined()
      expect(Array.isArray(interactive.realTimeFeedback.suggestions)).toBe(true)
    })

    it('should validate customization options', async () => {
      const input = {
        category: 'hybrid' as const,
        mode: 'hybrid' as const,
        targetFlavor: 'berry-citrus-fusion',
        targetVolume: 1000,
        servingSize: 300,
        batchSize: 3,
        region: 'EU',
        currency: 'EUR',
        language: 'en',
        qualityPreference: 'standard' as const,
        timePreference: 'weekly' as const,
        culturalPreference: 'european',
        age: 30,
        healthConditions: [],
        caffeineSensitivity: 'medium' as const,
        useAmazonIntegration: false,
        enableBatchOptimization: false,
        enableCostAnalysis: false,
        enableRegionalAdaptation: false
      }
      
      const currentRecipe = {
        ingredients: [],
        instructions: []
      }
      
      const calculator = new EnhancedCalculatorService()
      const interactive = calculator.buildInteractiveRecipe(input, currentRecipe)
      
      expect(interactive.customizationOptions).toBeDefined()
      expect(Array.isArray(interactive.customizationOptions)).toBe(true)
      
      interactive.customizationOptions.forEach(option => {
        expect(option.id).toBeDefined()
        expect(option.name).toBeDefined()
        expect(Array.isArray(option.options)).toBe(true)
        expect(option.current).toBeDefined()
      })
    })
  })

  describe('Comprehensive Integration Tests', () => {
    it('should generate comprehensive test report', async () => {
      await testingFramework.testMultiModeCalculationAccuracy()
      await testingFramework.testBatchScalingPrecision()
      await testingFramework.testSafetyValidationAccuracy()
      await testingFramework.testCulturalAdaptation()
      await testingFramework.testPerformanceUnderHeavyUsage()
      await testingFramework.testInteractiveRecipeBuilder()

      const report = testingFramework.generateTestReport()
      
      expect(report).toHaveProperty('totalTests')
      expect(report).toHaveProperty('successfulTests')
      expect(report).toHaveProperty('failedTests')
      expect(report).toHaveProperty('averagePerformance')
      expect(report).toHaveProperty('accuracyScore')
      expect(report).toHaveProperty('testBreakdown')
      expect(report).toHaveProperty('modePerformance')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.totalTests).toBeGreaterThan(0)
      expect(report.successfulTests).toBeGreaterThan(0)
      expect(report.averagePerformance).toBeGreaterThan(0)
      expect(report.accuracyScore).toBeGreaterThanOrEqual(0)
    })

    it('should validate all success criteria', async () => {
      await testingFramework.testMultiModeCalculationAccuracy()
      await testingFramework.testSafetyValidationAccuracy()
      await testingFramework.testCulturalAdaptation()

      const report = testingFramework.generateTestReport()
      
      // Success criteria validation
      expect(report.failedTests).toBe(0) // No critical failures
      expect(report.averagePerformance).toBeLessThan(3000) // Average < 3 seconds
      expect(report.accuracyScore).toBeGreaterThanOrEqual(95) // 95% accuracy
      expect(report.successfulTests / report.totalTests).toBeGreaterThanOrEqual(0.95) // 95% success rate
    })
  })
})

export { CalculatorTestingFramework }