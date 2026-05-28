-- Adds per-slot capacity and booking behavior for existing projects.
-- Run this once in Supabase SQL editor before using the updated admin fields.

ALTER TABLE weekly_slots
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared';

ALTER TABLE tour_slots
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared';

UPDATE weekly_slots ws
SET capacity = COALESCE(NULLIF(ws.capacity, 1), ct.max_capacity)
FROM class_types ct
WHERE ws.class_type_id = ct.id;

UPDATE tour_slots ts
SET capacity = COALESCE(NULLIF(ts.capacity, 1), ct.max_capacity)
FROM class_types ct
WHERE ts.class_type_id = ct.id;

ALTER TABLE weekly_slots
  DROP CONSTRAINT IF EXISTS weekly_slots_booking_mode_check,
  ADD CONSTRAINT weekly_slots_booking_mode_check CHECK (booking_mode IN ('shared','exclusive')),
  DROP CONSTRAINT IF EXISTS weekly_slots_capacity_check,
  ADD CONSTRAINT weekly_slots_capacity_check CHECK (capacity >= 0);

ALTER TABLE tour_slots
  DROP CONSTRAINT IF EXISTS tour_slots_booking_mode_check,
  ADD CONSTRAINT tour_slots_booking_mode_check CHECK (booking_mode IN ('shared','exclusive')),
  DROP CONSTRAINT IF EXISTS tour_slots_capacity_check,
  ADD CONSTRAINT tour_slots_capacity_check CHECK (capacity >= 0);
