import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('Home page visual regression', async ({ page }) => {
    await page.goto('/')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
      await expect(ageModal).not.toBeVisible()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      threshold: 0.1 // Allow 10% difference for minor variations
    })
  })

  test('Calculator page visual regression', async ({ page }) => {
    await page.goto('/calculator')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('calculator-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Calculator with results visual regression', async ({ page }) => {
    await page.goto('/calculator')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Fill out calculator form
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')

    // Select base
    await page.getByRole('combobox', { name: /base/i }).click()
    await page.getByRole('option', { name: /classic/i }).click()

    // Generate recipe
    await page.getByRole('button', { name: /calculate/i }).click()

    // Wait for results
    await expect(page.locator('text=/total caffeine/i')).toBeVisible()

    // Take screenshot of results
    await expect(page).toHaveScreenshot('calculator-results.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Flavors page visual regression', async ({ page }) => {
    await page.goto('/flavors')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('flavors-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Flavor detail page visual regression', async ({ page }) => {
    await page.goto('/flavors')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Click on first flavor
    const firstFlavor = page.locator('.flavor-card').first()
    await firstFlavor.click()

    // Wait for detail page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('flavor-detail-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Recipes page visual regression', async ({ page }) => {
    await page.goto('/recipes')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('recipes-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Safety page visual regression', async ({ page }) => {
    await page.goto('/safety')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('safety-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Guide page visual regression', async ({ page }) => {
    await page.goto('/guide')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('guide-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Phases page visual regression', async ({ page }) => {
    await page.goto('/phases')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('phases-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Mobile home page visual regression', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('home-page-mobile.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Tablet calculator page visual regression', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/calculator')

    // Handle age verification modal if it appears
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('calculator-page-tablet.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Error page visual regression', async ({ page }) => {
    await page.goto('/nonexistent-page')

    // Wait for error page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('error-page.png', {
      fullPage: true,
      threshold: 0.1
    })
  })

  test('Age verification modal visual regression', async ({ page }) => {
    await page.goto('/calculator')

    // Wait for age verification modal
    const ageModal = page.locator('[role="dialog"]')
    await expect(ageModal).toBeVisible()

    // Take screenshot of modal
    await expect(page).toHaveScreenshot('age-verification-modal.png', {
      threshold: 0.1
    })
  })

  test('Cookie banner visual regression', async ({ page }) => {
    await page.goto('/')

    // Check for cookie banner
    const cookieBanner = page.locator('[data-testid="cookie-banner"]')
    if (await cookieBanner.isVisible()) {
      // Take screenshot of banner
      await expect(page).toHaveScreenshot('cookie-banner.png', {
        threshold: 0.1
      })
    }
  })
})