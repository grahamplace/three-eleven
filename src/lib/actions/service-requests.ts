"use server";

import { ServiceRequest } from "@/entities";
import { findByDateAndType, find } from "@/store/service-request";
import {
  ServiceRequestDTOThin,
  serviceRequestToDTOThin,
} from "@/entities/data-transfer";

export const getServiceRequests = async (
  dateStart: string,
  dateEnd: string,
  serviceDetails: string[]
): Promise<ServiceRequestDTOThin[]> => {
  const results = await findByDateAndType(dateStart, dateEnd, serviceDetails);
  const dtos = results.map(serviceRequestToDTOThin);
  return dtos;
};

export const getServiceRequestById = async (
  id: string
): Promise<ServiceRequest | null> => {
  const result = await find(id);
  return result;
};
