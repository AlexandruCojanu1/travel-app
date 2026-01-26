import { z } from 'zod'

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Adresă de email invalidă'),
})

/**
 * Password reset (update) schema
 */
export const passwordResetSchema = z.object({
  password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere'),
  confirmPassword: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere'),
  token: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu se potrivesc',
  path: ['confirmPassword'],
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
  persona: z.string().optional(),
  onboarding_data: z.record(z.any()).optional(),
  onboarding_completed: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
