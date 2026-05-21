-- Ensures the dev admin account exists (admin@test.com / password: admin).
-- Safe to re-run on an existing DB.
-- Example:
--   docker compose exec -T db psql -U app -d app < database/seed_admin_user.sql

BEGIN;

INSERT INTO users (id, email, full_name, password_hash, email_verified_at)
VALUES (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
    'admin@test.com',
    'Admin A.',
    '$2b$10$dDORgx./1sZP3WQP3AVl7umgbhpWgGFmyetlySQ6D6JuMsPVJnlAq',
    now()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
    email_confirmation_token_hash = NULL,
    email_confirmation_expires_at = NULL;

COMMIT;
