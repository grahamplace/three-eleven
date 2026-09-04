-- migrate:up
-- Per-day request counts per H3 cell, so a hexbin query reads a narrow
-- purpose-built table instead of scanning service_requests.
--
-- Counting from service_requests directly means touching every row in the
-- window (~500k for a year) across a ~470-byte-wide table to read a 16-byte
-- cell id, which the planner turns into a sequential scan of the whole table:
-- a one-year hexbin query timed out in production. Summing pre-aggregated
-- daily rows covers the same window in ~15MB.
--
-- query_id is '' for the unfiltered map and the query's id for a filtered one,
-- so both paths share a table and a query shape.
CREATE TABLE service_request_h3_daily (
  query_id TEXT NOT NULL,
  resolution SMALLINT NOT NULL,
  day DATE NOT NULL,
  cell TEXT NOT NULL,
  count INTEGER NOT NULL
);

-- Serves the read path as an index-only scan: the leading columns pin one
-- (query, resolution) series and range-scan the days, and count rides along.
CREATE UNIQUE INDEX service_request_h3_daily_series_idx
  ON service_request_h3_daily (query_id, resolution, day, cell) INCLUDE (count);

-- Maintenance recomputes whole days, which needs to find them across every
-- query_id and resolution.
CREATE INDEX service_request_h3_daily_day_idx
  ON service_request_h3_daily (day);

-- migrate:down
DROP TABLE IF EXISTS service_request_h3_daily;
