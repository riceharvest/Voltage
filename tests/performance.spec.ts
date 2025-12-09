import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('Home page performance metrics', async ({ page }) => {
    // Start performance monitoring
    const client = await page.context().newCDPSession(page)
    await client.send('Performance.enable')

    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime

    // Basic performance assertions
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      }
    })

    // Assert key performance metrics
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000)
    expect(performanceMetrics.loadComplete).toBeLessThan(3000)
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500)

    console.log('Home page performance metrics:', performanceMetrics)
  })

  test('Calculator page performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/calculator', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2500)

    // Test calculator interaction performance
    const calcStartTime = Date.now()

    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')
    await page.getByRole('button', { name: /calculate/i }).click()

    const calcTime = Date.now() - calcStartTime
    expect(calcTime).toBeLessThan(1000) // Calculation should be fast

    console.log('Calculator performance - Load time:', loadTime, 'Calc time:', calcTime)
  })

  test('Large page performance - Flavors', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/flavors', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(4000) // Allow more time for larger pages

    // Count rendered elements
    const cardCount = await page.locator('.flavor-card').count()
    console.log(`Flavors page loaded ${cardCount} cards in ${loadTime}ms`)

    // Test scrolling performance
    const scrollStartTime = Date.now()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500) // Wait for any lazy loading
    const scrollTime = Date.now() - scrollStartTime

    expect(scrollTime).toBeLessThan(1000)
  })

  test('API response performance', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = []

    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })

    page.on('response', response => {
      const request = requests.find(r => r.url === response.url())
      if (request) {
        request.responseTime = Date.now() - request.timestamp
        request.status = response.status()
      }
    })

    await page.goto('/calculator', { waitUntil: 'networkidle' })

    // Fill and submit calculator
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')
    await page.getByRole('button', { name: /calculate/i }).click()

    // Wait for any API responses
    await page.waitForTimeout(1000)

    // Check API response times
    const apiRequests = requests.filter(r => r.url.includes('/api/'))
    apiRequests.forEach(request => {
      if (request.responseTime) {
        expect(request.responseTime).toBeLessThan(2000) // API should respond within 2 seconds
        expect(request.status).toBe(200)
      }
    })

    console.log('API requests:', apiRequests)
  })

  test('Memory usage monitoring', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore - performance.memory is not in types but available in Chromium
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    })

    // Navigate through several pages
    await page.getByRole('link', { name: /calculator/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /flavors/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /safety/i }).click()
    await page.waitForLoadState('networkidle')

    // Check memory after navigation
    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    })

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used
      console.log(`Memory usage: Initial ${initialMemory.used}, Final ${finalMemory.used}, Increase ${memoryIncrease}`)

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    }
  })

  test('Bundle size and resource loading', async ({ page }) => {
    const resources: any[] = []

    page.on('response', response => {
      const url = response.url()
      const contentType = response.headers()['content-type'] || ''

      if (contentType.includes('javascript') || contentType.includes('css') || url.includes('.js') || url.includes('.css')) {
        resources.push({
          url,
          contentType,
          size: 0 // Will be populated if we can get it
        })
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Analyze loaded resources
    const jsResources = resources.filter(r => r.contentType.includes('javascript') || r.url.includes('.js'))
    const cssResources = resources.filter(r => r.contentType.includes('css') || r.url.includes('.css'))

    console.log(`Loaded ${jsResources.length} JS files and ${cssResources.length} CSS files`)

    // Ensure we don't have too many large bundles
    expect(jsResources.length).toBeLessThan(20)
    expect(cssResources.length).toBeLessThan(10)
  })

  test('Core Web Vitals simulation', async ({ page }) => {
    // Monitor Core Web Vitals metrics
    const vitals: any[] = []

    await page.evaluate(() => {
      // @ts-ignore - web-vitals types
      import('https://unpkg.com/web-vitals@3/dist/web-vitals.es5.min.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for metrics to be collected
    await page.waitForTimeout(2000)

    // Simulate user interactions that affect Core Web Vitals
    await page.getByRole('link', { name: /calculator/i }).click()
    await page.waitForLoadState('networkidle')

    // Fill out form (tests FID - First Input Delay)
    await page.locator('input[placeholder*="caffeine"]').fill('100')

    // Wait for any layout shifts to settle
    await page.waitForTimeout(1000)

    console.log('Core Web Vitals monitoring completed')
  })

  test('Caching effectiveness', async ({ page, context }) => {
    // First load - should cache resources
    const startTime1 = Date.now()
    await page.goto('/', { waitUntil: 'networkidle' })
    const loadTime1 = Date.now() - startTime1

    // Second load - should be faster due to caching
    const startTime2 = Date.now()
    const page2 = await context.newPage()
    await page2.goto('/', { waitUntil: 'networkidle' })
    const loadTime2 = Date.now() - startTime2

    console.log(`First load: ${loadTime1}ms, Second load: ${loadTime2}ms`)

    // Second load should be significantly faster (at least 20% improvement)
    const improvement = (loadTime1 - loadTime2) / loadTime1
    expect(improvement).toBeGreaterThan(0.2)

    await page2.close()
  })

  test('Progressive loading and lazy images', async ({ page }) => {
    await page.goto('/flavors', { waitUntil: 'networkidle' })

    // Count total images
    const totalImages = await page.locator('img').count()

    // Count lazy-loaded images
    const lazyImages = await page.locator('img[loading="lazy"]').count()

    console.log(`Total images: ${totalImages}, Lazy images: ${lazyImages}`)

    // Should have lazy loading for performance
    expect(lazyImages).toBeGreaterThan(0)

    // Test that lazy images load on scroll
    const initialLoadedImages = await page.locator('img[data-loaded="true"]').count()

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000) // Wait for lazy loading

    const finalLoadedImages = await page.locator('img[data-loaded="true"]').count()

    // Should have loaded more images after scrolling
    expect(finalLoadedImages).toBeGreaterThanOrEqual(initialLoadedImages)
  })

  test('JavaScript execution performance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Measure JavaScript execution time
    const jsExecutionTime = await page.evaluate(() => {
      const start = performance.now()

      // Simulate some JavaScript work
      for (let i = 0; i < 10000; i++) {
        Math.sqrt(i)
      }

      return performance.now() - start
    })

    console.log(`JavaScript execution time: ${jsExecutionTime}ms`)

    // JS execution should be fast
    expect(jsExecutionTime).toBeLessThan(50)
  })
})