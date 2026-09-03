/** Types generated for queries found in "src/store/queries/service_request_query_tags.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

export type DateOrString = Date | string;

export type stringArray = string[];

/** 'CreateServiceRequestQueryTags' parameters type */
export interface ICreateServiceRequestQueryTagsParams {
  tags: readonly {
    service_request_id: string | null | void;
    query_id: string | null | void;
  }[];
}

/** 'CreateServiceRequestQueryTags' return type */
export type ICreateServiceRequestQueryTagsResult = void;

/** 'CreateServiceRequestQueryTags' query type */
export interface ICreateServiceRequestQueryTagsQuery {
  params: ICreateServiceRequestQueryTagsParams;
  result: ICreateServiceRequestQueryTagsResult;
}

const createServiceRequestQueryTagsIR: any = {
  usedParamSet: { tags: true },
  params: [
    {
      name: "tags",
      required: false,
      transform: {
        type: "pick_array_spread",
        keys: [
          { name: "service_request_id", required: false },
          { name: "query_id", required: false },
        ],
      },
      locs: [{ a: 83, b: 87 }],
    },
  ],
  statement:
    "INSERT INTO service_request_query_tags (\n  service_request_id,\n  query_id\n) VALUES :tags\nON CONFLICT (service_request_id, query_id) DO NOTHING",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO service_request_query_tags (
 *   service_request_id,
 *   query_id
 * ) VALUES :tags
 * ON CONFLICT (service_request_id, query_id) DO NOTHING
 * ```
 */
export const createServiceRequestQueryTags = new PreparedQuery<
  ICreateServiceRequestQueryTagsParams,
  ICreateServiceRequestQueryTagsResult
>(createServiceRequestQueryTagsIR);

/** 'FindServiceRequestsByQueryId' parameters type */
export interface IFindServiceRequestsByQueryIdParams {
  date_end?: DateOrString | null | void;
  date_start?: DateOrString | null | void;
  query_id?: string | null | void;
}

/** 'FindServiceRequestsByQueryId' return type */
export interface IFindServiceRequestsByQueryIdResult {
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

/** 'FindServiceRequestsByQueryId' query type */
export interface IFindServiceRequestsByQueryIdQuery {
  params: IFindServiceRequestsByQueryIdParams;
  result: IFindServiceRequestsByQueryIdResult;
}

const findServiceRequestsByQueryIdIR: any = {
  usedParamSet: { query_id: true, date_start: true, date_end: true },
  params: [
    {
      name: "query_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 141, b: 149 }],
    },
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 193, b: 203 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 209, b: 217 }],
    },
  ],
  statement:
    "SELECT sr.*\nFROM service_requests sr\nJOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id\nWHERE qt.query_id = :query_id\n  AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT sr.*
 * FROM service_requests sr
 * JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
 * WHERE qt.query_id = :query_id
 *   AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end
 * ```
 */
export const findServiceRequestsByQueryId = new PreparedQuery<
  IFindServiceRequestsByQueryIdParams,
  IFindServiceRequestsByQueryIdResult
>(findServiceRequestsByQueryIdIR);

/** 'DeleteServiceRequestQueryTagsForMany' parameters type */
export interface IDeleteServiceRequestQueryTagsForManyParams {
  service_request_ids?: stringArray | null | void;
}

/** 'DeleteServiceRequestQueryTagsForMany' return type */
export type IDeleteServiceRequestQueryTagsForManyResult = void;

/** 'DeleteServiceRequestQueryTagsForMany' query type */
export interface IDeleteServiceRequestQueryTagsForManyQuery {
  params: IDeleteServiceRequestQueryTagsForManyParams;
  result: IDeleteServiceRequestQueryTagsForManyResult;
}

const deleteServiceRequestQueryTagsForManyIR: any = {
  usedParamSet: { service_request_ids: true },
  params: [
    {
      name: "service_request_ids",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 70, b: 89 }],
    },
  ],
  statement:
    "DELETE FROM service_request_query_tags\nWHERE service_request_id = ANY(:service_request_ids)",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM service_request_query_tags
 * WHERE service_request_id = ANY(:service_request_ids)
 * ```
 */
export const deleteServiceRequestQueryTagsForMany = new PreparedQuery<
  IDeleteServiceRequestQueryTagsForManyParams,
  IDeleteServiceRequestQueryTagsForManyResult
>(deleteServiceRequestQueryTagsForManyIR);
