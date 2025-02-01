"use server";

import { findByDateAndType } from "@/store/service-request";
import {
  ServiceRequestDTO,
  serviceRequestToDTO,
} from "@/entities/data-transfer";

export const getServiceRequests = async (
  dateStart: string,
  dateEnd: string,
  serviceSubtype: string[]
): Promise<ServiceRequestDTO[]> => {
  console.log("server: fetching service request data on server");
  const results = await findByDateAndType(dateStart, dateEnd, serviceSubtype);
  const dtos = results.map(serviceRequestToDTO);
  return dtos;
};
