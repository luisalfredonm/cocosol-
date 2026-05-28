import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

export const missingSupabaseEnv = [
  !supabaseUrl ? 'SUPABASE_URL' : null,
  !supabaseKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
].filter(Boolean) as string[]

export const isSupabaseConfigured = missingSupabaseEnv.length === 0

const missingConfigError = new Error(
  `Missing ${missingSupabaseEnv.join(' or ')} environment variables`
)

function createMissingSupabaseClient(): SupabaseClient {
  const query = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => void) => {
            resolve({ data: null, error: missingConfigError, count: null })
          }
        }

        return () => query
      },
    }
  )

  return new Proxy(
    {},
    {
      get() {
        return () => query
      },
    }
  ) as SupabaseClient
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createMissingSupabaseClient()

export interface DbBooking {
  id: string
  checkout_id: string | null
  class_type_id: string
  booking_date: string
  start_time: string
  participants: number
  total_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_country: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_method: string | null
  external_payment_id: string | null
  checkout_summary_sent_at: string | null
  checkout_admin_summary_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface DbAvailabilityBlock {
  id: number
  class_type_id: string | null
  blocked_date: string
  start_time: string | null
  reason: string | null
}
