-- Set weekly lesson schedule for the main surf lesson products.
-- Run this in the Supabase SQL editor.
--
-- Applies to:
-- - private-1-hour      (1 Hour Surf Lessons)
-- - surf-lessons-2h     (2 Hour Surf lessons)
-- - group-lessons-1h    (1 Hour Group Lesson)
-- - group-lessons-2h    (2 Hour Group Lesson)
--
-- Schedule:
-- Monday-Sunday: 8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM
-- Capacity: 8 spots
-- Booking mode: shared
--
-- Also applies the same schedule to packages:
-- - progresion-pack      (Progression Pack)
-- - elite-pack           (Elite Pack)
-- - started-pack         (Starter Pack)
--
-- Package capacity: 8 spots
-- Package booking mode: exclusive

begin;

delete from weekly_slots
where class_type_id in (
  'private-1-hour',
  'surf-lessons-2h',
  'group-lessons-1h',
  'group-lessons-2h'
)
and day_of_week between 1 and 7;

insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode)
select
  services.class_type_id,
  days.day_of_week,
  times.start_time::time,
  8,
  'shared'
from (
  values
    ('private-1-hour'),
    ('surf-lessons-2h'),
    ('group-lessons-1h'),
    ('group-lessons-2h')
) as services(class_type_id)
cross join (
  values
    (1),
    (2),
    (3),
    (4),
    (5),
    (6),
    (7)
) as days(day_of_week)
cross join (
  values
    ('08:00:00'),
    ('10:00:00'),
    ('12:00:00'),
    ('14:00:00'),
    ('16:00:00')
) as times(start_time)
on conflict (class_type_id, day_of_week, start_time)
do update set
  capacity = excluded.capacity,
  booking_mode = excluded.booking_mode;

delete from weekly_slots
where class_type_id in (
  'progresion-pack',
  'elite-pack',
  'started-pack'
)
and day_of_week between 1 and 7;

insert into weekly_slots (class_type_id, day_of_week, start_time, capacity, booking_mode)
select
  packages.class_type_id,
  days.day_of_week,
  times.start_time::time,
  8,
  'exclusive'
from (
  values
    ('progresion-pack'),
    ('elite-pack'),
    ('started-pack')
) as packages(class_type_id)
cross join (
  values
    (1),
    (2),
    (3),
    (4),
    (5),
    (6),
    (7)
) as days(day_of_week)
cross join (
  values
    ('08:00:00'),
    ('10:00:00'),
    ('12:00:00'),
    ('14:00:00'),
    ('16:00:00')
) as times(start_time)
on conflict (class_type_id, day_of_week, start_time)
do update set
  capacity = excluded.capacity,
  booking_mode = excluded.booking_mode;

commit;

-- Optional check after running:
-- select class_type_id, day_of_week, start_time, capacity, booking_mode
-- from weekly_slots
-- where class_type_id in (
--   'private-1-hour',
--   'surf-lessons-2h',
--   'group-lessons-1h',
--   'group-lessons-2h',
--   'progresion-pack',
--   'elite-pack',
--   'started-pack'
-- )
-- order by class_type_id, day_of_week, start_time;
