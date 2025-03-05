import {
  weeklyBackfillScheduler,
  processBatchFunction,
} from "./backfill-query-tags";
import { updateServiceRequests } from "./update-service-requests";

export const functions = [
  weeklyBackfillScheduler,
  processBatchFunction,
  updateServiceRequests,
];
