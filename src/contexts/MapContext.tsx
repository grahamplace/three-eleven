"use client";
import React, {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";

export type MapMode = "points" | "heatmap" | "hexabin";
const MODES: readonly MapMode[] = ["points", "heatmap", "hexabin"];
const isMode = (v: string | null): v is MapMode =>
  v !== null && (MODES as readonly string[]).includes(v);

export type DateRange = { start: string; end: string };

/**
 * Trailing 7 days ending yesterday. Data is ingested nightly, so today never
 * has rows; this also matches the T7 preset in the date picker.
 */
export const getDefaultDateRange = (): DateRange => {
  const yesterday = subDays(new Date(), 1);
  return {
    start: format(subDays(yesterday, 6), "yyyy-MM-dd"),
    end: format(yesterday, "yyyy-MM-dd"),
  };
};

type MapState = {
  mode: MapMode;
  selectedRequestId: string | null;
  dateRange: DateRange;
  selectedQuery: string | null;
};

/** Pure: derives the initial state from the URL so the first render is right. */
export function readStateFromUrl(params: URLSearchParams): MapState {
  const mode = params.get("mode");
  const start = params.get("start");
  const end = params.get("end");
  return {
    mode: isMode(mode) ? mode : "heatmap",
    selectedRequestId: params.get("id") || null,
    dateRange: start && end ? { start, end } : getDefaultDateRange(),
    selectedQuery: params.get("query") || null,
  };
}

interface MapContextType extends MapState {
  setMode: (mode: MapMode) => void;
  setSelectedRequestId: (id: string | null) => void;
  setDateRange: (range: DateRange) => void;
  setSelectedQuery: (queryId: string | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

function MapContextContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read the URL synchronously on first render. Doing this in an effect
  // meant one render (and one data fetch) with default state before the URL
  // was applied.
  const [state, setState] = useState<MapState>(() =>
    readStateFromUrl(searchParams),
  );

  const updateURL = useCallback(
    (
      params: Partial<
        Record<"mode" | "id" | "start" | "end" | "query", string | null>
      >,
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) next.delete(key);
        else if (value !== undefined) next.set(key, value);
      }
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const setMode = useCallback(
    (mode: MapMode) => {
      setState((s) => ({ ...s, mode }));
      updateURL({ mode });
    },
    [updateURL],
  );

  const setSelectedRequestId = useCallback(
    (id: string | null) => {
      setState((s) => ({ ...s, selectedRequestId: id }));
      updateURL({ id });
    },
    [updateURL],
  );

  const setDateRange = useCallback(
    (dateRange: DateRange) => {
      setState((s) => ({ ...s, dateRange }));
      updateURL({ start: dateRange.start, end: dateRange.end });
    },
    [updateURL],
  );

  const setSelectedQuery = useCallback(
    (query: string | null) => {
      setState((s) => ({ ...s, selectedQuery: query }));
      updateURL({ query });
    },
    [updateURL],
  );

  const value = useMemo<MapContextType>(
    () => ({
      ...state,
      setMode,
      setSelectedRequestId,
      setDateRange,
      setSelectedQuery,
    }),
    [state, setMode, setSelectedRequestId, setDateRange, setSelectedQuery],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <MapContextContent>{children}</MapContextContent>
    </Suspense>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
