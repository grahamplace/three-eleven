import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { createQueryTagsForMany } from "@/store/service-request-query-tags";

export const EVENTS = {
  WEEKLY_BACKFILL: "query-tags.weekly-backfill",
  PROCESS_BATCH: "query-tags.process-batch",
};

const BATCH_SIZE = 2500;

export const weeklyBackfillScheduler = inngest.createFunction(
  { id: "weekly-backfill-scheduler" },
  { cron: "TZ=America/Los_Angeles 0 0 1 * *" }, // On the first of the month (trigger manually generally after adding new queries)
  async ({ step, logger }) => {
    logger.info("Starting weekly backfill scheduler");

    const totalCount = await step.run("count-service-requests", async () => {
      const result = await db.query(
        "SELECT COUNT(*) as count FROM service_requests",
        []
      );
      return parseInt(result.rows[0].count, 10);
    });

    const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

    logger.info(
      `Total service requests: ${totalCount}, Batches needed: ${totalBatches}`
    );

    if (totalBatches > 0) {
      await step.sendEvent("trigger-first-batch", {
        name: EVENTS.PROCESS_BATCH,
        data: {
          batchNumber: 1,
          totalBatches,
          batchSize: BATCH_SIZE,
        },
      });

      return {
        totalRequests: totalCount,
        totalBatches,
        message: "Backfill process initiated",
      };
    }

    return {
      totalRequests: 0,
      totalBatches: 0,
      message: "No service requests to process",
    };
  }
);

export const processBatchFunction = inngest.createFunction(
  {
    id: "process-backfill-batch",
    concurrency: 1,
  },
  { event: EVENTS.PROCESS_BATCH },
  async ({ event, step, logger }) => {
    const { batchNumber, totalBatches, batchSize } = event.data;

    logger.info(`Processing batch ${batchNumber} of ${totalBatches}`);

    const offset = (batchNumber - 1) * batchSize;

    const serviceRequests = await step.run("fetch-batch", async () => {
      const result = await db.query(
        "SELECT * FROM service_requests ORDER BY service_request_id LIMIT $1 OFFSET $2",
        [batchSize, offset]
      );
      return result.rows;
    });

    const processedCount = await step.run("process-batch", async () => {
      if (serviceRequests.length === 0) {
        return 0;
      }

      const tags = await createQueryTagsForMany(serviceRequests);
      return tags.length;
    });

    logger.info(
      `Processed ${processedCount} tags for ${serviceRequests.length} service requests`
    );

    if (batchNumber < totalBatches) {
      await step.sendEvent("trigger-next-batch", {
        name: EVENTS.PROCESS_BATCH,
        data: {
          batchNumber: batchNumber + 1,
          totalBatches,
          batchSize,
        },
      });

      return {
        batchNumber,
        processedRequests: serviceRequests.length,
        processedTags: processedCount,
        status: "completed",
        nextBatch: batchNumber + 1,
      };
    }

    return {
      batchNumber,
      processedRequests: serviceRequests.length,
      processedTags: processedCount,
      status: "completed",
      nextBatch: null,
      message: "Backfill process completed",
    };
  }
);
