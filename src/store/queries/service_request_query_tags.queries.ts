/** Types generated for queries found in "src/store/queries/service_request_query_tags.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

/** Query 'CreateServiceRequestQueryTags' is invalid, so its result is assigned type 'never'.
 *  */
export type ICreateServiceRequestQueryTagsResult = never;

/** Query 'CreateServiceRequestQueryTags' is invalid, so its parameters are assigned type 'never'.
 *  */
export type ICreateServiceRequestQueryTagsParams = never;

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

/** Query 'FindServiceRequestsByQueryId' is invalid, so its result is assigned type 'never'.
 *  */
export type IFindServiceRequestsByQueryIdResult = never;

/** Query 'FindServiceRequestsByQueryId' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IFindServiceRequestsByQueryIdParams = never;

const findServiceRequestsByQueryIdIR: any = {
  usedParamSet: { query_id: true, date_start: true, date_end: true },
  params: [
    {
      name: "query_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 142, b: 150 }],
    },
    {
      name: "date_start",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 194, b: 204 }],
    },
    {
      name: "date_end",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 210, b: 218 }],
    },
  ],
  statement:
    "SELECT sr.* \nFROM service_requests sr\nJOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id\nWHERE qt.query_id = :query_id\n  AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end",
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

/** Query 'DeleteServiceRequestQueryTags' is invalid, so its result is assigned type 'never'.
 *  */
export type IDeleteServiceRequestQueryTagsResult = never;

/** Query 'DeleteServiceRequestQueryTags' is invalid, so its parameters are assigned type 'never'.
 *  */
export type IDeleteServiceRequestQueryTagsParams = never;

const deleteServiceRequestQueryTagsIR: any = {
  usedParamSet: { service_request_id: true },
  params: [
    {
      name: "service_request_id",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 66, b: 84 }],
    },
  ],
  statement:
    "DELETE FROM service_request_query_tags\nWHERE service_request_id = :service_request_id",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM service_request_query_tags
 * WHERE service_request_id = :service_request_id
 * ```
 */
export const deleteServiceRequestQueryTags = new PreparedQuery<
  IDeleteServiceRequestQueryTagsParams,
  IDeleteServiceRequestQueryTagsResult
>(deleteServiceRequestQueryTagsIR);
