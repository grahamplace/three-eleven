"use client";
import React from "react";
import {
  createContext,
  useContext,
  useEffect,
  Suspense,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";

const getDefaultDateRange = () => {
  const yesterday = subDays(new Date(), 0);
  const sevenDaysAgo = subDays(yesterday, 6);
  return {
    start: format(sevenDaysAgo, "yyyy-MM-dd"),
    end: format(yesterday, "yyyy-MM-dd"),
  };
};

export type MapMode = "points" | "heatmap" | "hexabin";

interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  dateRange: {
    start: string;
    end: string;
  };
  setDateRange: (range: { start: string; end: string }) => void;
  selectedQuery: string | null;
  setSelectedQuery: (queryId: string | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

function MapContextContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const [initialized, setInitialized] = useState(false);
  const [mode, setInternalMode] = useState<MapMode>("heatmap");
  const [selectedRequestId, setInternalSelectedRequestId] = useState<
    string | null
  >(null);
  const [dateRange, setInternalDateRange] = useState(getDefaultDateRange());
  const [selectedQuery, setInternalSelectedQuery] = useState<string | null>(
    null
  );

  // Effect to initialize state from URL once
  useEffect(() => {
    if (!initialized) {
      const urlMode = searchParams.get("mode") as MapMode;
      const urlId = searchParams.get("id");
      const urlStart = searchParams.get("start");
      const urlEnd = searchParams.get("end");
      const urlQuery = searchParams.get("query");

      // Only update state if URL parameters exist
      if (urlMode || urlId || urlStart || urlEnd || urlQuery) {
        if (urlMode && ["points", "heatmap", "hexabin"].includes(urlMode)) {
          setInternalMode(urlMode);
        }
        if (urlId) {
          setInternalSelectedRequestId(urlId);
        }
        if (urlStart && urlEnd) {
          setInternalDateRange({ start: urlStart, end: urlEnd });
        }
        if (urlQuery) {
          setInternalSelectedQuery(urlQuery);
        }

        // Update URL to match state (this will clean up any invalid URL params)
        updateURL({
          mode: urlMode as MapMode,
          id: urlId,
          start: urlStart || dateRange.start,
          end: urlEnd || dateRange.end,
          query: urlQuery,
        });
      }

      setInitialized(true);
    }
  }, [searchParams, initialized]);

  const updateURL = (params: {
    mode?: MapMode;
    id?: string | null;
    start?: string;
    end?: string;
    query?: string | null;
  }) => {
    // Start with existing params instead of creating new empty params
    const newParams = new URLSearchParams(searchParams.toString());

    // Update or remove parameters based on new values
    if (params.mode) {
      newParams.set("mode", params.mode);
    }

    if (params.id === null) {
      newParams.delete("id");
    } else if (params.id) {
      newParams.set("id", params.id);
    }

    if (params.start) {
      newParams.set("start", params.start);
    }

    if (params.end) {
      newParams.set("end", params.end);
    }

    if (params.query === null) {
      newParams.delete("query");
    } else if (params.query) {
      newParams.set("query", params.query);
    }

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  // State setters that also update URL
  const setMode = (newMode: MapMode) => {
    setInternalMode(newMode);
    updateURL({ mode: newMode });
  };

  const setSelectedRequestId = (id: string | null) => {
    setInternalSelectedRequestId(id);
    updateURL({ id });
  };

  const setDateRange = (range: { start: string; end: string }) => {
    setInternalDateRange(range);
    updateURL({ start: range.start, end: range.end });
  };

  const setSelectedQuery = (queryId: string | null) => {
    setInternalSelectedQuery(queryId);
    updateURL({ query: queryId });
  };

  return (
    <MapContext.Provider
      value={{
        mode,
        setMode,
        selectedRequestId,
        setSelectedRequestId,
        dateRange,
        setDateRange,
        selectedQuery,
        setSelectedQuery,
      }}
    >
      {children}
    </MapContext.Provider>
  );
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
