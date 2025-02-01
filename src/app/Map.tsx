"use client";

import { useState, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl";
import { getServiceRequests } from "@/lib/actions/service-requests";

export default function MapComponent({ token }: { token: string }) {
  const [points, setPoints] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("client: fetching service request data from server");
      const data = await getServiceRequests("2024-01-01", "2024-12-31", [
        "Human or Animal Waste",
      ]);
      console.log("client: service request data fetched", data);
      setPoints(data);
    };

    fetchData();
  }, []);

  const geojson = {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: {
        weight: point.weight,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={{
        longitude: -122.44,
        latitude: 37.77,
        zoom: 12.25,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      <Source type="geojson" data={geojson}>
        <Layer
          id="heatmap-layer"
          type="heatmap"
          paint={{
            "heatmap-weight": ["get", "weight"],
            "heatmap-intensity": 1.5,
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
            "heatmap-radius": 15,
            "heatmap-opacity": 0.8,
          }}
        />
      </Source>
    </Map>
  );
}
