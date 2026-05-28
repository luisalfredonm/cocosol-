-- Pura Vida Surf School - Clean New Supabase Setup
-- Use this for a fresh Supabase project for lessons/packages.
-- Safe to re-run: it uses IF NOT EXISTS, ON CONFLICT, and ALTER ADD COLUMN guards.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Services / Products
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_types (
  id VARCHAR PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('lesson','package','camp')),
  price_per_person DECIMAL(10,2) NOT NULL,
  price_tiers JSONB,
  min_participants_per_booking INTEGER NOT NULL DEFAULT 1 CHECK (min_participants_per_booking >= 1),
  max_participants_per_booking INTEGER NOT NULL DEFAULT 1 CHECK (max_participants_per_booking >= min_participants_per_booking),
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= 1),
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  description TEXT,
  included TEXT[],
  badge VARCHAR(100),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE class_types ADD COLUMN IF NOT EXISTS price_tiers JSONB;
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS min_participants_per_booking INTEGER NOT NULL DEFAULT 1;
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS max_participants_per_booking INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS update_class_types_updated_at ON class_types;
CREATE TRIGGER update_class_types_updated_at
  BEFORE UPDATE ON class_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Starter services for the new project.
-- Edit names/prices/hours later from /admin.
INSERT INTO class_types (
  id, name, category, price_per_person, price_tiers,
  min_participants_per_booking, max_participants_per_booking, max_capacity,
  duration_minutes, description, included, badge, sort_order, active
) VALUES
  (
    'private',
    '1 Hour Surf Lesson',
    'lesson',
    75.00,
    '[
      {"min_participants":1,"max_participants":1,"price_per_person":75,"price_type":"per_person","label":"Private"},
      {"min_participants":2,"max_participants":2,"price_per_person":70,"price_type":"per_person","label":"Semi-private"},
      {"min_participants":3,"max_participants":null,"price_per_person":65,"price_type":"per_person","label":"Group"}
    ]'::jsonb,
    1,
    12,
    12,
    60,
    'One-hour surf lesson with pricing that adjusts by group size.',
    ARRAY['Surfboard','Leash','Rash guard','Certified instructor'],
    NULL,
    1,
    true
  ),
  (
    'private-2h',
    '2 Hour Surf Lesson',
    'lesson',
    0.00,
    NULL,
    1,
    12,
    12,
    120,
    'Two-hour surf lesson. Add final pricing in Admin before making it visible.',
    ARRAY['Surfboard','Leash','Rash guard','Certified instructor'],
    NULL,
    2,
    false
  ),
  (
    'semi-private',
    'Semi-Private Lesson',
    'lesson',
    70.00,
    NULL,
    2,
    2,
    2,
    60,
    'Legacy direct semi-private option. Prefer the 1 Hour Surf Lesson tiered pricing flow.',
    ARRAY['Surfboard','Leash','Rash guard','Certified instructor'],
    NULL,
    3,
    false
  ),
  (
    'group',
    'Group Surf Lesson',
    'lesson',
    65.00,
    NULL,
    3,
    12,
    12,
    60,
    'Legacy direct group option. Prefer the 1 Hour Surf Lesson tiered pricing flow.',
    ARRAY['Surfboard','Leash','Rash guard','Certified instructor'],
    NULL,
    4,
    false
  ),
  (
    'pkg-3-private',
    'Starter Pack',
    'package',
    260.00,
    NULL,
    1,
    8,
    8,
    60,
    'Four one-hour surf lessons with flexible scheduling.',
    ARRAY['4 one-hour surf lessons','Flexible scheduling','Same instructor','Gear included'],
    NULL,
    10,
    true
  ),
  (
    'pkg-3-semi',
    'Starter Pack - Group',
    'package',
    260.00,
    NULL,
    2,
    8,
    8,
    60,
    'Starter Pack for couples, families, or small groups.',
    ARRAY['4 one-hour surf lessons','Flexible scheduling','Same instructor','Gear included'],
    NULL,
    11,
    false
  ),
  (
    'pkg-5-private',
    'Progression Pack',
    'package',
    475.00,
    NULL,
    1,
    8,
    8,
    60,
    'Six one-hour surf lessons for structured progression.',
    ARRAY['6 one-hour surf lessons','Flexible scheduling','Same instructor','Gear included','1 photography session'],
    'Most Popular',
    12,
    true
  ),
  (
    'pkg-5-semi',
    'Progression Pack - Group',
    'package',
    475.00,
    NULL,
    2,
    8,
    8,
    60,
    'Progression Pack for couples, families, or small groups.',
    ARRAY['6 one-hour surf lessons','Flexible scheduling','Same instructor','Gear included','1 photography session'],
    NULL,
    13,
    false
  ),
  (
    'elite-pack',
    'Elite Pack',
    'package',
    1280.00,
    NULL,
    1,
    8,
    8,
    60,
    'Sixteen one-hour surf lessons for full progression.',
    ARRAY['16 one-hour surf lessons','Flexible scheduling','Gear included','2 photography sessions'],
    NULL,
    20,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_per_person = EXCLUDED.price_per_person,
  price_tiers = EXCLUDED.price_tiers,
  min_participants_per_booking = EXCLUDED.min_participants_per_booking,
  max_participants_per_booking = EXCLUDED.max_participants_per_booking,
  max_capacity = EXCLUDED.max_capacity,
  duration_minutes = EXCLUDED.duration_minutes,
  description = EXCLUDED.description,
  included = EXCLUDED.included,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- If an older schema already seeded camp services, hide them for this project.
UPDATE class_types SET active = false WHERE category = 'camp';

-- ============================================================================
-- Weekly and Date-Specific Slots
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_slots (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 0),
  booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared' CHECK (booking_mode IN ('shared','exclusive')),
  UNIQUE (class_type_id, day_of_week, start_time)
);

ALTER TABLE weekly_slots ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE weekly_slots ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared';

CREATE INDEX IF NOT EXISTS idx_weekly_slots_class ON weekly_slots(class_type_id, day_of_week);

CREATE TABLE IF NOT EXISTS tour_slots (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 0),
  booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared' CHECK (booking_mode IN ('shared','exclusive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_type_id, slot_date, start_time)
);

ALTER TABLE tour_slots ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tour_slots ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) NOT NULL DEFAULT 'shared';

CREATE INDEX IF NOT EXISTS idx_tour_slots_date ON tour_slots(class_type_id, slot_date);

CREATE TABLE IF NOT EXISTS availability_blocks (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR REFERENCES class_types(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_date ON availability_blocks(blocked_date);

-- Legacy date-level capacity override retained because admin still has the tab.
-- New booking logic enforces capacity from weekly_slots/tour_slots.
CREATE TABLE IF NOT EXISTS tour_capacity (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  capacity_date DATE NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_type_id, capacity_date)
);

CREATE INDEX IF NOT EXISTS idx_tour_capacity_date ON tour_capacity(class_type_id, capacity_date);

-- ============================================================================
-- Bookings
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID,
  class_type_id VARCHAR NOT NULL REFERENCES class_types(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  participants INTEGER NOT NULL CHECK (participants >= 1),
  total_amount DECIMAL(10,2) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_country VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('on-site','paypal','credomatic')),
  external_payment_id VARCHAR(255),
  checkout_summary_sent_at TIMESTAMPTZ,
  checkout_admin_summary_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_summary_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_admin_summary_sent_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_class_date ON bookings(class_type_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_checkout ON bookings(checkout_id);

-- ============================================================================
-- Admin Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  min_advance_hours INTEGER NOT NULL DEFAULT 48 CHECK (min_advance_hours BETWEEN 0 AND 720),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_booking_settings_row CHECK (id = 1)
);

DROP TRIGGER IF EXISTS update_booking_settings_updated_at ON booking_settings;
CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO booking_settings (id, min_advance_hours)
VALUES (1, 48)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('on-site', 'paypal', 'credomatic')) DEFAULT 'on-site',
  paypal_client_id VARCHAR(255),
  paypal_secret VARCHAR(255),
  paypal_sandbox BOOLEAN DEFAULT true,
  paypal_enabled BOOLEAN DEFAULT false,
  credomatic_api_key VARCHAR(255),
  credomatic_secret VARCHAR(255),
  credomatic_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_config ADD COLUMN IF NOT EXISTS paypal_sandbox BOOLEAN DEFAULT true;

DROP TRIGGER IF EXISTS update_payment_config_updated_at ON payment_config;
CREATE TRIGGER update_payment_config_updated_at
  BEFORE UPDATE ON payment_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_config_active
  ON payment_config(is_active)
  WHERE is_active = true;

INSERT INTO payment_config (provider, is_active, paypal_sandbox)
VALUES ('on-site', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RLS Note
-- ============================================================================
-- API routes use SUPABASE_SERVICE_ROLE_KEY, so RLS is bypassed server-side.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in client-side/public variables.
