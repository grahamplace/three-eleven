import { describe, it, expect, afterEach } from "vitest";
import {
  dayChunksDesc,
  formatDay,
  formatSfDate,
  formatSfDateTime,
  fromSfWallClock,
  sfToday,
  toSfWallClock,
  toSfWallClockOrNull,
} from "@/lib/time";

const originalTz = process.env.TZ;

describe("lib/time", () => {
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  describe("fromSfWallClock", () => {
    it("treats a naive timestamp as Pacific standard time in winter", () => {
      expect(fromSfWallClock("2024-01-15T10:30:00.000").toISOString()).toBe(
        "2024-01-15T18:30:00.000Z",
      );
    });

    it("treats a naive timestamp as Pacific daylight time in summer", () => {
      expect(fromSfWallClock("2024-07-04T12:00:00.000").toISOString()).toBe(
        "2024-07-04T19:00:00.000Z",
      );
    });

    it("accepts Postgres' space-separated output", () => {
      expect(fromSfWallClock("2024-07-04 12:00:00").toISOString()).toBe(
        "2024-07-04T19:00:00.000Z",
      );
      expect(fromSfWallClock("2024-07-04 12:00:00.5").toISOString()).toBe(
        "2024-07-04T19:00:00.500Z",
      );
    });

    it("rejects garbage instead of returning an Invalid Date", () => {
      expect(() => fromSfWallClock("not a date")).toThrow(/Invalid/);
    });
  });

  describe("toSfWallClock", () => {
    it("formats an instant as Pacific wall-clock time", () => {
      expect(toSfWallClock(new Date("2024-01-15T18:30:00.000Z"))).toBe(
        "2024-01-15T10:30:00.000",
      );
      expect(toSfWallClock(new Date("2024-07-04T19:00:00.000Z"))).toBe(
        "2024-07-04T12:00:00.000",
      );
    });

    it("crosses the date line correctly", () => {
      // 3am UTC on the 5th is still the 4th in San Francisco.
      expect(toSfWallClock(new Date("2024-07-05T03:00:00.000Z"))).toBe(
        "2024-07-04T20:00:00.000",
      );
    });

    it("passes nulls through in the OrNull variant", () => {
      expect(toSfWallClockOrNull(null)).toBeNull();
      expect(toSfWallClockOrNull(undefined)).toBeNull();
      expect(toSfWallClockOrNull(new Date("2024-01-15T18:30:00.000Z"))).toBe(
        "2024-01-15T10:30:00.000",
      );
    });
  });

  it("round-trips a wall-clock string through Date and back unchanged", () => {
    for (const s of [
      "2024-01-15T10:30:00.000",
      "2024-07-04T12:00:00.000",
      "2024-03-10T01:59:59.000", // minute before the DST spring-forward gap
      "2024-11-03T01:30:00.000", // ambiguous hour during fall-back
    ]) {
      expect(toSfWallClock(fromSfWallClock(s))).toBe(s);
    }
  });

  it("is independent of the process time zone", () => {
    const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map((tz) => {
      process.env.TZ = tz;
      return {
        parsed: fromSfWallClock("2024-07-04T12:00:00.000").toISOString(),
        formatted: toSfWallClock(new Date("2024-07-04T19:00:00.000Z")),
      };
    });

    expect(new Set(results.map((r) => r.parsed)).size).toBe(1);
    expect(new Set(results.map((r) => r.formatted)).size).toBe(1);
    expect(results[0]).toEqual({
      parsed: "2024-07-04T19:00:00.000Z",
      formatted: "2024-07-04T12:00:00.000",
    });
  });

  describe("display helpers", () => {
    it("always render San Francisco time regardless of process TZ", () => {
      const instant = new Date("2024-07-05T03:00:00.000Z"); // 8pm on the 4th in SF
      for (const tz of ["UTC", "Asia/Tokyo"]) {
        process.env.TZ = tz;
        expect(formatSfDateTime(instant)).toBe("7/4/2024, 8:00:00 PM");
        expect(formatSfDate(instant)).toBe("7/4/2024");
      }
    });

    it("accept the ISO strings a server action serializes Dates into", () => {
      expect(formatSfDateTime("2024-01-15T18:30:00.000Z")).toBe(
        "1/15/2024, 10:30:00 AM",
      );
    });
  });

  describe("formatDay", () => {
    it("reads back the calendar day node-postgres parsed, not a UTC shift", () => {
      // node-postgres parses a `date` column to local midnight; formatting it
      // through a timezone would land on the previous day west of UTC.
      expect(formatDay(new Date(2024, 2, 15))).toBe("2024-03-15");
      expect(formatDay(new Date(2024, 0, 1))).toBe("2024-01-01");
      expect(formatDay(new Date(2024, 11, 31))).toBe("2024-12-31");
    });
  });

  describe("sfToday", () => {
    it("uses the San Francisco day, not the server's", () => {
      // 03:00 UTC on the 2nd is still the 1st in San Francisco.
      expect(sfToday(new Date("2024-07-02T03:00:00Z"))).toBe("2024-07-01");
      expect(sfToday(new Date("2024-07-02T18:00:00Z"))).toBe("2024-07-02");
    });
  });

  describe("dayChunksDesc", () => {
    it("walks an inclusive range backwards in chunks", () => {
      expect(dayChunksDesc("2024-03-01", "2024-03-05", 2)).toEqual([
        ["2024-03-05", "2024-03-04"],
        ["2024-03-03", "2024-03-02"],
        ["2024-03-01"],
      ]);
    });

    it("returns a single chunk when the range fits", () => {
      expect(dayChunksDesc("2024-03-01", "2024-03-01", 30)).toEqual([
        ["2024-03-01"],
      ]);
    });

    it("crosses a DST boundary without dropping or repeating a day", () => {
      // Pacific springs forward on 2024-03-10.
      const days = dayChunksDesc("2024-03-08", "2024-03-12", 30).flat();

      expect(days).toEqual([
        "2024-03-12",
        "2024-03-11",
        "2024-03-10",
        "2024-03-09",
        "2024-03-08",
      ]);
    });

    it("is empty when the range is inverted", () => {
      expect(dayChunksDesc("2024-03-05", "2024-03-01", 30)).toEqual([]);
    });

    it("rejects a chunk size below one", () => {
      expect(() => dayChunksDesc("2024-03-01", "2024-03-05", 0)).toThrow();
    });
  });
});
