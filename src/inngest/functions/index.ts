import { updateServiceRequests } from "./update-service-requests";
import {
  processBatchFunction,
  weeklyBackfillScheduler,
} from "./backfill-query-tags";

export const functions = [
  updateServiceRequests,
  processBatchFunction,
  weeklyBackfillScheduler,
];
