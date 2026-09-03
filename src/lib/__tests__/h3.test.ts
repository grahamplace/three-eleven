import { describe, it, expect } from "vitest";
import { latLngToCell } from "h3-js";
import {
  getResolutionFromZoom,
  h3CellsForPoint,
  hexCountsToFeatures,
  type HexCount,
} from "@/lib/h3";

const SF_BOUNDS = {
  north: 37.811749,
  south: 37.708075,
  east: -122.346582,
  west: -122.513272,
};

const CITY_CENTER = { lat: 37.7749, lng: -122.4194 };

describe("h3", () => {
  describe("getResolutionFromZoom", () => {
    it("maps zoom bands to resolutions 7 through 11", () => {
      expect(getResolutionFromZoom(8)).toBe(7);
      expect(getResolutionFromZoom(9)).toBe(8);
      expect(getResolutionFromZoom(11.5)).toBe(9);
      expect(getResolutionFromZoom(13)).toBe(10);
      expect(getResolutionFromZoom(16)).toBe(11);
    });
  });

  describe("h3CellsForPoint", () => {
    it("returns a cell at every rendered resolution", () => {
      const cells = h3CellsForPoint(CITY_CENTER.lat, CITY_CENTER.lng);

      expect(cells.h3_r7).toBe(
        latLngToCell(CITY_CENTER.lat, CITY_CENTER.lng, 7),
      );
      expect(cells.h3_r11).toBe(
        latLngToCell(CITY_CENTER.lat, CITY_CENTER.lng, 11),
      );
      expect(Object.values(cells).every((c) => typeof c === "string")).toBe(
        true,
      );
    });

    it("returns all nulls for a point without coordinates", () => {
      expect(h3CellsForPoint(null, null)).toEqual({
        h3_r7: null,
        h3_r8: null,
        h3_r9: null,
        h3_r10: null,
        h3_r11: null,
      });
      expect(h3CellsForPoint(37.7, undefined).h3_r9).toBeNull();
      expect(h3CellsForPoint(NaN, -122.4).h3_r9).toBeNull();
    });
  });

  describe("hexCountsToFeatures", () => {
    it("places server-side counts on the matching visible hexes", () => {
      const cell = latLngToCell(CITY_CENTER.lat, CITY_CENTER.lng, 9);
      const counts: HexCount[] = [[cell, 42]];

      const result = hexCountsToFeatures(counts, SF_BOUNDS, 9);

      const hit = result.features.find((f) => f.properties?.hexId === cell);
      expect(result.type).toBe("FeatureCollection");
      expect(hit?.properties?.count).toBe(42);
    });

    it("includes visible hexes with no requests as zero-count features", () => {
      const result = hexCountsToFeatures([], SF_BOUNDS, 9);

      expect(result.features.length).toBeGreaterThan(0);
      expect(result.features.every((f) => f.properties?.count === 0)).toBe(
        true,
      );
    });

    it("ignores counts for cells outside the SF grid", () => {
      const oakland = latLngToCell(37.8044, -122.2712, 9);

      const result = hexCountsToFeatures([[oakland, 99]], SF_BOUNDS, 9);

      expect(result.features.some((f) => f.properties?.hexId === oakland)).toBe(
        false,
      );
    });

    it("returns correct feature schema", () => {
      const result = hexCountsToFeatures([], SF_BOUNDS, 9);

      expect(result.features[0]).toHaveProperty("type", "Feature");
      expect(result.features[0]).toHaveProperty("properties.count");
      expect(result.features[0]).toHaveProperty("properties.hexId");
      expect(result.features[0]).toHaveProperty("geometry.type", "Polygon");
      expect(result.features[0]).toHaveProperty("geometry.coordinates");
    });

    it("produces more, smaller hexes at finer resolutions", () => {
      const coarse = hexCountsToFeatures([], SF_BOUNDS, 7);
      const fine = hexCountsToFeatures([], SF_BOUNDS, 9);

      expect(fine.features.length).toBeGreaterThan(coarse.features.length);
    });

    it("only returns hexes that intersect the viewport", () => {
      const tinyBounds = {
        north: CITY_CENTER.lat + 0.001,
        south: CITY_CENTER.lat - 0.001,
        east: CITY_CENTER.lng + 0.001,
        west: CITY_CENTER.lng - 0.001,
      };

      const all = hexCountsToFeatures([], SF_BOUNDS, 9);
      const few = hexCountsToFeatures([], tinyBounds, 9);

      expect(few.features.length).toBeGreaterThan(0);
      expect(few.features.length).toBeLessThan(all.features.length / 10);
    });
  });
});
