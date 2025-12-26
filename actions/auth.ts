'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  signupSchema,
  onboardingSchema,
  type LoginInput,
  type SignupInput,
  type OnboardingInput,
} from '@/lib/validations/auth'

type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

export async function login(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input)
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    // Check if user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('home_city_id, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If profile doesn't exist, redirect to onboarding
      redirect('/onboarding')
    }

    // Check if onboarding is complete
    if (!profile.home_city_id || !profile.role) {
      redirect('/onboarding')
    }

    // Onboarding complete, go to home
    revalidatePath('/', 'layout')
    redirect('/home')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function signup(input: SignupInput): Promise<ActionResult> {
  try {
    const validated = signupSchema.parse(input)
    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    // Create profile (safety check in case trigger doesn't work)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validated.email,
        full_name: validated.fullName,
      })

    // Ignore error if profile already exists (trigger worked)
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError)
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  try {
    const validated = onboardingSchema.parse(input)
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        home_city_id: validated.homeCityId,
        role: validated.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
      }
    }

    // Create user preferences
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        preferred_language: 'en',
        currency: 'USD',
        notification_enabled: true,
      })

    // Ignore error if preferences already exist
    if (preferencesError && !preferencesError.message.includes('duplicate')) {
      console.error('Preferences creation error:', preferencesError)
    }

    revalidatePath('/', 'layout')
    redirect('/home')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/', 'layout')
    redirect('/auth/login')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}



import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  signupSchema,
  onboardingSchema,
  type LoginInput,
  type SignupInput,
  type OnboardingInput,
} from '@/lib/validations/auth'

type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

export async function login(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input)
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    // Check if user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('home_city_id, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If profile doesn't exist, redirect to onboarding
      redirect('/onboarding')
    }

    // Check if onboarding is complete
    if (!profile.home_city_id || !profile.role) {
      redirect('/onboarding')
    }

    // Onboarding complete, go to home
    revalidatePath('/', 'layout')
    redirect('/home')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function signup(input: SignupInput): Promise<ActionResult> {
  try {
    const validated = signupSchema.parse(input)
    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create account',
      }
    }

    // Create profile (safety check in case trigger doesn't work)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validated.email,
        full_name: validated.fullName,
      })

    // Ignore error if profile already exists (trigger worked)
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError)
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  try {
    const validated = onboardingSchema.parse(input)
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        home_city_id: validated.homeCityId,
        role: validated.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
      }
    }

    // Create user preferences
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        preferred_language: 'en',
        currency: 'USD',
        notification_enabled: true,
      })

    // Ignore error if preferences already exist
    if (preferencesError && !preferencesError.message.includes('duplicate')) {
      console.error('Preferences creation error:', preferencesError)
    }

    revalidatePath('/', 'layout')
    redirect('/home')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/', 'layout')
    redirect('/auth/login')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

