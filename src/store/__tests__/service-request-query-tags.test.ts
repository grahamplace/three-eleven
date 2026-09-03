import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeQueryTags,
  replaceQueryTagsForMany,
} from "@/store/service-request-query-tags";
import * as queries from "@/store/queries/service_request_query_tags.queries";

vi.mock("@/lib/db", () => ({
  db: { query: vi.fn() },
}));

vi.mock("@/store/queries/service_request_query_tags.queries", () => ({
  createServiceRequestQueryTags: { run: vi.fn() },
  deleteServiceRequestQueryTagsForMany: { run: vi.fn() },
}));

const base = {
  service_details: null,
  service_name: null,
  service_subtype: null,
  status_description: null,
  agency_responsible: null,
};

const graffiti = { ...base, service_request_id: "1", service_name: "Graffiti" };
const poop = {
  ...base,
  service_request_id: "2",
  service_details: "Human/Animal Waste",
};
const untagged = { ...base, service_request_id: "3", service_name: "Other" };

const conn = { query: vi.fn() };

describe("computeQueryTags", () => {
  it("emits one row per matching (request, query) pair", () => {
    expect(computeQueryTags([graffiti, poop, untagged])).toEqual([
      { service_request_id: "1", query_id: "graffiti" },
      { service_request_id: "2", query_id: "poop" },
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(computeQueryTags([untagged])).toEqual([]);
  });
});

describe("replaceQueryTagsForMany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing for an empty batch", async () => {
    const result = await replaceQueryTagsForMany([], conn);

    expect(result).toEqual([]);
    expect(
      queries.deleteServiceRequestQueryTagsForMany.run,
    ).not.toHaveBeenCalled();
    expect(queries.createServiceRequestQueryTags.run).not.toHaveBeenCalled();
  });

  it("deletes existing tags for the batch before inserting current ones", async () => {
    const result = await replaceQueryTagsForMany([graffiti, untagged], conn);

    expect(
      queries.deleteServiceRequestQueryTagsForMany.run,
    ).toHaveBeenCalledWith({ service_request_ids: ["1", "3"] }, conn);
    expect(queries.createServiceRequestQueryTags.run).toHaveBeenCalledWith(
      { tags: [{ service_request_id: "1", query_id: "graffiti" }] },
      conn,
    );
    expect(result).toEqual([{ service_request_id: "1", query_id: "graffiti" }]);

    const deleteOrder = vi.mocked(
      queries.deleteServiceRequestQueryTagsForMany.run,
    ).mock.invocationCallOrder[0];
    const insertOrder = vi.mocked(queries.createServiceRequestQueryTags.run)
      .mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(insertOrder);
  });

  it("still clears stale tags when no request in the batch matches anything", async () => {
    const result = await replaceQueryTagsForMany([untagged], conn);

    expect(
      queries.deleteServiceRequestQueryTagsForMany.run,
    ).toHaveBeenCalledWith({ service_request_ids: ["3"] }, conn);
    expect(queries.createServiceRequestQueryTags.run).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("propagates database errors instead of swallowing them", async () => {
    const boom = new Error("connection reset");
    vi.mocked(queries.createServiceRequestQueryTags.run).mockRejectedValueOnce(
      boom,
    );

    await expect(replaceQueryTagsForMany([graffiti], conn)).rejects.toBe(boom);
  });
});
