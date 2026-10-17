import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

// Each Inngest step is its own request. Steps are sized to finish in seconds;
// this is headroom for a slow SODA page or rollup chunk, not a budget to fill.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
