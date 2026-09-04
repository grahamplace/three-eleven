import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { refreshH3DailyForDays } from "@/store/service-request";
import {
  CHUNK_DAYS,
  EVENTS,
  processRollupChunk,
  rebuildH3Rollup,
} from "@/inngest/functions/rebuild-h3-rollup";

vi.mock("@/lib/db", () => ({
  db: { query: vi.fn() },
}));

vi.mock("@/store/service-request", () => ({
  refreshH3DailyForDays: vi.fn(),
  rollupHorizonDay: vi.fn(() => "2024-01-01"),
}));

const makeStep = () => ({
  run: vi.fn((_name: string, fn: () => Promise<unknown>) => fn()),
  sendEvent: vi.fn(),
});
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const dayRange = (first: string | null, last: string | null) =>
  vi.mocked(db.query).mockResolvedValueOnce({
    rows: [{ first_day: first, last_day: last }],
    rowCount: 1,
  });

describe("rebuildH3Rollup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts at the newest day the data covers", async () => {
    dayRange("2024-01-01", "2024-06-30");
    const step = makeStep();

    const result = await (rebuildH3Rollup as any).fn({
      step,
      event: { name: EVENTS.REBUILD, data: {} },
      logger,
    });

    expect(step.sendEvent).toHaveBeenCalledWith("trigger-first-chunk", {
      name: EVENTS.PROCESS_CHUNK,
      data: { fromDay: "2024-01-01", toDay: "2024-06-30" },
    });
    expect(result).toMatchObject({
      firstDay: "2024-01-01",
      lastDay: "2024-06-30",
    });
  });

  it("does not rebuild days that fall past the rollup horizon", async () => {
    // Data starts in 2009; only the horizon onwards is rolled up.
    dayRange("2009-01-01", "2024-06-30");
    const step = makeStep();

    await (rebuildH3Rollup as any).fn({
      step,
      event: { name: EVENTS.REBUILD, data: {} },
      logger,
    });

    expect(step.sendEvent).toHaveBeenCalledWith("trigger-first-chunk", {
      name: EVENTS.PROCESS_CHUNK,
      data: { fromDay: "2024-01-01", toDay: "2024-06-30" },
    });
  });

  it("does nothing when every day is older than the horizon", async () => {
    dayRange("2009-01-01", "2012-06-30");
    const step = makeStep();

    const result = await (rebuildH3Rollup as any).fn({
      step,
      event: { name: EVENTS.REBUILD, data: {} },
      logger,
    });

    expect(step.sendEvent).not.toHaveBeenCalled();
    expect(result.days).toBe(0);
  });

  it("does nothing on an empty table", async () => {
    dayRange(null, null);
    const step = makeStep();

    const result = await (rebuildH3Rollup as any).fn({
      step,
      event: { name: EVENTS.REBUILD, data: {} },
      logger,
    });

    expect(step.sendEvent).not.toHaveBeenCalled();
    expect(result.days).toBe(0);
  });
});

describe("processRollupChunk", () => {
  beforeEach(() => vi.clearAllMocks());

  const runChunk = (fromDay: string, toDay: string) => {
    const step = makeStep();
    return {
      step,
      result: (processRollupChunk as any).fn({
        step,
        event: { name: EVENTS.PROCESS_CHUNK, data: { fromDay, toDay } },
        logger,
      }),
    };
  };

  it("recomputes a chunk of days, newest first", async () => {
    const { result } = runChunk("2024-01-01", "2024-06-30");

    await result;

    const [days] = vi.mocked(refreshH3DailyForDays).mock.calls[0];
    expect(days).toHaveLength(CHUNK_DAYS);
    expect(days[0]).toBe("2024-06-30");
    expect(days[days.length - 1]).toBe("2024-06-01");
  });

  it("chains the next chunk from the day before the one it finished", async () => {
    const { step, result } = runChunk("2024-01-01", "2024-06-30");

    expect(await result).toMatchObject({ oldest: "2024-06-01", done: false });
    expect(step.sendEvent).toHaveBeenCalledWith("trigger-next-chunk", {
      name: EVENTS.PROCESS_CHUNK,
      data: { fromDay: "2024-01-01", toDay: "2024-05-31" },
    });
  });

  it("stops once the chunk reaches the oldest day", async () => {
    const { step, result } = runChunk("2024-06-25", "2024-06-30");

    expect(await result).toMatchObject({ days: 6, done: true });
    expect(step.sendEvent).not.toHaveBeenCalled();
  });

  it("handles a single-day range", async () => {
    const { step, result } = runChunk("2024-06-30", "2024-06-30");

    expect(await result).toMatchObject({ days: 1, done: true });
    expect(vi.mocked(refreshH3DailyForDays).mock.calls[0][0]).toEqual([
      "2024-06-30",
    ]);
    expect(step.sendEvent).not.toHaveBeenCalled();
  });
});
