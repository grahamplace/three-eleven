import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/use-media-query";

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    vi.clearAllTimers();
  });

  it("returns false initially", () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("returns true when media query matches", () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("updates when media query changes", () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);

    // Simulate media query change
    const changeHandler = mockAddEventListener.mock.calls[0][1];
    changeHandler({ matches: true });

    expect(result.current).toBe(true);
  });

  it("adds and removes event listeners correctly", () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("handles multiple media queries", () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result: result1 } = renderHook(() =>
      useMediaQuery("(max-width: 768px)")
    );
    const { result: result2 } = renderHook(() =>
      useMediaQuery("(min-width: 1024px)")
    );

    expect(result1.current).toBe(false);
    expect(result2.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledTimes(2);
  });

  it("handles media query with no matches", () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery("(invalid-query)"));
    expect(result.current).toBe(false);
  });
});
