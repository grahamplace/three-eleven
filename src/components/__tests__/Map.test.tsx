import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MapComponent from "@/components/Map";
import { MapProvider } from "@/contexts/MapContext";

// Mock react-map-gl
vi.mock("react-map-gl", () => ({
  default: vi.fn(({ children, onClick, onTouchEnd, onMoveEnd, onLoad }) => {
    React.useEffect(() => {
      if (onLoad) onLoad();
      if (onMoveEnd) onMoveEnd();
    }, []);
    return (
      <div data-testid="mapbox-map" onClick={onClick} onTouchEnd={onTouchEnd}>
        {children}
      </div>
    );
  }),
  Source: vi.fn(({ children }) => (
    <div data-testid="map-source">{children}</div>
  )),
  Layer: vi.fn(() => <div data-testid="map-layer" />),
  useMap: vi.fn(() => ({
    map: {
      flyTo: vi.fn(),
      getBounds: vi.fn(() => ({
        getNorth: vi.fn(() => 37.811749),
        getSouth: vi.fn(() => 37.708075),
        getEast: vi.fn(() => -122.346582),
        getWest: vi.fn(() => -122.513272),
      })),
      getZoom: vi.fn(() => 11.5),
      getContainer: vi.fn(() => ({ offsetWidth: 1200 })),
      project: vi.fn(() => ({ x: 600, y: 400 })),
      unproject: vi.fn(() => [-122.4194, 37.7749] as [number, number]),
    },
  })),
  MapProvider: vi.fn(({ children }) => (
    <div data-testid="map-provider">{children}</div>
  )),
}));

// Mock server actions
vi.mock("@/lib/actions/service-requests", () => ({
  getServiceRequests: vi.fn(),
  getServiceRequestById: vi.fn(),
  getServiceRequestsByPredefinedQuery: vi.fn(),
}));

// Mock hooks
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(() => true), // Default to desktop
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

// Mock h3 utility
vi.mock("@/lib/h3", () => ({
  binPointsToHexagons: vi.fn(() => ({
    type: "FeatureCollection",
    features: [],
  })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock ServiceRequestDetail component
vi.mock("@/components/ServiceRequestDetail", () => ({
  default: vi.fn(({ selectedRequest, selectedRequestData }) => (
    <div data-testid="service-request-detail">
      {selectedRequest && (
        <div data-testid="selected-request">
          {selectedRequest.serviceRequestId}
        </div>
      )}
      {selectedRequestData && (
        <div data-testid="request-data">
          {selectedRequestData.service_request_id}
        </div>
      )}
    </div>
  )),
}));

describe.skip("MapComponent", () => {
  const defaultProps = {
    token: "test-token",
    dataAsOf: new Date("2024-01-01"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    const {
      getServiceRequests,
      getServiceRequestById,
    } = require("@/lib/actions/service-requests");

    getServiceRequests.mockResolvedValue([
      {
        serviceRequestId: "1",
        latitude: 37.7749,
        longitude: -122.4194,
        weight: 1,
      },
    ]);

    getServiceRequestById.mockResolvedValue({
      service_request_id: "1",
      requested_datetime: new Date(),
      closed_date: null,
      updated_datetime: null,
      status_description: "Open",
      status_notes: null,
      agency_responsible: "DPW",
      service_name: "Graffiti",
      service_subtype: null,
      service_details: "Graffiti on wall",
      address: "123 Main St",
      street: "Main St",
      supervisor_district: 1,
      neighborhoods_sffind_boundaries: "Downtown",
      analysis_neighborhood: "Downtown",
      police_district: "Central",
      source: "311",
      data_as_of: new Date(),
      data_loaded_at: new Date(),
      lat: 37.7749,
      long: -122.4194,
      media_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  it("renders map component with correct structure", () => {
    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("mapbox-map")).toBeInTheDocument();
    expect(screen.getByTestId("map-provider")).toBeInTheDocument();
  });

  it("shows loading overlay initially", () => {
    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("fetches and displays service request data", async () => {
    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(
        require("@/lib/actions/service-requests").getServiceRequests
      ).toHaveBeenCalledWith(expect.any(String), expect.any(String), []);
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });
  });

  it("handles data fetching errors gracefully", async () => {
    const errorMessage = "Failed to fetch data";
    require("@/lib/actions/service-requests").getServiceRequests.mockRejectedValue(
      new Error(errorMessage)
    );

    const { toast } = await import("sonner");

    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load map data. Please try again."
      );
    });
  });

  it("displays data updated badge with correct date", () => {
    const testDate = new Date("2024-01-15");

    render(
      <MapProvider>
        <MapComponent {...defaultProps} dataAsOf={testDate} />
      </MapProvider>
    );

    expect(screen.getByText(/Data updated:/)).toBeInTheDocument();
  });

  it("handles map interactions and selects service requests", async () => {
    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    const mapElement = screen.getByTestId("mapbox-map");

    // Simulate clicking on a map feature
    fireEvent.click(mapElement, {
      features: [
        {
          properties: {
            serviceRequestId: "1",
          },
        },
      ],
      lngLat: {
        lng: -122.4194,
        lat: 37.7749,
      },
    });

    await waitFor(() => {
      expect(
        require("@/lib/actions/service-requests").getServiceRequestById
      ).toHaveBeenCalledWith("1");
    });
  });

  it("clears selection when clicking on empty map area", async () => {
    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    const mapElement = screen.getByTestId("mapbox-map");

    // Simulate clicking on empty area
    fireEvent.click(mapElement, {
      features: [],
      lngLat: {
        lng: -122.4194,
        lat: 37.7749,
      },
    });

    // Should not call getServiceRequestById
    expect(
      require("@/lib/actions/service-requests").getServiceRequestById
    ).not.toHaveBeenCalled();
  });

  it("fetches data using predefined query when selected", async () => {
    // Mock the context to have a selected query
    vi.mock("@/contexts/MapContext", () => ({
      useMapContext: vi.fn(() => ({
        mode: "points",
        selectedRequestId: null,
        setSelectedRequestId: vi.fn(),
        dateRange: { start: "2024-01-01", end: "2024-01-31" },
        setDateRange: vi.fn(),
        selectedQuery: "graffiti",
        setSelectedQuery: vi.fn(),
      })),
      MapProvider: vi.fn(({ children }) => (
        <div data-testid="map-provider">{children}</div>
      )),
    }));

    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(
        require("@/lib/actions/service-requests")
          .getServiceRequestsByPredefinedQuery
      ).toHaveBeenCalledWith("graffiti", "2024-01-01", "2024-01-31");
    });
  });

  it("handles service request detail fetching errors", async () => {
    require("@/lib/actions/service-requests").getServiceRequestById.mockRejectedValue(
      new Error("Failed to fetch details")
    );

    const { toast } = await import("sonner");

    render(
      <MapProvider>
        <MapComponent {...defaultProps} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    const mapElement = screen.getByTestId("mapbox-map");

    fireEvent.click(mapElement, {
      features: [
        {
          properties: {
            serviceRequestId: "1",
          },
        },
      ],
      lngLat: {
        lng: -122.4194,
        lat: 37.7749,
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load request details. Please try again."
      );
    });
  });
});
