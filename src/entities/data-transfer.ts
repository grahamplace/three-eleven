import { ServiceRequest } from "./service-request";

export type ServiceRequestDTOThin = {
  service_request_id: string;
  latitude: number | null;
  longitude: number | null;
  weight: number;
};

export const serviceRequestToDTOThin = (
  serviceRequest: ServiceRequest
): ServiceRequestDTOThin => {
  return {
    service_request_id: serviceRequest.service_request_id,
    latitude: serviceRequest.lat,
    longitude: serviceRequest.long,
    weight: 1,
  };
};
