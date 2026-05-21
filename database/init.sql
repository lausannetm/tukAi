-- Users, Services, Orders, Reviews — initialized on first Postgres container boot
-- Services belong to a provider (seller). Buyers cannot order their own listings;
-- reviewers cannot review their own listings.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    full_name       TEXT,
    password_hash   TEXT,
    email_verified_at               TIMESTAMPTZ,
    email_confirmation_token_hash TEXT,
    email_confirmation_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email_confirmation_hash ON users (email_confirmation_token_hash)
    WHERE email_confirmation_token_hash IS NOT NULL;

CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    price_cents     INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    location        TEXT NOT NULL,
    rating          NUMERIC(4, 2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    image_url       TEXT NOT NULL,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_provider ON services (provider_id);

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    service_id      UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
    status          TEXT NOT NULL DEFAULT 'pending',
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    booking_date    DATE,
    booking_time    TEXT,
    message_to_provider TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_service ON orders (service_id);

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders (id) ON DELETE SET NULL,
    rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_service ON reviews (service_id);

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

CREATE TRIGGER trg_reviews_no_self_review
  BEFORE INSERT OR UPDATE OF user_id, service_id ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION forbid_review_own_listing();

-- Demo data (fixed UUIDs so the web UI and curl examples stay stable across resets)

-- Dev admin (password: admin). Email pre-verified so login works without registration.
INSERT INTO users (id, email, full_name, password_hash, email_verified_at)
VALUES (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
    'admin@test.com',
    'Admin A.',
    '$2b$10$dDORgx./1sZP3WQP3AVl7umgbhpWgGFmyetlySQ6D6JuMsPVJnlAq',
    now()
);

INSERT INTO users (id, email, full_name)
VALUES (
    '11111111-1111-4111-8111-111111111111'::uuid,
    'demo@example.com',
    'Demo User'
);

-- Reviewer accounts (for catalog services below)
INSERT INTO users (id, email, full_name)
VALUES
    ('33333333-3333-4333-8333-333333333301'::uuid, 'misho.a@catalog.example', 'Misho A.'),
    ('33333333-3333-4333-8333-333333333302'::uuid, 'petyo.k@catalog.example', 'Petyo K.'),
    ('33333333-3333-4333-8333-333333333303'::uuid, 'elizabeth@catalog.example', 'Elizabeth'),
    ('33333333-3333-4333-8333-333333333304'::uuid, 'zhana.k@catalog.example', 'Zhana K.');

-- Listing owners (distinct from reviewers so self-review rules stay satisfied)
INSERT INTO users (id, email, full_name)
VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'sofia.handyman@example.com', 'Sofia Handyman'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'burgas.studio@example.com', 'Burgas Photo Studio'),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid, 'plovdiv.chef@example.com', 'Plovdiv Chef Co.');

INSERT INTO services (id, provider_id, name, description, price_cents, location, rating, image_url, latitude, longitude)
VALUES
    (
        '44444444-4444-4444-8444-444444444401'::uuid,
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
        'Plaster',
        'Plasterer for applying plaster—best plasterer in the whole town. Category: construction and renovation work, 14 EUR per sq.m.',
        1400,
        'Sofia, Bulgaria',
        NULL,
        '/images/services/plaster-service.jpeg',
        42.6977,
        23.3219
    ),
    (
        '44444444-4444-4444-8444-444444444402'::uuid,
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
        'Photographer',
        'Photography for your very special personal event. Category: photography, 50 EUR per hour',
        5000,
        'Burgas, Bulgaria',
        4.90,
        '/images/services/photoshoot.jpeg',
        42.5048,
        27.4626
    ),
    (
        '44444444-4444-4444-8444-444444444403'::uuid,
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
        'Personal chef',
        'Hire a professional personal chef to cook your favorite meal. Category: chefs, 28 EUR per hour',
        2800,
        'Plovdiv, Bulgaria',
        5.00,
        '/images/services/chef.jpg',
        42.1354,
        24.7453
    );

INSERT INTO reviews (user_id, service_id, rating, comment)
VALUES
    (
        '33333333-3333-4333-8333-333333333301'::uuid,
        '44444444-4444-4444-8444-444444444401'::uuid,
        4,
        'Very good, working great.'
    ),
    (
        '33333333-3333-4333-8333-333333333302'::uuid,
        '44444444-4444-4444-8444-444444444401'::uuid,
        5,
        'Very good, working whole day without a break.'
    ),
    (
        '33333333-3333-4333-8333-333333333303'::uuid,
        '44444444-4444-4444-8444-444444444402'::uuid,
        5,
        'Best photoshoot in my life.'
    ),
    (
        '33333333-3333-4333-8333-333333333304'::uuid,
        '44444444-4444-4444-8444-444444444402'::uuid,
        5,
        'Very professional.'
    ),
    (
        '33333333-3333-4333-8333-333333333303'::uuid,
        '44444444-4444-4444-8444-444444444403'::uuid,
        5,
        'Best dinner surprise for my girlfriend.'
    );

COMMIT;
