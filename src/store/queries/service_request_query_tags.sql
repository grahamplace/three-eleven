/* @name CreateServiceRequestQueryTags
   @param tags -> ((service_request_id, query_id)...)
*/
INSERT INTO service_request_query_tags (
  service_request_id,
  query_id
) VALUES :tags
ON CONFLICT (service_request_id, query_id) DO NOTHING;

/* @name FindServiceRequestsByQueryId */
SELECT sr.* 
FROM service_requests sr
JOIN service_request_query_tags qt ON sr.service_request_id = qt.service_request_id
WHERE qt.query_id = :query_id
  AND DATE(sr.requested_datetime) BETWEEN :date_start AND :date_end;

/* @name DeleteServiceRequestQueryTags */
DELETE FROM service_request_query_tags
WHERE service_request_id = :service_request_id; 