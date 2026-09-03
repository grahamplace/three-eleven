import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MapComponent from "@/components/Map";
import { MapProvider } from "@/contexts/MapContext";
import {
  getServiceRequests,
  getServiceRequestById,
  getServiceRequestsByPredefinedQuery,
} from "@/lib/actions/service-requests";
import { toast } from "sonner";

// Mutable search params so individual tests can seed URL state
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => searchParams,
  usePathname: () => "/",
}));

// Mock react-map-gl. The Map mock forwards click events with the same shape
// react-map-gl uses (features + lngLat) so handlers can be exercised.
vi.mock("react-map-gl", async () => {
  const React = await import("react");
  return {
    default: vi.fn(({ children, onClick, onMoveEnd, onLoad }) => {
      React.useEffect(() => {
        onLoad?.();
        onMoveEnd?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return (
        <div
          data-testid="mapbox-map"
          onClick={(e) => {
            const detail = (e as unknown as { detail?: unknown }).detail;
            onClick?.(detail ?? { features: [], lngLat: { lng: 0, lat: 0 } });
          }}
        >
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
  };
});

vi.mock("@/lib/actions/service-requests", () => ({
  getServiceRequests: vi.fn(),
  getServiceRequestById: vi.fn(),
  getServiceRequestsByPredefinedQuery: vi.fn(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(() => true), // Default to desktop
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

vi.mock("@/lib/h3", () => ({
  binPointsToHexagons: vi.fn(() => ({
    type: "FeatureCollection",
    features: [],
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

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

const mockedGetServiceRequests = vi.mocked(getServiceRequests);
const mockedGetServiceRequestById = vi.mocked(getServiceRequestById);
const mockedGetByPredefinedQuery = vi.mocked(
  getServiceRequestsByPredefinedQuery,
);

const clickFeature = (el: HTMLElement, serviceRequestId: string) => {
  const event = new MouseEvent("click", { bubbles: true });
  Object.defineProperty(event, "detail", {
    value: {
      features: [{ properties: { serviceRequestId } }],
      lngLat: { lng: -122.4194, lat: 37.7749 },
    },
  });
  fireEvent(el, event);
};

const renderMap = (props?: Partial<{ token: string; dataAsOf: Date }>) =>
  render(
    <MapProvider>
      <MapComponent
        token="test-token"
        dataAsOf={new Date("2024-01-01")}
        {...props}
      />
    </MapProvider>,
  );

describe("MapComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();

    mockedGetServiceRequests.mockResolvedValue([
      {
        serviceRequestId: "1",
        latitude: 37.7749,
        longitude: -122.4194,
        weight: 1,
      },
    ]);

    mockedGetServiceRequestById.mockResolvedValue({
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
    renderMap();

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("mapbox-map")).toBeInTheDocument();
    expect(screen.getByTestId("map-provider")).toBeInTheDocument();
  });

  it("shows loading overlay initially", () => {
    renderMap();

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("fetches all service requests when no query is selected", async () => {
    renderMap();

    await waitFor(() => {
      expect(mockedGetServiceRequests).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        [],
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });
    expect(mockedGetByPredefinedQuery).not.toHaveBeenCalled();
  });

  it("fetches data using predefined query when selected via URL", async () => {
    searchParams = new URLSearchParams(
      "query=graffiti&start=2024-01-01&end=2024-01-31",
    );
    mockedGetByPredefinedQuery.mockResolvedValue([]);

    renderMap();

    await waitFor(() => {
      expect(mockedGetByPredefinedQuery).toHaveBeenCalledWith(
        "graffiti",
        "2024-01-01",
        "2024-01-31",
      );
    });
  });

  it("surfaces a toast when data fetching fails", async () => {
    mockedGetServiceRequests.mockRejectedValue(new Error("Failed to fetch"));

    renderMap();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load map data. Please try again.",
      );
    });
    expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
  });

  it("displays the data updated badge", () => {
    renderMap({ dataAsOf: new Date("2024-01-15") });

    expect(screen.getByText(/Data updated:/)).toBeInTheDocument();
  });

  it("loads request details when a feature is clicked", async () => {
    renderMap();

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    clickFeature(screen.getByTestId("mapbox-map"), "1");

    await waitFor(() => {
      expect(mockedGetServiceRequestById).toHaveBeenCalledWith("1");
    });
    expect(screen.getByTestId("selected-request")).toHaveTextContent("1");
    await waitFor(() => {
      expect(screen.getByTestId("request-data")).toHaveTextContent("1");
    });
  });

  it("clears selection when clicking on empty map area", async () => {
    renderMap();

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("mapbox-map"));

    expect(mockedGetServiceRequestById).not.toHaveBeenCalled();
    expect(screen.queryByTestId("selected-request")).not.toBeInTheDocument();
  });

  it("surfaces a toast when request detail fetching fails", async () => {
    mockedGetServiceRequestById.mockRejectedValue(new Error("boom"));

    renderMap();

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });

    clickFeature(screen.getByTestId("mapbox-map"), "1");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load request details. Please try again.",
      );
    });
  });
});
