/** Types generated for queries found in "src/store/queries/service_request.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

/** 'FindServiceRequestById' parameters type */
export interface IFindServiceRequestByIdParams {
  service_request_id?: bigint | null | void;
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
  geom: string | null;
  lat: number | null;
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
  supervisor_district: string | null;
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
