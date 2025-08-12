import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Mapbox API calls to avoid external dependencies
    await page.route("**/mapbox-gl.js", (route) => route.abort());
    await page.route("**/mapbox-gl.css", (route) => route.abort());
    await page.route("**/styles/**", (route) => route.abort());
    await page.route("**/tiles/**", (route) => route.abort());

    // Mock the Mapbox access token validation
    await page.route("**/mapbox.com/**", (route) => {
      route.fulfill({ status: 200, body: "{}" });
    });
  });

  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/sfdata\.app/);

    // Wait for the loading to complete (loading overlay disappears)
    await page.waitForSelector("text=Loading data...", { state: "hidden" });

    // // Verify the main map container is present using test ID
    await expect(page.getByTestId("map")).toBeVisible();

    // Check that the "Data updated" badge is visible
    await expect(page.getByText(/Data updated/)).toBeVisible();
  });

  test("should show query filter selector", async ({ page }) => {
    await page.goto("/");

    // Wait for the loading to complete
    await page.waitForSelector("text=Loading data...", { state: "hidden" });

    // Verify the query filter is present using explicit test ID
    await expect(page.getByTestId("query-filter-selector")).toBeVisible();
  });

  test("should show date range picker", async ({ page }) => {
    await page.goto("/");

    // Wait for the loading to complete
    await page.waitForSelector("text=Loading data...", { state: "hidden" });

    // Verify the date picker is present (look for the date button)
    await expect(page.getByTestId("date-range-picker")).toBeVisible();
  });

  test("should show mode toggle buttons", async ({ page }) => {
    await page.goto("/");

    // Wait for the loading to complete
    await page.waitForSelector("text=Loading data...", { state: "hidden" });

    // Verify mode toggle buttons are present (they're in the top controls)
    await expect(page.getByTestId("mode-toggle-buttons")).toBeVisible();
  });
});
