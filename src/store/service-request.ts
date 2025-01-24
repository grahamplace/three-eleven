import { db } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import { ServiceRequest } from "@/entities";
import { firstEntity } from "./util";

export const find = async (serviceRequesId: bigint) => {
  const results = await queries.findServiceRequestById.run(
    { service_request_id: serviceRequesId },
    db
  );
  return firstEntity(results, storeToEntity);
};

function storeToEntity(
  result: queries.IFindServiceRequestByIdResult
): ServiceRequest {
  return {
    service_request_id: parseInt(result.service_request_id, 10),
    requested_datetime: result.requested_datetime,
    closed_date: result.closed_date,
    updated_datetime: result.updated_datetime,
    status_description: result.status_description,
    status_notes: result.status_notes,
    agency_responsible: result.agency_responsible,
    service_name: result.service_name,
    service_subtype: result.service_subtype,
    service_details: result.service_details,
    address: result.address,
    street: result.street,
    supervisor_district: result.supervisor_district
      ? parseFloat(result.supervisor_district)
      : null,
    neighborhoods_sffind_boundaries: result.neighborhoods_sffind_boundaries,
    analysis_neighborhood: result.analysis_neighborhood,
    police_district: result.police_district,
    source: result.source,
    data_as_of: result.data_as_of,
    data_loaded_at: result.data_loaded_at,
    lat: result.lat,
    long: result.long,
    media_url: result.media_url,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}
