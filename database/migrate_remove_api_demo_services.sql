-- Removes Vision API, Text API, Speech API demo listings and their provider.
-- Example:
--   docker compose exec -T db psql -U app -d app < database/migrate_remove_api_demo_services.sql

BEGIN;

DELETE FROM reviews
WHERE service_id IN (
    '22222222-2222-4222-8222-222222222221'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '22222222-2222-4222-8222-222222222223'::uuid
);

DELETE FROM orders
WHERE service_id IN (
    '22222222-2222-4222-8222-222222222221'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '22222222-2222-4222-8222-222222222223'::uuid
);

DELETE FROM services
WHERE id IN (
    '22222222-2222-4222-8222-222222222221'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '22222222-2222-4222-8222-222222222223'::uuid
);

DELETE FROM users
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM services WHERE provider_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
  );

COMMIT;
