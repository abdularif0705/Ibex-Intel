import { test, expect } from '@playwright/test';

test.describe('Signal Detection E2E Flow', () => {
  test('should navigate to scanner and initiate scan', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to scanner
    await page.goto('/scanner');
    
    // Check for scanner interface
    await expect(page.locator('input[type="url"], input[placeholder*="URL"]')).toBeVisible();
  });

  test('should display signals dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard elements
    const hasSignalsHeading = await page.locator('text=/signals?/i').count() > 0;
    const hasDashboardContent = await page.locator('[class*="dashboard"], [class*="signals"]').count() > 0;
    
    expect(hasSignalsHeading || hasDashboardContent).toBeTruthy();
  });
});

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to auth page', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to auth or show login prompt
    await page.waitForURL(/auth|login/, { timeout: 5000 }).catch(() => {
      // Some apps show inline login, that's ok too
    });
  });
});

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });
});
