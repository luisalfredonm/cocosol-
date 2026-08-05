export const prerender = false

import type { APIRoute } from 'astro'
import { issueFormToken, isTokenSigningConfigured } from '../../lib/antiSpam'

/**
 * Hands the contact form a short-lived signed token.
 *
 * /contact is a static page, so the token cannot be baked into the HTML - it is
 * fetched by the form's own JavaScript on load. That is the point: a bot POSTing
 * directly to /api/contact never asks for one, and cannot forge one without the
 * signing secret. The issue time inside it also powers the "filled in too fast"
 * check on the other side.
 *
 * Must never be cached - see the /api cache-header exclusion in vercel.json.
 */
export const GET: APIRoute = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  }

  if (!isTokenSigningConfigured()) {
    console.error('[contact-token] no signing secret available')
    return new Response(JSON.stringify({ token: '' }), { status: 503, headers })
  }

  return new Response(JSON.stringify({ token: await issueFormToken() }), { status: 200, headers })
}
