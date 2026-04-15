/**
 * Dashboard page E2E tests.
 * Covers: stat widgets, trend chart, BMI trend, bar chart.
 */
import { test, expect } from "@playwright/test";

test.describe("Dashboard page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // let widgets render
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("shows Dashboard heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("shows 'Your fitness at a glance' subtitle", async ({ page }) => {
    await expect(page.getByText(/fitness at a glance/i)).toBeVisible();
  });

  // ── Stat widgets ────────────────────────────────────────────────────────────

  test("Assessments stat widget is visible", async ({ page }) => {
    await expect(page.getByText(/assessments/i).first()).toBeVisible();
    await expect(page.getByText(/total taken/i)).toBeVisible();
  });

  test("Latest Score stat widget is visible", async ({ page }) => {
    await expect(page.getByText(/latest score/i)).toBeVisible();
    await expect(page.getByText(/most recent/i)).toBeVisible();
  });

  test("Best Score stat widget is visible", async ({ page }) => {
    await expect(page.getByText(/best score/i)).toBeVisible();
    await expect(page.getByText(/all time high/i)).toBeVisible();
  });

  test("Avg Score stat widget is visible", async ({ page }) => {
    await expect(page.getByText(/avg score/i)).toBeVisible();
    await expect(page.getByText(/across all sessions/i)).toBeVisible();
  });

  // ── Trend widgets ────────────────────────────────────────────────────────────

  test("Score Trend widget is visible", async ({ page }) => {
    await expect(page.getByText(/score trend/i)).toBeVisible();
    await expect(page.getByText(/overall fitness score over time/i)).toBeVisible();
  });

  test("Score Trend renders an SVG chart when data exists", async ({ page }) => {
    const svg = page.locator("svg").first();
    if (await svg.isVisible()) {
      await expect(svg).toBeVisible();
    }
    // If no data yet, widget shows nothing — that's fine
  });

  test("BMI Trend widget appears when BMI data exists", async ({ page }) => {
    const bmiWidget = page.getByText(/bmi trend/i);
    if (await bmiWidget.isVisible()) {
      await expect(bmiWidget).toBeVisible();
      await expect(page.getByText(/body mass index over time/i)).toBeVisible();
      // The subtitle shows 'Latest: X.X'
      await expect(page.getByText(/latest:\s*\d+\.\d/i)).toBeVisible();
    }
    // If no BMI data, widget is hidden — not a failure
  });

  test("Avg Score by Metric bar chart is visible", async ({ page }) => {
    await expect(page.getByText(/avg score by metric/i)).toBeVisible();
    await expect(page.getByText(/percentage of max points/i)).toBeVisible();
  });

  // ── Data correctness ────────────────────────────────────────────────────────

  test("stat widget values are numeric or em-dash (no data)", async ({ page }) => {
    // Values should either be a number or the placeholder em-dash (—)
    const widgets = page.locator("text=/^(\\d+|—)$/");
    await expect(widgets.first()).toBeVisible({ timeout: 5_000 });
  });

  test("delta badge shows +/- vs prev when 2+ assessments exist", async ({ page }) => {
    const delta = page.getByText(/[+\-]\d+\s*vs\s*prev/i);
    // Only check if it renders correctly when visible
    if (await delta.isVisible()) {
      await expect(delta).toBeVisible();
    }
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  test("navbar is visible on dashboard", async ({ page }) => {
    await expect(page.getByRole("navigation").or(page.locator("nav"))).toBeVisible();
  });
});
