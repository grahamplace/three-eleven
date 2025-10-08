import { inngest } from "@/inngest/client";
import { ingestServiceRequests } from "@/lib/cron/service-request";

export const updateServiceRequests = inngest.createFunction(
  {
    id: "update-service-requests",
    concurrency: 1,
  },
  // Run every 4 hours
  { cron: "TZ=America/Los_Angeles */4 * * * *" },
  async ({ step }) => {
    await ingestServiceRequests();
  }
);
