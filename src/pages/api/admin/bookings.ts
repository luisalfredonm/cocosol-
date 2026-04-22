export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === import.meta.env.ADMIN_PASSWORD
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const status = url.searchParams.get('status')
  const date = url.searchParams.get('date')
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = 50

  let query = supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .order('booking_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (date) query = query.eq('booking_date', date)

  const { data, error, count } = await query

  if (error) {
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ bookings: data, total: count, page }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}

export const PATCH: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id, status } = await request.json()

  if (!id || !['confirmed', 'cancelled', 'pending'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)

  if (error) {
    return new Response(JSON.stringify({ error: 'Update failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}
