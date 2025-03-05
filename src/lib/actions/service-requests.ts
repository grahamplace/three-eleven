"use server";

import { ServiceRequest } from "@/entities";
import { findByDateAndType, findAll, find } from "@/store/service-request";
import {
  ServiceRequestDTOThin,
  serviceRequestToDTOThin,
} from "@/entities/data-transfer";
import { findServiceRequestsByQueryId } from "@/store/service-request-query-tags";
import { PREDEFINED_QUERIES } from "@/entities/query-definition";

export const getServiceRequests = async (
  dateStart: string,
  dateEnd: string,
  serviceDetails: string[]
): Promise<ServiceRequestDTOThin[]> => {
  let results;

  // If serviceDetails is empty, fetch all service requests
  if (serviceDetails.length === 0) {
    results = await findAll(dateStart, dateEnd);
  } else {
    results = await findByDateAndType(dateStart, dateEnd, serviceDetails);
  }

  const dtos = results.map(serviceRequestToDTOThin);
  return dtos;
};

export const getServiceRequestById = async (
  id: string
): Promise<ServiceRequest | null> => {
  const result = await find(id);
  return result;
};

export const getServiceRequestsByPredefinedQuery = async (
  queryId: string,
  dateStart: string,
  dateEnd: string
): Promise<ServiceRequestDTOThin[]> => {
  // Validate that the query ID exists
  if (!PREDEFINED_QUERIES[queryId]) {
    throw new Error(`Invalid query ID: ${queryId}`);
  }

  const results = await findServiceRequestsByQueryId(
    queryId,
    dateStart,
    dateEnd
  );
  const dtos = results.map(serviceRequestToDTOThin);
  return dtos;
};

export const getPredefinedQueries = async (): Promise<
  { id: string; name: string; description: string }[]
> => {
  return Object.values(PREDEFINED_QUERIES).map((query) => ({
    id: query.id,
    name: query.name,
    description: query.description,
  }));
};
