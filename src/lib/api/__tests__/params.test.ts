import { describe, it, expect } from "vitest";
import {
  MAX_RANGE_DAYS,
  parseDate,
  parseDateRangeParams,
  parseResolution,
} from "@/lib/api/params";

const params = (q: string) => new URLSearchParams(q);

describe("api/params", () => {
  describe("parseDate", () => {
    it("accepts real YYYY-MM-DD dates", () => {
      expect(parseDate("2024-02-29")).toBe("2024-02-29");
    });

    it("rejects malformed, impossible, and missing dates", () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate("")).toBeNull();
      expect(parseDate("2024-1-5")).toBeNull();
      expect(parseDate("2024-02-31")).toBeNull();
      expect(parseDate("2023-02-29")).toBeNull();
      expect(parseDate("yesterday")).toBeNull();
      expect(parseDate("2024-01-01T00:00:00Z")).toBeNull();
    });
  });

  describe("parseDateRangeParams", () => {
    it("parses a valid range with no query", () => {
      expect(
        parseDateRangeParams(params("start=2024-01-01&end=2024-01-31")),
      ).toEqual({
        ok: true,
        value: { start: "2024-01-01", end: "2024-01-31", query: null },
      });
    });

    it("treats query=all the same as no query", () => {
      const result = parseDateRangeParams(
        params("start=2024-01-01&end=2024-01-31&query=all"),
      );
      expect(result.ok && result.value.query).toBeNull();
    });

    it("accepts a known predefined query", () => {
      const result = parseDateRangeParams(
        params("start=2024-01-01&end=2024-01-31&query=graffiti"),
      );
      expect(result.ok && result.value.query).toBe("graffiti");
    });

    it("rejects an unknown query", () => {
      const result = parseDateRangeParams(
        params("start=2024-01-01&end=2024-01-31&query=nope"),
      );
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toMatch(/unknown query/);
    });

    it("rejects missing or malformed dates", () => {
      expect(parseDateRangeParams(params("start=2024-01-01")).ok).toBe(false);
      expect(
        parseDateRangeParams(params("start=2024-01-01&end=not-a-date")).ok,
      ).toBe(false);
    });

    it("rejects start after end", () => {
      const result = parseDateRangeParams(
        params("start=2024-02-01&end=2024-01-01"),
      );
      expect(result.ok).toBe(false);
    });

    it("allows a range up to the maximum and rejects one beyond it", () => {
      // 2022-01-01 → 2024-01-02 is exactly 731 days.
      expect(
        parseDateRangeParams(params("start=2022-01-01&end=2024-01-02")).ok,
      ).toBe(true);
      expect(
        parseDateRangeParams(params("start=2022-01-01&end=2024-01-03")).ok,
      ).toBe(false);
      expect(MAX_RANGE_DAYS).toBe(731);
    });
  });

  describe("parseResolution", () => {
    it("accepts the rendered resolutions", () => {
      for (const r of [7, 8, 9, 10, 11]) {
        expect(parseResolution(String(r))).toEqual({ ok: true, value: r });
      }
    });

    it("rejects anything else", () => {
      expect(parseResolution(null).ok).toBe(false);
      expect(parseResolution("6").ok).toBe(false);
      expect(parseResolution("12").ok).toBe(false);
      expect(parseResolution("9.5").ok).toBe(false);
      expect(parseResolution("abc").ok).toBe(false);
    });
  });
});
