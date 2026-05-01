-- Manual repair for mixed payment schema states in Supabase
-- Safe to run in the Supabase SQL editor.
-- Goal:
-- 1. Normalize bookings/camp_bookings from legacy Stripe-era fields
-- 2. Standardize payment_method values to: on-site | paypal | credomatic
-- 3. Ensure external_payment_id exists
-- 4. Refresh PostgREST schema cache

BEGIN;

-- -----------------------------------------------------------------------------
-- BOOKINGS: ensure external_payment_id exists and preserve legacy data
-- -----------------------------------------------------------------------------

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'stripe_payment_intent_id'
  ) THEN
    UPDATE bookings
    SET external_payment_id = COALESCE(external_payment_id, stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

    ALTER TABLE bookings DROP COLUMN stripe_payment_intent_id;
  END IF;
END $$;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

UPDATE bookings SET payment_method = 'on-site' WHERE payment_method IN ('stripe', 'cash');

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('on-site', 'paypal', 'credomatic'));

-- -----------------------------------------------------------------------------
-- CAMP_BOOKINGS: apply the same rename/normalization only if the table exists
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'camp_bookings'
  ) THEN
    ALTER TABLE camp_bookings
      ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255);

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'camp_bookings'
        AND column_name = 'stripe_payment_intent_id'
    ) THEN
      UPDATE camp_bookings
      SET external_payment_id = COALESCE(external_payment_id, stripe_payment_intent_id)
      WHERE stripe_payment_intent_id IS NOT NULL;

      ALTER TABLE camp_bookings DROP COLUMN stripe_payment_intent_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'camp_bookings'
        AND column_name = 'payment_method'
    ) THEN
      ALTER TABLE camp_bookings DROP CONSTRAINT IF EXISTS camp_bookings_payment_method_check;

      UPDATE camp_bookings
      SET payment_method = 'on-site'
      WHERE payment_method IN ('stripe', 'cash');

      ALTER TABLE camp_bookings
        ADD CONSTRAINT camp_bookings_payment_method_check
        CHECK (payment_method IS NULL OR payment_method IN ('on-site', 'paypal', 'credomatic'));
    END IF;
  END IF;
END $$;

COMMIT;

-- Ask PostgREST to refresh its schema cache after the DDL changes.
NOTIFY pgrst, 'reload schema';

-- Optional verification queries:
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'bookings'
-- ORDER BY ordinal_position;
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname IN ('bookings_payment_method_check', 'camp_bookings_payment_method_check');
--
-- SELECT payment_method, COUNT(*)
-- FROM bookings
-- GROUP BY payment_method
-- ORDER BY payment_method;
