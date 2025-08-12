import { describe, it, expect } from "vitest";
import { supportedMediaDomains } from "@/lib/config";

describe("config", () => {
  describe("supportedMediaDomains", () => {
    it("contains expected media domains", () => {
      expect(supportedMediaDomains).toContain("spot-sf-res.cloudinary.com");
      expect(supportedMediaDomains).toContain("pbs.twimg.com");
    });

    it("is an array of strings", () => {
      expect(Array.isArray(supportedMediaDomains)).toBe(true);
      expect(
        supportedMediaDomains.every((domain) => typeof domain === "string")
      ).toBe(true);
    });

    it("has correct number of domains", () => {
      expect(supportedMediaDomains).toHaveLength(2);
    });

    it("contains valid domain names", () => {
      const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      supportedMediaDomains.forEach((domain) => {
        expect(domain).toMatch(domainRegex);
      });
    });

    it("contains cloudinary domain for SF resources", () => {
      expect(supportedMediaDomains).toContain("spot-sf-res.cloudinary.com");
    });

    it("contains Twitter image domain", () => {
      expect(supportedMediaDomains).toContain("pbs.twimg.com");
    });
  });
});
