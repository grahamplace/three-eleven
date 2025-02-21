"use client";
import { createContext, useContext, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";

// Get default date range (31 days ago to yesterday)
const getDefaultDateRange = () => {
  const yesterday = subDays(new Date(), 1);
  const thirtyOneDaysAgo = subDays(yesterday, 90);
  return {
    start: format(thirtyOneDaysAgo, "yyyy-MM-dd"),
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
}

const MapContext = createContext<MapContextType | undefined>(undefined);

// Create a separate component to handle search params
function MapContextContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode") as MapMode;
  const currentRequestId = searchParams.get("id");
  const currentStart = searchParams.get("start");
  const currentEnd = searchParams.get("end");

  // Validate and get mode from URL or use default
  const getValidMode = (mode: string | null): MapMode => {
    const validModes: MapMode[] = ["points", "heatmap", "hexabin"];
    return validModes.includes(mode as MapMode) ? (mode as MapMode) : "heatmap";
  };

  const mode = getValidMode(currentMode);
  const defaultRange = getDefaultDateRange();

  const updateURL = (params: {
    mode?: MapMode;
    id?: string | null;
    start?: string;
    end?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (params.mode) {
      newParams.set("mode", params.mode);
      // Clear ID when mode changes
      newParams.delete("id");
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

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const setMode = (newMode: MapMode) => {
    updateURL({ mode: newMode });
  };

  const setSelectedRequestId = (id: string | null) => {
    updateURL({ id });
  };

  const setDateRange = (range: { start: string; end: string }) => {
    updateURL({ start: range.start, end: range.end });
  };

  // Set initial mode in URL if not present
  useEffect(() => {
    if (!currentMode) {
      setMode("heatmap");
    }
    if (!currentStart || !currentEnd) {
      setDateRange(defaultRange);
    }
  }, [currentMode, currentStart, currentEnd]);

  return (
    <MapContext.Provider
      value={{
        mode,
        setMode,
        selectedRequestId: currentRequestId,
        setSelectedRequestId,
        dateRange: {
          start: currentStart || defaultRange.start,
          end: currentEnd || defaultRange.end,
        },
        setDateRange,
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
