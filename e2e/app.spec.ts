import { test, expect, type Page, type Request } from "@playwright/test";
import { format, subDays } from "date-fns";

/**
 * End-to-end flows against a real Next server and database (see the e2e job
 * in .github/workflows/ci.yaml). Map data routes are mocked at the network
 * layer so the tests are deterministic and independent of what is ingested;
 * the detail panel test reads a row seeded by `npm run seed-db`.
 *
 * Mapbox itself needs WebGL and a network token, so its requests are stubbed
 * and nothing here asserts on rendered tiles.
 */

const POINTS = { points: [["e2e-1", -122.4194, 37.7749]] };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function stubNetwork(page: Page) {
  const apiRequests: URL[] = [];

  await page.route("**/api.mapbox.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.route("**/events.mapbox.com/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.route("**/api/points**", (route) => {
    apiRequests.push(new URL(route.request().url()));
    return route.fulfill({ json: POINTS });
  });
  await page.route("**/api/hexbins**", (route) => {
    const url = new URL(route.request().url());
    apiRequests.push(url);
    return route.fulfill({
      json: { resolution: Number(url.searchParams.get("res")), cells: [] },
    });
  });

  const lastRequest = (path: string) =>
    apiRequests.filter((u) => u.pathname === path).at(-1);
  const waitForApi = (
    path: string,
    predicate: (u: URL) => boolean = () => true,
  ) =>
    page.waitForRequest((req: Request) => {
      const u = new URL(req.url());
      return u.pathname === path && predicate(u);
    });

  return { apiRequests, lastRequest, waitForApi };
}

const loaded = (page: Page) =>
  expect(page.getByText("Loading data...")).toBeHidden();

test.describe("map", () => {
  test("loads points for the default 7-day range with no query", async ({
    page,
  }) => {
    const net = await stubNetwork(page);

    await page.goto("/");
    await loaded(page);

    const req = net.lastRequest("/api/points");
    expect(req).toBeDefined();
    expect(req!.searchParams.get("start")).toMatch(DATE);
    expect(req!.searchParams.get("end")).toBe(
      format(subDays(new Date(), 1), "yyyy-MM-dd"),
    );
    expect(req!.searchParams.has("query")).toBe(false);
    expect(net.lastRequest("/api/hexbins")).toBeUndefined();
    await expect(page.getByText(/Data updated:/)).toBeVisible();
  });

  test("selecting a query filter updates the URL and refetches", async ({
    page,
  }) => {
    const net = await stubNetwork(page);
    await page.goto("/");
    await loaded(page);

    const refetch = net.waitForApi(
      "/api/points",
      (u) => u.searchParams.get("query") === "graffiti",
    );
    await page.getByTestId("query-filter-selector").click();
    await page.getByRole("option", { name: "Graffiti" }).click();
    await refetch;

    await expect(page).toHaveURL(/[?&]query=graffiti(&|$)/);
    await expect(page.getByTestId("query-filter-selector")).toHaveText(
      "Graffiti",
    );
  });

  test("switching to hexabin mode requests server-side bins", async ({
    page,
  }) => {
    const net = await stubNetwork(page);
    await page.goto("/");
    await loaded(page);

    const hexbins = net.waitForApi("/api/hexbins");
    await page.getByRole("button", { name: "Toggle map mode" }).click();
    // click, not check(): choosing a mode closes the menu, so the radio is
    // gone before check() could verify its state.
    await page.getByLabel("Hexabin").click();
    const req = new URL((await hexbins).url());

    await expect(page).toHaveURL(/[?&]mode=hexabin(&|$)/);
    // Initial zoom 11.5 maps to H3 resolution 9.
    expect(req.searchParams.get("res")).toBe("9");
    expect(req.searchParams.get("start")).toMatch(DATE);
  });

  test("a date preset updates the URL and refetches that range", async ({
    page,
  }) => {
    const net = await stubNetwork(page);
    await page.goto("/");
    await loaded(page);

    const yesterday = subDays(new Date(), 1);
    const expectedStart = format(subDays(yesterday, 30), "yyyy-MM-dd");
    const expectedEnd = format(yesterday, "yyyy-MM-dd");

    const refetch = net.waitForApi(
      "/api/points",
      (u) => u.searchParams.get("start") === expectedStart,
    );
    await page
      .getByTestId("date-range-picker")
      .getByRole("button")
      .first()
      .click();
    await page.getByRole("button", { name: "T30", exact: true }).click();
    const req = new URL((await refetch).url());

    expect(req.searchParams.get("end")).toBe(expectedEnd);
    await expect(page).toHaveURL(new RegExp(`start=${expectedStart}`));
    await expect(page).toHaveURL(new RegExp(`end=${expectedEnd}`));
  });

  test("URL state is applied on first load", async ({ page }) => {
    const net = await stubNetwork(page);

    await page.goto(
      "/?start=2024-03-01&end=2024-03-31&query=graffiti&mode=hexabin",
    );
    await loaded(page);

    // One request, already reflecting the URL: no default-then-refetch.
    expect(net.apiRequests.map((u) => u.pathname)).toEqual(["/api/hexbins"]);
    const req = net.apiRequests[0];
    expect(req.searchParams.get("start")).toBe("2024-03-01");
    expect(req.searchParams.get("end")).toBe("2024-03-31");
    expect(req.searchParams.get("query")).toBe("graffiti");
    await expect(page.getByTestId("date-range-picker")).toContainText(
      "Mar 01, 2024 - Mar 31, 2024",
    );
  });

  test("a deep link to a request opens its detail panel from the database", async ({
    page,
  }) => {
    await stubNetwork(page);

    // Seeded by `npm run seed-db`.
    await page.goto("/?id=3827464&start=2024-03-01&end=2024-03-31");
    await loaded(page);

    await expect(
      page.getByRole("heading", { name: "Request 3827464" }),
    ).toBeVisible();
    await expect(page.getByText("Graffiti", { exact: true })).toBeVisible();
    await expect(page.getByText("123 Main St")).toBeVisible();
    // Requested 2024-03-15T10:30Z, rendered in San Francisco time. (\s also
    // matches the narrow no-break space newer ICU puts before AM/PM.)
    // Requested and Last Updated share this timestamp in the seed row.
    await expect(
      page.getByText(/3\/15\/2024, 3:30:00\sAM/).first(),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "Request 3827464" }),
    ).toBeHidden();
    await expect(page).not.toHaveURL(/[?&]id=/);
  });
});
