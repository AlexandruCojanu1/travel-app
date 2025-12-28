import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations
 * Uses Next.js cookies() for session management
 */
export async function createClient() {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables')
    }

    try {
        const cookieStore = await cookies()

        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        try {
                            return cookieStore.getAll()
                        } catch (error) {
                            console.warn('Failed to get cookies:', error)
                            return []
                        }
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) {
                            // The `setAll` method was called from a Server Component or Server Action.
                            // This can be ignored if you have middleware refreshing user sessions.
                            console.warn('Failed to set cookies in server action:', error)
                        }
                    },
                },
            }
        )
    } catch (error) {
        console.error('Failed to create Supabase client:', error)
        throw error
    }
}

