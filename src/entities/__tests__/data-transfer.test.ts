import { describe, it, expect } from "vitest";
import { serviceRequestToDTOThin } from "@/entities/data-transfer";
import { ServiceRequest } from "@/entities";

describe("data-transfer", () => {
  describe("serviceRequestToDTOThin", () => {
    it("maps service request to DTO correctly", () => {
      const serviceRequest: ServiceRequest = {
        service_request_id: "test-123",
        requested_datetime: new Date("2024-01-15T10:30:00Z"),
        closed_date: null,
        updated_datetime: new Date("2024-01-15T10:30:00Z"),
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
        data_as_of: new Date("2024-01-15T10:30:00Z"),
        data_loaded_at: new Date("2024-01-15T10:30:00Z"),
        lat: 37.7749,
        long: -122.4194,
        media_url: null,
        created_at: new Date("2024-01-15T10:30:00Z"),
        updated_at: new Date("2024-01-15T10:30:00Z"),
      };

      const result = serviceRequestToDTOThin(serviceRequest);

      expect(result).toEqual({
        serviceRequestId: "test-123",
        latitude: 37.7749,
        longitude: -122.4194,
        weight: 1,
      });
    });

    it("handles null coordinates", () => {
      const serviceRequest: ServiceRequest = {
        service_request_id: "test-123",
        requested_datetime: new Date("2024-01-15T10:30:00Z"),
        closed_date: null,
        updated_datetime: new Date("2024-01-15T10:30:00Z"),
        status_description: "Open",
        status_notes: null,
        agency_responsible: "DPW",
        service_name: "Graffiti",
        service_subtype: null,
        service_details: null,
        address: "123 Test St",
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

      const result = serviceRequestToDTOThin(serviceRequest);

      expect(result).toEqual({
        serviceRequestId: "test-123",
        latitude: null,
        longitude: null,
        weight: 1,
      });
    });

    it("always returns weight of 1", () => {
      const serviceRequest: ServiceRequest = {
        service_request_id: "test-123",
        requested_datetime: new Date("2024-01-15T10:30:00Z"),
        closed_date: null,
        updated_datetime: new Date("2024-01-15T10:30:00Z"),
        status_description: "Open",
        status_notes: null,
        agency_responsible: "DPW",
        service_name: "Graffiti",
        service_subtype: null,
        service_details: null,
        address: "123 Test St",
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

      const result = serviceRequestToDTOThin(serviceRequest);

      expect(result.weight).toBe(1);
    });
  });
});
