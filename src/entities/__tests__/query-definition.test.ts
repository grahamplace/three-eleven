import { describe, it, expect } from "vitest";
import {
  evaluateServiceRequestAgainstQuery,
  getMatchingQueryIds,
  PREDEFINED_QUERIES,
} from "@/entities/query-definition";

describe("query-definition", () => {
  describe("evaluateServiceRequestAgainstQuery", () => {
    it("matches via 'in' with null-safe handling", () => {
      const req = {
        service_details: "Human/Animal Waste",
        service_name: null,
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      expect(
        evaluateServiceRequestAgainstQuery(req, PREDEFINED_QUERIES.poop)
      ).toBe(true);
    });

    it("matches via 'in' with different case", () => {
      const req = {
        service_details: "Human/Animal Waste",
        service_name: null,
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      expect(
        evaluateServiceRequestAgainstQuery(req, PREDEFINED_QUERIES.poop)
      ).toBe(true);
    });

    it("does not match when field is null", () => {
      const req = {
        service_details: null,
        service_name: null,
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      expect(
        evaluateServiceRequestAgainstQuery(req, PREDEFINED_QUERIES.poop)
      ).toBe(false);
    });

    it("matches noise reports", () => {
      const req = {
        service_details: null,
        service_name: "Noise Report",
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      expect(
        evaluateServiceRequestAgainstQuery(req, PREDEFINED_QUERIES.noise)
      ).toBe(true);
    });

    it("matches graffiti", () => {
      const req = {
        service_details: null,
        service_name: "Graffiti",
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      expect(
        evaluateServiceRequestAgainstQuery(req, PREDEFINED_QUERIES.graffiti)
      ).toBe(true);
    });
  });

  describe("getMatchingQueryIds", () => {
    it("returns matching query IDs for poop request", () => {
      const req = {
        service_details: "Human/Animal Waste",
        service_name: null,
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      const matches = getMatchingQueryIds(req);
      expect(matches).toContain("poop");
    });

    it("returns multiple matches when service request matches multiple queries", () => {
      const req = {
        service_details: "Human/Animal Waste",
        service_name: "Graffiti",
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      const matches = getMatchingQueryIds(req);
      expect(matches).toContain("poop");
      expect(matches).toContain("graffiti");
    });

    it("returns empty array when no matches", () => {
      const req = {
        service_details: "Some Other Service",
        service_name: "Unknown Service",
        service_subtype: null,
        status_description: null,
        agency_responsible: null,
      };
      const matches = getMatchingQueryIds(req);
      expect(matches).toEqual([]);
    });
  });
});
