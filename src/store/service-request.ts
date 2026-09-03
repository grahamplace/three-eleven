import { db, withTransaction } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import * as tagQueries from "@/store/queries/service_request_query_tags.queries";
import { ServiceRequest } from "@/entities";
import { supportedMediaDomains } from "@/lib/config";
import { firstEntity } from "./utils";
import { replaceQueryTagsForMany } from "./service-request-query-tags";
import { h3CellsForPoint, type H3Resolution, type HexCount } from "@/lib/h3";
import { toSfWallClock, toSfWallClockOrNull } from "@/lib/time";

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

/** Request counts per H3 cell, aggregated in Postgres. */
export const countByH3Cell = async (
  resolution: H3Resolution,
  dateStart: string,
  dateEnd: string,
) =>
  toHexCounts(
    await queries.countByH3Cell.run(
      { resolution, date_start: dateStart, date_end: dateEnd },
      db,
    ),
  );

export const countByH3CellForQuery = async (
  queryId: string,
  resolution: H3Resolution,
  dateStart: string,
  dateEnd: string,
) =>
  toHexCounts(
    await queries.countByH3CellForQuery.run(
      {
        query_id: queryId,
        resolution,
        date_start: dateStart,
        date_end: dateEnd,
      },
      db,
    ),
  );

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
