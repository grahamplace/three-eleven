import React from "react";

// Mock Map component
export const Map = vi.fn(({ children, ...props }) => {
  return React.createElement(
    "div",
    {
      "data-testid": "map",
      ...props,
    },
    children
  );
});

// Mock Source component
export const Source = vi.fn(({ children, ...props }) => {
  return React.createElement(
    "div",
    {
      "data-testid": "map-source",
      ...props,
    },
    children
  );
});

// Mock Layer component
export const Layer = vi.fn((props) => {
  return React.createElement("div", {
    "data-testid": "map-layer",
    ...props,
  });
});

// Mock useMap hook
export const useMap = vi.fn(() => ({
  map: {
    getBounds: vi.fn(() => ({
      getNorth: vi.fn(() => 37.811749),
      getSouth: vi.fn(() => 37.708075),
      getEast: vi.fn(() => -122.346582),
      getWest: vi.fn(() => -122.513272),
    })),
    getZoom: vi.fn(() => 11.5),
    getContainer: vi.fn(() => ({ offsetWidth: 1200 })),
    project: vi.fn(() => ({ x: 600, y: 400 })),
    unproject: vi.fn(() => [-122.4194, 37.7749]),
    flyTo: vi.fn(),
  },
}));

// Mock MapProvider component
export const MapProvider = vi.fn(({ children }) => {
  return React.createElement(
    "div",
    {
      "data-testid": "map-provider",
    },
    children
  );
});

// Default export
export default Map;
