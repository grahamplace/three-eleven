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
} from "@/lib/actions/service-requests";
import { ServiceRequest } from "@/entities";
import ServiceRequestDetail from "./ServiceRequestDetail";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTheme } from "next-themes";
import { binPointsToHexagons } from "@/lib/h3";
import { ModeToggle } from "./ModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useMapContext } from "@/contexts/MapContext";

export default function MapComponent({ token }: { token: string }) {
  return (
    <MapProvider>
      <MapContent token={token} />
    </MapProvider>
  );
}

function MapContent({ token }: { token: string }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { theme } = useTheme();
  const { mode, selectedRequestId, setSelectedRequestId } = useMapContext();
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

  // Add new state for zoom level
  const [zoom, setZoom] = useState(11.5);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getServiceRequests("2024-01-01", "2024-12-31", [
        "Human or Animal Waste",
      ]);
      setPoints(data);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (selectedRequest?.serviceRequestId) {
        setSelectedRequestData(null);
        const data = await getServiceRequestById(
          selectedRequest.serviceRequestId
        );
        setSelectedRequestData(data);
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
    if (mode !== "hexagons") return null;
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

    map?.flyTo({
      center: [longitude, latitude],
      duration: 500,
    });
  };

  return (
    <div className="h-full w-full flex flex-row">
      <div className={isDesktop ? "w-2/3" : "w-full"}>
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
          {mode === "hexagons" ? (
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
                  "fill-opacity": mode === "hexagons" ? 0.7 : 0.5,
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
                  "circle-stroke-color": theme === "dark" ? "white" : "gray",
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      <ServiceRequestDetail
        selectedRequest={selectedRequest}
        selectedRequestData={selectedRequestData}
      >
        <div className="flex items-center gap-2">
          <ModeToggle />
          <ThemeToggle />
        </div>
      </ServiceRequestDetail>
    </div>
  );
}
