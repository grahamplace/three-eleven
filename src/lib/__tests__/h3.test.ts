import { describe, it, expect } from "vitest";
import { binPointsToHexagons } from "@/lib/h3";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";

describe("h3", () => {
  describe("binPointsToHexagons", () => {
    it("bins points to hexagons with correct zoom resolution mapping", () => {
      const points: ServiceRequestDTOThin[] = [
        {
          serviceRequestId: "test-1",
          latitude: 37.7749,
          longitude: -122.4194,
          weight: 1,
        },
        {
          serviceRequestId: "test-2",
          latitude: 37.7897,
          longitude: -122.3981,
          weight: 1,
        },
      ];

      const mapBounds = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      const result = binPointsToHexagons(points, mapBounds, 11);

      expect(result.type).toBe("FeatureCollection");
      expect(result.features).toBeInstanceOf(Array);
      expect(result.features.length).toBeGreaterThan(0);
    });

    it("ignores points with null coordinates", () => {
      const points: ServiceRequestDTOThin[] = [
        {
          serviceRequestId: "test-1",
          latitude: null,
          longitude: null,
          weight: 1,
        },
        {
          serviceRequestId: "test-2",
          latitude: 37.7749,
          longitude: -122.4194,
          weight: 1,
        },
      ];

      const mapBounds = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      const result = binPointsToHexagons(points, mapBounds, 11);

      // Should only count the point with valid coordinates
      const totalCount = result.features.reduce(
        (sum, feature) => sum + (feature.properties?.count || 0),
        0
      );
      expect(totalCount).toBe(1);
    });

    it("returns correct feature schema", () => {
      const points: ServiceRequestDTOThin[] = [
        {
          serviceRequestId: "test-1",
          latitude: 37.7749,
          longitude: -122.4194,
          weight: 1,
        },
      ];

      const mapBounds = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      const result = binPointsToHexagons(points, mapBounds, 11);

      expect(result.features[0]).toHaveProperty("type", "Feature");
      expect(result.features[0]).toHaveProperty("properties.count");
      expect(result.features[0]).toHaveProperty("properties.hexId");
      expect(result.features[0]).toHaveProperty("geometry.type", "Polygon");
      expect(result.features[0]).toHaveProperty("geometry.coordinates");
    });

    it("handles different zoom levels", () => {
      const points: ServiceRequestDTOThin[] = [
        {
          serviceRequestId: "test-1",
          latitude: 37.7749,
          longitude: -122.4194,
          weight: 1,
        },
      ];

      const mapBounds = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      const resultLowZoom = binPointsToHexagons(points, mapBounds, 8);
      const resultHighZoom = binPointsToHexagons(points, mapBounds, 12);

      // Higher zoom should result in more hexagons (smaller hexagons)
      expect(resultHighZoom.features.length).toBeGreaterThanOrEqual(
        resultLowZoom.features.length
      );
    });

    it("filters hexagons to map bounds", () => {
      const points: ServiceRequestDTOThin[] = [
        {
          serviceRequestId: "test-1",
          latitude: 37.7749,
          longitude: -122.4194,
          weight: 1,
        },
      ];

      const mapBounds = {
        north: 37.811749,
        south: 37.708075,
        east: -122.346582,
        west: -122.513272,
      };

      const result = binPointsToHexagons(points, mapBounds, 11);

      // All hexagons should be within SF bounds (with some tolerance for floating point precision)
      result.features.forEach((feature) => {
        const coordinates = feature.geometry.coordinates[0];
        coordinates.forEach((coord: number[]) => {
          const [lng, lat] = coord;
          expect(lat).toBeGreaterThanOrEqual(37.708075 - 0.01);
          expect(lat).toBeLessThanOrEqual(37.811749 + 0.01);
          expect(lng).toBeGreaterThanOrEqual(-122.513272 - 0.01);
          expect(lng).toBeLessThanOrEqual(-122.346582 + 0.01);
        });
      });
    });
  });
});
