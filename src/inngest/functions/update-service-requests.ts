import { inngest } from "@/inngest/client";
import { ingestServiceRequests } from "@/lib/cron/service-request";

export const updateServiceRequests = inngest.createFunction(
  {
    id: "update-service-requests",
    concurrency: 1,
  },
  // Run once every day at 12:00 AM
  { cron: "TZ=America/Los_Angeles 0 0 * * *" },
  async ({ step }) => {
    await ingestServiceRequests();
  }
);
