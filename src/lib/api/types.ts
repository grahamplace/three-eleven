import type { HexCount } from "@/lib/h3";

/**
 * Wire types shared by the map API routes and the client.
 *
 * Points are shipped as compact tuples rather than objects: a 1-year window
 * can be hundreds of thousands of rows, and `[id, lng, lat]` is roughly a
 * third the size of `{ serviceRequestId, latitude, longitude, weight }`.
 */
export type PointTuple = [id: string, lng: number, lat: number];

export type PointsResponse = { points: PointTuple[] };

export type HexbinsResponse = { resolution: number; cells: HexCount[] };

export type ApiError = { error: string };

/** Cache tag for every map payload; revalidated after each ingest. */
export const SERVICE_REQUESTS_TAG = "service-requests";

/**
 * Data changes once a day (nightly ingest), so responses can be served from
 * the CDN and the Next data cache. `revalidateTag` after ingest busts both.
 *
 * `max-age` is what the browser gets (Vercel keeps `s-maxage` for itself), and
 * without it the client revalidates every hexbin resolution on every zoom even
 * though the payload cannot have changed.
 */
export const CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
