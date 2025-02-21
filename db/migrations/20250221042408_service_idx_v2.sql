-- migrate:up
CREATE INDEX service_idx_v2 ON service_requests (DATE(requested_datetime), service_name, service_details);

-- migrate:down
DROP INDEX service_idx_v2;
