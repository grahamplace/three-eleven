import { latLngToCell, cellToBoundary, gridDisk } from "h3-js";
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
        [-122.47203564756705, 37.70469212743971],
        [-122.39230246489862, 37.70440726123584],
        [-122.3946513351915, 37.70710868568513],
        [-122.39103282082482, 37.70980165522302],
        [-122.3878334396295, 37.70878578764773],
        [-122.38527773099733, 37.71029998490229],
        [-122.37717657746688, 37.708270664979196],
        [-122.37973490572425, 37.71079934398445],
        [-122.37632303288717, 37.71601660900576],
        [-122.38399631610461, 37.72039994096875],
        [-122.37847655278685, 37.72461512913108],
        [-122.37571157903992, 37.72377413445294],
        [-122.37377175766082, 37.71888113173689],
        [-122.37037153649096, 37.719388899159014],
        [-122.36483532495686, 37.71635723477495],
        [-122.36207251948785, 37.720231815523704],
        [-122.3571660085815, 37.728478748626856],
        [-122.36463009803049, 37.73184932772425],
        [-122.37060724489208, 37.73202217859003],
        [-122.37209156863413, 37.73404046244569],
        [-122.37295123991913, 37.73235962512899],
        [-122.37593144350194, 37.732696527684624],
        [-122.37719127847768, 37.735239966540874],
        [-122.37550868470686, 37.737615042369924],
        [-122.3785250659099, 37.7383304431214],
        [-122.37671006642304, 37.74047259811097],
        [-122.3687165082666, 37.74070947576749],
        [-122.3724851806214, 37.74464032878821],
        [-122.37460106093904, 37.74452151220862],
        [-122.37625809801837, 37.74630776551918],
        [-122.38845406548617, 37.74642685055356],
        [-122.39312486587872, 37.74761764388511],
        [-122.39252777926656, 37.74964134294733],
        [-122.39041337956597, 37.748927562380786],
        [-122.37730533908926, 37.74988066418872],
        [-122.3770016847323, 37.751429149557865],
        [-122.38318063377913, 37.752976851194504],
        [-122.38469377560793, 37.75511866981756],
        [-122.3831858277818, 37.75654792814754],
        [-122.38302749601752, 37.761432449606644],
        [-122.3857436942915, 37.76178752133832],
        [-122.38864121950309, 37.787622593514456],
        [-122.40121811696929, 37.80393025058159],
        [-122.40710898203417, 37.807220127516004],
        [-122.41515321652427, 37.80869703419188],
        [-122.42248115772168, 37.807313378695596],
        [-122.46253438124535, 37.80277090962879],
        [-122.4757189348455, 37.80808402484965],
        [-122.48435216063882, 37.789383915070076],
        [-122.48958830511944, 37.786482511294466],
        [-122.49605300913154, 37.78664309681275],
        [-122.50382715719851, 37.78573955032334],
        [-122.50854603785962, 37.78362829918436],
        [-122.51272414208479, 37.7779342797609],
        [-122.50596468850925, 37.729003150165994],
        [-122.50615643749562, 37.722692002670925],
        [-122.50071130629152, 37.703547687811366],
        [-122.47203564756705, 37.70469212743971],
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
  zoom: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  // Convert zoom level to appropriate H3 resolution
  // H3 resolutions: 0 (largest) to 15 (smallest)
  // Mapbox zoom levels: 0 (furthest) to 22 (closest)
  const getResolutionFromZoom = (zoom: number): number => {
    if (zoom < 9) return 7;
    if (zoom < 11) return 8;
    if (zoom < 13) return 9;
    if (zoom < 15) return 10;
    return 11;
  };

  const resolution = getResolutionFromZoom(zoom);

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
