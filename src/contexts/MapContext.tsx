"use client";
import { createContext, useContext, useState } from "react";
import { MapLayers } from "@/components/LayerToggle";

interface MapContextType {
  visibleLayers: MapLayers;
  setVisibleLayers: (layers: MapLayers) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [visibleLayers, setVisibleLayers] = useState<MapLayers>({
    points: true,
    heatmap: true,
    hexagons: true,
  });

  return (
    <MapContext.Provider value={{ visibleLayers, setVisibleLayers }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useLayers must be used within a LayersProvider");
  }
  return context;
}
