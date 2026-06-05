-- Seed: booking products (class_types) + weekly availability (weekly_slots)
-- Generated from the live Supabase DB. Idempotent (on conflict do update).
-- Run in the Supabase SQL editor to reproduce the booking catalog.

alter table class_types add column if not exists variant_group text;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('summer-camp', 'Summer Camp', 'camp', 350, '[{"label":"1 Child","price_type":"total","max_participants":1,"min_participants":1,"price_per_person":350},{"label":"2 Kids","price_type":"total","max_participants":2,"min_participants":2,"price_per_person":650},{"label":"3 Kids","price_type":"total","max_participants":3,"min_participants":3,"price_per_person":900}]'::jsonb, 1, 3, 3, 260, null, 'Surf lesson with pricing that adjusts by group size.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('private-1-hour', '1 Hour Surf Lessons', 'lesson', 75, '[{"label":"Private","price_type":"per_person","max_participants":1,"min_participants":1,"price_per_person":75},{"label":"Semi-private","price_type":"per_person","max_participants":2,"min_participants":2,"price_per_person":70},{"label":"3 people","price_type":"per_person","max_participants":3,"min_participants":3,"price_per_person":65}]'::jsonb, 1, 3, 12, 60, 'private-lessons', 'One-on-one, or share the session with 2–3 people — the more you bring, the lower the per-person price.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('surf-coaching', 'Surf Coaching ', 'lesson', 75, null, 1, 12, 12, 60, null, 'For surfers who already ride — sharpen your technique, positioning and wave selection with wave-by-wave feedback.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('surf-lessons-2h', '2 Hour Surf lessons', 'lesson', 140, '[{"label":"Private","price_type":"per_person","max_participants":1,"min_participants":1,"price_per_person":140},{"label":"Semi-private","price_type":"per_person","max_participants":2,"min_participants":2,"price_per_person":130},{"label":"3 people","price_type":"per_person","max_participants":3,"min_participants":3,"price_per_person":120}]'::jsonb, 1, 3, 12, 120, 'private-lessons', 'One-on-one, or share the session with 2–3 people — the more you bring, the lower the per-person price.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('group-lessons-1h', '1 Hour Group Lesson', 'lesson', 60, null, 4, 12, 12, 60, 'group-lessons', 'Fun group surf lesson for 4 or more — the social, budget-friendly way to learn, with hands-on attention for everyone.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 11)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('group-lessons-2h', '2 Hour Group Lesson', 'lesson', 120, null, 4, 12, 12, 120, 'group-lessons', 'Fun group surf lesson for 4 or more — the social, budget-friendly way to learn, with hands-on attention for everyone.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 11)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('elite-pack', 'Elite Pack', 'package', 1280, null, 1, 12, 12, 60, null, 'Surf lesson with pricing that adjusts by group size.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], '16 one-hour surf lessons', true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('progresion-pack', 'Progression Pack', 'package', 475, null, 1, 12, 12, 60, null, 'Surf lesson with pricing that adjusts by group size.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], null, true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into class_types (id, name, category, price_per_person, price_tiers, min_participants_per_booking, max_participants_per_booking, max_capacity, duration_minutes, variant_group, description, included, badge, active, sort_order)
values ('started-pack', 'Starter Pack', 'package', 260, null, 1, 12, 12, 60, null, 'Surf lesson with pricing that adjusts by g4 Sessiioroup size.', ARRAY['Surfboard', 'Leash', 'Rash guard', 'Certified instructor']::text[], '4 Sesiones', true, 10)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price_per_person = excluded.price_per_person,
  price_tiers = excluded.price_tiers,
  min_participants_per_booking = excluded.min_participants_per_booking,
  max_participants_per_booking = excluded.max_participants_per_booking,
  max_capacity = excluded.max_capacity,
  duration_minutes = excluded.duration_minutes,
  variant_group = excluded.variant_group,
  description = excluded.description,
  included = excluded.included,
  badge = excluded.badge,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- ── Weekly slots ──────────────────────────────────────────────────────────
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('elite-pack', 1, '07:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('elite-pack', 1, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('elite-pack', 2, '07:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 2, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 3, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 4, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 5, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 6, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-1h', 7, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 2, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 3, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 4, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 5, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 6, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('group-lessons-2h', 7, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 2, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 3, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 4, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 5, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 6, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('private-1-hour', 7, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('progresion-pack', 1, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('started-pack', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('started-pack', 2, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('summer-camp', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-coaching', 1, '07:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-coaching', 2, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-coaching', 3, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-coaching', 4, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 1, '08:00:00', 12, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 2, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 3, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 4, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 5, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 6, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode) values ('surf-lessons-2h', 7, '08:00:00', 8, 'shared')
  on conflict (class_type_id, day_of_week, start_time) do update set capacity = excluded.capacity, booking_mode = excluded.booking_mode;
