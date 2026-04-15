/**
 * Auth Setup — runs once before all test projects.
 * Logs in as both user and admin, saves storage state so tests
 * start pre-authenticated without repeating the login flow.
 *
 * Requires .env.test:
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const USER_FILE  = path.join(__dirname, ".auth/user.json");
const ADMIN_FILE = path.join(__dirname, ".auth/admin.json");

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait until we've left the /login page
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

setup("authenticate as regular user", async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL!;
  const password = process.env.E2E_USER_PASSWORD!;
  if (!email || !password) throw new Error("Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
  await loginAs(page, email, password);
  await page.context().storageState({ path: USER_FILE });
});

setup("authenticate as admin user", async ({ page }) => {
  const email    = process.env.E2E_ADMIN_EMAIL!;
  const password = process.env.E2E_ADMIN_PASSWORD!;
  if (!email || !password) throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  await loginAs(page, email, password);
  await page.context().storageState({ path: ADMIN_FILE });
});
