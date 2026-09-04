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
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { getServiceRequestById } from "@/lib/actions/service-requests";
import { ServiceRequest } from "@/entities";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getResolutionFromZoom, hexCountsToFeatures } from "@/lib/h3";
import { useMapContext } from "@/contexts/MapContext";
import { formatSfDate } from "@/lib/time";
import ServiceRequestDetail from "./ServiceRequestDetail";
import { Badge } from "./ui/badge";
import { useMapData } from "./map/useMapData";
import { centerOnPoint } from "./map/centerOnPoint";
import { LoadingOverlay, RefreshingIndicator } from "./map/LoadingOverlay";
import {
  HEATMAP_PAINT,
  HEXAGON_FILL_PAINT,
  hexagonOutlinePaint,
  pointPaint,
} from "./map/layers";

const INITIAL_VIEW = { longitude: -122.44, latitude: 37.77, zoom: 11.5 };

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
  const { map } = useMap();
  const {
    mode,
    selectedRequestId,
    setSelectedRequestId,
    dateRange,
    selectedQuery,
  } = useMapContext();

  // Only the resolution is tracked, not the raw zoom: panning and zooming
  // within a band then costs no render at all.
  const [resolution, setResolution] = useState(() =>
    getResolutionFromZoom(INITIAL_VIEW.zoom),
  );
  const [selectedRequestData, setSelectedRequestData] =
    useState<ServiceRequest | null>(null);

  const isHexabin = mode === "hexabin";
  const { isLoading, isRefreshing, points, hexCounts, hexResolution } =
    useMapData({
      dateRange,
      selectedQuery,
      isHexabin,
      resolution,
      dataVersion: dataAsOf.toISOString(),
    });

  // Selection lives in the URL (?id=), so deep links open the panel too.
  const selectedId = selectedRequestId;

  useEffect(() => {
    if (!selectedId) {
      setSelectedRequestData(null);
      return;
    }
    let cancelled = false;
    setSelectedRequestData(null);
    getServiceRequestById(selectedId)
      .then((data) => {
        if (!cancelled) setSelectedRequestData(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load request details. Please try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: points.map(([id, lng, lat]) => ({
        type: "Feature",
        properties: { weight: 1, serviceRequestId: id },
        geometry: { type: "Point", coordinates: [lng, lat] },
      })),
    }),
    [points],
  );

  // Keyed off the data, not the viewport, so panning never rebuilds it. While
  // a resolution change is in flight the hexes already on screen stay put.
  const hexagonData = useMemo(
    () => (isHexabin && hexResolution ? hexCountsToFeatures(hexCounts) : null),
    [hexCounts, hexResolution, isHexabin],
  );

  const handleMapMove = useCallback(() => {
    if (!map) return;
    setResolution(getResolutionFromZoom(map.getZoom()));
  }, [map]);

  const handleMapInteraction = (event: MapMouseEvent | MapTouchEvent) => {
    if (!event.features?.length) {
      setSelectedRequestId(null);
      return;
    }
    const { lng, lat } = event.lngLat;
    const requestId = event.features[0].properties?.serviceRequestId || "";
    setSelectedRequestId(requestId);
    if (map) centerOnPoint(map, [lng, lat], { isDesktop });
  };

  const pointLayerPaint = useMemo(
    () => pointPaint({ mode, selectedId: selectedId || "", theme }),
    [mode, selectedId, theme],
  );

  return (
    <div className="relative h-screen w-full" data-testid="map">
      <div className="h-full w-full flex flex-row">
        <div className="w-full">
          <div className="relative h-full">
            <Map
              id="map"
              mapboxAccessToken={token}
              initialViewState={INITIAL_VIEW}
              style={{ height: "100vh" }}
              mapStyle={`mapbox://styles/mapbox/${theme === "dark" ? "dark" : "light"}-v11`}
              onClick={handleMapInteraction}
              onTouchEnd={handleMapInteraction}
              interactiveLayerIds={["point-layer"]}
              onMoveEnd={handleMapMove}
              onLoad={handleMapMove}
            >
              {isLoading && <LoadingOverlay />}
              {isRefreshing && <RefreshingIndicator />}

              {isHexabin && hexagonData && (
                <Source type="geojson" data={hexagonData}>
                  <Layer
                    id="hexagon-layer"
                    type="fill"
                    paint={HEXAGON_FILL_PAINT}
                  />
                  <Layer
                    id="hexagon-outline"
                    type="line"
                    paint={hexagonOutlinePaint(theme)}
                  />
                </Source>
              )}

              {mode === "heatmap" && (
                <Source type="geojson" data={geojson}>
                  <Layer
                    id="heatmap-layer"
                    type="heatmap"
                    paint={HEATMAP_PAINT}
                  />
                </Source>
              )}

              {(mode === "points" || mode === "heatmap") && (
                <Source type="geojson" data={geojson}>
                  <Layer
                    id="point-layer"
                    type="circle"
                    paint={pointLayerPaint}
                  />
                </Source>
              )}
            </Map>
          </div>
        </div>

        <ServiceRequestDetail
          selectedRequestId={selectedId}
          selectedRequestData={selectedRequestData}
        />
        <div className="fixed right-0 bottom-0 p-2">
          <Badge variant="default">
            Data updated: {formatSfDate(dataAsOf)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
