import { describe, it, expect, beforeEach } from "vitest";
import { mockCoordinates } from "@/lib/mock";

describe("mock", () => {
  describe("mockCoordinates", () => {
    it("generates the expected number of points", () => {
      expect(mockCoordinates).toHaveLength(1000);
    });

    it("generates points with correct structure", () => {
      mockCoordinates.forEach((point) => {
        expect(point).toHaveProperty("latitude");
        expect(point).toHaveProperty("longitude");
        expect(point).toHaveProperty("weight");
      });
    });

    it("generates points with valid latitude values", () => {
      mockCoordinates.forEach((point) => {
        expect(typeof point.latitude).toBe("number");
        expect(point.latitude).toBeGreaterThanOrEqual(37.708075);
        expect(point.latitude).toBeLessThanOrEqual(37.811749);
      });
    });

    it("generates points with valid longitude values", () => {
      mockCoordinates.forEach((point) => {
        expect(typeof point.longitude).toBe("number");
        expect(point.longitude).toBeGreaterThanOrEqual(-122.513272);
        expect(point.longitude).toBeLessThanOrEqual(-122.346582);
      });
    });

    it("generates points with valid weight values", () => {
      mockCoordinates.forEach((point) => {
        expect(typeof point.weight).toBe("number");
        expect(point.weight).toBeGreaterThanOrEqual(1);
        expect(point.weight).toBeLessThanOrEqual(10);
        expect(Number.isInteger(point.weight)).toBe(true);
      });
    });

    it("generates points within San Francisco boundaries", () => {
      const SF_BOUNDS = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      mockCoordinates.forEach((point) => {
        expect(point.latitude).toBeGreaterThanOrEqual(SF_BOUNDS.south);
        expect(point.latitude).toBeLessThanOrEqual(SF_BOUNDS.north);
        expect(point.longitude).toBeGreaterThanOrEqual(SF_BOUNDS.west);
        expect(point.longitude).toBeLessThanOrEqual(SF_BOUNDS.east);
      });
    });

    it("generates unique points (no exact duplicates)", () => {
      const uniquePoints = new Set(
        mockCoordinates.map((point) => `${point.latitude},${point.longitude}`)
      );

      // Allow for some floating point precision issues, but should be mostly unique
      expect(uniquePoints.size).toBeGreaterThan(mockCoordinates.length * 0.95);
    });

    it("has reasonable distribution of weights", () => {
      const weights = mockCoordinates.map((point) => point.weight);
      const uniqueWeights = new Set(weights);

      // Should have weights from 1 to 10
      expect(Math.min(...weights)).toBe(1);
      expect(Math.max(...weights)).toBe(10);
      expect(uniqueWeights.size).toBe(10);
    });

    it("generates points that could represent realistic service request locations", () => {
      // Check that some points are clustered around popular areas
      const financialDistrictPoints = mockCoordinates.filter(
        (point) =>
          Math.abs(point.latitude - 37.789) < 0.01 &&
          Math.abs(point.longitude - -122.401) < 0.01
      );

      const missionDistrictPoints = mockCoordinates.filter(
        (point) =>
          Math.abs(point.latitude - 37.761) < 0.01 &&
          Math.abs(point.longitude - -122.435) < 0.01
      );

      // Should have some clustering around popular areas
      expect(financialDistrictPoints.length).toBeGreaterThan(0);
      expect(missionDistrictPoints.length).toBeGreaterThan(0);
    });
  });
});
