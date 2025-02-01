-- migrate:up
CREATE INDEX service_idx ON service_requests (DATE(requested_datetime), service_name, service_subtype);

-- migrate:down
DROP INDEX service_idx;
