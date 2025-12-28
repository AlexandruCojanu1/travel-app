import { z } from 'zod'

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * Signup schema
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

/**
 * Onboarding schema
 */
export const onboardingSchema = z.object({
  homeCityId: z.string().uuid('Invalid city ID'),
  role: z.enum(['tourist', 'local'], {
    errorMap: () => ({ message: 'Role must be either tourist or local' }),
  }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
