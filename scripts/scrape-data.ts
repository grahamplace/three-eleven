import { ingestServiceRequests } from "@/lib/cron/service-request";
import { closeDb } from "@/lib/db";
import { closeRedis } from "@/lib/redis";

async function main() {
  try {
    await ingestServiceRequests();
  } finally {
    await Promise.all([closeDb(), closeRedis()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
