-- Adds human-readable location, optional listing rating, and card image URL.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_service_listing_fields.sql

BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(4, 2),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_rating_check;

ALTER TABLE services
  ADD CONSTRAINT services_rating_check
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

UPDATE services
SET location = COALESCE(
  NULLIF(BTRIM(location), ''),
  NULLIF(
    SUBSTRING(description FROM 'Based in ([^.\n]+)'),
    ''
  ),
  'Bulgaria'
)
WHERE location IS NULL OR BTRIM(location) = '';

ALTER TABLE services
  ALTER COLUMN location SET NOT NULL;

COMMIT;
