/**
 * Environment variables validation
 * Validates all required environment variables at startup
 * Throws descriptive errors if any are missing
 */

import { z } from 'zod'

// Schema for required environment variables
const envSchema = z.object({
  // Supabase (CRITICAL)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  
  // Stripe (CRITICAL for payments)
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  
  // Application URL (CRITICAL for redirects and webhooks)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  
  // Optional but recommended
  // Note: MapLibre GL JS is used (free, open-source) - no Mapbox token needed
  WEATHER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables
 * Call this at application startup
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      WEATHER_API_KEY: process.env.WEATHER_API_KEY,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')
      throw new Error(
        `Missing or invalid environment variables:\n${missingVars}\n\n` +
        `Please check your .env.local file or Vercel environment variables.`
      )
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Use this instead of process.env directly
 * 
 * Note: In Next.js, this should be called in server-side code only
 * For client-side, use process.env.NEXT_PUBLIC_* directly
 */
let validatedEnv: Env | null = null

export function getEnv(): Env {
  if (!validatedEnv) {
    validatedEnv = validateEnv()
  }
  return validatedEnv
}

