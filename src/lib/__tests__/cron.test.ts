import { describe, it, expect, vi, beforeEach } from "vitest";

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

  beforeEach(async () => {
    // Import the function after mocking
    const module = await import("@/lib/cron/service-request");
    transformData = module.transformData;
  });
  describe("transformData", () => {
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

    it("transforms raw data correctly", () => {
      const result = transformData(mockRawData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        service_request_id: "test-1",
        requested_datetime: new Date("2024-01-15T10:30:00.000"),
        closed_date: null,
        updated_datetime: new Date("2024-01-15T10:30:00.000"),
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
        data_as_of: new Date("2024-01-15T10:30:00.000"),
        data_loaded_at: new Date("2024-01-15T10:30:00.000"),
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
        requested_datetime: new Date("2024-01-15T10:30:00.000"),
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
});
