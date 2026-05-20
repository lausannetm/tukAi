-- Booking details on orders (date, time slot, message to provider).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS booking_date DATE,
  ADD COLUMN IF NOT EXISTS booking_time TEXT,
  ADD COLUMN IF NOT EXISTS message_to_provider TEXT;
