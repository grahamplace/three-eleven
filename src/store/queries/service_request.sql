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

/*
  Hexbin counts straight from service_requests. Only used for windows that
  reach back past the rollup horizon (see service_request_h3_daily): scanning
  raw rows for a long window is what these cost, which is why recent windows
  read the rollup instead.
*/

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

/*
  Hexbin counts read from the daily rollup (service_request_h3_daily), not
  from service_requests: counting raw rows for a long window means scanning
  the whole table for a 16-byte cell id. query_id is '' for the unfiltered
  map, so one query serves both paths.
*/

/* @name CountH3DailyCells */
SELECT cell AS h3_cell, SUM(count)::int AS count
  FROM service_request_h3_daily
 WHERE query_id = :query_id!
   AND resolution = :resolution!
   AND day BETWEEN :date_start! AND :date_end!
 GROUP BY cell;

/*
  Rollup maintenance. Whole days are recomputed rather than incremented:
  ingest re-upserts requests it has already seen, so adding to a count would
  drift, and a request's tags can change under it.

  Delete and insert are separate statements on purpose — a data-modifying CTE
  would not see its own deletes and could trip the unique index.
*/

/* @name DeleteH3DailyForDays */
DELETE FROM service_request_h3_daily WHERE day = ANY(:days!);

/* @name InsertH3DailyForDays */
INSERT INTO service_request_h3_daily (query_id, resolution, day, cell, count)
SELECT '' AS query_id,
       c.resolution,
       DATE(sr.requested_datetime) AS day,
       c.cell,
       COUNT(*)::int AS count
  FROM service_requests sr
  CROSS JOIN LATERAL (VALUES
         (7::smallint, sr.h3_r7),
         (8::smallint, sr.h3_r8),
         (9::smallint, sr.h3_r9),
         (10::smallint, sr.h3_r10),
         (11::smallint, sr.h3_r11)
       ) AS c(resolution, cell)
 WHERE DATE(sr.requested_datetime) = ANY(:days!)
   AND c.cell IS NOT NULL
 GROUP BY 1, 2, 3, 4
UNION ALL
SELECT qt.query_id,
       c.resolution,
       DATE(sr.requested_datetime) AS day,
       c.cell,
       COUNT(*)::int AS count
  FROM service_requests sr
  JOIN service_request_query_tags qt
    ON qt.service_request_id = sr.service_request_id
  CROSS JOIN LATERAL (VALUES
         (7::smallint, sr.h3_r7),
         (8::smallint, sr.h3_r8),
         (9::smallint, sr.h3_r9),
         (10::smallint, sr.h3_r10),
         (11::smallint, sr.h3_r11)
       ) AS c(resolution, cell)
 WHERE DATE(sr.requested_datetime) = ANY(:days!)
   AND c.cell IS NOT NULL
 GROUP BY 1, 2, 3, 4;

/* @name PruneH3DailyBefore */
DELETE FROM service_request_h3_daily WHERE day < :day!;

/* @name FindDaysForRequests */
SELECT DISTINCT DATE(requested_datetime) AS day
  FROM service_requests
 WHERE service_request_id = ANY(:ids!);

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
