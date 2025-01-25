-- migrate:up
CREATE TABLE service_requests (
    service_request_id TEXT PRIMARY KEY,
    requested_datetime TIMESTAMP NOT NULL,
    closed_date TIMESTAMP,
    updated_datetime TIMESTAMP,
    status_description TEXT,
    status_notes TEXT,
    agency_responsible TEXT,
    service_name TEXT,
    service_subtype TEXT,
    service_details TEXT,
    address TEXT,
    street TEXT,
    supervisor_district INTEGER,
    neighborhoods_sffind_boundaries TEXT,
    analysis_neighborhood TEXT,
    police_district TEXT,
    source TEXT,
    data_as_of TIMESTAMP,
    data_loaded_at TIMESTAMP,
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    latlon GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(long, lat), 4326)
    ) STORED,
    media_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_service_requests_updated_datetime ON service_requests (updated_datetime);
CREATE INDEX idx_service_requests_latlon ON service_requests USING GIST (latlon);

-- migrate:down
DROP TABLE service_requests;
