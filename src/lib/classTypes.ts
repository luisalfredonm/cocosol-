// Server-only — imports Supabase, never import this from React components
import { isSupabaseConfigured, supabase } from './supabase'
export type { DbClassType } from './classTypeHelpers'
export { calculateTotal, formatCurrency, formatTime, formatPricingTiers } from './classTypeHelpers'

import type { DbClassType } from './classTypeHelpers'

let _cache: DbClassType[] | null = null
let _cacheTime = 0
const CACHE_TTL = 60_000

export async function getClassTypes(): Promise<DbClassType[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('class_types')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error || !data) return _cache ?? []

  _cache = data
  _cacheTime = Date.now()
  return data
}

export async function getClassTypeById(id: string): Promise<DbClassType | null> {
  const all = await getClassTypes()
  return all.find(ct => ct.id === id) ?? null
}
