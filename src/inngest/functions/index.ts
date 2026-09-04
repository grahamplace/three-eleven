import { updateServiceRequests } from "./update-service-requests";
import {
  processBatchFunction,
  monthlyBackfillScheduler,
} from "./backfill-query-tags";
import { rebuildH3Rollup, processRollupChunk } from "./rebuild-h3-rollup";

export const functions = [
  updateServiceRequests,
  processBatchFunction,
  monthlyBackfillScheduler,
  rebuildH3Rollup,
  processRollupChunk,
];
