/** Types generated for queries found in "src/store/queries/service_request.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

export type DateOrString = Date | string;

export type stringArray = string[];

/** 'GetLatestUpdatedDatetime' parameters type */
export type IGetLatestUpdatedDatetimeParams = void;

/** 'GetLatestUpdatedDatetime' return type */
export interface IGetLatestUpdatedDatetimeResult {
  updated_datetime: Date | null;
}

/** 'GetLatestUpdatedDatetime' query type */
export interface IGetLatestUpdatedDatetimeQuery {
  params: IGetLatestUpdatedDatetimeParams;
  result: IGetLatestUpdatedDatetimeResult;
}

const getLatestUpdatedDatetimeIR: any = {
  usedParamSet: {},
  params: [],
  statement:
    "SELECT COALESCE(MAX(updated_datetime), '1970-01-01') as updated_datetime FROM service_requests",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT COALESCE(MAX(updated_datetime), '1970-01-01') as updated_datetime FROM service_requests
 * ```
 */
export const getLatestUpdatedDatetime = new PreparedQuery<
  IGetLatestUpdatedDatetimeParams,
  IGetLatestUpdatedDatetimeResult
>(getLatestUpdatedDatetimeIR);

/** 'FindServiceRequestById' parameters type */
export interface IFindServiceRequestByIdParams {
  service_request_id?: string | null | void;
}

/** 'FindServiceRequestById' return type */
export interface IFindServiceRequestByIdResult {
  address: string | null;
  agency_responsible: string | null;
  analysis_neighborhood: string | null;
  closed_date: Date | null;
  created_at: Date | null;
  data_as_of: Date | null;
  data_loaded_at: Date | null;
  h3_r10: string | null;
  h3_r11: string | null;
  h3_r7: string | null;
  h3_r8: string | null;
  h3_r9: string | null;
  lat: number | null;
  latlon: string | null;
  long: number | null;
  media_url: string | null;
  neighborhoods_sffind_boundaries: string | null;
  police_district: string | null;
  requested_datetime: Date;
  service_details: string | null;
  service_name: string | null;
  service_request_id: string;
  service_subtype: string | null;
  source: string | null;
  status_description: string | null;
  status_notes: string | null;
  street: string | null;
  supervisor_district: number | null;
  updated_at: Date | null;
  updated_datetime: Date | null;
}

/** 'FindServiceRequestById' query type */
export interface IFindServiceRequestByIdQuery {
  params: IFindServiceRequestByIdParams;
  result: IFindServiceRequestByIdResult;
}

const findServiceRequestByIdIR: any = {
  usedParamSet: { service_request_id: true },
  params: [
    {
      name: "service_request_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 58, b: 76 }],
    },
  ],
  statement:
    "SELECT * FROM service_requests WHERE service_request_id = :service_request_id",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM service_requests WHERE service_request_id = :service_request_id
 * ```
 */
export const findServiceRequestById = new PreparedQuery<
  IFindServiceRequestByIdParams,
  IFindServiceRequestByIdResult
>(findServiceRequestByIdIR);

/** 'FindServiceRequestByDateAndType' parameters type */
export interface IFindServiceRequestByDateAndTypeParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
  service_details?: stringArray | null | void;
}

/** 'FindServiceRequestByDateAndType' return type */
export interface IFindServiceRequestByDateAndTypeResult {
  address: string | null;
  agency_responsible: string | null;
  analysis_neighborhood: string | null;
  closed_date: Date | null;
  created_at: Date | null;
  data_as_of: Date | null;
  data_loaded_at: Date | null;
  h3_r10: string | null;
  h3_r11: string | null;
  h3_r7: string | null;
  h3_r8: string | null;
  h3_r9: string | null;
  lat: number | null;
  latlon: string | null;
  long: number | null;
  media_url: string | null;
  neighborhoods_sffind_boundaries: string | null;
  police_district: string | null;
  requested_datetime: Date;
  service_details: string | null;
  service_name: string | null;
  service_request_id: string;
  service_subtype: string | null;
  source: string | null;
  status_description: string | null;
  status_notes: string | null;
  street: string | null;
  supervisor_district: number | null;
  updated_at: Date | null;
  updated_datetime: Date | null;
}

/** 'FindServiceRequestByDateAndType' query type */
export interface IFindServiceRequestByDateAndTypeQuery {
  params: IFindServiceRequestByDateAndTypeParams;
  result: IFindServiceRequestByDateAndTypeResult;
}

const findServiceRequestByDateAndTypeIR: any = {
  usedParamSet: { date_start: true, date_end: true, service_details: true },
  params: [
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 73, b: 83 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 89, b: 97 }],
    },
    {
      name: "service_details",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 128, b: 143 }],
    },
  ],
  statement:
    "SELECT *\n  FROM service_requests\n WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end\n   AND service_details = ANY(:service_details)",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 *   FROM service_requests
 *  WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
 *    AND service_details = ANY(:service_details)
 * ```
 */
export const findServiceRequestByDateAndType = new PreparedQuery<
  IFindServiceRequestByDateAndTypeParams,
  IFindServiceRequestByDateAndTypeResult
>(findServiceRequestByDateAndTypeIR);

/** 'FindAllServiceRequestsByDate' parameters type */
export interface IFindAllServiceRequestsByDateParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
}

/** 'FindAllServiceRequestsByDate' return type */
export interface IFindAllServiceRequestsByDateResult {
  address: string | null;
  agency_responsible: string | null;
  analysis_neighborhood: string | null;
  closed_date: Date | null;
  created_at: Date | null;
  data_as_of: Date | null;
  data_loaded_at: Date | null;
  h3_r10: string | null;
  h3_r11: string | null;
  h3_r7: string | null;
  h3_r8: string | null;
  h3_r9: string | null;
  lat: number | null;
  latlon: string | null;
  long: number | null;
  media_url: string | null;
  neighborhoods_sffind_boundaries: string | null;
  police_district: string | null;
  requested_datetime: Date;
  service_details: string | null;
  service_name: string | null;
  service_request_id: string;
  service_subtype: string | null;
  source: string | null;
  status_description: string | null;
  status_notes: string | null;
  street: string | null;
  supervisor_district: number | null;
  updated_at: Date | null;
  updated_datetime: Date | null;
}

/** 'FindAllServiceRequestsByDate' query type */
export interface IFindAllServiceRequestsByDateQuery {
  params: IFindAllServiceRequestsByDateParams;
  result: IFindAllServiceRequestsByDateResult;
}

const findAllServiceRequestsByDateIR: any = {
  usedParamSet: { date_start: true, date_end: true },
  params: [
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 73, b: 83 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 89, b: 97 }],
    },
  ],
  statement:
    "SELECT *\n  FROM service_requests\n WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end                                                                                  ",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT *
 *   FROM service_requests
 *  WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
 * ```
 */
export const findAllServiceRequestsByDate = new PreparedQuery<
  IFindAllServiceRequestsByDateParams,
  IFindAllServiceRequestsByDateResult
>(findAllServiceRequestsByDateIR);

/** 'FindPointsByDate' parameters type */
export interface IFindPointsByDateParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
}

/** 'FindPointsByDate' return type */
export interface IFindPointsByDateResult {
  lat: number | null;
  long: number | null;
  service_request_id: string;
}

/** 'FindPointsByDate' query type */
export interface IFindPointsByDateQuery {
  params: IFindPointsByDateParams;
  result: IFindPointsByDateResult;
}

const findPointsByDateIR: any = {
  usedParamSet: { date_start: true, date_end: true },
  params: [
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 101, b: 111 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 117, b: 125 }],
    },
  ],
  statement:
    "SELECT service_request_id, lat, long\n  FROM service_requests\n WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end\n   AND lat IS NOT NULL AND long IS NOT NULL",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT service_request_id, lat, long
 *   FROM service_requests
 *  WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
 *    AND lat IS NOT NULL AND long IS NOT NULL
 * ```
 */
export const findPointsByDate = new PreparedQuery<
  IFindPointsByDateParams,
  IFindPointsByDateResult
>(findPointsByDateIR);

/** 'FindPointsByQueryId' parameters type */
export interface IFindPointsByQueryIdParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
  query_id?: string | null | void;
}

/** 'FindPointsByQueryId' return type */
export interface IFindPointsByQueryIdResult {
  lat: number | null;
  long: number | null;
  service_request_id: string;
}

/** 'FindPointsByQueryId' query type */
export interface IFindPointsByQueryIdQuery {
  params: IFindPointsByQueryIdParams;
  result: IFindPointsByQueryIdResult;
}

const findPointsByQueryIdIR: any = {
  usedParamSet: { query_id: true, date_start: true, date_end: true },
  params: [
    {
      name: "query_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 180, b: 188 }],
    },
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 233, b: 243 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 249, b: 257 }],
    },
  ],
  statement:
    "SELECT sr.service_request_id, sr.lat, sr.long\n  FROM service_requests sr\n  JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id\n WHERE qt.query_id = :query_id\n   AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end\n   AND sr.lat IS NOT NULL AND sr.long IS NOT NULL",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT sr.service_request_id, sr.lat, sr.long
 *   FROM service_requests sr
 *   JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
 *  WHERE qt.query_id = :query_id
 *    AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end
 *    AND sr.lat IS NOT NULL AND sr.long IS NOT NULL
 * ```
 */
export const findPointsByQueryId = new PreparedQuery<
  IFindPointsByQueryIdParams,
  IFindPointsByQueryIdResult
>(findPointsByQueryIdIR);

/** 'CountByH3Cell' parameters type */
export interface ICountByH3CellParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
  resolution?: number | null | void;
}

/** 'CountByH3Cell' return type */
export interface ICountByH3CellResult {
  count: number | null;
  h3_cell: string | null;
}

/** 'CountByH3Cell' query type */
export interface ICountByH3CellQuery {
  params: ICountByH3CellParams;
  result: ICountByH3CellResult;
}

const countByH3CellIR: any = {
  usedParamSet: { resolution: true, date_start: true, date_end: true },
  params: [
    {
      name: "resolution",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 64, b: 74 }],
    },
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 330, b: 340 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 346, b: 354 }],
    },
  ],
  statement:
    "SELECT h3_cell, COUNT(*)::int AS count\n  FROM (\n    SELECT CASE :resolution::int\n             WHEN 7 THEN h3_r7\n             WHEN 8 THEN h3_r8\n             WHEN 9 THEN h3_r9\n             WHEN 10 THEN h3_r10\n             ELSE h3_r11\n           END AS h3_cell\n      FROM service_requests\n     WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end\n  ) cells\n WHERE h3_cell IS NOT NULL\n GROUP BY h3_cell",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT h3_cell, COUNT(*)::int AS count
 *   FROM (
 *     SELECT CASE :resolution::int
 *              WHEN 7 THEN h3_r7
 *              WHEN 8 THEN h3_r8
 *              WHEN 9 THEN h3_r9
 *              WHEN 10 THEN h3_r10
 *              ELSE h3_r11
 *            END AS h3_cell
 *       FROM service_requests
 *      WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
 *   ) cells
 *  WHERE h3_cell IS NOT NULL
 *  GROUP BY h3_cell
 * ```
 */
export const countByH3Cell = new PreparedQuery<
  ICountByH3CellParams,
  ICountByH3CellResult
>(countByH3CellIR);

/** 'CountByH3CellForQuery' parameters type */
export interface ICountByH3CellForQueryParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
  query_id?: string | null | void;
  resolution?: number | null | void;
}

/** 'CountByH3CellForQuery' return type */
export interface ICountByH3CellForQueryResult {
  count: number | null;
  h3_cell: string | null;
}

/** 'CountByH3CellForQuery' query type */
export interface ICountByH3CellForQueryQuery {
  params: ICountByH3CellForQueryParams;
  result: ICountByH3CellForQueryResult;
}

const countByH3CellForQueryIR: any = {
  usedParamSet: {
    resolution: true,
    query_id: true,
    date_start: true,
    date_end: true,
  },
  params: [
    {
      name: "resolution",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 64, b: 74 }],
    },
    {
      name: "query_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 419, b: 427 }],
    },
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 476, b: 486 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 492, b: 500 }],
    },
  ],
  statement:
    "SELECT h3_cell, COUNT(*)::int AS count\n  FROM (\n    SELECT CASE :resolution::int\n             WHEN 7 THEN sr.h3_r7\n             WHEN 8 THEN sr.h3_r8\n             WHEN 9 THEN sr.h3_r9\n             WHEN 10 THEN sr.h3_r10\n             ELSE sr.h3_r11\n           END AS h3_cell\n      FROM service_requests sr\n      JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id\n     WHERE qt.query_id = :query_id\n       AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end\n  ) cells\n WHERE h3_cell IS NOT NULL\n GROUP BY h3_cell",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT h3_cell, COUNT(*)::int AS count
 *   FROM (
 *     SELECT CASE :resolution::int
 *              WHEN 7 THEN sr.h3_r7
 *              WHEN 8 THEN sr.h3_r8
 *              WHEN 9 THEN sr.h3_r9
 *              WHEN 10 THEN sr.h3_r10
 *              ELSE sr.h3_r11
 *            END AS h3_cell
 *       FROM service_requests sr
 *       JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
 *      WHERE qt.query_id = :query_id
 *        AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end
 *   ) cells
 *  WHERE h3_cell IS NOT NULL
 *  GROUP BY h3_cell
 * ```
 */
export const countByH3CellForQuery = new PreparedQuery<
  ICountByH3CellForQueryParams,
  ICountByH3CellForQueryResult
>(countByH3CellForQueryIR);

/** 'CreateServiceRequests' parameters type */
export interface ICreateServiceRequestsParams {
  requests: readonly {
    service_request_id: string | null | void;
    requested_datetime: DateOrString | null | void;
    closed_date: DateOrString | null | void;
    updated_datetime: DateOrString | null | void;
    status_description: string | null | void;
    status_notes: string | null | void;
    agency_responsible: string | null | void;
    service_name: string | null | void;
    service_subtype: string | null | void;
    service_details: string | null | void;
    address: string | null | void;
    street: string | null | void;
    supervisor_district: number | null | void;
    neighborhoods_sffind_boundaries: string | null | void;
    analysis_neighborhood: string | null | void;
    police_district: string | null | void;
    source: string | null | void;
    data_as_of: DateOrString | null | void;
    data_loaded_at: DateOrString | null | void;
    lat: number | null | void;
    long: number | null | void;
    media_url: string | null | void;
    h3_r7: string | null | void;
    h3_r8: string | null | void;
    h3_r9: string | null | void;
    h3_r10: string | null | void;
    h3_r11: string | null | void;
  }[];
}

/** 'CreateServiceRequests' return type */
export type ICreateServiceRequestsResult = void;

/** 'CreateServiceRequests' query type */
export interface ICreateServiceRequestsQuery {
  params: ICreateServiceRequestsParams;
  result: ICreateServiceRequestsResult;
}

const createServiceRequestsIR: any = {
  usedParamSet: { requests: true },
  params: [
    {
      name: "requests",
      required: false,
      transform: {
        type: "pick_array_spread",
        keys: [
          { name: "service_request_id", required: false },
          { name: "requested_datetime", required: false },
          { name: "closed_date", required: false },
          { name: "updated_datetime", required: false },
          { name: "status_description", required: false },
          { name: "status_notes", required: false },
          { name: "agency_responsible", required: false },
          { name: "service_name", required: false },
          { name: "service_subtype", required: false },
          { name: "service_details", required: false },
          { name: "address", required: false },
          { name: "street", required: false },
          { name: "supervisor_district", required: false },
          { name: "neighborhoods_sffind_boundaries", required: false },
          { name: "analysis_neighborhood", required: false },
          { name: "police_district", required: false },
          { name: "source", required: false },
          { name: "data_as_of", required: false },
          { name: "data_loaded_at", required: false },
          { name: "lat", required: false },
          { name: "long", required: false },
          { name: "media_url", required: false },
          { name: "h3_r7", required: false },
          { name: "h3_r8", required: false },
          { name: "h3_r9", required: false },
          { name: "h3_r10", required: false },
          { name: "h3_r11", required: false },
        ],
      },
      locs: [{ a: 526, b: 534 }],
    },
  ],
  statement:
    "INSERT INTO service_requests (\n    service_request_id,\n    requested_datetime,\n    closed_date,\n    updated_datetime,\n    status_description,\n    status_notes,\n    agency_responsible,\n    service_name,\n    service_subtype,\n    service_details,\n    address,\n    street,\n    supervisor_district,\n    neighborhoods_sffind_boundaries,\n    analysis_neighborhood,\n    police_district,\n    source,\n    data_as_of,\n    data_loaded_at,\n    lat,\n    long,\n    media_url,\n    h3_r7,\n    h3_r8,\n    h3_r9,\n    h3_r10,\n    h3_r11\n) VALUES :requests\nON CONFLICT (service_request_id) DO UPDATE SET\n    requested_datetime = EXCLUDED.requested_datetime,\n    closed_date = EXCLUDED.closed_date,\n    updated_datetime = EXCLUDED.updated_datetime,\n    status_description = EXCLUDED.status_description,\n    status_notes = EXCLUDED.status_notes,\n    agency_responsible = EXCLUDED.agency_responsible,\n    service_name = EXCLUDED.service_name,\n    service_subtype = EXCLUDED.service_subtype,\n    service_details = EXCLUDED.service_details,\n    address = EXCLUDED.address,\n    street = EXCLUDED.street,\n    supervisor_district = EXCLUDED.supervisor_district,\n    neighborhoods_sffind_boundaries = EXCLUDED.neighborhoods_sffind_boundaries,\n    analysis_neighborhood = EXCLUDED.analysis_neighborhood,\n    police_district = EXCLUDED.police_district,\n    source = EXCLUDED.source,\n    data_as_of = EXCLUDED.data_as_of,\n    data_loaded_at = EXCLUDED.data_loaded_at,\n    lat = EXCLUDED.lat,\n    long = EXCLUDED.long,\n    media_url = EXCLUDED.media_url,\n    h3_r7 = EXCLUDED.h3_r7,\n    h3_r8 = EXCLUDED.h3_r8,\n    h3_r9 = EXCLUDED.h3_r9,\n    h3_r10 = EXCLUDED.h3_r10,\n    h3_r11 = EXCLUDED.h3_r11",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO service_requests (
 *     service_request_id,
 *     requested_datetime,
 *     closed_date,
 *     updated_datetime,
 *     status_description,
 *     status_notes,
 *     agency_responsible,
 *     service_name,
 *     service_subtype,
 *     service_details,
 *     address,
 *     street,
 *     supervisor_district,
 *     neighborhoods_sffind_boundaries,
 *     analysis_neighborhood,
 *     police_district,
 *     source,
 *     data_as_of,
 *     data_loaded_at,
 *     lat,
 *     long,
 *     media_url,
 *     h3_r7,
 *     h3_r8,
 *     h3_r9,
 *     h3_r10,
 *     h3_r11
 * ) VALUES :requests
 * ON CONFLICT (service_request_id) DO UPDATE SET
 *     requested_datetime = EXCLUDED.requested_datetime,
 *     closed_date = EXCLUDED.closed_date,
 *     updated_datetime = EXCLUDED.updated_datetime,
 *     status_description = EXCLUDED.status_description,
 *     status_notes = EXCLUDED.status_notes,
 *     agency_responsible = EXCLUDED.agency_responsible,
 *     service_name = EXCLUDED.service_name,
 *     service_subtype = EXCLUDED.service_subtype,
 *     service_details = EXCLUDED.service_details,
 *     address = EXCLUDED.address,
 *     street = EXCLUDED.street,
 *     supervisor_district = EXCLUDED.supervisor_district,
 *     neighborhoods_sffind_boundaries = EXCLUDED.neighborhoods_sffind_boundaries,
 *     analysis_neighborhood = EXCLUDED.analysis_neighborhood,
 *     police_district = EXCLUDED.police_district,
 *     source = EXCLUDED.source,
 *     data_as_of = EXCLUDED.data_as_of,
 *     data_loaded_at = EXCLUDED.data_loaded_at,
 *     lat = EXCLUDED.lat,
 *     long = EXCLUDED.long,
 *     media_url = EXCLUDED.media_url,
 *     h3_r7 = EXCLUDED.h3_r7,
 *     h3_r8 = EXCLUDED.h3_r8,
 *     h3_r9 = EXCLUDED.h3_r9,
 *     h3_r10 = EXCLUDED.h3_r10,
 *     h3_r11 = EXCLUDED.h3_r11
 * ```
 */
export const createServiceRequests = new PreparedQuery<
  ICreateServiceRequestsParams,
  ICreateServiceRequestsResult
>(createServiceRequestsIR);
