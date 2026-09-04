import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { H3_RESOLUTIONS, type H3Resolution, type HexCount } from "@/lib/h3";
import type {
  HexbinsResponse,
  PointsResponse,
  PointTuple,
} from "@/lib/api/types";
import type { DateRange } from "@/contexts/MapContext";

type Params = {
  dateRange: DateRange;
  selectedQuery: string | null;
  /** Hexbin mode fetches server-side counts instead of points. */
  isHexabin: boolean;
  resolution: H3Resolution;
};

type Hexbins = { resolution: H3Resolution; cells: HexCount[] };

/** Cached payloads, keyed by request URL. */
type Cached = { points: PointTuple[] } | Hexbins;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function buildUrl(
  { dateRange, selectedQuery }: Params,
  resolution?: H3Resolution,
) {
  const params = new URLSearchParams({
    start: dateRange.start,
    end: dateRange.end,
  });
  if (selectedQuery) params.set("query", selectedQuery);
  if (resolution === undefined) return `/api/points?${params}`;
  params.set("res", String(resolution));
  return `/api/hexbins?${params}`;
}

/** The resolutions a zoom step away from the one on screen. */
function neighborResolutions(resolution: H3Resolution): H3Resolution[] {
  const i = H3_RESOLUTIONS.indexOf(resolution);
  return [H3_RESOLUTIONS[i - 1], H3_RESOLUTIONS[i + 1]].filter(
    (r): r is H3Resolution => r !== undefined,
  );
}

/**
 * Loads the map payload from /api/points or /api/hexbins.
 *
 * Points and heatmap share one payload for every zoom level, so the request
 * URL — not the zoom — drives fetching: zooming in those modes refetches
 * nothing. Only hexbins are per-resolution, and those are cached per URL and
 * prefetched a zoom step out in each direction, so crossing a resolution
 * threshold usually paints from cache.
 *
 * Refetches keep the previous payload on screen (`isRefreshing`) instead of
 * blanking the map; `isLoading` is only true when there is nothing to draw.
 * In-flight requests are aborted when the inputs change.
 */
export function useMapData(params: Params) {
  const { isHexabin, resolution } = params;
  const cache = useRef(new Map<string, Cached>());
  const [points, setPoints] = useState<PointTuple[] | null>(null);
  const [hexbins, setHexbins] = useState<Hexbins | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const url = buildUrl(params, isHexabin ? resolution : undefined);

  useEffect(() => {
    const apply = (data: Cached) => {
      if ("cells" in data) setHexbins(data);
      else setPoints(data.points);
    };

    // Warm the resolutions on either side of this one so the next zoom step
    // paints from cache. Fired after the visible payload is in hand so it
    // never competes with it, and left to finish on unmount — the result is
    // still worth caching.
    const prefetchNeighbors = (current: H3Resolution) => {
      for (const res of neighborResolutions(current)) {
        const neighborUrl = buildUrl(params, res);
        if (cache.current.has(neighborUrl)) continue;
        fetchJson<HexbinsResponse>(neighborUrl)
          .then((data) =>
            cache.current.set(neighborUrl, {
              resolution: data.resolution as H3Resolution,
              cells: data.cells,
            }),
          )
          .catch(() => {});
      }
    };

    const cached = cache.current.get(url);
    if (cached) {
      apply(cached);
      setIsFetching(false);
      if ("cells" in cached) prefetchNeighbors(cached.resolution);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setIsFetching(true);
      try {
        if (isHexabin) {
          const data = await fetchJson<HexbinsResponse>(url, controller.signal);
          const payload: Hexbins = {
            resolution: data.resolution as H3Resolution,
            cells: data.cells,
          };
          cache.current.set(url, payload);
          apply(payload);
          setIsFetching(false);
          prefetchNeighbors(payload.resolution);
        } else {
          const data = await fetchJson<PointsResponse>(url, controller.signal);
          cache.current.set(url, { points: data.points });
          apply({ points: data.points });
          setIsFetching(false);
        }
      } catch {
        if (controller.signal.aborted) return;
        toast.error("Failed to load map data. Please try again.");
        setIsFetching(false);
      }
    };

    run();
    return () => controller.abort();
    // `params` only feeds URL building, and every field it contributes is
    // already baked into `url`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isHexabin]);

  const hasData = isHexabin ? hexbins !== null : points !== null;

  return {
    /** Nothing to draw yet: first load, or a mode switch with no cached data. */
    isLoading: isFetching && !hasData,
    /** Fetching over data that is already on screen. */
    isRefreshing: isFetching && hasData,
    points: points ?? [],
    hexCounts: hexbins?.cells ?? [],
    /** Resolution of the hexes currently held, which lags zoom while fetching. */
    hexResolution: hexbins?.resolution ?? null,
  };
}
