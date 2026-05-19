-- Assign catalog image to Speech API demo service.
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_service_speech_api_image.sql

BEGIN;

UPDATE services
SET image_url = '/images/services/it-speechapi.webp'
WHERE id = '22222222-2222-4222-8222-222222222223'::uuid;

COMMIT;
