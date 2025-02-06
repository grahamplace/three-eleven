import { ServiceRequest } from "./service-request";

export type ServiceRequestDTOThin = {
  serviceRequestId: string;
  latitude: number | null;
  longitude: number | null;
  weight: number;
};

export const serviceRequestToDTOThin = (
  serviceRequest: ServiceRequest
): ServiceRequestDTOThin => {
  return {
    serviceRequestId: serviceRequest.service_request_id,
    latitude: serviceRequest.lat,
    longitude: serviceRequest.long,
    weight: 1,
  };
};
