import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side operations
 * Uses browser storage for session management
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
        console.error(errorMsg)
        // Show user-friendly error in development
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            alert('Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
        }
        // Return a client with placeholder values to prevent crashes
        // This will fail gracefully when trying to use it
        return createBrowserClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder-key'
        )
    }

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    // Configure session persistence for "remember me"
    // Supabase handles this via cookies, but we can set options if needed
    return client
}

