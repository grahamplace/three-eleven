import { ingestServiceRequests } from "@/lib/cron/service-request";

try {
  ingestServiceRequests();
} catch (error) {
  console.error(error);
  process.exit(1);
}
