import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { updateServiceRequests } from "@/inngest/functions/update-service-requests";

export const maxDuration = 60; // Use Vercel free plan max 60s timeout for inngest function handlers

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [updateServiceRequests],
});
