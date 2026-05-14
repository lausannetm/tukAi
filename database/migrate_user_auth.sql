-- Adds password-based auth and optional service ownership.
-- Run once on an existing DB, e.g.:
--   docker compose exec -T db psql -U app -d app < database/migrate_user_auth.sql

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_owner ON services (owner_user_id);

COMMIT;
