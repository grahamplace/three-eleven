import type {
  CircleLayer,
  FillLayer,
  HeatmapLayer,
  LineLayer,
} from "react-map-gl";
import type { MapMode } from "@/contexts/MapContext";

/** Blue → red ramp shared by the hexbin fill and the heatmap. */
const RAMP = [
  "rgb(103,169,207)",
  "rgb(209,229,240)",
  "rgb(253,219,199)",
  "rgb(239,138,98)",
  "rgb(178,24,43)",
];

export const HEXAGON_FILL_PAINT: FillLayer["paint"] = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["get", "count"],
    0,
    "rgba(33,102,172,0.0)",
    10,
    RAMP[0],
    20,
    RAMP[1],
    30,
    RAMP[2],
    40,
    RAMP[3],
    50,
    RAMP[4],
  ],
  "fill-opacity": 0.7,
};

export const hexagonOutlinePaint = (
  theme: string | undefined,
): LineLayer["paint"] => ({
  "line-color": theme === "dark" ? "white" : "gray",
  "line-width": 1,
  "line-opacity": 0.1,
});

export const HEATMAP_PAINT: HeatmapLayer["paint"] = {
  "heatmap-weight": ["get", "weight"],
  "heatmap-intensity": 0.2,
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(33,102,172,0)",
    0.2,
    RAMP[0],
    0.4,
    RAMP[1],
    0.6,
    RAMP[2],
    0.8,
    RAMP[3],
    1,
    RAMP[4],
  ],
  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 20, 20],
  // Fade the heatmap out as individual points fade in.
  "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 14, 1, 16, 0],
};

/**
 * Circle layer for individual requests. In heatmap mode the circles are hidden
 * until zoom 14-15, where the heatmap hands off to points. The selected
 * request is drawn larger and green.
 */
export const pointPaint = ({
  mode,
  selectedId,
  theme,
}: {
  mode: MapMode;
  selectedId: string;
  theme: string | undefined;
}): CircleLayer["paint"] => {
  const isSelected = ["==", ["get", "serviceRequestId"], selectedId];
  const fadeInWithZoom: NonNullable<CircleLayer["paint"]>["circle-opacity"] =
    mode === "heatmap"
      ? ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1]
      : 1;
  return {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      11,
      ["case", isSelected, 1, 0.05],
      20,
      ["case", isSelected, 12, 6],
    ],
    "circle-color": ["case", isSelected, "#00ff00", "transparent"],
    "circle-opacity": fadeInWithZoom,
    "circle-stroke-opacity": fadeInWithZoom,
    "circle-stroke-width": 1,
    "circle-stroke-color": theme === "dark" ? "white" : "gray",
  };
};
