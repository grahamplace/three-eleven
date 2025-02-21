/* @name GetLatestUpdatedDatetime */
SELECT COALESCE(MAX(updated_datetime), '1970-01-01') as updated_datetime FROM service_requests;

/* @name FindServiceRequestById */
SELECT * FROM service_requests WHERE service_request_id = :service_request_id;

/* @name FindServiceRequestByDateAndType */
SELECT * 
  FROM service_requests 
 WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
   AND service_details = ANY(:service_details);

/* @name CreateServiceRequests
   @param requests -> ((
     service_request_id,
     requested_datetime,
     closed_date,
     updated_datetime,
     status_description,
     status_notes,
     agency_responsible,
     service_name,
     service_subtype,
     service_details,
     address,
     street,
     supervisor_district,
     neighborhoods_sffind_boundaries,
     analysis_neighborhood,
     police_district,
     source,
     data_as_of,
     data_loaded_at,
     lat,
     long,
     media_url
   )...)
*/
INSERT INTO service_requests (
    service_request_id,
    requested_datetime,
    closed_date,
    updated_datetime,
    status_description,
    status_notes,
    agency_responsible,
    service_name,
    service_subtype,
    service_details,
    address,
    street,
    supervisor_district,
    neighborhoods_sffind_boundaries,
    analysis_neighborhood,
    police_district,
    source,
    data_as_of,
    data_loaded_at,
    lat,
    long,
    media_url
) VALUES :requests
ON CONFLICT (service_request_id) DO UPDATE SET
    requested_datetime = EXCLUDED.requested_datetime,
    closed_date = EXCLUDED.closed_date,
    updated_datetime = EXCLUDED.updated_datetime,
    status_description = EXCLUDED.status_description,
    status_notes = EXCLUDED.status_notes,
    agency_responsible = EXCLUDED.agency_responsible,
    service_name = EXCLUDED.service_name,
    service_subtype = EXCLUDED.service_subtype,
    service_details = EXCLUDED.service_details,
    address = EXCLUDED.address,
    street = EXCLUDED.street,
    supervisor_district = EXCLUDED.supervisor_district,
    neighborhoods_sffind_boundaries = EXCLUDED.neighborhoods_sffind_boundaries,
    analysis_neighborhood = EXCLUDED.analysis_neighborhood,
    police_district = EXCLUDED.police_district,
    source = EXCLUDED.source,
    data_as_of = EXCLUDED.data_as_of,
    data_loaded_at = EXCLUDED.data_loaded_at,
    lat = EXCLUDED.lat,
    long = EXCLUDED.long,
    media_url = EXCLUDED.media_url;