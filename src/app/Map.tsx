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
import Image from "next/image";
import { ServiceRequest } from "@/entities";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function MapComponent({ token }: { token: string }) {
  return (
    <MapProvider>
      <MapContent token={token} />
    </MapProvider>
  );
}

function MapContent({ token }: { token: string }) {
  const [points, setPoints] = useState<any[]>([]);
  const [selectedRequestData, setSelectedRequestData] =
    useState<ServiceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<{
    longitude: number;
    latitude: number;
    serviceRequestId: string;
  } | null>(null);

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
        serviceRequestId: point.service_request_id,
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
    });
    map?.flyTo({
      center: [longitude, latitude],
      duration: 500,
    });
  };

  return (
    <div className="h-full w-full flex flex-row">
      <div className={"w-2/3"}>
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

      <div className="w-1/3 h-screen bg-white/95 dark:bg-gray-800/95 shadow-lg p-6 overflow-y-auto z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">
            Service Request Details
          </h2>
          <button
            onClick={() => setSelectedRequest(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {selectedRequest && (
          <div className="space-y-4">
            {selectedRequestData ? (
              <div className="flex flex-col gap-4">
                <pre className="whitespace-pre-wrap overflow-x-auto bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm">
                  {JSON.stringify(selectedRequestData, null, 2)}
                </pre>
                {selectedRequestData.media_url && (
                  <div className="relative w-full h-64">
                    <Image
                      src={selectedRequestData.media_url}
                      alt="Service Request Image"
                      fill
                      className="rounded-lg object-contain"
                      sizes="33vw"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
