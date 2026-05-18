-- Backfill missing service images and require image_url on new rows.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_service_image_required.sql

BEGIN;

UPDATE services
SET image_url = '/images/services/default.png'
WHERE image_url IS NULL OR BTRIM(image_url) = '';

ALTER TABLE services
  ALTER COLUMN image_url SET NOT NULL;

COMMIT;
