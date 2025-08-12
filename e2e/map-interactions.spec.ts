import { test, expect } from "@playwright/test";

test.describe("Map Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Mapbox API calls to avoid external dependencies
    await page.route("**/mapbox-gl.js", (route) => route.abort());
    await page.route("**/mapbox-gl.css", (route) => route.abort());
    await page.route("**/styles/**", (route) => route.abort());
    await page.route("**/tiles/**", (route) => route.abort());

    // Mock Mapbox access token validation
    await page.route("**/mapbox.com/**", (route) => {
      route.fulfill({ status: 200, body: "{}" });
    });
  });

  test("should load map with controls", async ({ page }) => {
    await page.goto("/");

    // Wait for the loading to complete
    await page.waitForSelector("text=Loading data...", { state: "hidden" });

    // Verify the map is visible
    await expect(page.getByTestId("map")).toBeVisible();

    // Verify there are controls visible (buttons, selects, etc.)
    await expect(page.getByTestId("mode-toggle-buttons")).toBeVisible();
    await expect(page.getByTestId("query-filter-selector")).toBeVisible();
  });
});
