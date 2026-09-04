import { latLngToCell, cellToBoundary } from "h3-js";

/** H3 resolutions the map renders, chosen from the current zoom level. */
export const H3_RESOLUTIONS = [7, 8, 9, 10, 11] as const;
export type H3Resolution = (typeof H3_RESOLUTIONS)[number];

/** `[h3CellId, count]` as returned by the hexbins API. */
export type HexCount = [cell: string, count: number];

export type H3Cells = {
  h3_r7: string | null;
  h3_r8: string | null;
  h3_r9: string | null;
  h3_r10: string | null;
  h3_r11: string | null;
};

// Mapbox zoom levels: 0 (furthest) to 22 (closest)
// H3 resolutions: 0 (largest) to 15 (smallest)
export function getResolutionFromZoom(zoom: number): H3Resolution {
  if (zoom < 9) return 7;
  if (zoom < 11) return 8;
  if (zoom < 13) return 9;
  if (zoom < 15) return 10;
  return 11;
}

/**
 * H3 cell ids for a point at every rendered resolution. Stored on each
 * service request at write time so hexbin counts are a GROUP BY in Postgres.
 */
export function h3CellsForPoint(
  lat: number | null | undefined,
  lng: number | null | undefined,
): H3Cells {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      h3_r7: null,
      h3_r8: null,
      h3_r9: null,
      h3_r10: null,
      h3_r11: null,
    };
  }
  return {
    h3_r7: latLngToCell(lat, lng, 7),
    h3_r8: latLngToCell(lat, lng, 8),
    h3_r9: latLngToCell(lat, lng, 9),
    h3_r10: latLngToCell(lat, lng, 10),
    h3_r11: latLngToCell(lat, lng, 11),
  };
}

export type HexProperties = { count: number; hexId: string };

/**
 * Turns per-cell counts (aggregated in Postgres) into a GeoJSON layer.
 *
 * One polygon per cell the API returned, so the layer holds exactly the data
 * that exists and nothing else: no synthetic city-wide grid to generate, and
 * no dependence on the viewport, so panning and zooming never rebuild it.
 */
export function hexCountsToFeatures(
  counts: HexCount[],
): GeoJSON.FeatureCollection<GeoJSON.Polygon, HexProperties> {
  const features: GeoJSON.Feature<GeoJSON.Polygon, HexProperties>[] =
    counts.map(([hexId, count]) => ({
      type: "Feature",
      properties: { count, hexId },
      geometry: {
        type: "Polygon",
        coordinates: [cellToBoundary(hexId, true)],
      },
    }));

  return {
    type: "FeatureCollection",
    features,
  };
}
