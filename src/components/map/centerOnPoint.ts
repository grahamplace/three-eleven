import type { MapRef } from "react-map-gl";

/** Width of the desktop detail sidebar, which covers the left of the map. */
export const SIDEBAR_WIDTH = 400;

/**
 * Flies the map to a point. On desktop the detail sidebar covers the left
 * edge, so the target is shifted right by half the sidebar width (in screen
 * pixels, so it holds at any zoom) to land in the visible area's center.
 */
export function centerOnPoint(
  map: Pick<MapRef, "project" | "unproject" | "flyTo">,
  lngLat: [lng: number, lat: number],
  { isDesktop, duration = 500 }: { isDesktop: boolean; duration?: number },
) {
  if (!isDesktop) {
    map.flyTo({ center: lngLat, duration });
    return;
  }
  const pixel = map.project(lngLat);
  pixel.x -= SIDEBAR_WIDTH / 2;
  map.flyTo({ center: map.unproject(pixel), duration });
}
