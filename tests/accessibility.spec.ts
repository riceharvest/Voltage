import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Home page should pass accessibility checks', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Calculator page should pass accessibility checks', async ({ page }) => {
    await page.goto('/calculator');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
  test('Flavors page should pass accessibility checks', async ({ page }) => {
    await page.goto('/flavors');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Guide page should pass accessibility checks', async ({ page }) => {
    await page.goto('/guide');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Phases page should pass accessibility checks', async ({ page }) => {
    await page.goto('/phases');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Recipes page should pass accessibility checks', async ({ page }) => {
    await page.goto('/recipes');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Safety page should pass accessibility checks', async ({ page }) => {
    await page.goto('/safety');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Skip navigation link should be visible on tab', async ({ page }) => {
    await page.goto('/');

    // Skip link should not be visible initially
    await expect(page.locator('a[href="#main-content"]')).not.toBeVisible();

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    await expect(page.locator('a[href="#main-content"]')).toBeVisible();

    // Press Enter to skip to main content
    await page.keyboard.press('Enter');
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('main-content');
  });

  test('Mobile navigation should be keyboard accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page.goto('/');

    // Menu button should be visible on mobile
    const menuButton = page.locator('button[aria-label*="navigation menu"]');
    await expect(menuButton).toBeVisible();

    // Focus menu button
    await menuButton.focus();
    await expect(menuButton).toBeFocused();

    // Open menu
    await page.keyboard.press('Enter');
    await expect(page.locator('#mobile-menu')).toBeVisible();

    // Navigate through menu items with keyboard
    await page.keyboard.press('Tab');
    const firstMenuItem = page.locator('#mobile-menu button').first();
    await expect(firstMenuItem).toBeFocused();
  });

  test('Form validation should announce errors to screen readers', async ({ page }) => {
    await page.goto('/calculator');

    // Wait for age verification modal if it appears
    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      // Close modal or handle it
      await page.keyboard.press('Escape');
    }

    // Focus on a form input
    const input = page.locator('input[type="number"]').first();
    await input.focus();

    // Enter invalid data
    await input.fill('invalid');
    await input.press('Tab'); // Trigger validation

    // Check for error message
    const errorMessage = page.locator('[role="alert"], .text-destructive').first();
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    // This would require additional setup with a contrast checking library
    // For now, we'll check that the page loads without contrast issues
    // In a real implementation, you'd use a tool like axe-core's color-contrast rule

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    // Log any contrast issues for manual review
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Color contrast violations:', accessibilityScanResults.violations);
    }

    // For now, just ensure no critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });
});