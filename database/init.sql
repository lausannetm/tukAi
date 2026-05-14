-- Users, Services, Orders, Reviews — initialized on first Postgres container boot

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
    owner_user_id   UUID REFERENCES users (id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    price_cents     INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_owner ON services (owner_user_id);

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    service_id      UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
    status          TEXT NOT NULL DEFAULT 'pending',
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
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

-- Demo data (fixed UUIDs so the web UI and curl examples stay stable across resets)
INSERT INTO users (id, email, full_name)
VALUES (
    '11111111-1111-4111-8111-111111111111'::uuid,
    'demo@example.com',
    'Demo User'
);

INSERT INTO services (id, name, description, price_cents, latitude, longitude)
VALUES
    ('22222222-2222-4222-8222-222222222221'::uuid, 'Vision API', 'Image classification bundle', 4999, 42.6977, 23.3219),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'Text API', 'LLM completions per token', 1999, 42.6745, 23.3542),
    ('22222222-2222-4222-8222-222222222223'::uuid, 'Speech API', 'Transcription pipeline', 3499, 42.7156, 23.2791);

INSERT INTO reviews (user_id, service_id, rating, comment)
VALUES
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, 5, 'Excellent accuracy'),
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, 5, 'Fast inference'),
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 4, 'Solid completions'),
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 4, 'Good value'),
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222223'::uuid, 3, 'Works for short clips'),
    ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222223'::uuid, 4, 'Clear transcripts');

-- Reviewer accounts (for catalog services below)
INSERT INTO users (id, email, full_name)
VALUES
    ('33333333-3333-4333-8333-333333333301'::uuid, 'misho.a@catalog.example', 'Misho A.'),
    ('33333333-3333-4333-8333-333333333302'::uuid, 'petyo.k@catalog.example', 'Petyo K.'),
    ('33333333-3333-4333-8333-333333333303'::uuid, 'elizabeth@catalog.example', 'Elizabeth'),
    ('33333333-3333-4333-8333-333333333304'::uuid, 'zhana.k@catalog.example', 'Zhana K.');

INSERT INTO services (id, name, description, price_cents, latitude, longitude)
VALUES
    (
        '44444444-4444-4444-8444-444444444401'::uuid,
        'Plaster',
        'Plasterer for applying plaster—best plasterer in the whole town. Category: construction and renovation work. Based in Sofia, Bulgaria. Price: 14 EUR per sq.m.',
        1400,
        42.6977,
        23.3219
    ),
    (
        '44444444-4444-4444-8444-444444444402'::uuid,
        'Photographer',
        'Photography for your very special personal event. Category: fun / events. Based in Burgas, Bulgaria. Price: 50 EUR per hour.',
        5000,
        42.5048,
        27.4626
    ),
    (
        '44444444-4444-4444-8444-444444444403'::uuid,
        'Personal chef',
        'Hire a professional personal chef to cook your favorite meal. Category: fun / dining. Based in Plovdiv, Bulgaria. Price: 28 EUR per hour.',
        2800,
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
