import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import {
  refreshH3DailyForDays,
  rollupHorizonDay,
} from "@/store/service-request";
import { addDays, parseISO } from "date-fns";
import { dayChunksDesc, formatDay } from "@/lib/time";

export const EVENTS = {
  REBUILD: "h3-rollup.rebuild",
  PROCESS_CHUNK: "h3-rollup.process-chunk",
};

/** Days per invocation. One chunk is a few seconds of Postgres work. */
export const CHUNK_DAYS = 30;

export type ProcessChunkEvent = {
  /** Oldest day the rebuild should reach, inclusive. */
  fromDay: string;
  /** Newest day still to do, inclusive; the chunk ends here and works back. */
  toDay: string;
};

/**
 * Rebuilds the whole hexbin rollup from service_requests and the query tags.
 *
 * The nightly ingest keeps the rollup current for the days it writes, so this
 * is only needed when the *tags* change underneath it — after adding or
 * editing a predefined query, which re-tags every request. The monthly tag
 * backfill triggers it on completion; it can also be sent by hand.
 *
 * Days are walked newest first so the recent window the map opens on is
 * correct within the first chunk, and chained by event so each invocation
 * stays well inside the function timeout.
 */
export const rebuildH3Rollup = inngest.createFunction(
  { id: "rebuild-h3-rollup", concurrency: 1 },
  { event: EVENTS.REBUILD },
  async ({ step, logger }) => {
    const range = await step.run("find-day-range", async () => {
      const result = await db.query(
        `SELECT MIN(DATE(requested_datetime))::text AS first_day,
                MAX(DATE(requested_datetime))::text AS last_day
           FROM service_requests`,
        [],
      );
      return result.rows[0] as {
        first_day: string | null;
        last_day: string | null;
      };
    });

    if (!range.first_day || !range.last_day) {
      return { days: 0, message: "No service requests to roll up" };
    }

    // Only the horizon is rolled up; older windows are answered from raw rows.
    const fromDay =
      range.first_day > rollupHorizonDay()
        ? range.first_day
        : rollupHorizonDay();

    if (fromDay > range.last_day) {
      return { days: 0, message: "No days inside the rollup horizon" };
    }

    logger.info(
      `Rebuilding hexbin rollup from ${fromDay} to ${range.last_day}`,
    );

    await step.sendEvent("trigger-first-chunk", {
      name: EVENTS.PROCESS_CHUNK,
      data: { fromDay, toDay: range.last_day } satisfies ProcessChunkEvent,
    });

    return {
      firstDay: fromDay,
      lastDay: range.last_day,
      message: "Rollup rebuild initiated",
    };
  },
);

export const processRollupChunk = inngest.createFunction(
  { id: "process-h3-rollup-chunk", concurrency: 1 },
  { event: EVENTS.PROCESS_CHUNK },
  async ({ event, step, logger }) => {
    const { fromDay, toDay } = event.data as ProcessChunkEvent;

    const [days = []] = dayChunksDesc(fromDay, toDay, CHUNK_DAYS);

    await step.run("refresh-days", async () => {
      await refreshH3DailyForDays(days);
      return days.length;
    });

    const oldest = days[days.length - 1];
    const done = !oldest || oldest <= fromDay;

    logger.info(
      `Rolled up ${days.length} days back to ${oldest ?? toDay}` +
        (done ? " (done)" : ""),
    );

    if (!done) {
      await step.sendEvent("trigger-next-chunk", {
        name: EVENTS.PROCESS_CHUNK,
        data: {
          fromDay,
          toDay: previousDay(oldest),
        } satisfies ProcessChunkEvent,
      });
    }

    return { days: days.length, oldest: oldest ?? null, done };
  },
);

/** The calendar day before `day`, as "yyyy-MM-dd". */
function previousDay(day: string): string {
  return formatDay(addDays(parseISO(day), -1));
}
