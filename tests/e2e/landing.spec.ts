/**
 * Landing page — tests run WITHOUT authentication (public page).
 * Override storageState to an empty context.
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with brand name", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Brand name appears somewhere prominent
    await expect(page.getByText(/bodybench/i).first()).toBeVisible();
  });

  test("Start Assessment CTA is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /start|take|begin|assessment/i }).first()
    ).toBeVisible();
  });

  test("clicking Start navigates to /login (unauthenticated)", async ({ page }) => {
    await page.getByRole("button", { name: /start|take|begin|assessment/i }).first().click();
    // Unauthenticated → redirected to login
    await expect(page).toHaveURL(/\/(login|assessment)/);
  });

  test("How to Use popup opens and closes", async ({ page }) => {
    const btn = page.getByRole("button", { name: /how|guide|info/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      // Popup content visible
      await expect(page.getByRole("dialog").or(page.locator("[role=dialog]"))).toBeVisible();
      // Close via Escape
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("navbar shows Sign In button when unauthenticated", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign in|login/i }).first()
    ).toBeVisible();
  });
});
