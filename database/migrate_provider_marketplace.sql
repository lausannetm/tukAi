-- Marketplace: each service has a provider (seller). Orders and reviews cannot target own listings.
-- Run on an existing database (e.g. after an older init without provider_id):
--   docker compose exec -T db psql -U app -d app < database/migrate_provider_marketplace.sql
--
-- Backfill: assigns all services missing provider_id to the oldest user row. Adjust manually if needed.

BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS provider_id UUID;

UPDATE services s
SET provider_id = u.id
FROM (SELECT id FROM users ORDER BY created_at ASC LIMIT 1) AS u
WHERE s.provider_id IS NULL;

ALTER TABLE services
  ALTER COLUMN provider_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_provider_id_fkey'
  ) THEN
    ALTER TABLE services
      ADD CONSTRAINT services_provider_id_fkey
      FOREIGN KEY (provider_id) REFERENCES users (id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_services_provider ON services (provider_id);

CREATE OR REPLACE FUNCTION forbid_order_self_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM services
    WHERE id = NEW.service_id
      AND provider_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'cannot purchase own service'
      USING ERRCODE = '23514',
            CONSTRAINT = 'orders_no_self_purchase';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_orders_no_self_purchase ON orders;
CREATE TRIGGER trg_orders_no_self_purchase
  BEFORE INSERT OR UPDATE OF user_id, service_id ON orders
  FOR EACH ROW
  EXECUTE FUNCTION forbid_order_self_purchase();

CREATE OR REPLACE FUNCTION forbid_review_own_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM services
    WHERE id = NEW.service_id
      AND provider_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'cannot review own service'
      USING ERRCODE = '23514',
            CONSTRAINT = 'reviews_no_self_review';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_reviews_no_self_review ON reviews;
CREATE TRIGGER trg_reviews_no_self_review
  BEFORE INSERT OR UPDATE OF user_id, service_id ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION forbid_review_own_listing();

COMMIT;
