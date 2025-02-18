"use client";
import { createContext, useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type MapMode = "mixed" | "points" | "heatmap" | "hexabin";

interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode") as MapMode;
  const currentRequestId = searchParams.get("id");

  // Validate and get mode from URL or use default
  const getValidMode = (mode: string | null): MapMode => {
    const validModes: MapMode[] = ["mixed", "points", "heatmap", "hexabin"];
    return validModes.includes(mode as MapMode) ? (mode as MapMode) : "heatmap";
  };

  const mode = getValidMode(currentMode);

  const updateURL = (params: { mode?: MapMode; id?: string | null }) => {
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

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const setMode = (newMode: MapMode) => {
    updateURL({ mode: newMode });
  };

  const setSelectedRequestId = (id: string | null) => {
    updateURL({ id });
  };

  // Set initial mode in URL if not present
  useEffect(() => {
    if (!currentMode) {
      setMode("heatmap");
    }
  }, [currentMode]);

  return (
    <MapContext.Provider
      value={{
        mode,
        setMode,
        selectedRequestId: currentRequestId,
        setSelectedRequestId,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
