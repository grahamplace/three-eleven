import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { replaceQueryTagsForMany } from "@/store/service-request-query-tags";
import {
  BATCH_SIZE,
  EVENTS,
  monthlyBackfillScheduler,
  processBatchFunction,
} from "@/inngest/functions/backfill-query-tags";

vi.mock("@/lib/db", () => ({
  db: { query: vi.fn() },
}));

vi.mock("@/store/service-request-query-tags", () => ({
  replaceQueryTagsForMany: vi.fn(),
}));

// A step runner that executes each step inline and records events.
const makeStep = () => ({
  run: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
  sendEvent: vi.fn(),
});
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const rows = (ids: string[]) => ids.map((id) => ({ service_request_id: id }));

describe("monthlyBackfillScheduler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("kicks off the first batch from the beginning of the key space", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ count: "5000" }],
      rowCount: 1,
    });
    const step = makeStep();

    const result = await (monthlyBackfillScheduler as any).fn({
      step,
      event: { name: "cron" },
      logger,
    });

    expect(step.sendEvent).toHaveBeenCalledWith("trigger-first-batch", {
      name: EVENTS.PROCESS_BATCH,
      data: { afterId: "", batchSize: BATCH_SIZE },
    });
    expect(result).toEqual({
      totalRequests: 5000,
      message: "Backfill process initiated",
    });
  });

  it("does nothing on an empty table", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ count: "0" }],
      rowCount: 1,
    });
    const step = makeStep();

    const result = await (monthlyBackfillScheduler as any).fn({
      step,
      event: { name: "cron" },
      logger,
    });

    expect(step.sendEvent).not.toHaveBeenCalled();
    expect(result.totalRequests).toBe(0);
  });
});

describe("processBatchFunction", () => {
  beforeEach(() => vi.clearAllMocks());

  const runBatch = (afterId: string, batchSize: number) => {
    const step = makeStep();
    return {
      step,
      result: (processBatchFunction as any).fn({
        step,
        event: { name: EVENTS.PROCESS_BATCH, data: { afterId, batchSize } },
        logger,
      }),
    };
  };

  it("pages by primary key, not offset", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: rows(["a", "b"]),
      rowCount: 2,
    });
    vi.mocked(replaceQueryTagsForMany).mockResolvedValueOnce([]);

    await runBatch("x", 2).result;

    const [sql, params] = vi.mocked(db.query).mock.calls[0];
    expect(sql).toMatch(/service_request_id > \$1/);
    expect(sql).toMatch(/ORDER BY service_request_id/);
    expect(sql).not.toMatch(/OFFSET/i);
    expect(params).toEqual(["x", 2]);
  });

  it("chains the next batch from the last id when a page is full", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: rows(["a", "b"]),
      rowCount: 2,
    });
    vi.mocked(replaceQueryTagsForMany).mockResolvedValueOnce([
      { service_request_id: "a", query_id: "poop" },
    ]);

    const { step, result } = runBatch("", 2);

    expect(await result).toEqual({
      processedRequests: 2,
      processedTags: 1,
      lastId: "b",
      done: false,
    });
    expect(step.sendEvent).toHaveBeenCalledWith("trigger-next-batch", {
      name: EVENTS.PROCESS_BATCH,
      data: { afterId: "b", batchSize: 2 },
    });
  });

  it("stops when a page comes back short", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: rows(["z"]),
      rowCount: 1,
    });
    vi.mocked(replaceQueryTagsForMany).mockResolvedValueOnce([]);

    const { step, result } = runBatch("y", 2);

    expect(await result).toMatchObject({ lastId: "z", done: true });
    expect(step.sendEvent).not.toHaveBeenCalled();
  });

  it("stops on an empty page without touching the store", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { step, result } = runBatch("zz", 2);

    expect(await result).toEqual({
      processedRequests: 0,
      processedTags: 0,
      lastId: null,
      done: true,
    });
    expect(replaceQueryTagsForMany).not.toHaveBeenCalled();
    expect(step.sendEvent).not.toHaveBeenCalled();
  });
});
