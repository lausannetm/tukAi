-- Email confirmation columns on users (run once on existing DBs).
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_confirmation_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_hash
  ON users (email_confirmation_token_hash)
  WHERE email_confirmation_token_hash IS NOT NULL;

COMMIT;
