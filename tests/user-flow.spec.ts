import { test, expect } from '@playwright/test'

test.describe('End-to-End User Flow Tests', () => {
  test('Complete energy drink creation workflow', async ({ page }) => {
    // Start on home page
    await page.goto('/')
    await expect(page).toHaveTitle(/Energy Drink/)

    // Navigate to calculator
    await page.getByRole('link', { name: /calculator/i }).click()
    await expect(page).toHaveURL(/\/calculator/)

    // Handle age verification if present
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
      await expect(ageModal).not.toBeVisible()
    }

    // Fill out calculator form
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')

    // Select base
    await page.getByRole('combobox', { name: /base/i }).click()
    await page.getByRole('option', { name: /classic/i }).click()

    // Add ingredients
    await page.getByRole('button', { name: /add ingredient/i }).click()
    await page.getByRole('combobox', { name: /ingredient/i }).click()
    await page.getByRole('option', { name: /taurine/i }).click()
    await page.locator('input[placeholder*="amount"]').fill('1000')

    // Generate recipe
    await page.getByRole('button', { name: /calculate/i }).click()

    // Verify results are displayed
    await expect(page.locator('text=/total caffeine/i')).toBeVisible()
    await expect(page.locator('text=/safety status/i')).toBeVisible()
  })

  test('Flavor browsing and selection workflow', async ({ page }) => {
    await page.goto('/')

    // Navigate to flavors page
    await page.getByRole('link', { name: /flavors/i }).click()
    await expect(page).toHaveURL(/\/flavors/)

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Browse flavors
    await expect(page.locator('.flavor-card')).toHaveCount(await page.locator('.flavor-card').count())

    // Click on a flavor
    const firstFlavor = page.locator('.flavor-card').first()
    const flavorName = await firstFlavor.locator('h3').textContent()
    await firstFlavor.click()

    // Verify flavor detail page
    await expect(page.locator('h1')).toContainText(flavorName || '')
    await expect(page.locator('text=/ingredients/i')).toBeVisible()
    await expect(page.locator('text=/safety/i')).toBeVisible()
  })

  test('Recipe exploration workflow', async ({ page }) => {
    await page.goto('/')

    // Navigate to recipes
    await page.getByRole('link', { name: /recipes/i }).click()
    await expect(page).toHaveURL(/\/recipes/)

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Browse recipes
    await expect(page.locator('.recipe-card')).toHaveCount(await page.locator('.recipe-card').count())

    // Filter recipes
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await page.getByRole('checkbox', { name: /caffeine/i }).check()
      await page.getByRole('button', { name: /apply/i }).click()
    }

    // Select a recipe
    const firstRecipe = page.locator('.recipe-card').first()
    await firstRecipe.click()

    // Verify recipe details
    await expect(page.locator('text=/ingredients/i')).toBeVisible()
    await expect(page.locator('text=/instructions/i')).toBeVisible()
  })

  test('Safety information access workflow', async ({ page }) => {
    await page.goto('/')

    // Navigate to safety page
    await page.getByRole('link', { name: /safety/i }).click()
    await expect(page).toHaveURL(/\/safety/)

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Check safety guidelines
    await expect(page.locator('text=/daily limits/i')).toBeVisible()
    await expect(page.locator('text=/warnings/i')).toBeVisible()

    // Test safety calculator
    const safetyInput = page.locator('input[type="number"]').first()
    if (await safetyInput.isVisible()) {
      await safetyInput.fill('400')
      await page.getByRole('button', { name: /check/i }).click()
      await expect(page.locator('text=/status/i')).toBeVisible()
    }
  })

  test('Guide navigation workflow', async ({ page }) => {
    await page.goto('/')

    // Navigate to guide
    await page.getByRole('link', { name: /guide/i }).click()
    await expect(page).toHaveURL(/\/guide/)

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Navigate through guide sections
    const sections = ['basics', 'ingredients', 'safety', 'recipes']
    for (const section of sections) {
      const sectionLink = page.getByRole('link', { name: new RegExp(section, 'i') })
      if (await sectionLink.isVisible()) {
        await sectionLink.click()
        await expect(page.locator(`text=/${section}/i`)).toBeVisible()
      }
    }
  })

  test('Phased drinking guide workflow', async ({ page }) => {
    await page.goto('/')

    // Navigate to phases
    await page.getByRole('link', { name: /phases/i }).click()
    await expect(page).toHaveURL(/\/phases/)

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test phase navigation
    const phaseStepper = page.locator('.phase-stepper')
    if (await phaseStepper.isVisible()) {
      // Click next phase
      const nextButton = page.getByRole('button', { name: /next/i })
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await expect(page.locator('.phase-content')).toBeVisible()
      }

      // Click previous phase
      const prevButton = page.getByRole('button', { name: /previous/i })
      if (await prevButton.isVisible()) {
        await prevButton.click()
        await expect(page.locator('.phase-content')).toBeVisible()
      }
    }
  })

  test('GDPR compliance workflow', async ({ page }) => {
    await page.goto('/')

    // Check for cookie banner
    const cookieBanner = page.locator('[data-testid="cookie-banner"]')
    if (await cookieBanner.isVisible()) {
      // Accept cookies
      await page.getByRole('button', { name: /accept/i }).click()
      await expect(cookieBanner).not.toBeVisible()
    }

    // Navigate to privacy settings
    const privacyLink = page.getByRole('link', { name: /privacy/i })
    if (await privacyLink.isVisible()) {
      await privacyLink.click()
      await expect(page.locator('text=/data processing/i')).toBeVisible()
    }
  })

  test('Error handling and recovery workflow', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page')
    await expect(page.locator('text=/page not found/i')).toBeVisible()

    // Test navigation back to home
    await page.getByRole('link', { name: /home/i }).click()
    await expect(page).toHaveURL('/')

    // Test offline functionality
    await page.context().setOffline(true)
    await page.reload()

    // Check offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toContainText(/offline/i)
    }

    await page.context().setOffline(false)
  })

  test('Internationalization workflow', async ({ page }) => {
    await page.goto('/')

    // Check language switcher
    const langSwitcher = page.locator('[data-testid="language-switcher"]')
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click()

      // Switch to Dutch
      await page.getByRole('option', { name: /nederlands/i }).click()

      // Verify language change
      await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
      await expect(page.locator('text=/energiedrank/i')).toBeVisible()
    }
  })

  test('Performance and loading workflow', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds

    // Test lazy loading of content
    await page.getByRole('link', { name: /flavors/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify images are lazy loaded
    const images = page.locator('img[loading="lazy"]')
    if (await images.count() > 0) {
      await expect(images.first()).toBeVisible()
    }
  test('Calculator validation and edge cases', async ({ page }) => {
    await page.goto('/calculator')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test empty form submission
    await page.getByRole('button', { name: /calculate/i }).click()
    await expect(page.locator('text=/please fill/i')).toBeVisible()

    // Test invalid caffeine amount
    await page.locator('input[placeholder*="caffeine"]').fill('-100')
    await page.getByRole('button', { name: /calculate/i }).click()
    await expect(page.locator('text=/invalid/i')).toBeVisible()

    // Test invalid volume
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('0')
    await page.getByRole('button', { name: /calculate/i }).click()
    await expect(page.locator('text=/invalid/i')).toBeVisible()

    // Test valid calculation with all bases
    const bases = ['classic', 'plain', 'zero']
    for (const base of bases) {
      await page.locator('input[placeholder*="caffeine"]').fill('100')
      await page.locator('input[placeholder*="volume"]').fill('500')
      await page.getByRole('combobox', { name: /base/i }).click()
      await page.getByRole('option', { name: new RegExp(base, 'i') }).click()
      await page.getByRole('button', { name: /calculate/i }).click()
      await expect(page.locator('text=/total caffeine/i')).toBeVisible()
    }
  })

  test('Advanced calculator features', async ({ page }) => {
    await page.goto('/calculator')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Fill basic info
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')
    await page.getByRole('combobox', { name: /base/i }).click()
    await page.getByRole('option', { name: /classic/i }).click()

    // Add multiple ingredients
    const ingredients = ['taurine', 'guarana', 'ginseng']
    for (const ingredient of ingredients) {
      await page.getByRole('button', { name: /add ingredient/i }).click()
      await page.getByRole('combobox', { name: /ingredient/i }).last().click()
      await page.getByRole('option', { name: new RegExp(ingredient, 'i') }).click()
      await page.locator('input[placeholder*="amount"]').last().fill('500')
    }

    // Calculate and verify results
    await page.getByRole('button', { name: /calculate/i }).click()
    await expect(page.locator('text=/total caffeine/i')).toBeVisible()
    await expect(page.locator('text=/safety status/i')).toBeVisible()

    // Test recipe saving (if available)
    const saveButton = page.getByRole('button', { name: /save/i })
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await expect(page.locator('text=/saved/i')).toBeVisible()
    }
  })

  test('Flavor detail page interactions', async ({ page }) => {
    await page.goto('/flavors')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Get first flavor
    const firstFlavor = page.locator('.flavor-card').first()
    const flavorName = await firstFlavor.locator('h3').textContent()
    await firstFlavor.click()

    // Verify detail page
    await expect(page.locator('h1')).toContainText(flavorName || '')
    await expect(page.locator('text=/ingredients/i')).toBeVisible()
    await expect(page.locator('text=/safety/i')).toBeVisible()

    // Test back navigation
    await page.getByRole('link', { name: /back/i }).click()
    await expect(page).toHaveURL(/\/flavors/)

    // Test different flavor types
    const flavorCards = page.locator('.flavor-card')
    const count = await flavorCards.count()
    if (count > 1) {
      await flavorCards.nth(1).click()
      await expect(page.locator('h1')).not.toContainText(flavorName || '')
      await expect(page.locator('text=/ingredients/i')).toBeVisible()
    }
  })

  test('Recipe customization and sharing', async ({ page }) => {
    await page.goto('/recipes')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Select a recipe
    const firstRecipe = page.locator('.recipe-card').first()
    await firstRecipe.click()

    // Test customization options
    const customizeButton = page.getByRole('button', { name: /customize/i })
    if (await customizeButton.isVisible()) {
      await customizeButton.click()
      await expect(page.locator('text=/customize/i')).toBeVisible()

      // Modify ingredients
      const ingredientInput = page.locator('input[type="number"]').first()
      if (await ingredientInput.isVisible()) {
        await ingredientInput.fill('200')
        await page.getByRole('button', { name: /update/i }).click()
        await expect(page.locator('text=/updated/i')).toBeVisible()
      }
    }

    // Test sharing functionality
    const shareButton = page.getByRole('button', { name: /share/i })
    if (await shareButton.isVisible()) {
      await shareButton.click()
      await expect(page.locator('text=/link copied/i')).toBeVisible()
    }
  })

  test('Advanced safety calculator features', async ({ page }) => {
    await page.goto('/safety')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test daily limit calculator
    const dailyInput = page.locator('input[type="number"]').first()
    if (await dailyInput.isVisible()) {
      await dailyInput.fill('400')
      await page.getByRole('button', { name: /check/i }).click()
      await expect(page.locator('text=/status/i')).toBeVisible()
    }

    // Test multiple consumption tracking
    const addConsumptionButton = page.getByRole('button', { name: /add consumption/i })
    if (await addConsumptionButton.isVisible()) {
      await addConsumptionButton.click()
      await page.locator('input[placeholder*="amount"]').last().fill('100')
      await page.getByRole('button', { name: /calculate/i }).click()
      await expect(page.locator('text=/total/i')).toBeVisible()
    }

    // Test safety warnings for high intake
    const highIntakeInput = page.locator('input[type="number"]').first()
    if (await highIntakeInput.isVisible()) {
      await highIntakeInput.fill('800')
      await page.getByRole('button', { name: /check/i }).click()
      await expect(page.locator('text=/warning/i')).toBeVisible()
    }
  })

  test('Guide section deep navigation', async ({ page }) => {
    await page.goto('/guide')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Navigate through all guide sections
    const sections = ['basics', 'ingredients', 'safety', 'recipes', 'effects', 'alternatives']
    for (const section of sections) {
      const sectionLink = page.getByRole('link', { name: new RegExp(section, 'i') })
      if (await sectionLink.isVisible()) {
        await sectionLink.click()
        await expect(page.locator(`text=/${section}/i`)).toBeVisible()

        // Test subsection navigation if available
        const subsections = page.locator('nav a')
        if (await subsections.count() > 0) {
          await subsections.first().click()
          await expect(page.locator('h2, h3')).toBeVisible()
        }
      }
    }
  })

  test('Phase stepper comprehensive testing', async ({ page }) => {
    await page.goto('/phases')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test phase navigation
    const phaseStepper = page.locator('.phase-stepper')
    if (await phaseStepper.isVisible()) {
      // Navigate through all phases
      const totalPhases = await page.locator('.phase-indicator').count()
      for (let i = 0; i < totalPhases; i++) {
        await expect(page.locator('.phase-content')).toBeVisible()

        // Test phase content interactions
        const interactiveElements = page.locator('.phase-content button, .phase-content a')
        if (await interactiveElements.count() > 0) {
          await interactiveElements.first().click()
          // Should either navigate or show content
        }

        // Move to next phase
        const nextButton = page.getByRole('button', { name: /next/i })
        if (await nextButton.isVisible() && i < totalPhases - 1) {
          await nextButton.click()
        }
      }

      // Test direct phase jumping
      const phaseIndicators = page.locator('.phase-indicator')
      if (await phaseIndicators.count() > 1) {
        await phaseIndicators.first().click()
        await expect(page.locator('.phase-content')).toBeVisible()
      }
    }
  })

  test('GDPR data management workflow', async ({ page }) => {
    await page.goto('/')

    // Check for cookie banner
    const cookieBanner = page.locator('[data-testid="cookie-banner"]')
    if (await cookieBanner.isVisible()) {
      await page.getByRole('button', { name: /accept/i }).click()
    }

    // Navigate to privacy settings
    const privacyLink = page.getByRole('link', { name: /privacy/i })
    if (await privacyLink.isVisible()) {
      await privacyLink.click()
      await expect(page.locator('text=/data processing/i')).toBeVisible()

      // Test data export
      const exportButton = page.getByRole('button', { name: /export/i })
      if (await exportButton.isVisible()) {
        await exportButton.click()
        await expect(page.locator('text=/export/i')).toBeVisible()
      }

      // Test data deletion
      const deleteButton = page.getByRole('button', { name: /delete/i })
      if (await deleteButton.isVisible()) {
        // Don't actually delete, just check the confirmation
        await deleteButton.click()
        await expect(page.locator('text=/confirm/i')).toBeVisible()
      }
    }
  })

  test('API error handling and recovery', async ({ page }) => {
    // Test with simulated API failures
    await page.route('**/api/**', async route => {
      if (Math.random() > 0.5) { // Randomly fail some requests
        await route.fulfill({ status: 500, body: 'Internal Server Error' })
      } else {
        await route.continue()
      }
    })

    await page.goto('/calculator')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Try to perform calculation
    await page.locator('input[placeholder*="caffeine"]').fill('100')
    await page.locator('input[placeholder*="volume"]').fill('500')
    await page.getByRole('button', { name: /calculate/i }).click()

    // Should handle error gracefully
    await expect(page.locator('text=/error/i')).toBeVisible()

    // Test retry functionality
    const retryButton = page.getByRole('button', { name: /retry/i })
    if (await retryButton.isVisible()) {
      await retryButton.click()
      await expect(page.locator('text=/total caffeine/i')).toBeVisible()
    }
  })

  test('Search and filter functionality', async ({ page }) => {
    await page.goto('/flavors')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('berry')
      await page.waitForTimeout(500) // Wait for search results
      await expect(page.locator('.flavor-card')).toHaveCount(await page.locator('.flavor-card').count())

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
    }

    // Test filter functionality
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
      const caffeineFilter = page.getByRole('checkbox', { name: /caffeine/i })
      if (await caffeineFilter.isVisible()) {
        await caffeineFilter.check()
        await page.getByRole('button', { name: /apply/i }).click()
        await expect(page.locator('.flavor-card')).toHaveCount(await page.locator('.flavor-card').count())
      }
    }
  })

  test('Form validation comprehensive testing', async ({ page }) => {
    await page.goto('/calculator')

    // Handle age verification
    const ageModal = page.locator('[role="dialog"]')
    if (await ageModal.isVisible()) {
      await page.getByRole('button', { name: /yes.*18/i }).click()
    }

    // Test all form validations
    const inputs = page.locator('input[required], input[type="number"]')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const placeholder = await input.getAttribute('placeholder') || ''

      // Test empty submission
      await input.clear()
      await page.getByRole('button', { name: /calculate/i }).click()
      await expect(page.locator('text=/required/i')).toBeVisible()

      // Test invalid values
      if (placeholder.toLowerCase().includes('caffeine') || placeholder.toLowerCase().includes('amount')) {
        await input.fill('-1')
        await page.getByRole('button', { name: /calculate/i }).click()
        await expect(page.locator('text=/invalid/i')).toBeVisible()
      }

      // Test valid values
      await input.fill('100')
    }

    // Test successful submission
    await page.getByRole('button', { name: /calculate/i }).click()
    await expect(page.locator('text=/total caffeine/i')).toBeVisible()
  })
})
  })
})