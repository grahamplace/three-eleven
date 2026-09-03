import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingOverlay } from "@/components/map/LoadingOverlay";

describe("LoadingOverlay", () => {
  it("renders the loading message", () => {
    render(<LoadingOverlay />);

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("covers its container and sits above the map layers", () => {
    const { container } = render(<LoadingOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("absolute", "inset-0", "z-50");
  });
});
