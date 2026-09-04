import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { H3_RESOLUTIONS, type H3Resolution, type HexCount } from "@/lib/h3";
import type {
  HexbinsResponse,
  PointsResponse,
  PointTuple,
} from "@/lib/api/types";
import type { DateRange } from "@/contexts/MapContext";
import { readCachedHexbins, writeCachedHexbins } from "./hexbinCache";

type Params = {
  dateRange: DateRange;
  selectedQuery: string | null;
  /** Hexbin mode fetches server-side counts instead of points. */
  isHexabin: boolean;
  resolution: H3Resolution;
  /** Ingest the data came from; scopes the cross-reload hexbin cache. */
  dataVersion: string;
};

type Hexbins = { resolution: H3Resolution; cells: HexCount[] };

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

/** The other resolutions, nearest zoom step first. */
function otherResolutions(current: H3Resolution): H3Resolution[] {
  return H3_RESOLUTIONS.filter((r) => r !== current).sort(
    (a, b) => Math.abs(a - current) - Math.abs(b - current),
  );
}

/**
 * Loads the map payload from /api/points or /api/hexbins.
 *
 * Points and heatmap share one payload for every zoom level, so the request
 * URL — not the zoom — drives fetching and zooming in those modes fetches
 * nothing.
 *
 * Hexbins are per-resolution, so entering hexabin mode fetches the resolution
 * on screen and then, in the background, every other one: all five levels for
 * a week are ~300KB together, so a zoom step becomes a local lookup instead of
 * a round trip. Payloads are held in memory for the session and in Cache
 * Storage across reloads (see hexbinCache).
 *
 * Refetches keep the previous payload on screen (`isRefreshing`) instead of
 * blanking the map; `isLoading` is only true when there is nothing to draw.
 */
export function useMapData(params: Params) {
  const { dateRange, selectedQuery, isHexabin, resolution, dataVersion } =
    params;

  const memory = useRef(new Map<string, PointTuple[] | Hexbins>());
  const inFlight = useRef(new Map<string, Promise<Hexbins>>());
  const prefetch = useRef<{ key: string; controller: AbortController } | null>(
    null,
  );

  const [points, setPoints] = useState<PointTuple[] | null>(null);
  const [hexbins, setHexbins] = useState<Hexbins | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const url = buildUrl(params, isHexabin ? resolution : undefined);
  // Identifies the whole set of hexbin payloads behind the current filters, so
  // the background prefetch runs once per set rather than once per zoom.
  const prefetchKey = `${dateRange.start}|${dateRange.end}|${selectedQuery ?? ""}`;

  useEffect(() => {
    const controller = new AbortController();

    const fetchHexbins = async (target: string, signal?: AbortSignal) => {
      const response = await fetch(target, { signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      // Stored before the body is read here, so the copy stays intact.
      void writeCachedHexbins(target, dataVersion, response.clone());
      return (await response.json()) as HexbinsResponse;
    };

    /** Memory, then Cache Storage, then the network. */
    const loadHexbins = (target: string, signal?: AbortSignal) => {
      const cached = memory.current.get(target);
      if (cached && !Array.isArray(cached)) return Promise.resolve(cached);

      const pending = inFlight.current.get(target);
      if (pending) return pending;

      const load = (async () => {
        const stored = await readCachedHexbins(target, dataVersion);
        const data = stored ?? (await fetchHexbins(target, signal));
        const payload: Hexbins = {
          resolution: data.resolution as H3Resolution,
          cells: data.cells,
        };
        memory.current.set(target, payload);
        return payload;
      })().finally(() => inFlight.current.delete(target));

      inFlight.current.set(target, load);
      return load;
    };

    // Warm every other resolution once the visible one is on screen, so later
    // zoom steps never touch the network. Sequential: these are background
    // requests and must not compete with whatever the user does next.
    const prefetchOtherResolutions = (current: H3Resolution) => {
      if (prefetch.current?.key === prefetchKey) return;
      prefetch.current?.controller.abort();
      const chain = new AbortController();
      prefetch.current = { key: prefetchKey, controller: chain };

      void (async () => {
        for (const res of otherResolutions(current)) {
          if (chain.signal.aborted) return;
          try {
            await loadHexbins(buildUrl(params, res), chain.signal);
          } catch {
            // A warm-up failure just means that zoom step pays for itself.
          }
        }
      })();
    };

    const run = async () => {
      setIsFetching(true);
      try {
        if (isHexabin) {
          const payload = await loadHexbins(url, controller.signal);
          if (controller.signal.aborted) return;
          setHexbins(payload);
          setIsFetching(false);
          prefetchOtherResolutions(payload.resolution);
        } else {
          const cached = memory.current.get(url);
          const payload = Array.isArray(cached)
            ? cached
            : await fetchPoints(url, controller.signal);
          if (controller.signal.aborted) return;
          memory.current.set(url, payload);
          setPoints(payload);
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
    // already baked into `url` and `prefetchKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isHexabin, prefetchKey, dataVersion]);

  // Background warming outlives a mode or zoom change, but not the map.
  useEffect(() => () => prefetch.current?.controller.abort(), []);

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

async function fetchPoints(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return ((await response.json()) as PointsResponse).points;
}
