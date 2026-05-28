export const prerender = false

import type { APIRoute } from 'astro'
import { isSupabaseConfigured, missingSupabaseEnv } from '../../lib/supabase'
import { getClassTypes } from '../../lib/classTypes'

export const GET: APIRoute = async () => {
  if (!isSupabaseConfigured) {
    return new Response(JSON.stringify({
      error: `Booking database is not configured. Missing ${missingSupabaseEnv.join(' and ')}.`,
      classTypes: [],
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }

  const classTypes = await getClassTypes()
  return new Response(JSON.stringify({ classTypes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
