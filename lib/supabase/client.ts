import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side operations
 * Uses browser storage for session management
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

