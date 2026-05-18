-- Backfill missing service images and require image_url on new rows.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_service_image_required.sql

BEGIN;

UPDATE services
SET image_url = '/images/services/vision-api.png'
WHERE image_url IS NULL AND name ILIKE '%vision%';

UPDATE services
SET image_url = '/images/services/text-api.png'
WHERE image_url IS NULL AND name ILIKE '%text api%';

UPDATE services
SET image_url = '/images/services/speech-api.png'
WHERE image_url IS NULL AND name ILIKE '%speech%';

UPDATE services
SET image_url = '/images/services/plaster.png'
WHERE image_url IS NULL AND name ILIKE '%plaster%';

UPDATE services
SET image_url = '/images/services/photographer.png'
WHERE image_url IS NULL AND name ILIKE '%photograph%';

UPDATE services
SET image_url = '/images/services/personal-chef.png'
WHERE image_url IS NULL AND name ILIKE '%chef%';

UPDATE services
SET image_url = '/images/services/default.png'
WHERE image_url IS NULL OR BTRIM(image_url) = '';

ALTER TABLE services
  ALTER COLUMN image_url SET NOT NULL;

COMMIT;
