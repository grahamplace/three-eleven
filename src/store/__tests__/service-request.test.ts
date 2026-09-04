import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  countByH3Cell,
  createMany,
  find,
  findByQueryId,
  pruneH3Daily,
  refreshH3DailyForDays,
  rollupHorizonDay,
} from "@/store/service-request";
import { withTransaction } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import * as tagQueries from "@/store/queries/service_request_query_tags.queries";
import { replaceQueryTagsForMany } from "@/store/service-request-query-tags";
import { formatDay } from "@/lib/time";

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
  countByH3Cell: { run: vi.fn() },
  countByH3CellForQuery: { run: vi.fn() },
  countH3DailyCells: { run: vi.fn() },
  pruneH3DailyBefore: { run: vi.fn() },
  deleteH3DailyForDays: { run: vi.fn() },
  insertH3DailyForDays: { run: vi.fn() },
  findDaysForRequests: { run: vi.fn(async () => []) },
}));

vi.mock("@/store/queries/service_request_query_tags.queries", () => ({
  findServiceRequestsByQueryId: { run: vi.fn() },
}));

vi.mock("@/store/service-request-query-tags", () => ({
  replaceQueryTagsForMany: vi.fn(async () => []),
}));

/** A day the rollup definitely covers. */
const inHorizon = formatDay(new Date());

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
  h3_r7: null,
  h3_r8: null,
  h3_r9: null,
  h3_r10: null,
  h3_r11: null,
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

    it("writes datetimes as Pacific wall-clock strings, not server-local Dates", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);

      await createMany([
        {
          ...row,
          requested_datetime: new Date("2024-07-04T19:00:00.000Z"),
          closed_date: new Date("2024-01-15T18:30:00.000Z"),
          updated_datetime: null,
        },
      ] as any);

      const { requests } = vi.mocked(queries.createServiceRequests.run).mock
        .calls[0][0] as any;
      expect(requests[0]).toMatchObject({
        requested_datetime: "2024-07-04T12:00:00.000",
        closed_date: "2024-01-15T10:30:00.000",
        updated_datetime: null,
      });
    });

    it("lets a tag failure abort the transaction", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);
      const boom = new Error("tags failed");
      vi.mocked(replaceQueryTagsForMany).mockRejectedValueOnce(boom);

      await expect(createMany([row] as any)).rejects.toBe(boom);
    });
  });

  describe("hexbin rollup", () => {
    it("recomputes the rollup for the days a batch touches, on the same transaction", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);
      const today = new Date();
      vi.mocked(queries.findDaysForRequests.run).mockResolvedValue([
        { day: today },
      ]);

      await createMany([row] as any);

      expect(queries.findDaysForRequests.run).toHaveBeenCalledWith(
        { ids: ["1"] },
        tx,
      );
      const days = [formatDay(today)];
      expect(queries.deleteH3DailyForDays.run).toHaveBeenCalledWith(
        { days },
        tx,
      );
      expect(queries.insertH3DailyForDays.run).toHaveBeenCalledWith(
        { days },
        tx,
      );
    });

    it("skips days that have already aged past the rollup horizon", async () => {
      vi.mocked(queries.createServiceRequests.run).mockResolvedValue([]);
      const today = new Date();
      vi.mocked(queries.findDaysForRequests.run).mockResolvedValue([
        { day: new Date("2009-06-15T00:00:00") },
        { day: today },
      ]);

      await createMany([row] as any);

      expect(queries.deleteH3DailyForDays.run).toHaveBeenCalledWith(
        { days: [formatDay(today)] },
        tx,
      );
    });

    it("prunes the rollup back to the horizon", async () => {
      await pruneH3Daily();

      expect(queries.pruneH3DailyBefore.run).toHaveBeenCalledWith(
        { day: rollupHorizonDay() },
        expect.anything(),
      );
    });

    it("clears a day before rewriting it, so a recount never doubles", async () => {
      const order: string[] = [];
      vi.mocked(queries.deleteH3DailyForDays.run).mockImplementation(
        async () => {
          order.push("delete");
          return undefined as never;
        },
      );
      vi.mocked(queries.insertH3DailyForDays.run).mockImplementation(
        async () => {
          order.push("insert");
          return undefined as never;
        },
      );

      await refreshH3DailyForDays(["2024-01-01"]);

      expect(order).toEqual(["delete", "insert"]);
    });

    it("touches nothing when there are no days to recompute", async () => {
      await refreshH3DailyForDays([]);

      expect(queries.deleteH3DailyForDays.run).not.toHaveBeenCalled();
      expect(queries.insertH3DailyForDays.run).not.toHaveBeenCalled();
    });

    it("reads unfiltered counts as the empty query series", async () => {
      vi.mocked(queries.countH3DailyCells.run).mockResolvedValue([
        { h3_cell: "8928308280fffff", count: 12 },
        { h3_cell: null, count: 3 },
      ] as any);

      const result = await countByH3Cell(9, inHorizon, inHorizon);

      expect(queries.countH3DailyCells.run).toHaveBeenCalledWith(
        {
          query_id: "",
          resolution: 9,
          date_start: inHorizon,
          date_end: inHorizon,
        },
        expect.anything(),
      );
      // Rows without a cell are dropped rather than drawn at 0,0.
      expect(result).toEqual([["8928308280fffff", 12]]);
    });

    it("reads a filtered map from that query's own series", async () => {
      vi.mocked(queries.countH3DailyCells.run).mockResolvedValue([]);

      await countByH3Cell(11, inHorizon, inHorizon, "graffiti");

      expect(queries.countH3DailyCells.run).toHaveBeenCalledWith(
        expect.objectContaining({ query_id: "graffiti", resolution: 11 }),
        expect.anything(),
      );
    });

    it("counts raw rows for a window that starts before the horizon", async () => {
      vi.mocked(queries.countByH3Cell.run).mockResolvedValue([]);

      await countByH3Cell(9, "2009-06-15", "2009-06-30");

      expect(queries.countByH3Cell.run).toHaveBeenCalledWith(
        { resolution: 9, date_start: "2009-06-15", date_end: "2009-06-30" },
        expect.anything(),
      );
      expect(queries.countH3DailyCells.run).not.toHaveBeenCalled();
    });

    it("counts raw tagged rows for a filtered window before the horizon", async () => {
      vi.mocked(queries.countByH3CellForQuery.run).mockResolvedValue([]);

      await countByH3Cell(9, "2009-06-15", "2009-06-30", "graffiti");

      expect(queries.countByH3CellForQuery.run).toHaveBeenCalledWith(
        expect.objectContaining({ query_id: "graffiti" }),
        expect.anything(),
      );
      expect(queries.countH3DailyCells.run).not.toHaveBeenCalled();
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
