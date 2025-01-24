-- migrate:up
CREATE EXTENSION IF NOT EXISTS postgis;

-- migrate:down
DROP EXTENSION IF EXISTS postgis;

