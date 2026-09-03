/* @name GetLatestUpdatedDatetime */
SELECT COALESCE(MAX(updated_datetime), '1970-01-01') as updated_datetime FROM service_requests;

/* @name FindServiceRequestById */
SELECT * FROM service_requests WHERE service_request_id = :service_request_id;

/* @name FindServiceRequestByDateAndType */
SELECT *
  FROM service_requests
 WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
   AND service_details = ANY(:service_details);

/* @name FindAllServiceRequestsByDate */
SELECT *
  FROM service_requests
 WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end;

/*
  Map payloads. Only the columns the map needs, only rows that can be drawn.
*/

/* @name FindPointsByDate */
SELECT service_request_id, lat, long
  FROM service_requests
 WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
   AND lat IS NOT NULL AND long IS NOT NULL;

/* @name FindPointsByQueryId */
SELECT sr.service_request_id, sr.lat, sr.long
  FROM service_requests sr
  JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
 WHERE qt.query_id = :query_id
   AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end
   AND sr.lat IS NOT NULL AND sr.long IS NOT NULL;

/* @name CountByH3Cell */
SELECT h3_cell, COUNT(*)::int AS count
  FROM (
    SELECT CASE :resolution::int
             WHEN 7 THEN h3_r7
             WHEN 8 THEN h3_r8
             WHEN 9 THEN h3_r9
             WHEN 10 THEN h3_r10
             ELSE h3_r11
           END AS h3_cell
      FROM service_requests
     WHERE DATE(requested_datetime) BETWEEN :date_start AND :date_end
  ) cells
 WHERE h3_cell IS NOT NULL
 GROUP BY h3_cell;

/* @name CountByH3CellForQuery */
SELECT h3_cell, COUNT(*)::int AS count
  FROM (
    SELECT CASE :resolution::int
             WHEN 7 THEN sr.h3_r7
             WHEN 8 THEN sr.h3_r8
             WHEN 9 THEN sr.h3_r9
             WHEN 10 THEN sr.h3_r10
             ELSE sr.h3_r11
           END AS h3_cell
      FROM service_requests sr
      JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
     WHERE qt.query_id = :query_id
       AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end
  ) cells
 WHERE h3_cell IS NOT NULL
 GROUP BY h3_cell;

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
     media_url,
     h3_r7,
     h3_r8,
     h3_r9,
     h3_r10,
     h3_r11
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
    media_url,
    h3_r7,
    h3_r8,
    h3_r9,
    h3_r10,
    h3_r11
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
    media_url = EXCLUDED.media_url,
    h3_r7 = EXCLUDED.h3_r7,
    h3_r8 = EXCLUDED.h3_r8,
    h3_r9 = EXCLUDED.h3_r9,
    h3_r10 = EXCLUDED.h3_r10,
    h3_r11 = EXCLUDED.h3_r11;
