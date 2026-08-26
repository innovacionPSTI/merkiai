import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Cliente de acceso a datos tipado. Las funciones de query lo reciben por
 * parámetro (inyección de dependencias) para desacoplarse del tipo de cliente:
 * hoy service-role; en multi-tenant (E17), un cliente sujeto a RLS por tenant.
 */
export type Db = SupabaseClient<Database>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Cliente público (browser, anon key) */
export function createBrowserClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

/** Cliente de servidor con service role (solo en Server Components / API routes) */
export function createServerClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}
