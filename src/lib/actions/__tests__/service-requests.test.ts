import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getServiceRequestById,
  getPredefinedQueries,
} from "@/lib/actions/service-requests";
import { find } from "@/store/service-request";

vi.mock("@/store/service-request", () => ({
  find: vi.fn(),
}));

vi.mock("@/entities/query-definition", () => ({
  PREDEFINED_QUERIES: {
    poop: {
      id: "poop",
      name: "Human/Animal Waste",
      description: "Waste related requests",
      rules: [],
    },
    graffiti: {
      id: "graffiti",
      name: "Graffiti",
      description: "Graffiti related requests",
      rules: [],
    },
  },
}));

describe("service-requests actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        lat: 37.7749,
        long: -122.4194,
        media_url: null,
        created_at: null,
        updated_at: null,
      };
      vi.mocked(find).mockResolvedValue(mockServiceRequest);

      const result = await getServiceRequestById("1");

      expect(find).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockServiceRequest);
    });

    it("returns null when service request is not found", async () => {
      vi.mocked(find).mockResolvedValue(null);

      expect(await getServiceRequestById("missing")).toBeNull();
    });
  });

  describe("getPredefinedQueries", () => {
    it("returns id, name, and description for every predefined query", async () => {
      const result = await getPredefinedQueries();

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
