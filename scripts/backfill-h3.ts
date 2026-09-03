/**
 * One-time backfill of the h3_r7..h3_r11 columns for rows ingested before the
 * columns existed. New rows get their cells at write time in the store.
 *
 * Uses keyset pagination on the primary key (not OFFSET), so each page costs
 * the same regardless of how far into the table it is. Safe to re-run: only
 * rows with a null h3_r11 are touched.
 *
 *   DATABASE_URL=... npm run backfill-h3
 */
import { db, closeDb } from "@/lib/db";
import { h3CellsForPoint } from "@/lib/h3";

const BATCH_SIZE = 5000;

type Row = { service_request_id: string; lat: number; long: number };

async function backfill() {
  let lastId = "";
  let updated = 0;

  for (;;) {
    const { rows } = await db.query(
      `SELECT service_request_id, lat, long
         FROM service_requests
        WHERE service_request_id > $1
          AND lat IS NOT NULL AND long IS NOT NULL
          AND h3_r11 IS NULL
        ORDER BY service_request_id
        LIMIT $2`,
      [lastId, BATCH_SIZE],
    );
    const batch = rows as Row[];
    if (batch.length === 0) break;

    const cells = batch.map((r) => h3CellsForPoint(r.lat, r.long));

    await db.query(
      `UPDATE service_requests AS s
          SET h3_r7 = v.h3_r7, h3_r8 = v.h3_r8, h3_r9 = v.h3_r9,
              h3_r10 = v.h3_r10, h3_r11 = v.h3_r11
         FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])
              AS v(service_request_id, h3_r7, h3_r8, h3_r9, h3_r10, h3_r11)
        WHERE s.service_request_id = v.service_request_id`,
      [
        batch.map((r) => r.service_request_id),
        cells.map((c) => c.h3_r7),
        cells.map((c) => c.h3_r8),
        cells.map((c) => c.h3_r9),
        cells.map((c) => c.h3_r10),
        cells.map((c) => c.h3_r11),
      ],
    );

    updated += batch.length;
    lastId = batch[batch.length - 1].service_request_id;
    console.info(`Backfilled ${updated} rows (through ${lastId})`);
  }

  console.info(`Done. ${updated} rows updated.`);
}

backfill()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
