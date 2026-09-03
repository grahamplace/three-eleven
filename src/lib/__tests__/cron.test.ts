import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromSfWallClock } from "@/lib/time";

const { sodaExecute, sodaOffset } = vi.hoisted(() => ({
  sodaExecute: vi.fn(),
  sodaOffset: vi.fn(),
}));

// Chainable stand-in for the SODA client; only execute() and offset() matter.
vi.mock("@/lib/sfdata", () => {
  const chain: Record<string, unknown> = {};
  for (const m of ["query", "where", "orderBy", "limit"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.offset = vi.fn((n: number) => {
    sodaOffset(n);
    return chain;
  });
  chain.execute = () => sodaExecute();
  return { default: chain, ResourceId: { SERVICE_REQUESTS: "test" } };
});

vi.mock("@/store/service-request", () => ({
  createMany: vi.fn(async () => []),
}));

vi.mock("@/store/metadata", () => ({
  getLatestUpdatedDatetime: vi.fn(async () => new Date("2024-01-01T08:00:00Z")),
  setLatestUpdatedDatetime: vi.fn(async () => {}),
}));

// Mock the database connection to prevent process.exit
vi.mock("@/lib/db", () => ({
  db: {
    query: vi.fn(),
  },
}));

// Mock Redis to prevent envobj errors
vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock the server actions
vi.mock("@/lib/actions/service-requests", () => ({
  getServiceRequests: vi.fn(),
  getServiceRequestsByPredefinedQuery: vi.fn(),
}));

describe("cron", () => {
  let transformData: any;
  let ingestServiceRequests: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import the function after mocking
    const mod = await import("@/lib/cron/service-request");
    transformData = mod.transformData;
    ingestServiceRequests = mod.ingestServiceRequests;
  });
  const mockRawData = [
    {
      service_request_id: "test-1",
      requested_datetime: "2024-01-15T10:30:00.000",
      closed_date: null,
      updated_datetime: "2024-01-15T10:30:00.000",
      status_description: "Open",
      status_notes: "Test request",
      agency_responsible: "DPW",
      service_name: "Graffiti",
      service_subtype: "Public Property",
      service_details: "Test graffiti",
      address: "123 Test St",
      street: "Test St",
      supervisor_district: "6",
      neighborhoods_sffind_boundaries: "Test Neighborhood",
      analysis_neighborhood: "Test District",
      police_district: "Central",
      source: "Test",
      data_as_of: "2024-01-15T10:30:00.000",
      data_loaded_at: "2024-01-15T10:30:00.000",
      lat: "37.7749",
      long: "-122.4194",
      media_url: null,
    },
  ];

  describe("transformData", () => {
    it("interprets SODA floating timestamps as Pacific time, not server-local", () => {
      const result = transformData([
        { ...mockRawData[0], requested_datetime: "2024-07-04T12:00:00.000" },
      ]);
      // Noon PDT is 19:00 UTC.
      expect(result[0].requested_datetime.toISOString()).toBe(
        "2024-07-04T19:00:00.000Z",
      );
    });

    it("transforms raw data correctly", () => {
      const result = transformData(mockRawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        service_request_id: "test-1",
        requested_datetime: fromSfWallClock("2024-01-15T10:30:00.000"),
        closed_date: null,
        updated_datetime: fromSfWallClock("2024-01-15T10:30:00.000"),
        status_description: "Open",
        status_notes: "Test request",
        agency_responsible: "DPW",
        service_name: "Graffiti",
        service_subtype: "Public Property",
        service_details: "Test graffiti",
        address: "123 Test St",
        street: "Test St",
        supervisor_district: 6,
        neighborhoods_sffind_boundaries: "Test Neighborhood",
        analysis_neighborhood: "Test District",
        police_district: "Central",
        source: "Test",
        data_as_of: fromSfWallClock("2024-01-15T10:30:00.000"),
        data_loaded_at: fromSfWallClock("2024-01-15T10:30:00.000"),
        lat: 37.7749,
        long: -122.4194,
        media_url: null,
      });
    });

    it("handles null values correctly", () => {
      const rawDataWithNulls = [
        {
          service_request_id: "test-1",
          requested_datetime: "2024-01-15T10:30:00.000",
          closed_date: null,
          updated_datetime: null,
          status_description: null,
          status_notes: null,
          agency_responsible: null,
          service_name: null,
          service_subtype: null,
          service_details: null,
          address: null,
          street: null,
          supervisor_district: null,
          neighborhoods_sffind_boundaries: null,
          analysis_neighborhood: null,
          police_district: null,
          source: null,
          data_as_of: null,
          data_loaded_at: null,
          lat: null,
          long: null,
          media_url: null,
        },
      ];

      const result = transformData(rawDataWithNulls);

      expect(result[0]).toEqual({
        service_request_id: "test-1",
        requested_datetime: fromSfWallClock("2024-01-15T10:30:00.000"),
        closed_date: null,
        updated_datetime: null,
        status_description: null,
        status_notes: null,
        agency_responsible: null,
        service_name: null,
        service_subtype: null,
        service_details: null,
        address: null,
        street: null,
        supervisor_district: null,
        neighborhoods_sffind_boundaries: null,
        analysis_neighborhood: null,
        police_district: null,
        source: null,
        data_as_of: null,
        data_loaded_at: null,
        lat: null,
        long: null,
        media_url: null,
      });
    });

    it("parses numeric fields correctly", () => {
      const rawDataWithNumbers = [
        {
          ...mockRawData[0],
          supervisor_district: "3",
          lat: "37.7897",
          long: "-122.3981",
        },
      ];

      const result = transformData(rawDataWithNumbers);

      expect(result[0].supervisor_district).toBe(3);
      expect(result[0].lat).toBe(37.7897);
      expect(result[0].long).toBe(-122.3981);
    });

    it("handles empty array", () => {
      const result = transformData([]);
      expect(result).toEqual([]);
    });

    it("handles media_url with object structure", () => {
      const rawDataWithMediaUrl = [
        {
          ...mockRawData[0],
          media_url: { url: "https://example.com/image.jpg" },
        },
      ];

      const result = transformData(rawDataWithMediaUrl);

      expect(result[0].media_url).toBe("https://example.com/image.jpg");
    });
  });

  describe("ingestServiceRequests", () => {
    const page = (n: number, prefix: string) =>
      Array.from({ length: n }, (_, i) => ({
        ...mockRawData[0],
        service_request_id: `${prefix}-${i}`,
      }));

    it("pages by offset until a short page, then advances the watermark", async () => {
      const { createMany } = await import("@/store/service-request");
      const { setLatestUpdatedDatetime } = await import("@/store/metadata");
      sodaExecute
        .mockResolvedValueOnce({ data: page(1000, "a") })
        .mockResolvedValueOnce({ data: page(300, "b") });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "info").mockImplementation(() => {});

      const summary = await ingestServiceRequests({ delayMs: 0 });

      expect(sodaOffset.mock.calls.map((c) => c[0])).toEqual([0, 1000]);
      expect(createMany).toHaveBeenCalledTimes(2);
      expect(setLatestUpdatedDatetime).toHaveBeenCalledTimes(1);
      expect(summary).toEqual({
        totalProcessed: 1300,
        batches: 2,
        hitBatchCap: false,
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it("stops at the batch cap and warns that rows remain upstream", async () => {
      const { createMany } = await import("@/store/service-request");
      const { setLatestUpdatedDatetime } = await import("@/store/metadata");
      sodaExecute.mockResolvedValue({ data: page(1000, "x") });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "info").mockImplementation(() => {});

      const summary = await ingestServiceRequests({
        maxBatches: 2,
        delayMs: 0,
      });

      expect(createMany).toHaveBeenCalledTimes(2);
      expect(summary).toEqual({
        totalProcessed: 2000,
        batches: 2,
        hitBatchCap: true,
      });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/batch cap/));
      // The watermark still advances so the next run resumes, not repeats.
      expect(setLatestUpdatedDatetime).toHaveBeenCalledTimes(1);
    });

    it("handles no new rows without writing", async () => {
      const { createMany } = await import("@/store/service-request");
      sodaExecute.mockResolvedValueOnce({ data: [] });
      vi.spyOn(console, "info").mockImplementation(() => {});

      const summary = await ingestServiceRequests({ delayMs: 0 });

      expect(createMany).not.toHaveBeenCalled();
      expect(summary).toEqual({
        totalProcessed: 0,
        batches: 0,
        hitBatchCap: false,
      });
    });
  });
});
