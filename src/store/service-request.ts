import { db } from "@/lib/db";
import * as queries from "@/store/queries/service_request.queries";
import { ServiceRequest } from "@/entities";
import { firstEntity } from "./util";

export const getLatestUpdatedDatetime = async () => {
  const results = await queries.getLatestUpdatedDatetime.run(undefined, db);
  const result = results[0].updated_datetime;
  if (result === null) {
    throw new Error("No updated datetime found");
  }
  return result;
};

export const find = async (serviceRequesId: string) => {
  const results = await queries.findServiceRequestById.run(
    { service_request_id: serviceRequesId },
    db
  );
  return firstEntity(results, storeToEntity);
};

export const createMany = async (
  serviceRequests: Omit<ServiceRequest, "created_at" | "updated_at">[]
) => {
  const mappedRequests = serviceRequests.map((req) => ({
    service_request_id: req.service_request_id,
    requested_datetime: req.requested_datetime,
    closed_date: req.closed_date,
    updated_datetime: req.updated_datetime,
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
    data_as_of: req.data_as_of,
    data_loaded_at: req.data_loaded_at,
    lat: req.lat || null,
    long: req.long || null,
    media_url: req.media_url,
  }));

  try {
    const result = await queries.createServiceRequests.run(
      { requests: mappedRequests },
      db
    );
    return result;
  } catch (error) {
    console.error("Error upserting service requests:", error);
    throw error;
  }
};

function storeToEntity(
  result: queries.IFindServiceRequestByIdResult
): ServiceRequest {
  return {
    ...result,
  };
}
