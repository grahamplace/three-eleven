import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryFilterSelector } from "@/components/QueryFilterSelector";
import { MapProvider } from "@/contexts/MapContext";
import { getPredefinedQueries } from "@/lib/actions/service-requests";

// Mutable per test so URL-driven initial state can be seeded.
let searchParams = new URLSearchParams();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => searchParams,
  usePathname: () => "/",
}));

// Replace the Radix-based select with plain buttons. Radix's open/close
// behaviour relies on pointer-capture and layout APIs jsdom does not have,
// and it is not what this component's tests are about: they cover what the
// component feeds the select and what it does with the chosen value.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  type Ctx = {
    value: string;
    disabled?: boolean;
    onValueChange: (v: string) => void;
  };
  const SelectContext = React.createContext<Ctx>({
    value: "",
    onValueChange: () => {},
  });
  return {
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <SelectContext.Provider value={{ value, onValueChange, disabled }}>
        <div data-testid="select" data-value={value}>
          {children}
        </div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, ...props }: any) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button type="button" disabled={ctx.disabled} {...props}>
          {children}
        </button>
      );
    },
    SelectValue: ({ placeholder }: any) => {
      const ctx = React.useContext(SelectContext);
      return <span>{ctx.value || placeholder}</span>;
    },
    SelectContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    SelectItem: ({ value, children, ...props }: any) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button
          type="button"
          onClick={() => ctx.onValueChange(value)}
          {...props}
        >
          {children}
        </button>
      );
    },
  };
});

vi.mock("@/lib/actions/service-requests", () => ({
  getPredefinedQueries: vi.fn(),
}));

const queries = [
  { id: "poop", name: "Human/Animal Waste", description: "Waste" },
  { id: "graffiti", name: "Graffiti", description: "Graffiti" },
];

const renderSelector = () =>
  render(
    <MapProvider>
      <QueryFilterSelector />
    </MapProvider>,
  );

const lastPushedParams = () =>
  new URLSearchParams(String(push.mock.calls.at(-1)?.[0]).replace(/^\?/, ""));

describe("QueryFilterSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    vi.mocked(getPredefinedQueries).mockResolvedValue(queries);
  });

  it("is disabled until the queries have loaded, then enabled", async () => {
    let resolve!: (v: typeof queries) => void;
    vi.mocked(getPredefinedQueries).mockReturnValue(
      new Promise((r) => (resolve = r)),
    );

    renderSelector();
    const trigger = screen.getByTestId("query-filter-selector");
    expect(trigger).toBeDisabled();

    resolve(queries);
    await waitFor(() => expect(trigger).toBeEnabled());
  });

  it("lists All first, followed by every predefined query", async () => {
    renderSelector();

    await screen.findByTestId("query-option-graffiti");
    const options = screen
      .getByTestId("query-filter-options")
      .querySelectorAll("button");
    expect(Array.from(options).map((o) => o.textContent)).toEqual([
      "All",
      "Human/Animal Waste",
      "Graffiti",
    ]);
  });

  it("defaults to All when no query is selected", async () => {
    renderSelector();

    await screen.findByTestId("query-option-all");
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "all");
  });

  it("reflects a query selected in the URL", async () => {
    searchParams = new URLSearchParams("query=graffiti");

    renderSelector();

    await screen.findByTestId("query-option-all");
    await waitFor(() =>
      expect(screen.getByTestId("select")).toHaveAttribute(
        "data-value",
        "graffiti",
      ),
    );
  });

  it("writes the chosen query to the URL", async () => {
    renderSelector();

    fireEvent.click(await screen.findByTestId("query-option-graffiti"));

    expect(lastPushedParams().get("query")).toBe("graffiti");
    expect(screen.getByTestId("select")).toHaveAttribute(
      "data-value",
      "graffiti",
    );
  });

  it("removes the query from the URL when All is chosen", async () => {
    searchParams = new URLSearchParams("query=graffiti");
    renderSelector();
    await waitFor(() =>
      expect(screen.getByTestId("select")).toHaveAttribute(
        "data-value",
        "graffiti",
      ),
    );

    fireEvent.click(screen.getByTestId("query-option-all"));

    expect(lastPushedParams().has("query")).toBe(false);
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "all");
  });

  it("still renders, enabled, when the queries fail to load", async () => {
    vi.mocked(getPredefinedQueries).mockRejectedValue(new Error("boom"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    renderSelector();

    await waitFor(() =>
      expect(screen.getByTestId("query-filter-selector")).toBeEnabled(),
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
