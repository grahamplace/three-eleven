import { revalidateTag } from "next/cache";
import { inngest } from "@/inngest/client";
import { ingestServiceRequests } from "@/lib/cron/service-request";
import { pruneH3Daily } from "@/store/service-request";
import { SERVICE_REQUESTS_TAG } from "@/lib/api/types";

export const updateServiceRequests = inngest.createFunction(
  {
    id: "update-service-requests",
    concurrency: 1,
  },
  // Run once every day at 12:00 AM
  { cron: "TZ=America/Los_Angeles 0 0 * * *" },
  async ({ step }) => {
    await step.run("ingest", () => ingestServiceRequests());

    // The rollup only covers a trailing window; drop what has aged out of it.
    await step.run("prune-rollup", () => pruneH3Daily());

    // Bust the cached map payloads so the new data shows up before the
    // time-based revalidation would have kicked in.
    await step.run("revalidate-cache", async () => {
      revalidateTag(SERVICE_REQUESTS_TAG);
    });
  },
);
