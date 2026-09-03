-- migrate:up
-- created_at / updated_at are set by the database (NOW()), so they are true
-- instants and belong in timestamptz. The SF 311 timestamps stay `timestamp`
-- (naive) on purpose: they are Pacific wall-clock values exactly as the city
-- publishes them. See src/lib/time.ts for the convention.
ALTER TABLE service_requests
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- migrate:down
ALTER TABLE service_requests
  ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP USING updated_at AT TIME ZONE 'UTC';
