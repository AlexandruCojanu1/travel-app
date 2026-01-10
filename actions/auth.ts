'use server'

import { createClient } from '@/lib/supabase/server'
import type { LoginInput, OnboardingInput, SignupInput } from '@/lib/validations/auth'
import { loginSchema, onboardingSchema, signupSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string; redirect?: string }

export async function login(data: LoginInput, redirectPath?: string): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(data)

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      if (clientError.message?.includes('Missing Supabase environment variables')) {
        return {
          success: false,
          error: 'Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
        }
      }
      throw clientError
    }

    // Sign in with password - this will set cookies via the server client
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Login failed: No user returned' }
    }

    // IMPORTANT: After signInWithPassword, we need to refresh the session
    // to ensure cookies are properly set
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.warn('login: Session refresh warning:', sessionError)
      }
    } catch (sessionRefreshError) {
      console.warn('login: Failed to refresh session:', sessionRefreshError)
    }

    // Revalidate paths to ensure fresh data after login
    revalidatePath('/', 'layout')
    revalidatePath('/home')
    revalidatePath('/onboarding')

    // Check if user has completed onboarding
    // First check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('home_city_id, role')
      .eq('id', authData.user.id)
      .single()

    // Also check user metadata as fallback (onboarding saves here too)
    const userMetadata = authData.user.user_metadata
    const metadataHasOnboarding = userMetadata?.onboarding_completed || userMetadata?.home_city_id

    // User needs onboarding if: no profile home_city_id AND no metadata confirmation
    const needsOnboarding = !profile?.home_city_id && !metadataHasOnboarding

    console.log('Login check:', {
      profileHomeCityId: profile?.home_city_id,
      metadataHasOnboarding,
      needsOnboarding
    })

    if (needsOnboarding) {
      const onboardingRedirect = redirectPath?.includes('role=')
        ? redirectPath
        : '/onboarding'
      return { success: true, redirect: onboardingRedirect }
    }

    // Always redirect to /home - users can navigate to business dashboard if needed
    const finalRedirect = redirectPath || '/home'
    return { success: true, redirect: finalRedirect }
  } catch (error: any) {
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
      error?.digest?.startsWith('NEXT_REDIRECT') ||
      (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      throw error // Re-throw redirect errors so they propagate
    }
    return { success: false, error: error.message || 'Login failed' }
  }
}

export async function signup(data: SignupInput, redirectPath?: string): Promise<ActionResult> {
  try {
    const validated = signupSchema.parse(data)

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      if (clientError.message?.includes('Missing Supabase environment variables')) {
        return {
          success: false,
          error: 'Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
        }
      }
      throw clientError
    }

    const { error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // IMPORTANT: After signUp, we need to explicitly sign in to establish the session
    // This is because signUp might not auto-login (depends on email confirmation settings)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (signInError) {
      console.warn('signup: Auto sign-in failed:', signInError)
      // Don't fail the signup, just redirect to login
      return { success: true, redirect: '/auth/login' }
    }

    // Refresh session to ensure cookies are set
    try {
      await supabase.auth.getSession()
    } catch (e) {
      console.warn('signup: Session refresh failed:', e)
    }

    // Use redirectPath if provided (for business signup), otherwise default to /onboarding (for traveler)
    const finalRedirect = redirectPath || '/onboarding'
    // Return redirect path for client to handle
    return { success: true, redirect: finalRedirect }
  } catch (error: any) {
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
      error?.digest?.startsWith('NEXT_REDIRECT') ||
      (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      throw error // Re-throw redirect errors so they propagate
    }
    return { success: false, error: error.message || 'Signup failed' }
  }
}

export async function completeOnboarding(data: OnboardingInput): Promise<ActionResult> {
  try {
    const validated = onboardingSchema.parse(data)

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      console.error('completeOnboarding: Error creating Supabase client:', clientError)
      return {
        success: false,
        error: 'Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
      }
    }

    // First, try to refresh the session to ensure cookies are up to date
    // This is critical for existing users who logged in before
    let session = null
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.warn('completeOnboarding: Session refresh warning:', sessionError)
        // If session is expired or invalid, return error
        if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid') || sessionError.message?.includes('JWT')) {
          return {
            success: false,
            error: 'Sesiunea a expirat. Te rugăm să te autentifici din nou.'
          }
        }
      } else {
        session = currentSession
      }

      // If no session, return error
      if (!session) {
        console.error('completeOnboarding: No session found')
        return {
          success: false,
          error: 'Nu ești autentificat. Te rugăm să te autentifici din nou.'
        }
      }
    } catch (sessionRefreshError) {
      console.warn('completeOnboarding: Failed to refresh session:', sessionRefreshError)
      return {
        success: false,
        error: 'Eroare la verificarea sesiunii. Te rugăm să te autentifici din nou.'
      }
    }

    // Get user with detailed error logging
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('completeOnboarding: Auth error:', userError)
      // Check if it's a session error - might need to refresh
      if (userError.message?.includes('session') || userError.message?.includes('JWT') || userError.message?.includes('expired')) {
        return {
          success: false,
          error: 'Sesiunea a expirat sau nu este disponibilă. Te rugăm să te autentifici din nou.'
        }
      }
      // Check if it's an AuthSessionMissingError
      if (userError.name === 'AuthSessionMissingError' || userError.status === 400) {
        return {
          success: false,
          error: 'Nu ești autentificat. Te rugăm să te autentifici din nou.'
        }
      }
      return {
        success: false,
        error: `Eroare de autentificare: ${userError.message || 'User not authenticated'}`
      }
    }

    if (!user) {
      console.error('completeOnboarding: No user returned from getUser()')
      return {
        success: false,
        error: 'Nu ești autentificat. Te rugăm să te autentifici din nou.'
      }
    }

    console.log('completeOnboarding: User authenticated:', user.id)

    console.log('completeOnboarding: Upserting profile:', {
      userId: user.id,
      homeCityId: validated.homeCityId,
      role: validated.role,
      persona: validated.persona
    })

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        home_city_id: validated.homeCityId,
        role: validated.role,
        persona: validated.persona,
        onboarding_data: validated.onboarding_data as any, // Cast for JSONB
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (error) {
      console.error('completeOnboarding: Error upserting profile:', error)
      return {
        success: false,
        error: `Eroare la salvare: ${error.message || 'Failed to save profile'}`
      }
    }

    console.log('completeOnboarding: Profile saved successfully, redirecting to /home')

    revalidatePath('/home')
    revalidatePath('/onboarding')

    return { success: true, redirect: '/home' }
  } catch (error: any) {
    console.error('completeOnboarding: Exception:', error)
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
      error?.digest?.startsWith('NEXT_REDIRECT') ||
      (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      // This is expected - redirect is happening
      return { success: true, redirect: '/home' }
    }
    return { success: false, error: error.message || 'Onboarding failed' }
  }
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
