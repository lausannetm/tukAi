-- Point every service listing at the default catalog image.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_services_default_image.sql

BEGIN;

UPDATE services
SET image_url = '/images/services/default.png';

COMMIT;
