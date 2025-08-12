import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupWorker } from "msw/browser";
import { handlers } from "./mocks/handlers";
import "@testing-library/jest-dom";

// Set up MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start worker before all tests
beforeAll(() => worker.start({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => worker.resetHandlers());

// Close worker after all tests
afterAll(() => worker.stop());

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
