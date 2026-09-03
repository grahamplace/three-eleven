import { describe, it, expect, vi } from "vitest";
import { centerOnPoint, SIDEBAR_WIDTH } from "@/components/map/centerOnPoint";
import { pointPaint } from "@/components/map/layers";

describe("centerOnPoint", () => {
  const makeMap = () => ({
    project: vi.fn(() => ({ x: 600, y: 400 })),
    unproject: vi.fn(() => ({ lng: -122.5, lat: 37.8 })),
    flyTo: vi.fn(),
  });

  it("flies straight to the point on mobile", () => {
    const map = makeMap();

    centerOnPoint(map as never, [-122.4, 37.7], { isDesktop: false });

    expect(map.flyTo).toHaveBeenCalledWith({
      center: [-122.4, 37.7],
      duration: 500,
    });
    expect(map.project).not.toHaveBeenCalled();
  });

  it("offsets by half the sidebar width in screen pixels on desktop", () => {
    const map = makeMap();

    centerOnPoint(map as never, [-122.4, 37.7], { isDesktop: true });

    expect(map.project).toHaveBeenCalledWith([-122.4, 37.7]);
    expect(map.unproject).toHaveBeenCalledWith({
      x: 600 - SIDEBAR_WIDTH / 2,
      y: 400,
    });
    expect(map.flyTo).toHaveBeenCalledWith({
      center: { lng: -122.5, lat: 37.8 },
      duration: 500,
    });
  });
});

describe("pointPaint", () => {
  it("keeps circles fully visible in points mode", () => {
    const paint = pointPaint({
      mode: "points",
      selectedId: "",
      theme: "light",
    });

    expect(paint?.["circle-opacity"]).toBe(1);
    expect(paint?.["circle-stroke-color"]).toBe("gray");
  });

  it("fades circles in with zoom in heatmap mode", () => {
    const paint = pointPaint({
      mode: "heatmap",
      selectedId: "",
      theme: "dark",
    });

    expect(paint?.["circle-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      14,
      0,
      15,
      1,
    ]);
    expect(paint?.["circle-stroke-color"]).toBe("white");
  });

  it("highlights the selected request by id", () => {
    const paint = pointPaint({
      mode: "points",
      selectedId: "abc",
      theme: "light",
    });

    expect(JSON.stringify(paint?.["circle-color"])).toContain(
      '["get","serviceRequestId"],"abc"',
    );
  });
});
