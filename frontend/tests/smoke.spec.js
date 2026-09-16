import { test, expect } from '@playwright/test';

test('Landing page loads and displays core elements', async ({ page }) => {
  await page.goto('/');
  
  // Check for the main hero heading
  await expect(page.locator('h1').first()).toBeVisible();
  
  // Check if navigation exists
  await expect(page.locator('nav')).toBeVisible();
  
  // Check if "Find a Doctor" or similar CTA exists
  const getStartedBtn = page.getByRole('link', { name: /Find a Doctor|Get Started/i }).first();
  await expect(getStartedBtn).toBeVisible();
});

test('Login page renders correctly', async ({ page }) => {
  await page.goto('/login');
  
  // Should have a login form
  await expect(page.locator('form')).toBeVisible();
  
  // Should have Google sign in button
  await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
});

test('Hospitals directory page loads', async ({ page }) => {
  await page.goto('/hospitals');
  
  // Should see the header
  await expect(page.getByRole('heading', { name: /Hospitals/i }).first()).toBeVisible();
});
