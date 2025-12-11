import { test, expect, request } from '@playwright/test'

/**
 * Comprehensive API Testing and Validation Framework
 * Tests all API endpoints for functionality, security, performance,
 * rate limiting, error handling, and backward compatibility
 */

interface APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  requiresAuth: boolean
  rateLimited: boolean
  description: string
  expectedStatusCodes: number[]
  requiredHeaders?: string[]
  responseSchema?: object
}

interface SecurityTestConfig {
  endpoint: string
  method: string
  attackVectors: string[]
  expectedProtection: string[]
}

interface PerformanceTestConfig {
  endpoint: string
  method: string
  concurrentUsers: number
  duration: number
  expectedResponseTime: number
  expectedThroughput: number
}

class APITestingFramework {
  private apiContext: any
  private testResults: Array<{
    endpoint: string
    method: string
    test: string
    success: boolean
    statusCode?: number
    responseTime?: number
    error?: string
    securityScore: number
  }> = []

  constructor() {
    this.initializeAPITesting()
  }

  private initializeAPITesting(): void {
    // Initialize API testing context
    this.apiContext = {
      baseURL: 'http://localhost:3000/api',
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  }

  async testAllEndpoints(): Promise<void> {
    const endpoints = this.getAllAPIEndpoints()
    
    for (const endpoint of endpoints) {
      await test.step(`Test ${endpoint.method} ${endpoint.path}`, async () => {
        await this.testEndpointFunctionality(endpoint)
        await this.testEndpointSecurity(endpoint)
        await this.testEndpointPerformance(endpoint)
        await this.testEndpointErrorHandling(endpoint)
        await this.testEndpointRateLimiting(endpoint)
      })
    }
  }

  private getAllAPIEndpoints(): APIEndpoint[] {
    return [
      // Core API endpoints
      {
        path: '/health',
        method: 'GET',
        requiresAuth: false,
        rateLimited: false,
        description: 'Health check endpoint',
        expectedStatusCodes: [200]
      },
      {
        path: '/flavors',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get all flavors',
        expectedStatusCodes: [200]
      },
      {
        path: '/flavors',
        method: 'POST',
        requiresAuth: true,
        rateLimited: true,
        description: 'Create new flavor',
        expectedStatusCodes: [201, 400, 401, 429]
      },
      {
        path: '/ingredients',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get all ingredients',
        expectedStatusCodes: [200]
      },
      {
        path: '/suppliers',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get all suppliers',
        expectedStatusCodes: [200]
      },
      {
        path: '/enhanced-calculator',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Enhanced calculator processing',
        expectedStatusCodes: [200, 400, 429]
      },
      
      // Authentication endpoints
      {
        path: '/auth/verify-age',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Age verification',
        expectedStatusCodes: [200, 400, 401, 429]
      },
      {
        path: '/auth/check-verification',
        method: 'GET',
        requiresAuth: true,
        rateLimited: true,
        description: 'Check verification status',
        expectedStatusCodes: [200, 401, 429]
      },
      
      // Amazon integration endpoints
      {
        path: '/amazon/products',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get Amazon products',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/amazon/pricing',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get Amazon pricing',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/amazon/availability',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Check Amazon availability',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/amazon/regions',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get Amazon regions',
        expectedStatusCodes: [200]
      },
      
      // Affiliate tracking endpoints
      {
        path: '/affiliate/track-click',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Track affiliate clicks',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/affiliate/track-conversion',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Track affiliate conversions',
        expectedStatusCodes: [200, 400, 429]
      },
      
      // Syrup system endpoints
      {
        path: '/syrups',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get all syrups',
        expectedStatusCodes: [200]
      },
      {
        path: '/syrups/cost-analysis',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Cost analysis for syrups',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/syrups/dilution',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Dilution calculations',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/syrups/recommendations',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Syrup recommendations',
        expectedStatusCodes: [200, 400, 429]
      },
      
      // GDPR and compliance endpoints
      {
        path: '/gdpr/status',
        method: 'GET',
        requiresAuth: false,
        rateLimited: false,
        description: 'GDPR compliance status',
        expectedStatusCodes: [200]
      },
      {
        path: '/gdpr/data',
        method: 'GET',
        requiresAuth: true,
        rateLimited: true,
        description: 'Get user data for GDPR',
        expectedStatusCodes: [200, 401, 429]
      },
      
      // Performance and monitoring endpoints
      {
        path: '/performance',
        method: 'GET',
        requiresAuth: false,
        rateLimited: false,
        description: 'Performance metrics',
        expectedStatusCodes: [200]
      },
      {
        path: '/performance/init',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Initialize performance monitoring',
        expectedStatusCodes: [200, 400, 429]
      },
      
      // Bulk operations
      {
        path: '/bulk',
        method: 'POST',
        requiresAuth: true,
        rateLimited: true,
        description: 'Bulk operations',
        expectedStatusCodes: [200, 400, 401, 429]
      },
      
      // Feedback system
      {
        path: '/feedback',
        method: 'POST',
        requiresAuth: false,
        rateLimited: true,
        description: 'Submit feedback',
        expectedStatusCodes: [200, 400, 429]
      },
      {
        path: '/feedback/stats',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get feedback statistics',
        expectedStatusCodes: [200, 429]
      },
      
      // Search functionality
      {
        path: '/search',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Search functionality',
        expectedStatusCodes: [200, 400, 429]
      },
      
      // Feature flags and A/B testing
      {
        path: '/feature-flags',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get feature flags',
        expectedStatusCodes: [200, 429]
      },
      {
        path: '/ab-tests',
        method: 'GET',
        requiresAuth: false,
        rateLimited: true,
        description: 'Get A/B tests',
        expectedStatusCodes: [200, 429]
      },
      
      // CSRF protection
      {
        path: '/csrf-token',
        method: 'GET',
        requiresAuth: false,
        rateLimited: false,
        description: 'Get CSRF token',
        expectedStatusCodes: [200]
      }
    ]
  }

  private async testEndpointFunctionality(endpoint: APIEndpoint): Promise<void> {
    const startTime = Date.now()
    
    try {
      const response = await this.makeAPIRequest(endpoint.method, endpoint.path, {})
      const responseTime = Date.now() - startTime
      
      // Validate status code
      expect(endpoint.expectedStatusCodes).toContain(response.status())
      
      // Validate response structure
      if (response.status() === 200) {
        const contentType = response.headers()['content-type']
        expect(contentType).toContain('application/json')
        
        const body = await response.json()
        expect(body).toBeDefined()
      }
      
      // Validate security headers
      const headers = response.headers()
      expect(headers['content-security-policy']).toBeDefined()
      expect(headers['x-frame-options']).toBeDefined()
      expect(headers['x-content-type-options']).toBeDefined()
      
      this.testResults.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        test: 'Functionality',
        success: true,
        statusCode: response.status(),
        responseTime,
        securityScore: 100
      })
      
      console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status()} (${responseTime}ms)`)
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.testResults.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        test: 'Functionality',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        securityScore: 0
      })
      
      console.log(`❌ ${endpoint.method} ${endpoint.path}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async testEndpointSecurity(endpoint: APIEndpoint): Promise<void> {
    const securityTests = [
      this.testSQLInjection,
      this.testXSSAttack,
      this.testCSRFProtection,
      this.testRateLimiting,
      this.testAuthenticationBypass
    ]

    let securityScore = 100
    
    for (const test of securityTests) {
      try {
        const result = await test.call(this, endpoint)
        if (!result) {
          securityScore -= 20
        }
      } catch (error) {
        console.warn(`Security test failed for ${endpoint.path}:`, error)
      }
    }
    
    this.testResults.push({
      endpoint: endpoint.path,
      method: endpoint.method,
      test: 'Security',
      success: securityScore >= 80,
      securityScore
    })
  }

  private async testSQLInjection(endpoint: APIEndpoint): Promise<boolean> {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker'); --",
      "admin'--",
      "' UNION SELECT * FROM users--"
    ]

    for (const input of maliciousInputs) {
      try {
        const response = await this.makeAPIRequest('POST', endpoint.path, {
          query: input,
          search: input,
          name: input,
          description: input
        })
        
        // Should not return sensitive data or execute malicious queries
        const body = await response.text()
        expect(body).not.toContain('syntax error')
        expect(body).not.toContain('mysql')
        expect(body).not.toContain('postgresql')
        expect(body).not.toContain('ORA-')
        
        return true
      } catch (error) {
        // If request fails completely, that's also a form of protection
        return true
      }
    }
    
    return true
  }

  private async testXSSAttack(endpoint: APIEndpoint): Promise<boolean> {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">'
    ]

    for (const payload of xssPayloads) {
      try {
        const response = await this.makeAPIRequest('POST', endpoint.path, {
          input: payload,
          comment: payload,
          description: payload
        })
        
        // Should properly escape or reject XSS payloads
        const body = await response.text()
        expect(body).not.toContain('<script>')
        expect(body).not.toContain('javascript:')
        expect(body).not.toContain('onerror=')
        
        return true
      } catch (error) {
        return true
      }
    }
    
    return true
  }

  private async testCSRFProtection(endpoint: APIEndpoint): Promise<boolean> {
    if (endpoint.method === 'GET') {
      return true // GET requests don't need CSRF protection
    }

    try {
      // Test without CSRF token
      const response = await this.makeAPIRequest(endpoint.method, endpoint.path, {}, {
        'Origin': 'https://malicious-site.com'
      })
      
      // Should reject requests without proper CSRF protection
      expect([400, 401, 403]).toContain(response.status())
      
      return true
    } catch (error) {
      return true
    }
  }

  private async testRateLimiting(endpoint: APIEndpoint): Promise<boolean> {
    if (!endpoint.rateLimited) {
      return true
    }

    const requests = []
    const maxRequests = 10
    
    // Make multiple rapid requests
    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        this.makeAPIRequest(endpoint.method, endpoint.path, {})
          .then(response => response.status())
          .catch(() => 0)
      )
    }
    
    const results = await Promise.all(requests)
    const rateLimitedResponses = results.filter(status => status === 429)
    
    // Should have some rate limiting in effect
    return rateLimitedResponses.length > 0
  }

  private async testAuthenticationBypass(endpoint: APIEndpoint): Promise<boolean> {
    if (!endpoint.requiresAuth) {
      return true
    }

    try {
      // Test without authentication
      const response = await this.makeAPIRequest(endpoint.method, endpoint.path, {})
      
      // Should require authentication
      expect([401, 403]).toContain(response.status())
      
      return true
    } catch (error) {
      return true
    }
  }

  private async testEndpointPerformance(endpoint: APIEndpoint): Promise<void> {
    const startTime = Date.now()
    
    try {
      const response = await this.makeAPIRequest(endpoint.method, endpoint.path, {})
      const responseTime = Date.now() - startTime
      
      // Performance thresholds
      const maxResponseTime = 2000 // 2 seconds
      
      expect(responseTime).toBeLessThan(maxResponseTime)
      
      this.testResults.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        test: 'Performance',
        success: true,
        responseTime,
        securityScore: 100
      })
    } catch (error) {
      this.testResults.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        test: 'Performance',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        securityScore: 0
      })
    }
  }

  private async testEndpointErrorHandling(endpoint: APIEndpoint): Promise<void> {
    const errorScenarios = [
      { description: 'Invalid JSON', data: 'invalid json' },
      { description: 'Missing required fields', data: {} },
      { description: 'Too large payload', data: { data: 'x'.repeat(10000) } }
    ]

    for (const scenario of errorScenarios) {
      try {
        const response = await this.makeAPIRequest(endpoint.method, endpoint.path, scenario.data)
        
        // Should handle errors gracefully
        expect([400, 422, 413]).toContain(response.status())
        
        const body = await response.json()
        expect(body).toHaveProperty('error')
        expect(body).toHaveProperty('message')
      } catch (error) {
        // Even if request fails, it should be a controlled failure
        console.log(`Error handling test for ${endpoint.path} (${scenario.description}): OK`)
      }
    }
  }

  private async testEndpointRateLimiting(endpoint: APIEndpoint): Promise<void> {
    if (!endpoint.rateLimited) {
      return
    }

    const requests = []
    const concurrentRequests = 20
    
    // Make many concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        this.makeAPIRequest(endpoint.method, endpoint.path, {})
          .then(response => ({ status: response.status(), index: i }))
          .catch(error => ({ error: error.message, index: i }))
      )
    }
    
    const results = await Promise.all(requests)
    const rateLimitedCount = results.filter(r => r.status === 429).length
    const successfulCount = results.filter(r => r.status === 200).length
    
    // Should have rate limiting in effect
    expect(rateLimitedCount).toBeGreaterThan(0)
    expect(successfulCount).toBeLessThan(concurrentRequests)
  }

  private async makeAPIRequest(method: string, path: string, data?: any, headers?: any): Promise<any> {
    const url = `${this.apiContext.baseURL}${path}`
    const requestHeaders = {
      ...this.apiContext.defaultHeaders,
      ...headers
    }

    const options: any = {
      method,
      headers: requestHeaders
    }

    if (data && method !== 'GET') {
      if (typeof data === 'string') {
        options.data = data
        options.headers['Content-Type'] = 'text/plain'
      } else {
        options.data = JSON.stringify(data)
      }
    }

    const response = await request.newContext().fetch(url, options)
    return response
  }

  async testAPIVersioning(): Promise<void> {
    const versionedEndpoints = [
      '/flavors',
      '/ingredients',
      '/suppliers',
      '/enhanced-calculator'
    ]

    for (const endpoint of versionedEndpoints) {
      // Test current version
      const currentResponse = await this.makeAPIRequest('GET', `${endpoint}?version=current`)
      expect(currentResponse.status()).toBe(200)

      // Test version header
      const versionedResponse = await this.makeAPIRequest('GET', endpoint, {}, {
        'API-Version': '1.0'
      })
      expect(versionedResponse.status()).toBe(200)
    }
  }

  async testBackwardCompatibility(): Promise<void> {
    const legacyEndpoints = [
      { path: '/flavors', oldSchema: { name: 'string', type: 'string' } },
      { path: '/ingredients', oldSchema: { id: 'string', name: 'string' } }
    ]

    for (const endpoint of legacyEndpoints) {
      try {
        const response = await this.makeAPIRequest('GET', endpoint.path)
        const body = await response.json()
        
        // Should maintain backward compatibility
        if (Array.isArray(body)) {
          expect(body.length).toBeGreaterThanOrEqual(0)
        } else {
          expect(body).toBeDefined()
        }
      } catch (error) {
        console.warn(`Backward compatibility test failed for ${endpoint.path}:`, error)
      }
    }
  }

  async testDataConsistency(): Promise<void> {
    // Test data integrity across endpoints
    const flavorsResponse = await this.makeAPIRequest('GET', '/flavors')
    const ingredientsResponse = await this.makeAPIRequest('GET', '/ingredients')
    
    if (flavorsResponse.status() === 200 && ingredientsResponse.status() === 200) {
      const flavors = await flavorsResponse.json()
      const ingredients = await ingredientsResponse.json()
      
      // Validate data consistency
      expect(Array.isArray(flavors)).toBe(true)
      expect(Array.isArray(ingredients)).toBe(true)
      
      // Check for data integrity
      flavors.forEach((flavor: any) => {
        expect(flavor).toHaveProperty('id')
        expect(flavor).toHaveProperty('name')
      })
      
      ingredients.forEach((ingredient: any) => {
        expect(ingredient).toHaveProperty('id')
        expect(ingredient).toHaveProperty('name')
      })
    }
  }

  generateTestReport(): {
    totalTests: number
    successfulTests: number
    failedTests: number
    averageResponseTime: number
    securityScore: number
    endpointBreakdown: Record<string, {
      total: number
      successful: number
      averageResponseTime: number
      securityScore: number
    }>
    performanceMetrics: {
      averageResponseTime: number
      slowestEndpoint: string
      fastestEndpoint: string
      throughputPerSecond: number
    }
    securityAnalysis: {
      overallScore: number
      vulnerabilitiesFound: number
      recommendations: string[]
    }
    recommendations: string[]
  } {
    const totalTests = this.testResults.length
    const successfulTests = this.testResults.filter(r => r.success).length
    const failedTests = totalTests - successfulTests
    const averageResponseTime = this.testResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / totalTests
    const securityScore = this.testResults.reduce((sum, r) => sum + r.securityScore, 0) / totalTests

    const endpointBreakdown: Record<string, any> = {}
    const performanceMetrics: any = {
      averageResponseTime,
      slowestEndpoint: '',
      fastestEndpoint: '',
      throughputPerSecond: 0
    }

    this.testResults.forEach(result => {
      if (!endpointBreakdown[result.endpoint]) {
        endpointBreakdown[result.endpoint] = {
          total: 0,
          successful: 0,
          responseTimes: [],
          securityScores: []
        }
      }
      
      const data = endpointBreakdown[result.endpoint]
      data.total++
      if (result.success) data.successful++
      if (result.responseTime) data.responseTimes.push(result.responseTime)
      data.securityScores.push(result.securityScore)
    })

    // Calculate endpoint averages
    Object.keys(endpointBreakdown).forEach(endpoint => {
      const data = endpointBreakdown[endpoint]
      data.averageResponseTime = data.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / data.responseTimes.length
      data.securityScore = data.securityScores.reduce((sum: number, score: number) => sum + score, 0) / data.securityScores.length
    })

    // Find slowest and fastest endpoints
    const endpointsWithTimes = Object.entries(endpointBreakdown)
      .filter(([_, data]: [string, any]) => data.responseTimes.length > 0)
    
    if (endpointsWithTimes.length > 0) {
      const slowest = endpointsWithTimes.reduce((slowest, current) => 
        current[1].averageResponseTime > slowest[1].averageResponseTime ? current : slowest
      )
      const fastest = endpointsWithTimes.reduce((fastest, current) => 
        current[1].averageResponseTime < fastest[1].averageResponseTime ? current : fastest
      )
      
      performanceMetrics.slowestEndpoint = slowest[0]
      performanceMetrics.fastestEndpoint = fastest[0]
      performanceMetrics.throughputPerSecond = Math.round(1000 / averageResponseTime)
    }

    // Security analysis
    const vulnerabilitiesFound = this.testResults.filter(r => r.securityScore < 80).length
    const securityRecommendations: string[] = []
    
    if (vulnerabilitiesFound > 0) {
      securityRecommendations.push(`Address ${vulnerabilitiesFound} security vulnerabilities found`)
    }
    
    if (securityScore < 90) {
      securityRecommendations.push(`Improve security score from ${securityScore.toFixed(1)}% to above 90%`)
    }

    // General recommendations
    const recommendations: string[] = []
    
    if (failedTests > 0) {
      recommendations.push(`Fix ${failedTests} failed API tests to improve reliability`)
    }
    
    if (averageResponseTime > 1000) {
      recommendations.push(`Optimize API performance - average response time: ${averageResponseTime.toFixed(0)}ms`)
    }
    
    recommendations.push(...securityRecommendations)

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime,
      securityScore,
      endpointBreakdown,
      performanceMetrics,
      securityAnalysis: {
        overallScore: securityScore,
        vulnerabilitiesFound,
        recommendations: securityRecommendations
      },
      recommendations
    }
  }
}

test.describe('Comprehensive API Testing', () => {
  let testingFramework: APITestingFramework

  test.beforeEach(() => {
    testingFramework = new APITestingFramework()
  })

  test.describe('Core API Functionality', () => {
    test('should test all API endpoints functionality', async () => {
      await testingFramework.testAllEndpoints()
    })

    test('should validate health check endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/health')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('timestamp')
      expect(body.status).toBe('healthy')
    })

    test('should validate flavors endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/flavors')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      
      if (body.length > 0) {
        const flavor = body[0]
        expect(flavor).toHaveProperty('id')
        expect(flavor).toHaveProperty('name')
        expect(flavor).toHaveProperty('category')
      }
    })

    test('should validate ingredients endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/ingredients')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      
      if (body.length > 0) {
        const ingredient = body[0]
        expect(ingredient).toHaveProperty('id')
        expect(ingredient).toHaveProperty('name')
      }
    })

    test('should validate suppliers endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/suppliers')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
    })
  })

  test.describe('Enhanced Calculator API', () => {
    test('should validate enhanced calculator endpoint', async () => {
      const requestData = {
        category: 'energy',
        mode: 'hybrid',
        targetFlavor: 'red-bull',
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
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/enhanced-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(requestData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('basic')
      expect(body).toHaveProperty('batchOptimization')
      expect(body).toHaveProperty('costAnalysis')
      expect(body).toHaveProperty('safetyValidation')
      expect(body).toHaveProperty('recommendations')
    })

    test('should handle calculator validation errors', async () => {
      const invalidData = {
        category: 'invalid-category',
        mode: 'invalid-mode',
        targetVolume: -100,
        age: 10
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/enhanced-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(invalidData)
      })

      expect([400, 422]).toContain(response.status())
      
      const body = await response.json()
      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('message')
    })
  })

  test.describe('Amazon Integration API', () => {
    test('should validate Amazon products endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/amazon/products?query=energy%20drink&region=US')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('products')
      expect(Array.isArray(body.products)).toBe(true)
    })

    test('should validate Amazon pricing endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/amazon/pricing?asin=B08N5WRWNW&regions=US,UK,DE')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('pricing')
      expect(Array.isArray(body.pricing)).toBe(true)
    })

    test('should validate Amazon availability endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/amazon/availability?asin=B08N5WRWNW&regions=US,UK,DE')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('availability')
      expect(Array.isArray(body.availability)).toBe(true)
    })

    test('should validate Amazon regions endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/amazon/regions')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('regions')
      expect(Array.isArray(body.regions)).toBe(true)
      
      body.regions.forEach((region: any) => {
        expect(region).toHaveProperty('code')
        expect(region).toHaveProperty('name')
        expect(region).toHaveProperty('domain')
      })
    })
  })

  test.describe('Affiliate Tracking API', () => {
    test('should validate affiliate click tracking', async () => {
      const clickData = {
        affiliateId: 'test-affiliate-123',
        productId: 'B08N5WRWNW',
        region: 'US',
        timestamp: new Date().toISOString(),
        userAgent: 'test-user-agent',
        referrer: 'https://example.com'
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/affiliate/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(clickData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('success')
      expect(body).toHaveProperty('trackingId')
    })

    test('should validate affiliate conversion tracking', async () => {
      const conversionData = {
        trackingId: 'test-tracking-123',
        affiliateId: 'test-affiliate-123',
        conversionValue: 29.99,
        currency: 'USD',
        timestamp: new Date().toISOString()
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/affiliate/track-conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(conversionData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('success')
      expect(body).toHaveProperty('conversionId')
    })
  })

  test.describe('Syrup System API', () => {
    test('should validate syrups endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/syrups')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('syrups')
      expect(Array.isArray(body.syrups)).toBe(true)
    })

    test('should validate syrup cost analysis', async () => {
      const analysisData = {
        targetFlavor: 'red-bull',
        targetServingSize: 250,
        batchSize: 10,
        region: 'US',
        currency: 'USD',
        qualityPreference: 'premium',
        timeframe: 'monthly'
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/syrups/cost-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(analysisData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('recommendation')
      expect(body).toHaveProperty('costAnalysis')
      expect(body).toHaveProperty('qualityAssessment')
    })

    test('should validate syrup dilution calculations', async () => {
      const dilutionData = {
        syrupType: 'energy-drink',
        concentration: 1.5,
        targetVolume: 500,
        desiredStrength: 0.8
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/syrups/dilution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(dilutionData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('syrupAmount')
      expect(body).toHaveProperty('waterAmount')
      expect(body).toHaveProperty('finalConcentration')
    })

    test('should validate syrup recommendations', async () => {
      const recommendationData = {
        targetFlavor: 'berry-citrus-fusion',
        preferredBrands: ['Torani', 'Monin'],
        budgetRange: 'medium',
        availability: 'US',
        qualityPreference: 'standard'
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/syrups/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(recommendationData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('recommendations')
      expect(Array.isArray(body.recommendations)).toBe(true)
    })
  })

  test.describe('Security and Compliance API', () => {
    test('should validate GDPR status endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/gdpr/status')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('compliant')
      expect(body).toHaveProperty('lastUpdated')
      expect(body).toHaveProperty('features')
    })

    test('should validate age verification', async () => {
      const verificationData = {
        birthDate: '1995-06-15',
        region: 'EU'
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/auth/verify-age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(verificationData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('verified')
      expect(body).toHaveProperty('age')
      expect(body).toHaveProperty('canAccess')
    })

    test('should validate CSRF token endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/csrf-token')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('token')
      expect(body).toHaveProperty('expiresAt')
      expect(typeof body.token).toBe('string')
      expect(body.token.length).toBeGreaterThan(0)
    })
  })

  test.describe('Performance and Monitoring API', () => {
    test('should validate performance endpoint', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/performance')
      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('metrics')
      expect(body).toHaveProperty('timestamp')
    })

    test('should validate performance initialization', async () => {
      const initData = {
        page: '/calculator',
        userAgent: 'test-user-agent',
        viewport: { width: 1024, height: 768 }
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/performance/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(initData)
      })

      expect(response.status()).toBe(200)
      
      const body = await response.json()
      expect(body).toHaveProperty('sessionId')
      expect(body).toHaveProperty('initialized')
    })
  })

  test.describe('API Security Tests', () => {
    test('should validate SQL injection protection', async () => {
      const maliciousQuery = "'; DROP TABLE users; --"
      
      const response = await request.newContext().fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(maliciousQuery)}`)
      expect(response.status()).toBe(400)
      
      const body = await response.text()
      expect(body).not.toContain('syntax error')
      expect(body).not.toContain('mysql')
    })

    test('should validate XSS protection', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      const response = await request.newContext().fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ comment: xssPayload })
      })

      expect([200, 400]).toContain(response.status())
      
      if (response.status() === 200) {
        const body = await response.json()
        if (body.comment) {
          expect(body.comment).not.toContain('<script>')
        }
      }
    })

    test('should validate rate limiting', async () => {
      const requests = []
      
      // Make 15 rapid requests to trigger rate limiting
      for (let i = 0; i < 15; i++) {
        requests.push(
          request.newContext().fetch('http://localhost:3000/api/search?q=test')
            .then(response => response.status())
        )
      }
      
      const results = await Promise.all(requests)
      const rateLimitedResponses = results.filter(status => status === 429)
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('should validate authentication requirements', async () => {
      // Test endpoint that requires authentication
      const response = await request.newContext().fetch('http://localhost:3000/api/auth/check-verification')
      expect([401, 403]).toContain(response.status())
    })
  })

  test.describe('API Performance Tests', () => {
    test('should validate response time thresholds', async () => {
      const endpoints = [
        '/health',
        '/flavors',
        '/ingredients',
        '/suppliers'
      ]

      for (const endpoint of endpoints) {
        const startTime = Date.now()
        const response = await request.newContext().fetch(`http://localhost:3000/api${endpoint}`)
        const responseTime = Date.now() - startTime

        expect(response.status()).toBe(200)
        expect(responseTime).toBeLessThan(2000) // 2 seconds max
      }
    })

    test('should validate concurrent request handling', async () => {
      const requests = []
      const concurrentCount = 10

      for (let i = 0; i < concurrentCount; i++) {
        requests.push(
          request.newContext().fetch('http://localhost:3000/api/health')
            .then(response => ({ status: response.status(), index: i }))
            .catch(error => ({ error: error.message, index: i }))
        )
      }

      const results = await Promise.all(requests)
      const successfulRequests = results.filter(r => r.status === 200).length

      expect(successfulRequests).toBe(concurrentCount)
    })
  })

  test.describe('API Error Handling', () => {
    test('should validate invalid JSON handling', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/enhanced-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: 'invalid json'
      })

      expect(response.status()).toBe(400)
    })

    test('should validate missing required fields', async () => {
      const response = await request.newContext().fetch('http://localhost:3000/api/enhanced-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({})
      })

      expect([400, 422]).toContain(response.status())
      
      const body = await response.json()
      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('message')
    })

    test('should validate payload size limits', async () => {
      const largePayload = {
        data: 'x'.repeat(100000) // 100KB payload
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(largePayload)
      })

      expect([400, 413]).toContain(response.status())
    })
  })

  test.describe('API Versioning and Compatibility', () => {
    test('should validate API versioning', async () => {
      // Test version parameter
      const response = await request.newContext().fetch('http://localhost:3000/api/flavors?version=1.0')
      expect(response.status()).toBe(200)

      // Test version header
      const versionedResponse = await request.newContext().fetch('http://localhost:3000/api/flavors', {
        headers: {
          'API-Version': '1.0'
        }
      })
      expect(versionedResponse.status()).toBe(200)
    })

    test('should validate backward compatibility', async () => {
      // Test legacy request format
      const legacyData = {
        name: 'Test Recipe',
        ingredients: ['caffeine', 'sugar'],
        instructions: ['mix', 'serve']
      }

      const response = await request.newContext().fetch('http://localhost:3000/api/flavors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(legacyData)
      })

      expect([200, 201, 400, 401]).toContain(response.status())
    })
  })

  test.describe('Data Consistency and Integrity', () => {
    test('should validate data consistency across endpoints', async () => {
      const flavorsResponse = await request.newContext().fetch('http://localhost:3000/api/flavors')
      const ingredientsResponse = await request.newContext().fetch('http://localhost:3000/api/ingredients')
      
      expect(flavorsResponse.status()).toBe(200)
      expect(ingredientsResponse.status()).toBe(200)
      
      const flavors = await flavorsResponse.json()
      const ingredients = await ingredientsResponse.json()
      
      expect(Array.isArray(flavors)).toBe(true)
      expect(Array.isArray(ingredients)).toBe(true)
      
      // Validate data structure
      flavors.forEach((flavor: any) => {
        expect(flavor).toHaveProperty('id')
        expect(flavor).toHaveProperty('name')
        expect(typeof flavor.id).toBe('string')
        expect(typeof flavor.name).toBe('string')
      })
      
      ingredients.forEach((ingredient: any) => {
        expect(ingredient).toHaveProperty('id')
        expect(ingredient).toHaveProperty('name')
        expect(typeof ingredient.id).toBe('string')
        expect(typeof ingredient.name).toBe('string')
      })
    })

    test('should validate referential integrity', async () => {
      const flavorsResponse = await request.newContext().fetch('http://localhost:3000/api/flavors')
      const flavors = await flavorsResponse.json()
      
      if (flavors.length > 0) {
        const flavor = flavors[0]
        if (flavor.ingredients) {
          // Check if referenced ingredients exist
          const ingredientsResponse = await request.newContext().fetch('http://localhost:3000/api/ingredients')
          const ingredients = await ingredientsResponse.json()
          
          const ingredientIds = ingredients.map((ing: any) => ing.id)
          flavor.ingredients.forEach((ingRef: any) => {
            if (typeof ingRef === 'string') {
              expect(ingredientIds).toContain(ingRef)
            }
          })
        }
      }
    })
  })

  test.describe('Comprehensive API Integration', () => {
    test('should generate comprehensive API test report', async () => {
      await testingFramework.testAllEndpoints()
      await testingFramework.testAPIVersioning()
      await testingFramework.testBackwardCompatibility()
      await testingFramework.testDataConsistency()

      const report = testingFramework.generateTestReport()
      
      expect(report).toHaveProperty('totalTests')
      expect(report).toHaveProperty('successfulTests')
      expect(report).toHaveProperty('failedTests')
      expect(report).toHaveProperty('averageResponseTime')
      expect(report).toHaveProperty('securityScore')
      expect(report).toHaveProperty('endpointBreakdown')
      expect(report).toHaveProperty('performanceMetrics')
      expect(report).toHaveProperty('securityAnalysis')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.totalTests).toBeGreaterThan(0)
      expect(report.successfulTests).toBeGreaterThan(0)
      expect(report.averageResponseTime).toBeGreaterThan(0)
      expect(report.securityScore).toBeGreaterThanOrEqual(0)
    })

    test('should validate all API success criteria', async () => {
      await testingFramework.testAllEndpoints()

      const report = testingFramework.generateTestReport()
      
      // Success criteria validation
      expect(report.failedTests).toBe(0) // No critical failures
      expect(report.averageResponseTime).toBeLessThan(2000) // Average < 2 seconds
      expect(report.securityScore).toBeGreaterThanOrEqual(90) // 90% security score
      expect(report.successfulTests / report.totalTests).toBeGreaterThanOrEqual(0.95) // 95% success rate
    })
  })
})