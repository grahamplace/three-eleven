import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { replaceQueryTagsForMany } from "@/store/service-request-query-tags";

export const EVENTS = {
  PROCESS_BATCH: "query-tags.process-batch",
};

export const BATCH_SIZE = 2500;

export type ProcessBatchEvent = {
  /** Resume after this service_request_id ("" for the first batch). */
  afterId: string;
  batchSize: number;
};

/**
 * Re-tags every service request against the current PREDEFINED_QUERIES.
 * Runs monthly; trigger it manually after adding or changing a query.
 *
 * Batches are chained by event so each one fits in a serverless invocation,
 * and paginate by primary key rather than OFFSET so every page costs the
 * same regardless of table size.
 */
export const monthlyBackfillScheduler = inngest.createFunction(
  { id: "monthly-query-tag-backfill" },
  { cron: "TZ=America/Los_Angeles 0 0 1 * *" },
  async ({ step, logger }) => {
    const totalCount = await step.run("count-service-requests", async () => {
      const result = await db.query(
        "SELECT COUNT(*) as count FROM service_requests",
        [],
      );
      return parseInt(result.rows[0].count, 10);
    });

    if (totalCount === 0) {
      return { totalRequests: 0, message: "No service requests to process" };
    }

    logger.info(
      `Backfilling query tags for ${totalCount} requests in batches of ${BATCH_SIZE}`,
    );

    await step.sendEvent("trigger-first-batch", {
      name: EVENTS.PROCESS_BATCH,
      data: { afterId: "", batchSize: BATCH_SIZE } satisfies ProcessBatchEvent,
    });

    return { totalRequests: totalCount, message: "Backfill process initiated" };
  },
);

export const processBatchFunction = inngest.createFunction(
  { id: "process-backfill-batch", concurrency: 1 },
  { event: EVENTS.PROCESS_BATCH },
  async ({ event, step, logger }) => {
    const { afterId, batchSize } = event.data as ProcessBatchEvent;

    const serviceRequests = await step.run("fetch-batch", async () => {
      const result = await db.query(
        `SELECT * FROM service_requests
          WHERE service_request_id > $1
          ORDER BY service_request_id
          LIMIT $2`,
        [afterId, batchSize],
      );
      return result.rows;
    });

    const processedTags = await step.run("process-batch", async () => {
      if (serviceRequests.length === 0) return 0;
      const tags = await replaceQueryTagsForMany(serviceRequests);
      return tags.length;
    });

    const lastId: string | null =
      serviceRequests.length > 0
        ? serviceRequests[serviceRequests.length - 1].service_request_id
        : null;
    const done = serviceRequests.length < batchSize;

    logger.info(
      `Tagged ${serviceRequests.length} requests (${processedTags} tags) after "${afterId}"`,
    );

    if (!done && lastId) {
      await step.sendEvent("trigger-next-batch", {
        name: EVENTS.PROCESS_BATCH,
        data: { afterId: lastId, batchSize } satisfies ProcessBatchEvent,
      });
    }

    return {
      processedRequests: serviceRequests.length,
      processedTags,
      lastId,
      done,
    };
  },
);
