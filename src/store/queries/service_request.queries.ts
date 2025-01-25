/** Types generated for queries found in "src/store/queries/service_request.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

export type DateOrString = Date | string;

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
