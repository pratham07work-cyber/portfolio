import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 3,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      testIgnore: "**/layout.spec.js",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "reduced-motion",
      testIgnore: "**/layout.spec.js",
      use: { viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" },
    },
  ],
  webServer: [
    {
      command: "node scripts/serve.mjs",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
    },
    {
      command:
        "node scripts/build.mjs --base /portfolio/ --out-dir dist/subpath && node scripts/serve.mjs --port 4174 --dir dist/subpath --base /portfolio/",
      url: "http://127.0.0.1:4174/portfolio/",
      reuseExistingServer: false,
    },
  ],
});
