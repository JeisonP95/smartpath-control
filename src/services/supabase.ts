import { createClient } from "@supabase/supabase-js"

// Crear cliente para el lado del servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
  return createClient(supabaseUrl, supabaseKey)
}

// Cliente para el lado del cliente (singleton)
let clientSupabaseClient: ReturnType<typeof createClient> | null = null

export const getClientSupabaseClient = () => {
  if (clientSupabaseClient) return clientSupabaseClient

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  clientSupabaseClient = createClient(supabaseUrl, supabaseKey)

  return clientSupabaseClient
}

