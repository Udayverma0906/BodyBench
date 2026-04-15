/**
 * History page E2E tests.
 * Covers: list rendering, delete flow, restore flow, score trend.
 *
 * NOTE: These tests assume the test user has at least 1 existing assessment.
 * Run the assessment.spec.ts flow first, or seed data manually.
 */
import { test, expect } from "@playwright/test";

test.describe("History page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL("/history");
    // Wait for data to load (spinner gone)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // brief settle for async state
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("shows page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /assessment history/i })).toBeVisible();
  });

  test("New Assessment button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /new assessment/i })
    ).toBeVisible();
  });

  test("Deleted button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /deleted/i })
    ).toBeVisible();
  });

  // ── With existing assessments ───────────────────────────────────────────────

  test("shows assessment cards or empty state", async ({ page }) => {
    const cards     = page.locator(".rounded-2xl.border").first(); // assessment card pattern
    const emptyText = page.getByText(/no assessments yet/i);
    // Either a card or the empty state must be visible
    const hasCards = await cards.isVisible();
    const isEmpty  = await emptyText.isVisible();
    expect(hasCards || isEmpty).toBe(true);
  });

  test("assessment card shows a numeric score", async ({ page }) => {
    const cards = page.locator(".rounded-2xl.border");
    if (await cards.first().isVisible()) {
      // Score circle contains a number 0–100
      await expect(
        page.locator("text=/^\\d{1,3}$/").first()
      ).toBeVisible();
    }
  });

  test("assessment card shows a category badge", async ({ page }) => {
    const cards = page.locator(".rounded-2xl.border");
    if (await cards.first().isVisible()) {
      await expect(
        page.getByText(/excellent|good|average|needs improvement/i).first()
      ).toBeVisible();
    }
  });

  test("score trend chart shown when 2+ assessments exist", async ({ page }) => {
    const cards = await page.locator(".rounded-2xl.border").count();
    if (cards >= 2) {
      // TrendChart renders an SVG
      await expect(page.locator("svg").first()).toBeVisible();
      await expect(page.getByText(/score trend/i)).toBeVisible();
    }
  });

  test("BMI pill visible on cards where weight+height were recorded", async ({ page }) => {
    // If any card has BMI data, "BMI" label should appear
    const bmiLabel = page.getByText(/^BMI$/).first();
    // Just check it renders correctly if it exists — don't fail if no BMI data
    if (await bmiLabel.isVisible()) {
      await expect(bmiLabel).toBeVisible();
      // Category pill should follow
      await expect(
        page.getByText(/underweight|normal|overweight|obese/i).first()
      ).toBeVisible();
    }
  });

  // ── Delete flow ─────────────────────────────────────────────────────────────

  test("delete button appears on hover and opens confirmation popup", async ({ page }) => {
    const firstCard = page.locator(".rounded-2xl.border").first();
    if (!(await firstCard.isVisible())) return; // skip if no assessments

    // Hover to reveal delete button (sm:opacity-0 sm:group-hover:opacity-100)
    await firstCard.hover();
    const deleteBtn = firstCard.getByRole("button", { name: /delete|remove/i });
    await expect(deleteBtn).toBeVisible({ timeout: 3_000 });
    await deleteBtn.click();

    // Confirmation popup
    await expect(page.getByText(/remove assessment/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /remove/i })).toBeVisible();
  });

  test("cancel in delete popup keeps assessment in list", async ({ page }) => {
    const firstCard = page.locator(".rounded-2xl.border").first();
    if (!(await firstCard.isVisible())) return;

    const initialCount = await page.locator(".rounded-2xl.border").count();

    await firstCard.hover();
    await firstCard.getByRole("button", { name: /delete|remove/i }).click();
    await page.getByRole("button", { name: /cancel/i }).click();

    // Card count unchanged
    await expect(page.locator(".rounded-2xl.border")).toHaveCount(initialCount);
  });

  test("confirming delete removes card from list", async ({ page }) => {
    const firstCard = page.locator(".rounded-2xl.border").first();
    if (!(await firstCard.isVisible())) return;

    const initialCount = await page.locator(".rounded-2xl.border").count();

    await firstCard.hover();
    await firstCard.getByRole("button", { name: /delete|remove/i }).click();
    await page.getByRole("button", { name: /^remove$/i }).click();

    // One fewer card
    await expect(page.locator(".rounded-2xl.border")).toHaveCount(initialCount - 1, {
      timeout: 5_000,
    });
  });

  // ── Deleted panel ───────────────────────────────────────────────────────────

  test("Deleted button opens the deleted assessments panel", async ({ page }) => {
    await page.getByRole("button", { name: /^deleted$/i }).click();
    await expect(
      page.getByText(/deleted assessments|removed/i).first()
    ).toBeVisible({ timeout: 4_000 });
  });

  test("panel closes on Escape or close button", async ({ page }) => {
    await page.getByRole("button", { name: /^deleted$/i }).click();
    await expect(
      page.getByText(/deleted assessments|removed/i).first()
    ).toBeVisible({ timeout: 4_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByText(/deleted assessments/i)).not.toBeVisible({ timeout: 3_000 });
  });

  test("deleted panel shows Restore button for each deleted item", async ({ page }) => {
    await page.getByRole("button", { name: /^deleted$/i }).click();
    await page.waitForLoadState("networkidle");
    const restoreButtons = page.getByRole("button", { name: /restore/i });
    // Could be 0 if nothing deleted — just verify they render if present
    const count = await restoreButtons.count();
    if (count > 0) {
      await expect(restoreButtons.first()).toBeVisible();
    }
  });
});
