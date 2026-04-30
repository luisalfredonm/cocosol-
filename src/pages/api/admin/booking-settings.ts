export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.slice(7) === import.meta.env.ADMIN_PASSWORD
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return json({ error: 'Unauthorized' }, 401)

  const { data, error } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) return json({ min_advance_hours: 48 })
  return json({ min_advance_hours: data.min_advance_hours ?? 48 })
}

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return json({ error: 'Unauthorized' }, 401)

  let body: any
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const hours = parseInt(body?.min_advance_hours)
  if (isNaN(hours) || hours < 0 || hours > 720) {
    return json({ error: 'min_advance_hours must be between 0 and 720' }, 400)
  }

  const { error } = await supabase
    .from('booking_settings')
    .upsert({ id: 1, min_advance_hours: hours, updated_at: new Date().toISOString() })

  if (error) return json({ error: 'Failed to save settings' }, 500)
  return json({ ok: true, min_advance_hours: hours })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
