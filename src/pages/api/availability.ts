export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../lib/supabase'
import { getClassTypeById } from '../../lib/classTypes'

export const GET: APIRoute = async ({ url }) => {
  const classTypeId = url.searchParams.get('classTypeId') ?? ''
  const date = url.searchParams.get('date') ?? '' // YYYY-MM-DD

  if (!classTypeId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'Invalid parameters' }, 400)
  }

  const classType = await getClassTypeById(classTypeId)
  if (!classType) return json({ error: 'Unknown class type' }, 400)

  // day_of_week: 1=Mon ... 7=Sun (ISO)
  const dow = new Date(date + 'T12:00:00').getDay() // 0=Sun
  const isoDow = dow === 0 ? 7 : dow

  const [
    { data: blocks, error: blocksError },
    { data: dateSlots, error: dateSlotsError },
    { data: weeklySlots, error: weeklySlotsError },
  ] = await Promise.all([
    supabase.from('availability_blocks').select('start_time, class_type_id')
      .eq('blocked_date', date),
    supabase.from('tour_slots').select('start_time')
      .eq('class_type_id', classTypeId).eq('slot_date', date).order('start_time'),
    supabase.from('weekly_slots').select('start_time')
      .eq('class_type_id', classTypeId).eq('day_of_week', isoDow).order('start_time'),
  ])

  if (blocksError || dateSlotsError || weeklySlotsError) {
    return json({ error: 'Database error' }, 500)
  }

  // Priority: date-specific slots > weekly template > empty (no slots today)
  const activeTimes: string[] =
    dateSlots && dateSlots.length > 0
      ? dateSlots.map(r => r.start_time.slice(0, 5))
      : weeklySlots && weeklySlots.length > 0
        ? weeklySlots.map(r => r.start_time.slice(0, 5))
        : []

  const blockedSlots = new Set(
    (blocks ?? [])
      .filter(b => !b.class_type_id || b.class_type_id === classTypeId)
      .map(b => b.start_time.slice(0, 5))
  )

  const { data: bSettings } = await supabase.from('booking_settings').select('min_advance_hours').eq('id', 1).single()
  const minAdvanceHours = bSettings?.min_advance_hours ?? 48

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + minAdvanceHours)

  const slots = activeTimes.map(time => {
    const slotDateTime = new Date(`${date}T${time}:00`)
    return {
      time,
      available: !blockedSlots.has(time) && slotDateTime > minDate,
      remaining: null,
    }
  })

  return new Response(JSON.stringify({ slots }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}
