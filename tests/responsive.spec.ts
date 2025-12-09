import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test('Mobile responsiveness - iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check header mobile menu
    const mobileMenu = page.locator('[aria-controls="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Check desktop nav is hidden
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).toBeHidden();

    // Check container padding
    const main = page.locator('main');
    const padding = await main.evaluate(el => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('16px'); // px-4 = 16px
  });

  test('Tablet responsiveness - iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check desktop nav is visible
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).toBeVisible();

    // Check mobile menu is hidden
    const mobileMenu = page.locator('[aria-controls="mobile-menu"]');
    await expect(mobileMenu).toBeHidden();
  });

  test('Desktop responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    // Check desktop nav is visible
    const desktopNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(desktopNav).toBeVisible();

    // Check container max width
    const container = page.locator('.container');
    const maxWidth = await container.evaluate(el => getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe('1200px'); // Assuming container max-w-6xl or similar
  });

  test('Touch targets minimum size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check button heights
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check input heights
    const inputs = page.locator('input');
    for (const input of await inputs.all()) {
      const box = await input.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Responsive images', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/calculator'); // Assuming calculator page has images

    // Check if images have responsive attributes
    const images = page.locator('img');
    for (const img of await images.all()) {
      const sizes = await img.getAttribute('sizes');
      expect(sizes).toBeTruthy();
    }
  });
});