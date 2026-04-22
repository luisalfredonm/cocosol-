export const prerender = false

import type { APIRoute } from 'astro'
import { getClassTypes } from '../../lib/classTypes'

export const GET: APIRoute = async () => {
  const classTypes = await getClassTypes()
  return new Response(JSON.stringify({ classTypes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
