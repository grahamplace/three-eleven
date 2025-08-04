"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Map, {
  Source,
  Layer,
  useMap,
  MapProvider,
  MapMouseEvent,
  MapTouchEvent,
} from "react-map-gl";
import {
  getServiceRequests,
  getServiceRequestById,
  getServiceRequestsByPredefinedQuery,
} from "@/lib/actions/service-requests";
import { ServiceRequest } from "@/entities";
import ServiceRequestDetail from "./ServiceRequestDetail";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTheme } from "next-themes";
import { binPointsToHexagons } from "@/lib/h3";
import { useMapContext } from "@/contexts/MapContext";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

export default function MapComponent({
  token,
  dataAsOf,
}: {
  token: string;
  dataAsOf: Date;
}) {
  return (
    <MapProvider>
      <MapContent token={token} dataAsOf={dataAsOf} />
    </MapProvider>
  );
}

function MapContent({ token, dataAsOf }: { token: string; dataAsOf: Date }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { theme } = useTheme();
  const {
    mode,
    selectedRequestId,
    setSelectedRequestId,
    dateRange,
    selectedQuery,
  } = useMapContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<ServiceRequestDTOThin[]>([]);
  const [selectedRequestData, setSelectedRequestData] =
    useState<ServiceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequestDTOThin | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  }>({
    north: 37.811749,
    south: 37.708075,
    east: -122.346582,
    west: -122.513272,
  });

  useEffect(() => {
    if (!selectedRequestId) {
      setSelectedRequest(null);
    }
  }, [selectedRequestId]);

  const { map } = useMap();

  const [zoom, setZoom] = useState(11.5);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data: ServiceRequestDTOThin[];

        if (selectedQuery) {
          // Fetch data using the predefined query
          data = await getServiceRequestsByPredefinedQuery(
            selectedQuery,
            dateRange.start,
            dateRange.end
          );
        } else {
          // Fetch all service requests without filtering by service details
          data = await getServiceRequests(
            dateRange.start,
            dateRange.end,
            [] // Empty array to fetch all service requests
          );
        }

        setPoints(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch service request data";
        setError(errorMessage);
        toast.error("Failed to load map data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange.start, dateRange.end, selectedQuery]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (selectedRequest?.serviceRequestId) {
        setSelectedRequestData(null);
        try {
          const data = await getServiceRequestById(
            selectedRequest.serviceRequestId
          );
          setSelectedRequestData(data);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch request details";
          toast.error("Failed to load request details. Please try again.");
        }
      } else {
        setSelectedRequestData(null);
      }
    };

    fetchRequestDetails();
  }, [selectedRequest?.serviceRequestId]);

  const geojson = {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: {
        weight: point.weight,
        serviceRequestId: point.serviceRequestId,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };

  const handleMapMove = useCallback(() => {
    if (map) {
      const bounds = map.getBounds();
      setMapBounds({
        north: bounds?.getNorth() || 0,
        south: bounds?.getSouth() || 0,
        east: bounds?.getEast() || 0,
        west: bounds?.getWest() || 0,
      });
      // Update zoom level
      setZoom(map.getZoom());
    }
  }, [map]);

  // Pass zoom to hexagonData calculation
  const hexagonData = useMemo(() => {
    if (mode !== "hexabin") return null;
    return binPointsToHexagons(points, mapBounds, zoom);
  }, [points, mapBounds, zoom, mode]);

  const handleMapInteraction = (event: MapMouseEvent | MapTouchEvent) => {
    if (!event.features?.length) {
      setSelectedRequest(null);
      setSelectedRequestId(null);
      return;
    }

    const feature = event.features[0];
    const longitude = event.lngLat.lng;
    const latitude = event.lngLat.lat;
    const requestId = feature.properties?.serviceRequestId || "";

    setSelectedRequest({
      longitude: longitude,
      latitude: latitude,
      serviceRequestId: requestId,
      weight: 1,
    });
    setSelectedRequestId(requestId);

    if (map) {
      if (isDesktop) {
        // For desktop with sidebar, we need to offset the center
        const SIDEBAR_WIDTH = 400; // Width of the sidebar in pixels

        // Get the current viewport dimensions
        const viewportWidth = map.getContainer().offsetWidth;

        // Calculate the pixel offset needed (half the sidebar width)
        const pixelOffsetX = SIDEBAR_WIDTH / 2;

        // Convert the clicked point to pixel coordinates
        const pointPixel = map.project([longitude, latitude]);

        // Apply the offset in pixels
        pointPixel.x -= pixelOffsetX;

        // Convert back to geographic coordinates
        const offsetPoint = map.unproject(pointPixel);

        // Fly to the offset point
        map.flyTo({
          center: offsetPoint,
          duration: 500,
        });
      } else {
        // For mobile, just fly to the exact point
        map.flyTo({
          center: [longitude, latitude],
          duration: 500,
        });
      }
    }
  };

  return (
    <div className="relative h-screen w-full">
      <div className="h-full w-full flex flex-row">
        <div className="w-full">
          <div className="relative h-full">
            <Map
              id="map"
              mapboxAccessToken={token}
              initialViewState={{
                longitude: -122.44,
                latitude: 37.77,
                zoom: 11.5,
              }}
              style={{ height: "100vh" }}
              mapStyle={`mapbox://styles/mapbox/${theme === "dark" ? "dark" : "light"}-v11`}
              onClick={handleMapInteraction}
              onTouchEnd={handleMapInteraction}
              interactiveLayerIds={["point-layer"]}
              onMoveEnd={handleMapMove}
              onLoad={handleMapMove}
            >
              {isLoading ? (
                <LoadingOverlay />
              ) : (
                <>
                  {mode === "hexabin" ? (
                    <Source type="geojson" data={hexagonData}>
                      <Layer
                        id="hexagon-layer"
                        type="fill"
                        paint={{
                          "fill-color": [
                            "interpolate",
                            ["linear"],
                            ["get", "count"],
                            0,
                            "rgba(33,102,172,0.0)",
                            10,
                            "rgb(103,169,207)",
                            20,
                            "rgb(209,229,240)",
                            30,
                            "rgb(253,219,199)",
                            40,
                            "rgb(239,138,98)",
                            50,
                            "rgb(178,24,43)",
                          ],
                          "fill-opacity": mode === "hexabin" ? 0.7 : 0.5,
                        }}
                      />
                      <Layer
                        id="hexagon-outline"
                        type="line"
                        paint={{
                          "line-color": theme === "dark" ? "white" : "gray",
                          "line-width": 1,
                          "line-opacity": 0.1,
                        }}
                      />
                    </Source>
                  ) : null}

                  {mode === "heatmap" && (
                    <Source type="geojson" data={geojson}>
                      <Layer
                        id="heatmap-layer"
                        type="heatmap"
                        paint={{
                          "heatmap-weight": ["get", "weight"],
                          "heatmap-intensity": 0.2,
                          "heatmap-color": [
                            "interpolate",
                            ["linear"],
                            ["heatmap-density"],
                            0,
                            "rgba(33,102,172,0)",
                            0.2,
                            "rgb(103,169,207)",
                            0.4,
                            "rgb(209,229,240)",
                            0.6,
                            "rgb(253,219,199)",
                            0.8,
                            "rgb(239,138,98)",
                            1,
                            "rgb(178,24,43)",
                          ],
                          "heatmap-radius": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            0,
                            2,
                            20,
                            20,
                          ],
                          "heatmap-opacity": {
                            type: "exponential",
                            stops: [
                              [14, 1],
                              [16, 0.0],
                            ],
                          },
                        }}
                      />
                    </Source>
                  )}

                  {(mode === "points" || mode === "heatmap") && (
                    <Source type="geojson" data={geojson}>
                      <Layer
                        id="point-layer"
                        type="circle"
                        paint={{
                          "circle-radius": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            11,
                            [
                              "case",
                              [
                                "==",
                                ["get", "serviceRequestId"],
                                selectedRequest?.serviceRequestId || "",
                              ],
                              1,
                              0.05,
                            ],
                            20,
                            [
                              "case",
                              [
                                "==",
                                ["get", "serviceRequestId"],
                                selectedRequest?.serviceRequestId || "",
                              ],
                              12,
                              6,
                            ],
                          ],
                          "circle-color": [
                            "case",
                            [
                              "==",
                              ["get", "serviceRequestId"],
                              selectedRequest?.serviceRequestId || "",
                            ],
                            "#00ff00",
                            "transparent",
                          ],
                          "circle-opacity":
                            mode === "heatmap"
                              ? {
                                  stops: [
                                    [14, 0],
                                    [15, 1],
                                  ],
                                }
                              : 1,
                          "circle-stroke-opacity":
                            mode === "heatmap"
                              ? {
                                  stops: [
                                    [14, 0],
                                    [15, 1],
                                  ],
                                }
                              : 1,
                          "circle-stroke-width": 1,
                          "circle-stroke-color":
                            theme === "dark" ? "white" : "gray",
                        }}
                      />
                    </Source>
                  )}
                </>
              )}
            </Map>
          </div>
        </div>

        <ServiceRequestDetail
          selectedRequest={selectedRequest}
          selectedRequestData={selectedRequestData}
        />
        <div className="fixed right-0 bottom-0 p-2">
          <Badge variant="default">
            Data updated: {dataAsOf.toLocaleDateString()}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
