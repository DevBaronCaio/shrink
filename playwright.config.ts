import { defineConfig, devices } from "@playwright/test";

const database = process.env.TEST_DATABASE_URL;
if (!database || !/_test$/.test(new URL(database).pathname))
  throw new Error(
    "Use um banco descartável terminado em _test para Playwright.",
  );
const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "pnpm start --port 3100" : "pnpm dev --port 3100",
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: database,
      DIRECT_URL: database,
      AUTH_SECRET: "isolated-test-secret-for-playwright-only-32-characters",
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      AUTH_GITHUB_ID: "",
      AUTH_GITHUB_SECRET: "",
      AUTH_GOOGLE_ID: "",
      AUTH_GOOGLE_SECRET: "",
    },
  },
});
