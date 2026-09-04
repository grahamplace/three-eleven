import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getPoints } from "@/app/api/points/route";
import { GET as getHexbins } from "@/app/api/hexbins/route";
import {
  findPoints,
  findPointsByQueryId,
  countByH3Cell,
} from "@/store/service-request";

// Pass-through: the cache wrapper is Next infrastructure, not what's under test.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/store/service-request", () => ({
  findPoints: vi.fn(),
  findPointsByQueryId: vi.fn(),
  countByH3Cell: vi.fn(),
}));

const req = (path: string) => new NextRequest(`http://localhost${path}`);

describe("GET /api/points", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns compact, rounded tuples with cache headers", async () => {
    vi.mocked(findPoints).mockResolvedValue([
      { service_request_id: "a", lat: 37.77491234, long: -122.41941234 },
      { service_request_id: "b", lat: null, long: null },
    ]);

    const res = await getPoints(
      req("/api/points?start=2024-01-01&end=2024-01-31"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
    expect(await res.json()).toEqual({ points: [["a", -122.41941, 37.77491]] });
    expect(findPoints).toHaveBeenCalledWith("2024-01-01", "2024-01-31");
  });

  it("routes a predefined query to the tag-based lookup", async () => {
    vi.mocked(findPointsByQueryId).mockResolvedValue([]);

    const res = await getPoints(
      req("/api/points?start=2024-01-01&end=2024-01-31&query=graffiti"),
    );

    expect(res.status).toBe(200);
    expect(findPointsByQueryId).toHaveBeenCalledWith(
      "graffiti",
      "2024-01-01",
      "2024-01-31",
    );
    expect(findPoints).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid params without touching the store", async () => {
    const res = await getPoints(req("/api/points?start=bad&end=2024-01-31"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(findPoints).not.toHaveBeenCalled();
  });
});

describe("GET /api/hexbins", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns per-cell counts for the requested resolution", async () => {
    vi.mocked(countByH3Cell).mockResolvedValue([["8928308280fffff", 12]]);

    const res = await getHexbins(
      req("/api/hexbins?start=2024-01-01&end=2024-01-31&res=9"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resolution: 9,
      cells: [["8928308280fffff", 12]],
    });
    expect(countByH3Cell).toHaveBeenCalledWith(
      9,
      "2024-01-01",
      "2024-01-31",
      "",
    );
  });

  it("passes a predefined query through as its own rollup series", async () => {
    vi.mocked(countByH3Cell).mockResolvedValue([]);

    await getHexbins(
      req("/api/hexbins?start=2024-01-01&end=2024-01-31&res=10&query=poop"),
    );

    expect(countByH3Cell).toHaveBeenCalledWith(
      10,
      "2024-01-01",
      "2024-01-31",
      "poop",
    );
  });

  it("returns 400 for an unsupported resolution", async () => {
    const res = await getHexbins(
      req("/api/hexbins?start=2024-01-01&end=2024-01-31&res=3"),
    );

    expect(res.status).toBe(400);
    expect(countByH3Cell).not.toHaveBeenCalled();
  });
});
