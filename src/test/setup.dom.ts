import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Set up jest-dom matchers
import "@testing-library/jest-dom/vitest";

// Mock scrollIntoView for Radix UI components in jsdom
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
});

// MSW setup will be handled in individual test files as needed

// Mock react-map-gl to avoid WebGL issues in tests
vi.mock("react-map-gl", () => ({
  default: vi.fn(),
  Source: vi.fn(),
  Layer: vi.fn(),
  useMap: vi.fn(() => ({
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
  })),
  MapProvider: vi.fn(),
}));

// Mock mapbox-gl to avoid WebGL issues
vi.mock("mapbox-gl", () => ({
  default: vi.fn(),
}));
