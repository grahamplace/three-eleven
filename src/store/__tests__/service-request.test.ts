import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMany, find, findByQueryId } from "@/store/service-request";
import { withTransaction } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import * as tagQueries from "@/store/queries/service_request_query_tags.queries";
import { replaceQueryTagsForMany } from "@/store/service-request-query-tags";

const tx = { query: vi.fn() };

vi.mock("@/lib/db", () => ({
  db: { query: vi.fn() },
  withTransaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(tx),
  ),
}));

vi.mock("@/store/queries/service_request.queries", () => ({
  getLatestUpdatedDatetime: { run: vi.fn() },
  findServiceRequestById: { run: vi.fn() },
  findServiceRequestByDateAndType: { run: vi.fn() },
  findAllServiceRequestsByDate: { run: vi.fn() },
  createServiceRequests: { run: vi.fn() },
}));

vi.mock("@/store/queries/service_request_query_tags.queries", () => ({
  findServiceRequestsByQueryId: { run: vi.fn() },
}));

vi.mock("@/store/service-request-query-tags", () => ({
  replaceQueryTagsForMany: vi.fn(async () => []),
}));

const row = {
  service_request_id: "1",
  requested_datetime: new Date("2024-01-01T00:00:00Z"),
  closed_date: null,
  updated_datetime: null,
  status_description: "Open",
  status_notes: null,
  agency_responsible: null,
  service_name: "Graffiti",
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
  lat: 37.7,
  long: -122.4,
  media_url: null,
  created_at: null,
  updated_at: null,
  latlon: null,
};

describe("store/service-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMany", () => {
    it("skips the database entirely for an empty batch", async () => {
      const result = await createMany([]);

      expect(result).toEqual([]);
      expect(withTransaction).not.toHaveBeenCalled();
    });

    it("upserts and replaces tags on the same transaction connection", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);

      const input = [{ ...row, created_at: undefined, updated_at: undefined }];
      await createMany(input as any);

      expect(withTransaction).toHaveBeenCalledTimes(1);
      expect(queries.createServiceRequests.run).toHaveBeenCalledWith(
        expect.objectContaining({
          requests: [expect.objectContaining({ service_request_id: "1" })],
        }),
        tx,
      );
      expect(replaceQueryTagsForMany).toHaveBeenCalledWith(input, tx);
    });

    it("lets a tag failure abort the transaction", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);
      const boom = new Error("tags failed");
      vi.mocked(replaceQueryTagsForMany).mockRejectedValueOnce(boom);

      await expect(createMany([row] as any)).rejects.toBe(boom);
    });
  });

  describe("media url filtering", () => {
    it("keeps media urls on supported domains", async () => {
      vi.mocked(queries.findServiceRequestById.run).mockResolvedValue([
        { ...row, media_url: "https://pbs.twimg.com/a.jpg" },
      ]);

      const result = await find("1");

      expect(result?.media_url).toBe("https://pbs.twimg.com/a.jpg");
    });

    it("nulls media urls on unsupported domains", async () => {
      vi.mocked(queries.findServiceRequestById.run).mockResolvedValue([
        { ...row, media_url: "https://evil.example/a.jpg" },
      ]);

      const result = await find("1");

      expect(result?.media_url).toBeNull();
    });

    it("nulls malformed media urls", async () => {
      vi.mocked(queries.findServiceRequestById.run).mockResolvedValue([
        { ...row, media_url: "not a url" },
      ]);

      const result = await find("1");

      expect(result?.media_url).toBeNull();
    });

    it("applies the same filtering to query-tag lookups", async () => {
      vi.mocked(tagQueries.findServiceRequestsByQueryId.run).mockResolvedValue([
        { ...row, media_url: "https://evil.example/a.jpg" },
      ]);

      const result = await findByQueryId(
        "graffiti",
        "2024-01-01",
        "2024-01-31",
      );

      expect(tagQueries.findServiceRequestsByQueryId.run).toHaveBeenCalledWith(
        {
          query_id: "graffiti",
          date_start: "2024-01-01",
          date_end: "2024-01-31",
        },
        expect.anything(),
      );
      expect(result[0].media_url).toBeNull();
    });
  });

  it("returns null when a request is not found", async () => {
    vi.mocked(queries.findServiceRequestById.run).mockResolvedValue([]);

    expect(await find("missing")).toBeNull();
  });
});
