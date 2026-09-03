/**
 * Local equivalent of the Inngest query-tag backfill: re-tags every service
 * request against the current PREDEFINED_QUERIES, paging by primary key.
 *
 *   DATABASE_URL=... npx tsx src/scripts/init-query-tags.ts
 */
import { db, closeDb } from "@/lib/db";
import { replaceQueryTagsForMany } from "@/store/service-request-query-tags";

const BATCH_SIZE = 1000;

async function initQueryTags() {
  const countResult = await db.query(
    "SELECT COUNT(*) FROM service_requests",
    [],
  );
  const totalCount = parseInt(countResult.rows[0].count, 10);
  console.log(`Processing ${totalCount} service requests...`);

  let processed = 0;
  let afterId = "";

  for (;;) {
    const { rows } = await db.query(
      `SELECT * FROM service_requests
        WHERE service_request_id > $1
        ORDER BY service_request_id
        LIMIT $2`,
      [afterId, BATCH_SIZE],
    );
    if (rows.length === 0) break;

    const tags = await replaceQueryTagsForMany(rows);
    processed += rows.length;
    afterId = rows[rows.length - 1].service_request_id;

    console.log(
      `Created ${tags.length} tags for ${rows.length} requests. ` +
        `Progress: ${processed}/${totalCount} (${Math.round((processed / totalCount) * 100)}%)`,
    );
  }

  console.log("Query tags initialization completed successfully");
}

initQueryTags()
  .catch((error) => {
    console.error("Error initializing query tags:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
