/**
 * Assessment flow E2E tests.
 * Covers: form rendering, validation, submission, result page, BMI card.
 */
import { test, expect } from "@playwright/test";

test.describe("Assessment page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assessment");
    await expect(page).toHaveURL("/assessment");
  });

  // ── Form rendering ──────────────────────────────────────────────────────────

  test("shows at least one input field", async ({ page }) => {
    const inputs = page.getByRole("spinbutton"); // type=number inputs
    await expect(inputs.first()).toBeVisible({ timeout: 8_000 });
  });

  test("renders section headings (Body Stats / Strength / Core)", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // At least one section header should be visible
    const headings = page.locator("h2, h3, p").filter({ hasText: /body stats|strength|endurance|core/i });
    await expect(headings.first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  test("submit with empty form shows validation error", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    // Some error text should appear
    await expect(
      page.getByText(/fill in|at least one|required|exercise/i).first()
    ).toBeVisible({ timeout: 4_000 });
  });

  test("negative value shows validation error", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const pushupField = page.getByPlaceholder(/e\.g\. 20|push/i).first();
    if (await pushupField.isVisible()) {
      await pushupField.fill("-5");
      await pushupField.blur();
      await expect(
        page.getByText(/negative|invalid|minimum|≥ 0/i).first()
      ).toBeVisible({ timeout: 3_000 });
    }
  });

  // ── Successful submission ───────────────────────────────────────────────────

  test("fills required fields and navigates to result page", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Fill whatever push-up field is present
    const pushupInput = page
      .getByRole("spinbutton")
      .filter({ has: page.locator("..").filter({ hasText: /push/i }) })
      .first();

    // Fallback: fill the first numeric input with a valid value
    const firstInput = page.getByRole("spinbutton").first();
    await firstInput.fill("30");

    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    await expect(page).toHaveURL("/result", { timeout: 10_000 });
  });

  // ── Result page ─────────────────────────────────────────────────────────────

  test("result page shows score and category", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const firstInput = page.getByRole("spinbutton").first();
    await firstInput.fill("30");
    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    await expect(page).toHaveURL("/result", { timeout: 10_000 });

    // Score ring / number visible
    await expect(page.getByText(/fitness score/i)).toBeVisible();

    // Category badge (one of the four levels)
    await expect(
      page.getByText(/excellent|good|average|needs improvement/i).first()
    ).toBeVisible();
  });

  test("result page shows score breakdown section", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("spinbutton").first().fill("30");
    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    await expect(page).toHaveURL("/result", { timeout: 10_000 });
    await expect(page.getByText(/score breakdown/i)).toBeVisible();
  });

  test("BMI card appears when weight and height are provided", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Try to fill weight and height fields
    const weightInput = page.getByPlaceholder(/e\.g\. 70/i).first();
    const heightInput = page.getByPlaceholder(/e\.g\. 175/i).first();
    const pushupInput = page.getByRole("spinbutton").first();

    if (await weightInput.isVisible() && await heightInput.isVisible()) {
      await weightInput.fill("75");
      await heightInput.fill("175");
      await pushupInput.fill("30");
      await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
      await expect(page).toHaveURL("/result", { timeout: 10_000 });
      // BMI card should be visible
      await expect(page.getByText(/body mass index|bmi/i)).toBeVisible();
      // BMI value should be a number
      await expect(page.getByText(/\d+\.\d/)).toBeVisible();
    }
  });

  test("BMI card absent when weight/height not provided", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Only fill an exercise field, skip weight+height
    const inputs = page.getByRole("spinbutton");
    await inputs.first().fill("30");
    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    await expect(page).toHaveURL("/result", { timeout: 10_000 });
    // If weight and height weren't filled, BMI section should not appear
    // (only checks if the weight/height inputs actually exist and were skipped)
    await expect(page.getByText(/body mass index/i)).not.toBeVisible();
  });

  test("Take Assessment Again button goes back to start", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("spinbutton").first().fill("30");
    await page.getByRole("button", { name: /submit|calculate|get score/i }).click();
    await expect(page).toHaveURL("/result", { timeout: 10_000 });
    await page.getByRole("button", { name: /take assessment again|restart/i }).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/); // back to home or assessment
  });
});
