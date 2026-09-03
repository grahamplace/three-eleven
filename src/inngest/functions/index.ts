import { updateServiceRequests } from "./update-service-requests";
import {
  processBatchFunction,
  monthlyBackfillScheduler,
} from "./backfill-query-tags";

export const functions = [
  updateServiceRequests,
  processBatchFunction,
  monthlyBackfillScheduler,
];
