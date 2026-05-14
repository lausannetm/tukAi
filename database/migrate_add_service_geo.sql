-- Run once against an existing DB that was created before latitude/longitude existed.
-- Example: docker compose exec db psql -U app -d app -f /path/to/migrate_add_service_geo.sql
-- Or paste into psql.

BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE services
SET
  latitude = COALESCE(latitude, 0),
  longitude = COALESCE(longitude, 0)
WHERE latitude IS NULL OR longitude IS NULL;

ALTER TABLE services
  ALTER COLUMN latitude SET NOT NULL,
  ALTER COLUMN longitude SET NOT NULL;

COMMIT;
