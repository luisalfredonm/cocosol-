export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === import.meta.env.ADMIN_PASSWORD
}

interface PaymentConfig {
  id: string
  provider: 'on-site' | 'paypal' | 'credomatic'
  paypal_client_id: string | null
  paypal_secret: string | null
  paypal_sandbox: boolean
  paypal_enabled: boolean
  credomatic_api_key: string | null
  credomatic_secret: string | null
  credomatic_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// GET current payment config
export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { data, error } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Supabase payment_config error:', error)
      return new Response(JSON.stringify({
        provider: 'on-site',
        paypal_client_id: '',
        paypal_secret: '',
        credomatic_api_key: '',
        credomatic_secret: '',
        debug: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const config = data && data.length > 0 ? data[0] : null

    if (!config) {
      return new Response(JSON.stringify({ provider: 'on-site', paypal_client_id: '', paypal_secret: '', credomatic_api_key: '', credomatic_secret: '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Payment config endpoint error:', err)
    return new Response(JSON.stringify({
      provider: 'on-site',
      paypal_client_id: '',
      paypal_secret: '',
      credomatic_api_key: '',
      credomatic_secret: '',
      error: err.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST update payment config
export const POST: APIRoute = async ({ request }) => {
  console.log('[PaymentConfig POST] Request received')

  if (!checkAuth(request)) {
    console.log('[PaymentConfig POST] Auth check failed')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    console.log('[PaymentConfig POST] Body:', body)
    const { provider, paypal_client_id, paypal_secret, paypal_sandbox, credomatic_api_key, credomatic_secret } = body

    // Validate provider
    if (!['on-site', 'paypal', 'credomatic'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch current active config
    const { data: configList, error: fetchError } = await supabase
      .from('payment_config')
      .select('id')
      .eq('is_active', true)

    if (fetchError) {
      console.error('[PaymentConfig POST] Fetch error:', fetchError)
      return new Response(JSON.stringify({ error: 'Database fetch error: ' + fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const currentConfig = configList && configList.length > 0 ? configList[0] : null
    console.log('[PaymentConfig POST] Current config:', currentConfig)

    let updateData: Partial<PaymentConfig> = {
      provider,
      paypal_enabled: provider === 'paypal',
      credomatic_enabled: provider === 'credomatic',
      updated_at: new Date().toISOString(),
    }

    // Add provider-specific keys if provided
    if (provider === 'paypal') {
      updateData.paypal_client_id = paypal_client_id || null
      updateData.paypal_secret = paypal_secret || null
      updateData.paypal_sandbox = paypal_sandbox !== false
    }

    if (provider === 'credomatic') {
      updateData.credomatic_api_key = credomatic_api_key || null
      updateData.credomatic_secret = credomatic_secret || null
    }

    // Update if exists, insert if not
    if (currentConfig) {
      console.log('[PaymentConfig POST] Updating config:', updateData)
      const { data, error } = await supabase
        .from('payment_config')
        .update(updateData)
        .eq('id', currentConfig.id)
        .select()

      if (error) {
        console.error('[PaymentConfig POST] Update error:', error)
        return new Response(JSON.stringify({ error: 'Failed to update config: ' + error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const updatedConfig = data && data.length > 0 ? data[0] : null
      console.log('[PaymentConfig POST] Updated config:', updatedConfig)
      return new Response(JSON.stringify(updatedConfig), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      console.log('[PaymentConfig POST] Creating new config:', updateData)
      const { data, error } = await supabase
        .from('payment_config')
        .insert([{ ...updateData, is_active: true }])
        .select()

      if (error) {
        console.error('[PaymentConfig POST] Insert error:', error)
        return new Response(JSON.stringify({ error: 'Failed to create config: ' + error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const newConfig = data && data.length > 0 ? data[0] : null
      console.log('[PaymentConfig POST] Created config:', newConfig)
      return new Response(JSON.stringify(newConfig), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
