"use client";

import { useState, useEffect } from "react";
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

export default function MapComponent({ token }: { token: string }) {
  return (
    <MapProvider>
      <MapContent token={token} />
    </MapProvider>
  );
}

function MapContent({ token }: { token: string }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [points, setPoints] = useState<ServiceRequestDTOThin[]>([]);
  const [selectedRequestData, setSelectedRequestData] =
    useState<ServiceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequestDTOThin | null>(null);

  const { map } = useMap();

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

  const handleMapInteraction = (event: MapMouseEvent | MapTouchEvent) => {
    if (!event.features?.length) {
      setSelectedRequest(null);
      return;
    }

    const feature = event.features[0];
    const longitude = event.lngLat.lng;
    const latitude = event.lngLat.lat;
    setSelectedRequest({
      longitude: longitude,
      latitude: latitude,
      serviceRequestId: feature.properties?.serviceRequestId || "",
      weight: 1,
    });
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
          mapStyle="mapbox://styles/mapbox/dark-v11" // TODO: allow dark mode toggle
          onClick={handleMapInteraction}
          onTouchEnd={handleMapInteraction}
          interactiveLayerIds={["point-layer"]}
        >
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
                  ["heatmap-density"],
                  0,
                  10,
                  1,
                  30,
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
            <Layer
              id="point-layer"
              type="circle"
              minzoom={14}
              paint={{
                "circle-radius": [
                  "case",
                  [
                    "==",
                    ["get", "serviceRequestId"],
                    selectedRequest?.serviceRequestId || "",
                  ],
                  8,
                  4,
                ],
                "circle-color": [
                  "case",
                  [
                    "==",
                    ["get", "serviceRequestId"],
                    selectedRequest?.serviceRequestId || "",
                  ],
                  "#00ff00", // bright green for selected point
                  "transparent", // default color for unselected points
                ],
                "circle-stroke-color": "white",
                "circle-stroke-width": [
                  "case",
                  [
                    "==",
                    ["get", "serviceRequestId"],
                    selectedRequest?.serviceRequestId || "",
                  ],
                  2, // thicker stroke for selected point
                  1, // default stroke width
                ],
                "circle-opacity": {
                  type: "exponential",
                  stops: [
                    [14, 0.1],
                    [16, 1],
                  ],
                },
                "circle-stroke-opacity": {
                  type: "exponential",
                  stops: [
                    [14, 0.1],
                    [16, 1],
                  ],
                },
              }}
            />
          </Source>
        </Map>
      </div>

      <ServiceRequestDetail
        selectedRequest={selectedRequest}
        selectedRequestData={selectedRequestData}
        setSelectedRequest={setSelectedRequest}
      />
    </div>
  );
}
