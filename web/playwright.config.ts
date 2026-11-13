import { defineConfig } from "@playwright/test";
const existingServer = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests", fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: existingServer ?? "http://127.0.0.1:3100", headless: true, viewport: { width: 1440, height: 1080 }, trace: "retain-on-failure" },
  webServer: existingServer ? undefined : { command: "npm run dev -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: !process.env.CI, timeout: 60000 },
});
