import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to scanner page', async ({ page }) => {
    await page.goto('/');
    
    // Look for navigation link to scanner
    const scannerLink = page.locator('a[href*="scanner"]').first();
    if (await scannerLink.isVisible()) {
      await scannerLink.click();
      await expect(page).toHaveURL(/scanner/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
