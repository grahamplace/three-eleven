/** Types generated for queries found in "src/store/queries/service_request.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

/** Query 'GetLatestUpdatedDatetime' is invalid, so its result is assigned type 'never'.
 *  */
export type IGetLatestUpdatedDatetimeResult = never;

/** Query 'GetLatestUpdatedDatetime' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IGetLatestUpdatedDatetimeParams = never;

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

/** Query 'FindServiceRequestById' is invalid, so its result is assigned type 'never'.
 *  */
export type IFindServiceRequestByIdResult = never;

/** Query 'FindServiceRequestById' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IFindServiceRequestByIdParams = never;

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

/** Query 'FindServiceRequestByDateAndType' is invalid, so its result is assigned type 'never'.
 *  */
export type IFindServiceRequestByDateAndTypeResult = never;

/** Query 'FindServiceRequestByDateAndType' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IFindServiceRequestByDateAndTypeParams = never;

const findServiceRequestByDateAndTypeIR: any = {
  usedParamSet: { date_start: true, date_end: true, service_details: true },
  params: [
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 75, b: 85 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 91, b: 99 }],
    },
    {
      name: "service_details",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 130, b: 145 }],
    },
  ],
  statement:
    "SELECT * \n  FROM service_requests \n WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end\n   AND service_details = ANY(:service_details)",
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

/** Query 'FindAllServiceRequestsByDate' is invalid, so its result is assigned type 'never'.
 *  */
export type IFindAllServiceRequestsByDateResult = never;

/** Query 'FindAllServiceRequestsByDate' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IFindAllServiceRequestsByDateParams = never;

const findAllServiceRequestsByDateIR: any = {
  usedParamSet: { date_start: true, date_end: true },
  params: [
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 75, b: 85 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 91, b: 99 }],
    },
  ],
  statement:
    "SELECT * \n  FROM service_requests \n WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end",
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

/** Query 'CreateServiceRequests' is invalid, so its result is assigned type 'never'.
 *  */
export type ICreateServiceRequestsResult = never;

/** Query 'CreateServiceRequests' is invalid, so its parameters are assigned type 'never'.
 *  */
export type ICreateServiceRequestsParams = never;

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
        ],
      },
      locs: [{ a: 469, b: 477 }],
    },
  ],
  statement:
    "INSERT INTO service_requests (\n    service_request_id,\n    requested_datetime,\n    closed_date,\n    updated_datetime,\n    status_description,\n    status_notes,\n    agency_responsible,\n    service_name,\n    service_subtype,\n    service_details,\n    address,\n    street,\n    supervisor_district,\n    neighborhoods_sffind_boundaries,\n    analysis_neighborhood,\n    police_district,\n    source,\n    data_as_of,\n    data_loaded_at,\n    lat,\n    long,\n    media_url\n) VALUES :requests\nON CONFLICT (service_request_id) DO UPDATE SET\n    requested_datetime = EXCLUDED.requested_datetime,\n    closed_date = EXCLUDED.closed_date,\n    updated_datetime = EXCLUDED.updated_datetime,\n    status_description = EXCLUDED.status_description,\n    status_notes = EXCLUDED.status_notes,\n    agency_responsible = EXCLUDED.agency_responsible,\n    service_name = EXCLUDED.service_name,\n    service_subtype = EXCLUDED.service_subtype,\n    service_details = EXCLUDED.service_details,\n    address = EXCLUDED.address,\n    street = EXCLUDED.street,\n    supervisor_district = EXCLUDED.supervisor_district,\n    neighborhoods_sffind_boundaries = EXCLUDED.neighborhoods_sffind_boundaries,\n    analysis_neighborhood = EXCLUDED.analysis_neighborhood,\n    police_district = EXCLUDED.police_district,\n    source = EXCLUDED.source,\n    data_as_of = EXCLUDED.data_as_of,\n    data_loaded_at = EXCLUDED.data_loaded_at,\n    lat = EXCLUDED.lat,\n    long = EXCLUDED.long,\n    media_url = EXCLUDED.media_url",
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
 *     media_url
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
 *     media_url = EXCLUDED.media_url
 * ```
 */
export const createServiceRequests = new PreparedQuery<
  ICreateServiceRequestsParams,
  ICreateServiceRequestsResult
>(createServiceRequestsIR);

/** Query 'CreateServiceRequestQueryTagsForMany' is invalid, so its result is assigned type 'never'.
 *  */
export type ICreateServiceRequestQueryTagsForManyResult = never;

/** Query 'CreateServiceRequestQueryTagsForMany' is invalid, so its parameters are assigned type 'never'.
 *  */
export type ICreateServiceRequestQueryTagsForManyParams = never;

const createServiceRequestQueryTagsForManyIR: any = {
  usedParamSet: { service_requests: true },
  params: [
    {
      name: "service_requests",
      required: false,
      transform: {
        type: "pick_array_spread",
        keys: [
          { name: "service_request_id", required: false },
          { name: "query_id", required: false },
        ],
      },
      locs: [{ a: 87, b: 103 }],
    },
  ],
  statement:
    "INSERT INTO service_request_query_tags (\n    service_request_id,\n    query_id\n) VALUES :service_requests\nON CONFLICT (service_request_id, query_id) DO NOTHING",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO service_request_query_tags (
 *     service_request_id,
 *     query_id
 * ) VALUES :service_requests
 * ON CONFLICT (service_request_id, query_id) DO NOTHING
 * ```
 */
export const createServiceRequestQueryTagsForMany = new PreparedQuery<
  ICreateServiceRequestQueryTagsForManyParams,
  ICreateServiceRequestQueryTagsForManyResult
>(createServiceRequestQueryTagsForManyIR);
