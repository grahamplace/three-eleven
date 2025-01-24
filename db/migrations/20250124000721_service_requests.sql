-- migrate:up
CREATE TABLE service_requests (
    service_request_id BIGINT PRIMARY KEY,
    requested_datetime TIMESTAMP NOT NULL,
    closed_date TIMESTAMP,
    updated_datetime TIMESTAMP,
    status_description VARCHAR(255),
    status_notes TEXT,
    agency_responsible VARCHAR(255),
    service_name VARCHAR(255),
    service_subtype VARCHAR(255),
    service_details TEXT,
    address TEXT,
    street VARCHAR(255),
    supervisor_district NUMERIC,
    neighborhoods_sffind_boundaries VARCHAR(255),
    analysis_neighborhood VARCHAR(255),
    police_district VARCHAR(255),
    source VARCHAR(255),
    data_as_of TIMESTAMP,
    data_loaded_at TIMESTAMP,
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
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

-- migrate:down
DROP TABLE service_requests;