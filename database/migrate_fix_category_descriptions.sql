-- Normalize Category: lines (remove trailing dots after category slug).
-- Run: docker compose exec -T db psql -U app -d app < database/migrate_fix_category_descriptions.sql

BEGIN;

UPDATE services
SET description = REPLACE(description, 'Category: it.', 'Category: it')
WHERE description LIKE '%Category: it.%';

UPDATE services
SET description = REPLACE(description, 'Category: photography. Price', 'Category: photography,')
WHERE description LIKE '%Category: photography. Price%';

UPDATE services
SET description = REPLACE(description, 'Category: chefs. Price', 'Category: chefs,')
WHERE description LIKE '%Category: chefs. Price%';

UPDATE services
SET description = REPLACE(
  description,
  'Category: construction and renovation work. Price',
  'Category: construction and renovation work,'
)
WHERE description LIKE '%Category: construction and renovation work. Price%';

COMMIT;
