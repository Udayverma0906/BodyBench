import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Required env vars (put in .env.test or set in your shell):
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon key
 *   E2E_USER_EMAIL          — test user email (must exist in Supabase)
 *   E2E_USER_PASSWORD       — test user password
 *   E2E_ADMIN_EMAIL         — admin user email
 *   E2E_ADMIN_PASSWORD      — admin user password
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // keep sequential — tests share Supabase state
  timeout: 30_000,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "auth-setup",
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "user-tests",
      testMatch: "**/*.spec.ts",
      dependencies: ["auth-setup"],
      use: {
        storageState: "tests/e2e/.auth/user.json",
      },
    },
    {
      name: "admin-tests",
      testMatch: "**/admin.spec.ts",
      dependencies: ["auth-setup"],
      use: {
        storageState: "tests/e2e/.auth/admin.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
