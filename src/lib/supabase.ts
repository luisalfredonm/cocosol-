import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
