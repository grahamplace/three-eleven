import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addDays, parseISO } from "date-fns";

/**
 * Timestamp convention
 * --------------------
 * SF 311 publishes its datetimes as Socrata "floating" timestamps: Pacific
 * wall-clock values with no zone, e.g. "2024-07-04T12:00:00.000". We store them
 * exactly that way, in `timestamp without time zone` columns, so that
 * `DATE(requested_datetime)` means "the San Francisco calendar day" and the
 * existing date indexes keep working.
 *
 * Everything that crosses the boundary between Postgres/SODA (wall-clock
 * strings) and JavaScript (`Date`, an instant) goes through this module, so
 * the result does not depend on the TZ of the machine running the code. That
 * matters: Vercel runs in UTC, developers usually don't.
 *
 * - reading from Postgres: `fromSfWallClock` (registered as the pg parser for
 *   `timestamp` in src/lib/db)
 * - writing to Postgres / filtering SODA: `toSfWallClock`
 * - showing to users: `formatSfDateTime` / `formatSfDate` (always SF time,
 *   regardless of where the viewer is)
 */
export const SF_TIME_ZONE = "America/Los_Angeles";

const WALL_CLOCK_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";

/**
 * Interprets a naive timestamp string ("2024-07-04T12:00:00.000" or Postgres'
 * "2024-07-04 12:00:00") as Pacific wall-clock time and returns the instant.
 */
export function fromSfWallClock(value: string): Date {
  // Postgres separates date and time with a space; Date parsing wants a T.
  const normalized = value.trim().replace(" ", "T");
  const date = fromZonedTime(normalized, SF_TIME_ZONE);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid wall-clock timestamp: ${value}`);
  }
  return date;
}

/** Formats an instant as the Pacific wall-clock string Postgres and SODA expect. */
export function toSfWallClock(date: Date): string {
  return formatInTimeZone(date, SF_TIME_ZONE, WALL_CLOCK_FORMAT);
}

/** Like `toSfWallClock` but passes nulls through, for optional columns. */
export function toSfWallClockOrNull(
  date: Date | null | undefined,
): string | null {
  return date == null ? null : toSfWallClock(date);
}

/**
 * A Postgres `date` as "yyyy-MM-dd". node-postgres parses those into
 * local-midnight Dates, so the calendar day is read back with the local
 * getters: converting to a zone here would shift it a day.
 */
export function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "7/4/2024, 12:00:00 PM", always in San Francisco time. */
export function formatSfDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", { timeZone: SF_TIME_ZONE });
}

/** "7/4/2024", always in San Francisco time. */
export function formatSfDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { timeZone: SF_TIME_ZONE });
}

/** Today's calendar day in San Francisco, as "yyyy-MM-dd". */
export function sfToday(now: Date = new Date()): string {
  return formatInTimeZone(now, SF_TIME_ZONE, "yyyy-MM-dd");
}

/**
 * An inclusive day range split into chunks of at most `size` calendar days,
 * newest first, as "yyyy-MM-dd" strings.
 *
 * Used to walk the hexbin rollup rebuild backwards, so the recent days the map
 * opens on are correct first and each chunk is small enough for one
 * serverless invocation.
 */
export function dayChunksDesc(
  from: string,
  to: string,
  size: number,
): string[][] {
  if (size < 1) throw new Error(`Chunk size must be at least 1, got ${size}`);

  const first = parseISO(from);
  const chunks: string[][] = [];
  let chunk: string[] = [];

  for (let day = parseISO(to); day >= first; day = addDays(day, -1)) {
    chunk.push(formatDay(day));
    if (chunk.length === size) {
      chunks.push(chunk);
      chunk = [];
    }
  }
  if (chunk.length > 0) chunks.push(chunk);

  return chunks;
}
