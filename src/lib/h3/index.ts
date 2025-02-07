import {
  latLngToCell,
  cellToBoundary,
  gridDisk,
  cellToLatLng,
  getResolution,
} from "h3-js";
import * as turf from "@turf/turf";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";

// SF boundary as GeoJSON polygon (simplified for performance)
const SF_LAND_BOUNDARY: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-122.513272, 37.708075],
        [-122.513272, 37.811749],
        [-122.346582, 37.811749],
        [-122.346582, 37.708075],
        [-122.513272, 37.708075],
      ],
    ],
  },
};

// Define neighborhoods or areas to ensure coverage
const SF_SEED_POINTS = [
  { lat: 37.7749, lng: -122.4194 }, // City center
  { lat: 37.789, lng: -122.401 }, // Financial District
  { lat: 37.774, lng: -122.419 }, // Hayes Valley
  { lat: 37.761, lng: -122.435 }, // Mission District
  { lat: 37.779, lng: -122.433 }, // Lower Haight
  { lat: 37.799, lng: -122.407 }, // North Beach
  { lat: 37.786, lng: -122.44 }, // Japantown
  { lat: 37.7759, lng: -122.4733 }, // Inner Sunset
  { lat: 37.8025, lng: -122.4382 }, // Pacific Heights
  { lat: 37.7575, lng: -122.3927 }, // Potrero Hill
];

export type H3BinnedFeature = {
  type: "Feature";
  properties: {
    count: number;
    hexId: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

// Generate a static set of hexagons covering SF
function generateSFHexagonGrid(resolution: number = 9): string[] {
  const hexagons = new Set<string>();

  // Generate hexagons from seed points
  SF_SEED_POINTS.forEach((point) => {
    const centerHex = latLngToCell(point.lat, point.lng, resolution);
    const hexSet = gridDisk(centerHex, 30);
    hexSet.forEach((hex) => hexagons.add(hex));
  });

  // Filter hexagons to only those that intersect with SF land
  return Array.from(hexagons).filter((hexId) => {
    const hexBoundary = cellToBoundary(hexId, true);
    const hexFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [hexBoundary],
      },
    };

    return turf.booleanIntersects(hexFeature, SF_LAND_BOUNDARY);
  });
}

// Memoize the SF hexagon grid since it's static
let sfHexagonGridCache: { resolution: number; hexagons: string[] } | null =
  null;

function getSFHexagonGrid(resolution: number): string[] {
  if (!sfHexagonGridCache || sfHexagonGridCache.resolution !== resolution) {
    sfHexagonGridCache = {
      resolution,
      hexagons: generateSFHexagonGrid(resolution),
    };
  }
  return sfHexagonGridCache.hexagons;
}

export function binPointsToHexagons(
  points: ServiceRequestDTOThin[],
  mapBounds: { north: number; south: number; east: number; west: number },
  resolution: number = 9
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  // Get the static SF hexagon grid
  const allHexagons = getSFHexagonGrid(resolution);

  // Create a map bounds polygon for intersection testing
  const mapBoundsPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [mapBounds.west, mapBounds.north],
          [mapBounds.east, mapBounds.north],
          [mapBounds.east, mapBounds.south],
          [mapBounds.west, mapBounds.south],
          [mapBounds.west, mapBounds.north],
        ],
      ],
    },
  };

  // Filter hexagons to only those within map bounds
  const visibleHexagons = allHexagons.filter((hexId) => {
    const hexBoundary = cellToBoundary(hexId, true);
    const hexFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [hexBoundary],
      },
    };
    return turf.booleanIntersects(hexFeature, mapBoundsPolygon);
  });

  // Create a map to store point counts per hexagon
  const hexagonCounts = new Map<string, number>();

  // Initialize visible hexagons with 0 count
  visibleHexagons.forEach((hexId) => {
    hexagonCounts.set(hexId, 0);
  });

  // Count points in hexagons
  points.forEach((point) => {
    if (point.latitude && point.longitude) {
      const hexId = latLngToCell(point.latitude, point.longitude, resolution);
      if (hexagonCounts.has(hexId)) {
        hexagonCounts.set(hexId, (hexagonCounts.get(hexId) || 0) + 1);
      }
    }
  });

  // Convert all hexagons to GeoJSON features
  const features: H3BinnedFeature[] = Array.from(hexagonCounts.entries()).map(
    ([hexId, count]) => {
      const coordinates = cellToBoundary(hexId, true);
      return {
        type: "Feature",
        properties: {
          count,
          hexId,
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      };
    }
  );

  return {
    type: "FeatureCollection",
    features,
  };
}
