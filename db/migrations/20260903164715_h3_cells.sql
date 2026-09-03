-- migrate:up
-- H3 cell ids at each resolution the map renders (zoom 9 .. 15+).
-- Populated by the store on write and by scripts/backfill-h3.ts for existing rows,
-- so hexbin counts can be aggregated with a plain GROUP BY instead of shipping
-- every point to the browser.
ALTER TABLE service_requests
  ADD COLUMN h3_r7 TEXT,
  ADD COLUMN h3_r8 TEXT,
  ADD COLUMN h3_r9 TEXT,
  ADD COLUMN h3_r10 TEXT,
  ADD COLUMN h3_r11 TEXT;

-- migrate:down
ALTER TABLE service_requests
  DROP COLUMN h3_r7,
  DROP COLUMN h3_r8,
  DROP COLUMN h3_r9,
  DROP COLUMN h3_r10,
  DROP COLUMN h3_r11;
