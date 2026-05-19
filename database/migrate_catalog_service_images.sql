-- Assign catalog images to demo marketplace services.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_catalog_service_images.sql

BEGIN;

UPDATE services
SET image_url = '/images/services/plaster-service.jpeg'
WHERE id = '44444444-4444-4444-8444-444444444401'::uuid;

UPDATE services
SET image_url = '/images/services/photoshoot.jpeg'
WHERE id = '44444444-4444-4444-8444-444444444402'::uuid;

UPDATE services
SET image_url = '/images/services/chef.jpg'
WHERE id = '44444444-4444-4444-8444-444444444403'::uuid;

COMMIT;
