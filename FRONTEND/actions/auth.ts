'use server'

import { createClient } from '@/lib/supabase/server'
import type { LoginInput, OnboardingInput, SignupInput } from '@/lib/validations/auth'
import { loginSchema, onboardingSchema, signupSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string; redirect?: string }

export async function login(data: LoginInput, redirectPath?: string, rememberMe?: boolean): Promise<ActionResult> {
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

    // Note: Remember me functionality
    // Supabase handles session persistence via cookies
    // The "remember me" option is primarily a UX feature
    // Session duration is controlled by Supabase auth settings
    // For extended sessions, you can configure this in Supabase Dashboard
    // The rememberMe flag is passed but Supabase manages the actual session duration

    revalidatePath('/home')
    revalidatePath('/profile')

    return { success: true, redirect: redirectPath || '/home' }
  } catch (error: any) {
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
        error?.digest?.startsWith('NEXT_REDIRECT') ||
        (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      return { success: true, redirect: redirectPath || '/home' }
    }

    console.error('Login error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }
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
    const finalRedirect = redirectPath || '/home'
    // Return redirect path for client to handle
    return { success: true, redirect: finalRedirect }
  } catch (error: any) {
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
        error?.digest?.startsWith('NEXT_REDIRECT') ||
        (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      return { success: true, redirect: redirectPath || '/home' }
    }

    console.error('Signup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed'
    }
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




    // Use service to update profile
    // This keeps logic centralized and consistent
    const { completeUserProfileOnboarding } = await import('@/services/auth/profile.service')
    try {
      await completeUserProfileOnboarding(user.id, {
        homeCityId: validated.homeCityId,
        role: validated.role,
        persona: validated.persona,
        onboarding_data: validated.onboarding_data,
      })
    } catch (serviceError: any) {
      console.error('completeOnboarding: Service error:', serviceError)
      return {
        success: false,
        error: serviceError.message || 'Failed to update profile'
      }
    }

    revalidatePath('/home')
    revalidatePath('/onboarding')

    return { success: true, redirect: '/home' }
  } catch (error: any) {
    console.error('completeOnboarding: Exception:', error)
    // Next.js redirect throws a special error - don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT' ||
        error?.digest?.startsWith('NEXT_REDIRECT') ||
        (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      return { success: true, redirect: '/home' }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding'
    }
  }
}

/**
 * Request password reset - sends reset email to user
 */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        success: false,
        error: 'Adresă de email invalidă'
      }
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      if (clientError.message?.includes('Missing Supabase environment variables')) {
        return {
          success: false,
          error: 'Configuration error: Missing Supabase environment variables.'
        }
      }
      throw clientError
    }

    // Request password reset - Supabase will send email if user exists
    // We don't reveal if email exists or not for security
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    // Always return success to prevent email enumeration
    // Supabase will only send email if user exists
    if (error) {
      console.error('Password reset request error:', error)
      // Still return success to prevent email enumeration
      return {
        success: true,
        error: undefined // Don't reveal error to user
      }
    }

    return {
      success: true,
      error: undefined
    }
  } catch (error: any) {
    console.error('Request password reset error:', error)
    // Always return success to prevent email enumeration
    return {
      success: true,
      error: undefined
    }
  }
}

/**
 * Update password using reset token from email
 * For password reset flow: token is verified via verifyOtp, then password is updated
 * For authenticated users: password is updated directly
 */
export async function updatePassword(newPassword: string, tokenHash?: string): Promise<ActionResult> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'Parola trebuie să aibă minim 6 caractere'
      }
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      if (clientError.message?.includes('Missing Supabase environment variables')) {
        return {
          success: false,
          error: 'Configuration error: Missing Supabase environment variables.'
        }
      }
      throw clientError
    }

    // If token hash is provided (from password reset email), verify it first
    if (tokenHash) {
      // Verify the OTP token hash from email
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })

      if (verifyError) {
        return {
          success: false,
          error: 'Token invalid sau expirat. Te rugăm să ceri un link nou de resetare.'
        }
      }

      // After verification, the session is established
      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        return {
          success: false,
          error: updateError.message || 'Eroare la actualizarea parolei'
        }
      }

      // Sign out after password reset to force re-login
      await supabase.auth.signOut()

      return {
        success: true,
        redirect: '/auth/login'
      }
    }

    // If no token, user must be authenticated to change password
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Nu ești autentificat. Te rugăm să te autentifici sau să folosești link-ul de resetare din email.'
      }
    }

    // Update password for authenticated user
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'Eroare la actualizarea parolei'
      }
    }

    return {
      success: true,
      redirect: '/auth/login'
    }
  } catch (error: any) {
    console.error('Update password error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Eroare la actualizarea parolei'
    }
  }
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
