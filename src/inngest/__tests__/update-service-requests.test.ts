import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestBatch, warnBatchCap } from "@/lib/cron/service-request";
import { setLatestUpdatedDatetime } from "@/store/metadata";
import { refreshH3DailyForDays } from "@/store/service-request";
import {
  MAX_BATCHES,
  updateServiceRequests,
} from "@/inngest/functions/update-service-requests";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

vi.mock("@/lib/cron/service-request", () => ({
  BATCH_SIZE: 1000,
  ROLLUP_CHUNK_DAYS: 30,
  ingestBatch: vi.fn(),
  warnBatchCap: vi.fn(),
}));

vi.mock("@/store/metadata", () => ({
  getLatestUpdatedDatetime: vi.fn(async () => new Date("2026-09-02T23:59:56Z")),
  setLatestUpdatedDatetime: vi.fn(async () => {}),
}));

vi.mock("@/store/service-request", () => ({
  pruneH3Daily: vi.fn(async () => "2024-08-01"),
  refreshH3DailyForDays: vi.fn(async () => {}),
  rollupChunks: vi.fn((days: string[]) => [[...new Set(days)].sort()]),
}));

const makeStep = () => ({
  run: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
});
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const run = (step: ReturnType<typeof makeStep>) =>
  (updateServiceRequests as any).fn({ step, event: {}, logger });

const stepNames = (step: ReturnType<typeof makeStep>) =>
  step.run.mock.calls.map((c) => c[0]);

describe("updateServiceRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs each batch as its own step, all from the same watermark", async () => {
    vi.mocked(ingestBatch)
      .mockResolvedValueOnce({ count: 1000, days: ["2026-09-01"] })
      .mockResolvedValueOnce({ count: 1000, days: ["2026-09-02"] })
      .mockResolvedValueOnce({ count: 10, days: ["2026-09-01"] });
    const step = makeStep();

    const result = await run(step);

    expect(stepNames(step)).toEqual([
      "read-watermark",
      "ingest-batch-0",
      "ingest-batch-1",
      "ingest-batch-2",
      "advance-watermark",
      "refresh-rollup-0",
      "prune-rollup",
      "revalidate-cache",
    ]);
    const watermark = new Date("2026-09-02T23:59:56Z");
    expect(vi.mocked(ingestBatch).mock.calls).toEqual([
      [watermark, 0],
      [watermark, 1000],
      [watermark, 2000],
    ]);
    expect(setLatestUpdatedDatetime).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totalProcessed: 2010,
      hitBatchCap: false,
      rollupDays: 2,
    });
  });

  it("refreshes the rollup once after every batch, not per batch", async () => {
    vi.mocked(ingestBatch)
      .mockResolvedValueOnce({ count: 1000, days: ["2026-09-01"] })
      .mockResolvedValueOnce({ count: 5, days: ["2026-09-01"] });
    const step = makeStep();

    await run(step);

    expect(refreshH3DailyForDays).toHaveBeenCalledTimes(1);
    expect(refreshH3DailyForDays).toHaveBeenCalledWith(["2026-09-01"]);
  });

  it("stops at the batch cap and still advances the watermark", async () => {
    vi.mocked(ingestBatch).mockResolvedValue({ count: 1000, days: [] });
    const step = makeStep();

    const result = await run(step);

    expect(ingestBatch).toHaveBeenCalledTimes(MAX_BATCHES);
    expect(setLatestUpdatedDatetime).toHaveBeenCalledTimes(1);
    expect(result.hitBatchCap).toBe(true);
    // Routed through Inngest's logger, which drops repeats on step replay.
    const [, log] = vi.mocked(warnBatchCap).mock.calls[0];
    log!("capped");
    expect(logger.warn).toHaveBeenCalledWith("capped");
  });

  it("skips the rollup when nothing new came in", async () => {
    vi.mocked(ingestBatch).mockResolvedValueOnce({ count: 0, days: [] });
    const { rollupChunks } = await import("@/store/service-request");
    vi.mocked(rollupChunks).mockReturnValueOnce([]);
    const step = makeStep();

    const result = await run(step);

    expect(refreshH3DailyForDays).not.toHaveBeenCalled();
    expect(result).toEqual({
      totalProcessed: 0,
      hitBatchCap: false,
      rollupDays: 0,
    });
  });
});
