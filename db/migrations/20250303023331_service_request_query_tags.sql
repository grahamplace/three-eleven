-- migrate:up
CREATE TABLE IF NOT EXISTS service_request_query_tags (
  service_request_id TEXT NOT NULL,
  query_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (service_request_id, query_id),
  FOREIGN KEY (service_request_id) REFERENCES service_requests(service_request_id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS service_request_query_tags;
