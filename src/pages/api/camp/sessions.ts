export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'

function overlaps(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart
}

export const GET: APIRoute = async () => {
  const [
    { data: sessions, error: sessionsError },
    { data: allBookings, error: bookingsError },
    { data: allSessions, error: allSessionsError },
    { data: sessionRooms, error: srError },
    { data: rooms, error: roomsError },
  ] = await Promise.all([
    supabase
      .from('camp_sessions')
      .select('*')
      .eq('is_active', true)
      .gte('start_date', new Date().toISOString().slice(0, 10))
      .order('start_date', { ascending: true }),
    // All active bookings with their session dates for overlap detection
    supabase
      .from('camp_bookings')
      .select('room_id, session_id, status')
      .in('status', ['pending', 'confirmed']),
    // Need ALL sessions (not just future) to resolve booked session dates
    supabase
      .from('camp_sessions')
      .select('id, start_date, end_date'),
    supabase
      .from('camp_session_rooms')
      .select('session_id, room_id'),
    supabase
      .from('camp_rooms')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  if (sessionsError || bookingsError || allSessionsError || srError || roomsError) {
    return json({ error: 'Database error' }, 500)
  }

  // Build session date lookup: session_id → {start_date, end_date}
  const sessionDateMap = new Map<string, { start_date: string; end_date: string }>()
  for (const s of allSessions ?? []) {
    sessionDateMap.set(s.id, { start_date: s.start_date, end_date: s.end_date })
  }

  // Build room → array of occupied date ranges
  const roomOccupied = new Map<string, Array<{ start: string; end: string }>>()
  for (const b of allBookings ?? []) {
    const dates = sessionDateMap.get(b.session_id)
    if (!dates) continue
    if (!roomOccupied.has(b.room_id)) roomOccupied.set(b.room_id, [])
    roomOccupied.get(b.room_id)!.push({ start: dates.start_date, end: dates.end_date })
  }

  // Map room_id → room data
  const roomMap = new Map((rooms ?? []).map(r => [r.id, r]))

  // Map session_id → assigned room ids
  const sessionRoomMap = new Map<string, string[]>()
  for (const sr of sessionRooms ?? []) {
    if (!sessionRoomMap.has(sr.session_id)) sessionRoomMap.set(sr.session_id, [])
    sessionRoomMap.get(sr.session_id)!.push(sr.room_id)
  }

  const result = (sessions ?? []).map(session => {
    const assignedRoomIds = sessionRoomMap.get(session.id) ?? []

    const roomsWithAvailability = assignedRoomIds
      .map(roomId => {
        const room = roomMap.get(roomId)
        if (!room) return null

        // Room is unavailable if ANY existing booking for it overlaps this session's dates
        const occupied = roomOccupied.get(roomId) ?? []
        const isOccupied = occupied.some(range =>
          overlaps(session.start_date, session.end_date, range.start, range.end)
        )

        return { ...room, available: !isOccupied }
      })
      .filter(Boolean)

    const availableCount = roomsWithAvailability.filter(r => r!.available).length

    return {
      ...session,
      available_rooms: availableCount,
      rooms: roomsWithAvailability,
    }
  })

  return json({ sessions: result })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
