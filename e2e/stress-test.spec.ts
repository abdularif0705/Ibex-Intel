import { test, expect } from '@playwright/test';

test.describe('Stress Tests - Signal Processing', () => {
  test('should handle multiple rapid navigation actions', async ({ page }) => {
    await page.goto('/');
    
    // Rapid navigation between pages
    for (let i = 0; i < 10; i++) {
      await page.goto('/dashboard');
      await page.goto('/scanner');
      await page.goto('/');
    }
    
    // Should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle large dataset rendering', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Scroll to trigger any virtual scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Should remain stable
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Concurrent User Simulation', () => {
  test('should handle concurrent requests', async ({ browser }) => {
    // Simulate multiple concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // All users navigate simultaneously
    await Promise.all(
      pages.map(page => page.goto('/'))
    );
    
    // All should load successfully
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });
});
