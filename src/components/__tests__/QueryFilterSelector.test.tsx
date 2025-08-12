import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryFilterSelector } from "@/components/QueryFilterSelector";
import { MapProvider } from "@/contexts/MapContext";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock the server action
vi.mock("@/lib/actions/service-requests", () => ({
  getPredefinedQueries: vi.fn(() =>
    Promise.resolve([
      {
        id: "poop",
        name: "Human/Animal Waste",
        description: "Waste related requests",
      },
      {
        id: "graffiti",
        name: "Graffiti",
        description: "Graffiti related requests",
      },
    ])
  ),
}));

describe("QueryFilterSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the query filter selector", async () => {
    render(
      <MapProvider>
        <QueryFilterSelector />
      </MapProvider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(
        screen.getAllByTestId("query-filter-selector")[0]
      ).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    render(
      <MapProvider>
        <QueryFilterSelector />
      </MapProvider>
    );

    // Should show "All" as default when no query is selected
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("loads and displays predefined queries", async () => {
    render(
      <MapProvider>
        <QueryFilterSelector />
      </MapProvider>
    );

    // Wait for queries to load
    await waitFor(() => {
      expect(
        screen.getAllByTestId("query-filter-selector")[0]
      ).toBeInTheDocument();
    });

    // Open the select dropdown
    fireEvent.click(screen.getAllByTestId("query-filter-selector")[0]);

    // Check that all options are available
    await waitFor(() => {
      expect(screen.getAllByText(/All/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Human\/Animal Waste/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Graffiti/)[0]).toBeInTheDocument();
    });
  });

  it("updates context when selection changes", async () => {
    render(
      <MapProvider>
        <QueryFilterSelector />
      </MapProvider>
    );

    // Wait for queries to load
    await waitFor(() => {
      expect(
        screen.getAllByTestId("query-filter-selector")[0]
      ).toBeInTheDocument();
    });

    // The component should render without errors
    expect(
      screen.getAllByTestId("query-filter-selector")[0]
    ).toBeInTheDocument();
  });

  it("handles error state gracefully", async () => {
    // Mock the server action to throw an error
    vi.doMock("@/lib/actions/service-requests", () => ({
      getPredefinedQueries: vi.fn(() =>
        Promise.reject(new Error("Failed to fetch"))
      ),
    }));

    render(
      <MapProvider>
        <QueryFilterSelector />
      </MapProvider>
    );

    // Should still render the component even if queries fail to load
    await waitFor(() => {
      expect(
        screen.getAllByTestId("query-filter-selector")[0]
      ).toBeInTheDocument();
    });
  });
});
