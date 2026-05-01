-- Pura Vida Surf School - Booking Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID,
  class_type_id VARCHAR NOT NULL,
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

CREATE TABLE IF NOT EXISTS availability_blocks (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR,
  blocked_date DATE NOT NULL,
  start_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_class_date ON bookings(class_type_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_checkout ON bookings(checkout_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_date ON availability_blocks(blocked_date);

-- Tour capacity overrides per date
CREATE TABLE IF NOT EXISTS tour_capacity (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL,
  capacity_date DATE NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_type_id, capacity_date)
);

CREATE INDEX IF NOT EXISTS idx_tour_capacity_date ON tour_capacity(class_type_id, capacity_date);

-- Tour slot overrides per date
CREATE TABLE IF NOT EXISTS tour_slots (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_type_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_tour_slots_date ON tour_slots(class_type_id, slot_date);

-- Dynamic class types (replaces hardcoded bookingConfig)
CREATE TABLE IF NOT EXISTS class_types (
  id VARCHAR PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('lesson','package','camp')),
  price_per_person DECIMAL(10,2) NOT NULL,
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

ALTER TABLE class_types ADD COLUMN IF NOT EXISTS min_participants_per_booking INTEGER NOT NULL DEFAULT 1;
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS max_participants_per_booking INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS update_class_types_updated_at ON class_types;
CREATE TRIGGER update_class_types_updated_at
  BEFORE UPDATE ON class_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Weekly slot templates (Mon=1 ... Sun=7)
CREATE TABLE IF NOT EXISTS weekly_slots (
  id SERIAL PRIMARY KEY,
  class_type_id VARCHAR NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  UNIQUE (class_type_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_weekly_slots_class ON weekly_slots(class_type_id, day_of_week);

-- Seed initial class types
INSERT INTO class_types (
  id, name, category, price_per_person, min_participants_per_booking,
  max_participants_per_booking, max_capacity, duration_minutes, description,
  included, badge, sort_order
) VALUES
  ('private',       'Private Surf Lesson',       'lesson',  90.40, 1,  4,  1, 90, 'One-on-one personalized coaching. Fastest progression, any skill level.', ARRAY['Surfboard','Leash','Rash guard','Certified instructor','Photos'], NULL, 1),
  ('semi-private',  'Semi-Private Lesson',       'lesson',  73.00, 2, 15,  3, 90, 'Small group of 2-3 people. Perfect for couples and friends.',             ARRAY['Surfboard','Leash','Rash guard','Certified instructor','Photos'], NULL, 2),
  ('group',         'Group Surf Lesson',         'lesson',  55.00, 4, 18,  8, 90, 'Fun group setting, ideal for beginners and solo travelers.',              ARRAY['Surfboard','Leash','Rash guard','Certified instructor'],          'Most Popular', 3),
  ('pkg-3-private', '3-Day Private Package',     'package', 326.00, 1,  4,  1, 90, '3 surf lessons over 3 days plus one boat surf trip.',                    ARRAY['3 x 90-min lessons','1 surf trip','Surfboard & gear','Certified instructor','Photos'], NULL, 4),
  ('pkg-3-semi',    '3-Day Semi-Private Package','package', 326.00, 1, 10, 10, 90, '3 surf lessons over 3 days plus one boat surf trip.',                    ARRAY['3 x 90-min lessons','1 surf trip','Surfboard & gear','Certified instructor','Photos'], NULL, 5),
  ('pkg-5-private', '5-Day Private Package',     'package', 620.87, 1,  4,  1, 90, '4 surf lessons over 5 days plus a surf trip.',                           ARRAY['4 x 90-min lessons','1 surf trip','Surfboard & gear','Certified instructor','Photos'], 'Best Value', 6),
  ('pkg-5-semi',    '5-Day Semi-Private Package','package', 563.87, 1, 10, 10, 90, '4 surf lessons over 5 days plus a surf trip.',                           ARRAY['4 x 90-min lessons','1 surf trip','Surfboard & gear','Certified instructor','Photos'], NULL, 7),
  ('camp-5-days',   '5 Days Surf Camp',          'camp',   1049.00, 1, 12,  8, 90, 'All-inclusive 5-day immersive surf camp with accommodation.',            ARRAY['4 x 90-min lessons','Accommodation (4 nights)','Breakfast daily','1 surf trip','Surfboard & gear','Airport transfer','Photos & video'], NULL, 8),
  ('camp-7-private','7-Day Private Package',     'camp',    694.95, 1,  4,  1, 90, 'The ultimate week-long private surf experience.',                        ARRAY['6 x 90-min lessons','Accommodation (6 nights)','Breakfast daily','2 surf trips','Surfboard & gear','Airport transfer','Photos & video','Yoga session'], 'Ultimate Experience', 9),
  ('camp-7-semi',   '7-Day Semi-Private Package','camp',    620.37, 1, 10, 10, 90, 'The ultimate week-long surf camp.',                                      ARRAY['6 x 90-min lessons','Accommodation (6 nights)','Breakfast daily','2 surf trips','Surfboard & gear','Airport transfer','Photos & video','Yoga session'], NULL, 10)
ON CONFLICT (id) DO NOTHING;

-- Payment Configuration (supports multiple providers)
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('on-site', 'paypal', 'credomatic')) DEFAULT 'on-site',

  -- PayPal keys
  paypal_client_id VARCHAR(255),
  paypal_secret VARCHAR(255),
  paypal_enabled BOOLEAN DEFAULT false,

  -- Credomatic keys (future)
  credomatic_api_key VARCHAR(255),
  credomatic_secret VARCHAR(255),
  credomatic_enabled BOOLEAN DEFAULT false,

  -- Config metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_active_config CHECK (is_active = true)
);

-- Only allow one active config
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_config_active ON payment_config(is_active) WHERE is_active = true;

-- Seed default config
INSERT INTO payment_config (provider, is_active)
VALUES ('on-site', true)
ON CONFLICT DO NOTHING;

-- Row Level Security: API routes use service_role key so RLS is bypassed
-- Enable if you want additional protection
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION: Remove Stripe, rename stripe_payment_intent_id to external_payment_id
-- Run this migration in Supabase to update existing data
-- ============================================================================

-- Step 1: Rename column on bookings table (only if it exists and hasn't been renamed already)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE bookings RENAME COLUMN stripe_payment_intent_id TO external_payment_id;
  END IF;
END $$;

-- Step 2: Rename column on camp_bookings table (only if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='camp_bookings' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE camp_bookings RENAME COLUMN stripe_payment_intent_id TO external_payment_id;
  END IF;
END $$;

-- Step 3: Update payment_method values from 'stripe' to 'on-site' (if any exist)
UPDATE bookings SET payment_method = 'on-site' WHERE payment_method = 'stripe';
UPDATE camp_bookings SET payment_method = 'on-site' WHERE payment_method = 'stripe' OR payment_method = 'cash';

-- Migration complete!
