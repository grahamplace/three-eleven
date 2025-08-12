import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getServiceRequests,
  getServiceRequestById,
  getServiceRequestsByPredefinedQuery,
  getPredefinedQueries,
} from "@/lib/actions/service-requests";

// Mock the store functions
vi.mock("@/store/service-request", () => ({
  findByDateAndType: vi.fn(),
  findAll: vi.fn(),
  find: vi.fn(),
}));

vi.mock("@/store/service-request-query-tags", () => ({
  findServiceRequestsByQueryId: vi.fn(),
}));

vi.mock("@/entities/data-transfer", () => ({
  serviceRequestToDTOThin: vi.fn((sr) => ({
    serviceRequestId: sr.service_request_id,
    latitude: sr.lat,
    longitude: sr.long,
    weight: 1,
  })),
}));

vi.mock("@/entities/query-definition", () => ({
  PREDEFINED_QUERIES: {
    poop: {
      id: "poop",
      name: "Human/Animal Waste",
      description: "Waste related requests",
    },
    graffiti: {
      id: "graffiti",
      name: "Graffiti",
      description: "Graffiti related requests",
    },
  },
}));

describe("service-requests actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getServiceRequests", () => {
    it("fetches all service requests when serviceDetails is empty", async () => {
      const mockServiceRequests = [
        {
          service_request_id: "1",
          requested_datetime: new Date("2024-01-01"),
          closed_date: null,
          updated_datetime: null,
          status_description: "open",
          status_notes: null,
          agency_responsible: null,
          service_name: null,
          service_subtype: null,
          service_details: "Waste",
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
          created_at: null,
          updated_at: null,
        },
        {
          service_request_id: "2",
          requested_datetime: new Date("2024-01-01"),
          closed_date: null,
          updated_datetime: null,
          status_description: "closed",
          status_notes: null,
          agency_responsible: null,
          service_name: null,
          service_subtype: null,
          service_details: "Graffiti",
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
          created_at: null,
          updated_at: null,
        },
      ];

      const { findAll } = await import("@/store/service-request");
      vi.mocked(findAll).mockResolvedValue(mockServiceRequests);

      const result = await getServiceRequests("2024-01-01", "2024-01-31", []);

      expect(findAll).toHaveBeenCalledWith("2024-01-01", "2024-01-31");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        serviceRequestId: "1",
        latitude: null,
        longitude: null,
        weight: 1,
      });
    });

    it("fetches filtered service requests when serviceDetails is provided", async () => {
      const mockServiceRequests = [
        {
          service_request_id: "1",
          requested_datetime: new Date("2024-01-01"),
          closed_date: null,
          updated_datetime: null,
          status_description: "open",
          status_notes: null,
          agency_responsible: null,
          service_name: null,
          service_subtype: null,
          service_details: "Waste",
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
          created_at: null,
          updated_at: null,
        },
      ];

      const { findByDateAndType } = await import("@/store/service-request");
      vi.mocked(findByDateAndType).mockResolvedValue(mockServiceRequests);

      const result = await getServiceRequests("2024-01-01", "2024-01-31", [
        "Waste",
      ]);

      expect(findByDateAndType).toHaveBeenCalledWith(
        "2024-01-01",
        "2024-01-31",
        ["Waste"]
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        serviceRequestId: "1",
        latitude: null,
        longitude: null,
        weight: 1,
      });
    });
  });

  describe("getServiceRequestById", () => {
    it("fetches a single service request by ID", async () => {
      const mockServiceRequest = {
        service_request_id: "1",
        requested_datetime: new Date("2024-01-01"),
        closed_date: null,
        updated_datetime: null,
        status_description: "open",
        status_notes: null,
        agency_responsible: null,
        service_name: null,
        service_subtype: null,
        service_details: "Waste",
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
        created_at: null,
        updated_at: null,
      };

      const { find } = await import("@/store/service-request");
      vi.mocked(find).mockResolvedValue(mockServiceRequest);

      const result = await getServiceRequestById("1");

      expect(find).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockServiceRequest);
    });

    it("returns null when service request is not found", async () => {
      const { find } = await import("@/store/service-request");
      vi.mocked(find).mockResolvedValue(null);

      const result = await getServiceRequestById("nonexistent");

      expect(find).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getServiceRequestsByPredefinedQuery", () => {
    it("fetches service requests by valid query ID", async () => {
      const mockServiceRequests = [
        {
          service_request_id: "1",
          requested_datetime: new Date("2024-01-01"),
          closed_date: null,
          updated_datetime: null,
          status_description: "open",
          status_notes: null,
          agency_responsible: null,
          service_name: null,
          service_subtype: null,
          service_details: "Waste",
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
          created_at: null,
          updated_at: null,
          latlon: null,
        },
      ];

      const { findServiceRequestsByQueryId } = await import(
        "@/store/service-request-query-tags"
      );
      vi.mocked(findServiceRequestsByQueryId).mockResolvedValue(
        mockServiceRequests
      );

      const result = await getServiceRequestsByPredefinedQuery(
        "poop",
        "2024-01-01",
        "2024-01-31"
      );

      expect(findServiceRequestsByQueryId).toHaveBeenCalledWith(
        "poop",
        "2024-01-01",
        "2024-01-31"
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        serviceRequestId: "1",
        latitude: null,
        longitude: null,
        weight: 1,
      });
    });

    it("throws error for invalid query ID", async () => {
      await expect(
        getServiceRequestsByPredefinedQuery(
          "invalid",
          "2024-01-01",
          "2024-01-31"
        )
      ).rejects.toThrow("Invalid query ID: invalid");
    });
  });

  describe("getPredefinedQueries", () => {
    it("returns all predefined queries", async () => {
      const result = await getPredefinedQueries();

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          id: "poop",
          name: "Human/Animal Waste",
          description: "Waste related requests",
        },
        {
          id: "graffiti",
          name: "Graffiti",
          description: "Graffiti related requests",
        },
      ]);
    });
  });
});
