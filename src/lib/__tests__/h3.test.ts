import { describe, it, expect } from "vitest";
import { latLngToCell } from "h3-js";
import {
  getResolutionFromZoom,
  h3CellsForPoint,
  hexCountsToFeatures,
  type HexCount,
} from "@/lib/h3";

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
    it("returns one polygon per cell, carrying its count", () => {
      const cell = latLngToCell(CITY_CENTER.lat, CITY_CENTER.lng, 9);
      const counts: HexCount[] = [[cell, 42]];

      const result = hexCountsToFeatures(counts);

      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties).toEqual({ count: 42, hexId: cell });
      // A closed hexagon ring: 6 corners plus the repeated first point.
      expect(result.features[0].geometry.coordinates[0]).toHaveLength(7);
    });

    it("draws every cell the API returns, at any resolution", () => {
      // The old seed-point grid missed most of the city at r10/r11, so counts
      // outside it were silently dropped.
      const cells: HexCount[] = [
        latLngToCell(37.7079, -122.4762, 11), // south-west corner
        latLngToCell(37.8102, -122.3673, 11), // north-east waterfront
        latLngToCell(CITY_CENTER.lat, CITY_CENTER.lng, 11),
      ].map((cell, i) => [cell, i + 1]);

      const result = hexCountsToFeatures(cells);

      expect(result.features.map((f) => f.properties.hexId)).toEqual(
        cells.map(([cell]) => cell),
      );
    });

    it("returns an empty collection when there are no counts", () => {
      const result = hexCountsToFeatures([]);

      expect(result.type).toBe("FeatureCollection");
      expect(result.features).toEqual([]);
    });
  });
});
