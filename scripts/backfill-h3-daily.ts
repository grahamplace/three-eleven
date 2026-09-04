/**
 * Builds the hexbin rollup (service_request_h3_daily) for every day already in
 * service_requests. New days are rolled up at write time by the store, and the
 * rebuild-h3-rollup Inngest job does the same work in the background after a
 * tag backfill — this is the first fill, run from a laptop where it can take
 * as long as it needs.
 *
 * Only the rollup horizon is filled by default (older windows are answered
 * from raw rows). Days are recomputed from scratch, so re-running is safe and
 * resuming is just a matter of narrowing the range:
 *
 *   DATABASE_URL=... npm run backfill-h3-daily
 *   DATABASE_URL=... npm run backfill-h3-daily -- --from=2024-01-01 --to=2024-12-31
 */
import { db, closeDb } from "@/lib/db";
import {
  refreshH3DailyForDays,
  rollupHorizonDay,
} from "@/store/service-request";
import { dayChunksDesc } from "@/lib/time";

const CHUNK_DAYS = 30;

function arg(name: string): string | undefined {
  const match = process.argv.find((a) => a.startsWith(`--${name}=`));
  return match?.split("=")[1];
}

async function dataRange() {
  const { rows } = await db.query(
    `SELECT MIN(DATE(requested_datetime))::text AS first_day,
            MAX(DATE(requested_datetime))::text AS last_day
       FROM service_requests`,
    [],
  );
  return rows[0] as { first_day: string | null; last_day: string | null };
}

async function backfill() {
  const range = await dataRange();
  const horizon = rollupHorizonDay();
  const earliest =
    range.first_day && range.first_day > horizon ? range.first_day : horizon;
  const from = arg("from") ?? earliest;
  const to = arg("to") ?? range.last_day;

  if (!from || !to) {
    console.log("No service requests to roll up");
    return;
  }

  if (from > to) {
    console.log(
      `Nothing to do: the newest request (${to}) is older than the rollup horizon (${horizon})`,
    );
    return;
  }

  const chunks = dayChunksDesc(from, to, CHUNK_DAYS);
  console.log(
    `Rolling up ${from}..${to} (${chunks.length} chunks of up to ${CHUNK_DAYS} days), newest first`,
  );

  let done = 0;
  for (const days of chunks) {
    const started = Date.now();
    await refreshH3DailyForDays(days);
    done += days.length;
    console.log(
      `  ${days[days.length - 1]}..${days[0]} (${done} days, ${Date.now() - started}ms)`,
    );
  }

  const { rows } = await db.query(
    "SELECT COUNT(*)::int AS count FROM service_request_h3_daily",
    [],
  );
  console.log(`Rollup complete: ${rows[0].count} rows`);
}

backfill()
  .catch((error) => {
    console.error("Rollup backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
