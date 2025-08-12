import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DatePickerWithRange from "@/components/DatePickerWithRange";
import { MapProvider } from "@/contexts/MapContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === "yyyy-MM-dd") {
      return date.toISOString().split("T")[0];
    }
    if (formatStr === "LLL dd, y") {
      return date.toLocaleDateString();
    }
    return date.toString();
  }),
  subDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }),
  subYears: vi.fn((date, years) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() - years);
    return result;
  }),
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: vi.fn(({ children, onClick, variant, className, ...props }) => (
    <button
      onClick={onClick}
      className={`button ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )),
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: vi.fn(({ onSelect, selected, mode, numberOfMonths }) => (
    <div data-testid="calendar" data-mode={mode} data-months={numberOfMonths}>
      <button>Select Date</button>
      {selected && (
        <div data-testid="selected-dates">
          {selected.from && (
            <span data-testid="from-date">{selected.from.toISOString()}</span>
          )}
          {selected.to && (
            <span data-testid="to-date">{selected.to.toISOString()}</span>
          )}
        </div>
      )}
    </div>
  )),
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: vi.fn(({ children, open, onOpenChange }) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  )),
  PopoverContent: vi.fn(({ children, align }) => (
    <div data-testid="popover-content" data-align={align}>
      {children}
    </div>
  )),
  PopoverTrigger: vi.fn(({ children, asChild }) => (
    <div data-testid="popover-trigger" data-as-child={asChild}>
      {children}
    </div>
  )),
}));

// Mock icons
vi.mock("@heroicons/react/24/outline", () => ({
  CalendarIcon: vi.fn(() => <svg data-testid="calendar-icon" />),
}));

describe("DatePickerWithRange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders date picker with correct structure", () => {
    render(
      <MapProvider>
        <DatePickerWithRange />
      </MapProvider>
    );

    expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
    expect(screen.getByTestId("popover")).toBeInTheDocument();
    expect(screen.getByTestId("popover-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
  });

  it("displays calendar with range mode", () => {
    render(
      <MapProvider>
        <DatePickerWithRange />
      </MapProvider>
    );

    const calendars = screen.getAllByTestId("calendar");
    expect(calendars[0]).toHaveAttribute("data-mode", "range");
    expect(calendars[0]).toHaveAttribute("data-months", "2");
  });

  it("displays preset buttons", () => {
    render(
      <MapProvider>
        <DatePickerWithRange />
      </MapProvider>
    );

    // Should show preset buttons
    expect(screen.getAllByText("T7")[0]).toBeInTheDocument();
    expect(screen.getAllByText("T30")[0]).toBeInTheDocument();
    expect(screen.getAllByText("T90")[0]).toBeInTheDocument();
    expect(screen.getAllByText("1Y")[0]).toBeInTheDocument();
    expect(screen.getAllByText("YTD")[0]).toBeInTheDocument();
  });

  it("has correct CSS classes for styling", () => {
    render(
      <MapProvider>
        <DatePickerWithRange />
      </MapProvider>
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveClass("button", "outline");
  });

  it("displays date range in button text", () => {
    render(
      <MapProvider>
        <DatePickerWithRange />
      </MapProvider>
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
    // Check that it contains date information
    expect(buttons[0].textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
