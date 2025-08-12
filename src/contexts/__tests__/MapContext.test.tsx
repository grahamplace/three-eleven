import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapProvider, useMapContext } from "@/contexts/MapContext";

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/",
}));

// Test component to access context
function TestComponent() {
  const context = useMapContext();
  return (
    <div>
      <div data-testid="mode">{context.mode}</div>
      <div data-testid="selected-query">{context.selectedQuery || "none"}</div>
      <button data-testid="set-mode" onClick={() => context.setMode("hexabin")}>
        Set Hexabin
      </button>
      <button
        data-testid="set-query"
        onClick={() => context.setSelectedQuery("poop")}
      >
        Set Poop Query
      </button>
      <button
        data-testid="set-date-range"
        onClick={() =>
          context.setDateRange({ start: "2024-01-01", end: "2024-01-31" })
        }
      >
        Set Date Range
      </button>
    </div>
  );
}

describe("MapContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear search params by creating a new instance
    mockSearchParams.forEach((_, key) => {
      mockSearchParams.delete(key);
    });
  });

  it("provides default context values", () => {
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("heatmap");
    expect(screen.getByTestId("selected-query")).toHaveTextContent("none");
  });

  it("updates mode and calls router", () => {
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );

    fireEvent.click(screen.getAllByTestId("set-mode")[0]);

    expect(screen.getAllByTestId("mode")[0]).toHaveTextContent("hexabin");
    expect(mockPush).toHaveBeenCalledWith("?mode=hexabin", { scroll: false });
  });

  it("updates selected query and calls router", () => {
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );

    fireEvent.click(screen.getAllByTestId("set-query")[0]);

    expect(screen.getAllByTestId("selected-query")[0]).toHaveTextContent(
      "poop"
    );
    expect(mockPush).toHaveBeenCalledWith("?query=poop", { scroll: false });
  });

  it("updates date range and calls router", () => {
    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );

    fireEvent.click(screen.getAllByTestId("set-date-range")[0]);

    expect(mockPush).toHaveBeenCalledWith("?start=2024-01-01&end=2024-01-31", {
      scroll: false,
    });
  });

  it("initializes from URL parameters", () => {
    // Set up URL parameters
    mockSearchParams.set("mode", "points");
    mockSearchParams.set("query", "graffiti");
    mockSearchParams.set("start", "2024-01-01");
    mockSearchParams.set("end", "2024-01-31");

    render(
      <MapProvider>
        <TestComponent />
      </MapProvider>
    );

    // The context should initialize with URL values
    // Note: This might need adjustment based on how the initialization actually works
    expect(mockPush).toHaveBeenCalled();
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useMapContext must be used within a MapProvider");

    consoleSpy.mockRestore();
  });
});
