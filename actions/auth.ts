'use server'

import { createClient } from '@/lib/supabase/server'
import type { LoginInput, OnboardingInput, SignupInput } from '@/lib/validations/auth'
import { loginSchema, onboardingSchema, signupSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'

export type ActionResult = { success: boolean; error?: string }

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
          error: 'Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.' 
        }
      }
      throw clientError
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Check if user has businesses - redirect to business portal if yes
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)

      if (businesses && businesses.length > 0) {
        redirect('/business-portal/dashboard')
        return { success: true }
      }
    }

    // Use redirectPath if provided, otherwise default to /home
    const finalRedirect = redirectPath || '/home'
    redirect(finalRedirect)
    return { success: true }
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
          error: 'Configuration error: Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.' 
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

    // Use redirectPath if provided (for business signup), otherwise default to /onboarding (for traveler)
    const finalRedirect = redirectPath || '/onboarding'
    redirect(finalRedirect)
    return { success: true }
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
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        home_city_id: validated.homeCityId,
        role: validated.role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (error) {
      console.error('Error completing onboarding:', error)
      return { success: false, error: error.message }
    }

    redirect('/home')
  } catch (error: any) {
    return { success: false, error: error.message || 'Onboarding failed' }
  }
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
