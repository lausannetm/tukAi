-- Add Plaster, Photographer, Personal chef + reviewers + reviews.
-- Safe to run once on an existing DB (uses fixed UUIDs + ON CONFLICT DO NOTHING).
-- Example:
--   docker compose exec -T db psql -U app -d app < database/seed_three_services.sql

BEGIN;

INSERT INTO users (id, email, full_name)
VALUES
    ('33333333-3333-4333-8333-333333333301'::uuid, 'misho.a@catalog.example', 'Misho A.'),
    ('33333333-3333-4333-8333-333333333302'::uuid, 'petyo.k@catalog.example', 'Petyo K.'),
    ('33333333-3333-4333-8333-333333333303'::uuid, 'elizabeth@catalog.example', 'Elizabeth'),
    ('33333333-3333-4333-8333-333333333304'::uuid, 'zhana.k@catalog.example', 'Zhana K.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name)
VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'sofia.handyman@example.com', 'Sofia Handyman'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'burgas.studio@example.com', 'Burgas Photo Studio'),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid, 'plovdiv.chef@example.com', 'Plovdiv Chef Co.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, provider_id, name, description, price_cents, latitude, longitude)
VALUES
    (
        '44444444-4444-4444-8444-444444444401'::uuid,
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
        'Plaster',
        'Plasterer for applying plaster—best plasterer in the whole town. Category: construction and renovation work. Based in Sofia, Bulgaria. Price: 14 EUR per sq.m.',
        1400,
        42.6977,
        23.3219
    ),
    (
        '44444444-4444-4444-8444-444444444402'::uuid,
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
        'Photographer',
        'Photography for your very special personal event. Category: fun / events. Based in Burgas, Bulgaria. Price: 50 EUR per hour.',
        5000,
        42.5048,
        27.4626
    ),
    (
        '44444444-4444-4444-8444-444444444403'::uuid,
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
        'Personal chef',
        'Hire a professional personal chef to cook your favorite meal. Category: fun / dining. Based in Plovdiv, Bulgaria. Price: 28 EUR per hour.',
        2800,
        42.1354,
        24.7453
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, user_id, service_id, rating, comment)
VALUES
    (
        '55555555-5555-4555-8555-555555555501'::uuid,
        '33333333-3333-4333-8333-333333333301'::uuid,
        '44444444-4444-4444-8444-444444444401'::uuid,
        4,
        'Very good, working great.'
    ),
    (
        '55555555-5555-4555-8555-555555555502'::uuid,
        '33333333-3333-4333-8333-333333333302'::uuid,
        '44444444-4444-4444-8444-444444444401'::uuid,
        5,
        'Very good, working whole day without a break.'
    ),
    (
        '55555555-5555-4555-8555-555555555503'::uuid,
        '33333333-3333-4333-8333-333333333303'::uuid,
        '44444444-4444-4444-8444-444444444402'::uuid,
        5,
        'Best photoshoot in my life.'
    ),
    (
        '55555555-5555-4555-8555-555555555504'::uuid,
        '33333333-3333-4333-8333-333333333304'::uuid,
        '44444444-4444-4444-8444-444444444402'::uuid,
        5,
        'Very professional.'
    ),
    (
        '55555555-5555-4555-8555-555555555505'::uuid,
        '33333333-3333-4333-8333-333333333303'::uuid,
        '44444444-4444-4444-8444-444444444403'::uuid,
        5,
        'Best dinner surprise for my girlfriend.'
    )
ON CONFLICT (id) DO NOTHING;

COMMIT;
