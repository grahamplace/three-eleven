import { db } from "@/lib/db";
import { createQueryTagsForMany } from "@/store/service-request-query-tags";

const BATCH_SIZE = 1000;

async function initQueryTags() {
  // Get the total count of service requests
  const countResult = await db.query(
    "SELECT COUNT(*) FROM service_requests",
    []
  );
  const totalCount = parseInt(countResult.rows[0].count, 10);

  console.log(`Processing ${totalCount} service requests...`);

  // Process in batches
  let processed = 0;

  while (processed < totalCount) {
    console.log(
      `Processing batch ${processed + 1} to ${Math.min(processed + BATCH_SIZE, totalCount)}...`
    );

    // Get a batch of service requests
    const serviceRequests = await db.query(
      `SELECT * FROM service_requests ORDER BY service_request_id LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, processed]
    );

    // Create query tags for the batch
    const tags = await createQueryTagsForMany(serviceRequests.rows);

    console.log(
      `Created ${tags.length} query tags for ${serviceRequests.rows.length} service requests`
    );

    processed += serviceRequests.rows.length;
    console.log(
      `Progress: ${processed}/${totalCount} (${Math.round((processed / totalCount) * 100)}%)`
    );
  }

  console.log("Query tags initialization completed successfully");
}

initQueryTags().catch((error) => {
  console.error("Error initializing query tags:", error);
  process.exit(1);
});
