import { inngest } from "@/inngest/client";
import { ingestServiceRequests } from "@/lib/cron/service-request";

export const updateServiceRequests = inngest.createFunction(
  {
    id: "update-service-requests",
    concurrency: 1,
  },
  { cron: "TZ=America/Los_Angeles */30 * * * *" },
  async ({ step }) => {
    await ingestServiceRequests();
  }
);
