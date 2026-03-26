import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  )
}

export async function getAuthUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
