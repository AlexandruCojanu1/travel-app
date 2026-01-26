import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger.js'

// Ensure env is loaded (this should already be done by env-loader, but just in case)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase environment variables', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
  })
  throw new Error('Missing required Supabase environment variables')
}

// Server client with service role key (full access)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Create a client for a specific user's JWT token
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(
    supabaseUrl || '',
    process.env.SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Verify a user's JWT token and return user data
export async function verifyUserToken(accessToken: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
  
  if (error) {
    logger.error('Token verification failed', error)
    return null
  }
  
  return user
}

export default supabaseAdmin
