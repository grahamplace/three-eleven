import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { H3Resolution, HexCount } from "@/lib/h3";
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

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Loads the map payload from /api/points or /api/hexbins.
 *
 * Points and heatmap share one payload. Hexbins are aggregated server-side per
 * resolution, so only a resolution change (not every zoom tick) refetches.
 * In-flight requests are aborted when the inputs change.
 */
export function useMapData({
  dateRange,
  selectedQuery,
  isHexabin,
  resolution,
}: Params) {
  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState<PointTuple[]>([]);
  const [hexCounts, setHexCounts] = useState<HexCount[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      start: dateRange.start,
      end: dateRange.end,
    });
    if (selectedQuery) params.set("query", selectedQuery);

    const run = async () => {
      setIsLoading(true);
      try {
        if (isHexabin) {
          params.set("res", String(resolution));
          const data = await fetchJson<HexbinsResponse>(
            `/api/hexbins?${params}`,
            controller.signal,
          );
          setHexCounts(data.cells);
        } else {
          const data = await fetchJson<PointsResponse>(
            `/api/points?${params}`,
            controller.signal,
          );
          setPoints(data.points);
        }
        setIsLoading(false);
      } catch {
        if (controller.signal.aborted) return;
        toast.error("Failed to load map data. Please try again.");
        setIsLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [dateRange.start, dateRange.end, selectedQuery, isHexabin, resolution]);

  return { isLoading, points, hexCounts };
}
