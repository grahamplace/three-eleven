import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MapComponent from "@/components/Map";
import { MapProvider } from "@/contexts/MapContext";
import { getServiceRequestById } from "@/lib/actions/service-requests";
import { toast } from "sonner";

// Mutable search params so individual tests can seed URL state
let searchParams = new URLSearchParams();

// The zoom react-map-gl reports; `setZoom` moves it and fires onMoveEnd.
let currentZoom = 11.5;

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
        <>
          {/* Stands in for a pan/zoom gesture; see `setZoom` below. */}
          <button data-testid="move-end" onClick={() => onMoveEnd?.()} />
          <div
            data-testid="mapbox-map"
            onClick={(e) => {
              const detail = (e as unknown as { detail?: unknown }).detail;
              onClick?.(detail ?? { features: [], lngLat: { lng: 0, lat: 0 } });
            }}
          >
            {children}
          </div>
        </>
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
        getZoom: vi.fn(() => currentZoom),
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
  getServiceRequestById: vi.fn(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(() => true), // Default to desktop
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

// Keep the real zoom→resolution mapping; stub the grid geometry, which is slow.
vi.mock("@/lib/h3", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/h3")>()),
  hexCountsToFeatures: vi.fn(() => ({
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
  default: vi.fn(({ selectedRequestId, selectedRequestData }) => (
    <div data-testid="service-request-detail">
      {selectedRequestId && (
        <div data-testid="selected-request">{selectedRequestId}</div>
      )}
      {selectedRequestData && (
        <div data-testid="request-data">
          {selectedRequestData.service_request_id}
        </div>
      )}
    </div>
  )),
}));

const mockedGetServiceRequestById = vi.mocked(getServiceRequestById);

// Map data comes from the /api/points and /api/hexbins routes.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const jsonResponse = (body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

const fetchedPaths = () =>
  fetchMock.mock.calls.map((c) => {
    const url = new URL(String(c[0]), "http://localhost");
    return { path: url.pathname, params: url.searchParams };
  });

const setZoom = (zoom: number) => {
  currentZoom = zoom;
  fireEvent.click(screen.getByTestId("move-end"));
};

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
    currentZoom = 11.5;

    // Answer each route with its own payload shape. The first render fetches
    // points before URL state hydrates, so a hexabin test still sees a points
    // request in flight.
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      return url.pathname === "/api/hexbins"
        ? jsonResponse({
            resolution: Number(url.searchParams.get("res")),
            cells: [],
          })
        : jsonResponse({ points: [["1", -122.4194, 37.7749]] });
    });

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

  it("fetches points for the date range when no query is selected", async () => {
    renderMap();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [{ path, params }] = fetchedPaths();
    expect(path).toBe("/api/points");
    expect(params.get("start")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.get("end")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.has("query")).toBe(false);

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });
  });

  it("passes the predefined query and dates from the URL through to the API", async () => {
    searchParams = new URLSearchParams(
      "query=graffiti&start=2024-01-01&end=2024-01-31",
    );

    renderMap();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const { path, params } = fetchedPaths().at(-1)!;
    expect(path).toBe("/api/points");
    expect(params.get("query")).toBe("graffiti");
    expect(params.get("start")).toBe("2024-01-01");
    expect(params.get("end")).toBe("2024-01-31");
  });

  const hexbinResolutions = () =>
    fetchedPaths()
      .filter((f) => f.path === "/api/hexbins")
      .map((f) => f.params.get("res"));

  it("requests server-side hexbin counts at the zoom's resolution in hexabin mode", async () => {
    searchParams = new URLSearchParams("mode=hexabin");

    renderMap();

    // Initial zoom is 11.5, which maps to resolution 9.
    await waitFor(() => {
      expect(hexbinResolutions()).toContain("9");
    });
  });

  const allWarm = () =>
    waitFor(() => {
      expect(hexbinResolutions().sort()).toEqual(["10", "11", "7", "8", "9"]);
    });

  it("warms every other resolution in the background, nearest zoom step first", async () => {
    searchParams = new URLSearchParams("mode=hexabin");

    renderMap();

    await allWarm();
    // Visible resolution first, then outwards from it.
    expect(hexbinResolutions()).toEqual(["9", "8", "10", "7", "11"]);
  });

  it("zooms between warmed resolutions without touching the network", async () => {
    searchParams = new URLSearchParams("mode=hexabin");

    renderMap();

    await allWarm();
    const before = fetchMock.mock.calls.length;

    setZoom(13.5); // resolution 10
    setZoom(8); // resolution 7
    setZoom(16); // resolution 11

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });
    expect(fetchMock.mock.calls.length).toBe(before);
  });

  it("fetches each resolution exactly once for a filter set", async () => {
    searchParams = new URLSearchParams("mode=hexabin");

    renderMap();

    await allWarm();
    expect(fetchMock.mock.calls).toHaveLength(5);
  });

  it("does not refetch points when zooming, only hexbins are per-resolution", async () => {
    renderMap();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Crosses two resolution thresholds (9 -> 10 -> 11).
    setZoom(13.5);
    setZoom(15.5);

    await waitFor(() => {
      expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces a toast when the API responds with an error", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("nope", { status: 500 })),
    );

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
