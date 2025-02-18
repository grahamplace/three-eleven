"use client";
import { createContext, useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type MapMode = "mixed" | "points" | "heatmap" | "hexagons";

interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode") as MapMode;

  // Validate and get mode from URL or use default
  const getValidMode = (mode: string | null): MapMode => {
    const validModes: MapMode[] = ["mixed", "points", "heatmap", "hexagons"];
    return validModes.includes(mode as MapMode) ? (mode as MapMode) : "heatmap";
  };

  const mode = getValidMode(currentMode);

  const setMode = (newMode: MapMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Set initial mode in URL if not present
  useEffect(() => {
    if (!currentMode) {
      setMode("heatmap");
    }
  }, [currentMode]);

  return (
    <MapContext.Provider value={{ mode, setMode }}>
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
