import { PREDEFINED_QUERIES } from "@/entities/query-definition";
import { H3_RESOLUTIONS, type H3Resolution } from "@/lib/h3";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type DateRangeParams = {
  start: string;
  end: string;
  /** Predefined query id, or null for all requests. */
  query: string | null;
};

/** Longest window the API will aggregate over. Bounds query cost. */
export const MAX_RANGE_DAYS = 731;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts only real calendar dates written as YYYY-MM-DD. */
export function parseDate(value: string | null): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Reject things like 2024-02-31, which Date silently rolls forward.
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function daysBetween(start: string, end: string): number {
  const ms =
    Date.UTC(
      Number(end.slice(0, 4)),
      Number(end.slice(5, 7)) - 1,
      Number(end.slice(8, 10)),
    ) -
    Date.UTC(
      Number(start.slice(0, 4)),
      Number(start.slice(5, 7)) - 1,
      Number(start.slice(8, 10)),
    );
  return ms / 86_400_000;
}

export function parseDateRangeParams(
  searchParams: URLSearchParams,
): ParseResult<DateRangeParams> {
  const start = parseDate(searchParams.get("start"));
  const end = parseDate(searchParams.get("end"));
  if (!start || !end) {
    return {
      ok: false,
      error: "start and end are required and must be YYYY-MM-DD dates",
    };
  }
  if (start > end) {
    return { ok: false, error: "start must be on or before end" };
  }
  if (daysBetween(start, end) > MAX_RANGE_DAYS) {
    return {
      ok: false,
      error: `date range may not exceed ${MAX_RANGE_DAYS} days`,
    };
  }

  const rawQuery = searchParams.get("query");
  const query = rawQuery && rawQuery !== "all" ? rawQuery : null;
  if (query !== null && !PREDEFINED_QUERIES[query]) {
    return { ok: false, error: `unknown query: ${query}` };
  }

  return { ok: true, value: { start, end, query } };
}

export function parseResolution(
  value: string | null,
): ParseResult<H3Resolution> {
  const n = Number(value);
  if ((H3_RESOLUTIONS as readonly number[]).includes(n)) {
    return { ok: true, value: n as H3Resolution };
  }
  return {
    ok: false,
    error: `res must be one of ${H3_RESOLUTIONS.join(", ")}`,
  };
}
