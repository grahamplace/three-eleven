import { db, withTransaction, type DbConnection } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import * as tagQueries from "@/store/queries/service_request_query_tags.queries";
import { ServiceRequest } from "@/entities";
import { supportedMediaDomains } from "@/lib/config";
import { firstEntity } from "./utils";
import { replaceQueryTagsForMany } from "./service-request-query-tags";
import { h3CellsForPoint, type H3Resolution, type HexCount } from "@/lib/h3";
import { addDays, parseISO } from "date-fns";
import {
  toSfWallClock,
  toSfWallClockOrNull,
  formatDay,
  sfToday,
} from "@/lib/time";

export async function getLatestUpdatedDatetimeFromPg() {
  const pgLatestUpdatedDatetime = await queries.getLatestUpdatedDatetime.run(
    undefined,
    db,
  );
  return pgLatestUpdatedDatetime[0].updated_datetime;
}

export const find = async (serviceRequestId: string) => {
  const results = await queries.findServiceRequestById.run(
    { service_request_id: serviceRequestId },
    db,
  );
  return firstEntity(results, storeToEntity);
};

export const findByDateAndType = async (
  dateStart: string,
  dateEnd: string,
  serviceDetails: string[],
) => {
  const results = await queries.findServiceRequestByDateAndType.run(
    {
      date_start: dateStart,
      date_end: dateEnd,
      service_details: serviceDetails,
    },
    db,
  );
  return results.map(storeToEntity);
};

export const findAll = async (dateStart: string, dateEnd: string) => {
  const results = await queries.findAllServiceRequestsByDate.run(
    {
      date_start: dateStart,
      date_end: dateEnd,
    },
    db,
  );
  return results.map(storeToEntity);
};

export const findByQueryId = async (
  queryId: string,
  dateStart: string,
  dateEnd: string,
) => {
  const results = await tagQueries.findServiceRequestsByQueryId.run(
    { query_id: queryId, date_start: dateStart, date_end: dateEnd },
    db,
  );
  return results.map(storeToEntity);
};

/** Compact rows for the map: only drawable points, only the needed columns. */
export const findPoints = (dateStart: string, dateEnd: string) =>
  queries.findPointsByDate.run(
    { date_start: dateStart, date_end: dateEnd },
    db,
  );

export const findPointsByQueryId = (
  queryId: string,
  dateStart: string,
  dateEnd: string,
) =>
  queries.findPointsByQueryId.run(
    { query_id: queryId, date_start: dateStart, date_end: dateEnd },
    db,
  );

const toHexCounts = (
  rows: { h3_cell: string | null; count: number | null }[],
): HexCount[] =>
  rows.flatMap((r) =>
    r.h3_cell && r.count ? [[r.h3_cell, r.count] as HexCount] : [],
  );

/**
 * How far back the hexbin rollup is kept, in days.
 *
 * The date picker caps a window at 730 days, so a horizon past that covers
 * every range that ends anywhere near today — which is all of them, in
 * practice. Older windows fall back to counting raw rows, which is slow but
 * rare, and keeping the rollup bounded keeps it at ~1GB instead of growing
 * past the size of service_requests itself.
 */
export const ROLLUP_HORIZON_DAYS = 800;

/** The oldest day the rollup covers, as yyyy-MM-dd. */
export const rollupHorizonDay = (now: Date = new Date()) =>
  formatDay(addDays(parseISO(sfToday(now)), -ROLLUP_HORIZON_DAYS));

/**
 * Request counts per H3 cell.
 *
 * Served from the daily rollup, which is what makes a long window cheap;
 * windows reaching back past the horizon count raw rows instead. `queryId` is
 * "" for the unfiltered map, which the rollup keeps as its own series
 * alongside one per predefined query.
 */
export const countByH3Cell = async (
  resolution: H3Resolution,
  dateStart: string,
  dateEnd: string,
  queryId: string = "",
) => {
  if (dateStart < rollupHorizonDay()) {
    return toHexCounts(
      await (queryId
        ? queries.countByH3CellForQuery.run(
            {
              query_id: queryId,
              resolution,
              date_start: dateStart,
              date_end: dateEnd,
            },
            db,
          )
        : queries.countByH3Cell.run(
            { resolution, date_start: dateStart, date_end: dateEnd },
            db,
          )),
    );
  }

  return toHexCounts(
    await queries.countH3DailyCells.run(
      {
        query_id: queryId,
        resolution,
        date_start: dateStart,
        date_end: dateEnd,
      },
      db,
    ),
  );
};

/**
 * Recomputes the rollup for whole days, from whatever service_requests and
 * query tags currently say.
 *
 * Recompute rather than increment: ingest re-upserts requests it has already
 * seen, and a request's tags can change under it, so adding to a running
 * count would drift.
 */
export const refreshH3DailyForDays = async (
  days: string[],
  conn: DbConnection = db,
) => {
  if (days.length === 0) return;
  await queries.deleteH3DailyForDays.run({ days }, conn);
  await queries.insertH3DailyForDays.run({ days }, conn);
};

/** Drops rollup days that have fallen past the horizon. */
export const pruneH3Daily = async (before: string = rollupHorizonDay()) => {
  await queries.pruneH3DailyBefore.run({ day: before }, db);
  return before;
};

/** The days a batch of requests falls on, as yyyy-MM-dd. */
export const findDaysForRequests = async (
  ids: string[],
  conn: DbConnection = db,
) => {
  if (ids.length === 0) return [];
  const rows = await queries.findDaysForRequests.run({ ids }, conn);
  return rows.flatMap((r) => (r.day ? [formatDay(r.day)] : []));
};

/**
 * Recomputes the rollup for every day a batch of requests touches, ignoring
 * days past the horizon: those are answered from raw rows and would only be
 * pruned again tonight.
 */
export const refreshH3DailyForRequests = async (
  ids: string[],
  conn: DbConnection = db,
) => {
  const horizon = rollupHorizonDay();
  const days = await findDaysForRequests(ids, conn);
  return refreshH3DailyForDays(
    days.filter((day) => day >= horizon),
    conn,
  );
};

export type ServiceRequestInput = Omit<
  ServiceRequest,
  "created_at" | "updated_at"
>;

/**
 * Upserts a batch of service requests and rewrites their query tags in one
 * transaction, so a failure in either step leaves the database unchanged.
 */
export const createMany = async (serviceRequests: ServiceRequestInput[]) => {
  if (serviceRequests.length === 0) {
    return [];
  }

  // Dates are instants in JS; Postgres stores SF wall-clock. Convert here so
  // the result does not depend on the server's TZ (see src/lib/time.ts).
  const mappedRequests = serviceRequests.map((req) => ({
    service_request_id: req.service_request_id,
    requested_datetime: toSfWallClock(req.requested_datetime),
    closed_date: toSfWallClockOrNull(req.closed_date),
    updated_datetime: toSfWallClockOrNull(req.updated_datetime),
    status_description: req.status_description,
    status_notes: req.status_notes,
    agency_responsible: req.agency_responsible,
    service_name: req.service_name,
    service_subtype: req.service_subtype,
    service_details: req.service_details,
    address: req.address,
    street: req.street,
    supervisor_district: req.supervisor_district,
    neighborhoods_sffind_boundaries: req.neighborhoods_sffind_boundaries,
    analysis_neighborhood: req.analysis_neighborhood,
    police_district: req.police_district,
    source: req.source,
    data_as_of: toSfWallClockOrNull(req.data_as_of),
    data_loaded_at: toSfWallClockOrNull(req.data_loaded_at),
    lat: req.lat ?? null,
    long: req.long ?? null,
    media_url: req.media_url,
    ...h3CellsForPoint(req.lat, req.long),
  }));

  return withTransaction(async (tx) => {
    const result = await queries.createServiceRequests.run(
      { requests: mappedRequests },
      tx,
    );
    await replaceQueryTagsForMany(serviceRequests, tx);
    // Keep the hexbin rollup in step with the rows just written, in the same
    // transaction: a map query never sees counts for a half-written batch.
    await refreshH3DailyForRequests(
      mappedRequests.map((r) => r.service_request_id),
      tx,
    );
    return result;
  });
};

function storeToEntity(
  result: queries.IFindServiceRequestByIdResult,
): ServiceRequest {
  return {
    ...result,
    // Only some of the media urls in the dataset actually work, so null out anything else here
    media_url: isSupportedMediaUrl(result.media_url) ? result.media_url : null,
  };
}

function isSupportedMediaUrl(url: string | null) {
  if (url === null) {
    return false;
  }

  try {
    const domain = new URL(url).hostname;
    return supportedMediaDomains.some((supportedDomain) =>
      domain.endsWith(supportedDomain),
    );
  } catch {
    return false;
  }
}
