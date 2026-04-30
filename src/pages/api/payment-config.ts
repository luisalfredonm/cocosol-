export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../lib/supabase'

// GET current payment config (public endpoint)
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      // Return default on-site if no config exists
      return new Response(JSON.stringify({ provider: 'on-site' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      provider: data.provider,
      paypal_client_id: data.provider === 'paypal' ? data.paypal_client_id : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ provider: 'on-site' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
