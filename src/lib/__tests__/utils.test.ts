import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("combines class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("handles conditional classes", () => {
      expect(cn("base", true && "conditional", false && "hidden")).toBe(
        "base conditional"
      );
    });

    it("handles arrays of classes", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
    });

    it("handles objects with boolean values", () => {
      expect(cn("base", { conditional: true, hidden: false })).toBe(
        "base conditional"
      );
    });

    it("handles mixed input types", () => {
      expect(
        cn("base", ["array1", "array2"], { conditional: true }, "string")
      ).toBe("base array1 array2 conditional string");
    });

    it("handles empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(null, undefined, false, "")).toBe("");
    });

    it("deduplicates and merges Tailwind classes", () => {
      expect(cn("p-2 p-4", "p-3")).toBe("p-3"); // Last p-* class wins
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500"); // Last text-* class wins
    });
  });
});
