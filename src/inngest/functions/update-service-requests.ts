import { revalidateTag } from "next/cache";
import { inngest } from "@/inngest/client";
import {
  BATCH_SIZE,
  ROLLUP_CHUNK_DAYS,
  ingestBatch,
  warnBatchCap,
} from "@/lib/cron/service-request";
import {
  getLatestUpdatedDatetime,
  setLatestUpdatedDatetime,
} from "@/store/metadata";
import {
  pruneH3Daily,
  refreshH3DailyForDays,
  rollupChunks,
} from "@/store/service-request";
import { SERVICE_REQUESTS_TAG } from "@/lib/api/types";

/**
 * Batches per nightly run. Each is its own step (its own request), so this
 * bounds how much one night catches up, not how long a request runs. Kept well
 * under Inngest's 1,000-step limit to leave room for the rollup chunks.
 */
export const MAX_BATCHES = 200;

export const updateServiceRequests = inngest.createFunction(
  {
    id: "update-service-requests",
    concurrency: 1,
  },
  // Run once every day at 12:00 AM
  { cron: "TZ=America/Los_Angeles 0 0 * * *" },
  async ({ step, logger }) => {
    // Pagination is by offset, so the watermark must stay fixed across pages.
    // Memoized as a step so every batch sees the same value on replay.
    const watermark = await step.run("read-watermark", async () =>
      (await getLatestUpdatedDatetime()).toISOString(),
    );

    // One step per batch: each runs in its own request, well inside the
    // function timeout, and a retry redoes only the batch that failed.
    const days: string[] = [];
    let totalProcessed = 0;
    let hitBatchCap = true;
    for (let batch = 0; batch < MAX_BATCHES; batch++) {
      const result = await step.run(`ingest-batch-${batch}`, () =>
        ingestBatch(new Date(watermark), batch * BATCH_SIZE),
      );
      totalProcessed += result.count;
      days.push(...result.days);
      if (result.count < BATCH_SIZE) {
        hitBatchCap = false; // short page: nothing left upstream
        break;
      }
    }

    // Advance the watermark to the newest row we now hold. Rows we did not
    // reach this run have a later updated_datetime and are picked up next run.
    await step.run("advance-watermark", () => setLatestUpdatedDatetime());

    // Inngest's logger, not console: the function body re-runs once per step,
    // and only the logger drops the repeats from those replays.
    if (hitBatchCap) warnBatchCap(MAX_BATCHES, (msg) => logger.warn(msg));
    logger.info(`Ingested ${totalProcessed} records`);

    // Recompute each touched day once, after every batch is in, rather than
    // once per batch that touches it.
    const chunks = rollupChunks(days, ROLLUP_CHUNK_DAYS);
    for (const [i, chunk] of chunks.entries()) {
      await step.run(`refresh-rollup-${i}`, () => refreshH3DailyForDays(chunk));
    }

    // The rollup only covers a trailing window; drop what has aged out of it.
    await step.run("prune-rollup", () => pruneH3Daily());

    // Bust the cached map payloads so the new data shows up before the
    // time-based revalidation would have kicked in.
    await step.run("revalidate-cache", async () => {
      revalidateTag(SERVICE_REQUESTS_TAG);
    });

    return {
      totalProcessed,
      hitBatchCap,
      rollupDays: chunks.flat().length,
    };
  },
);
