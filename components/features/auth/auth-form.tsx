"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { login, signup } from '@/actions/auth'
import { loginSchema, signupSchema } from '@/lib/validations/auth'
import { FloatingLabelInput } from './floating-label-input'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

interface AuthFormProps {
  redirectTo?: string
  defaultMode?: 'login' | 'signup'
  role?: string // 'tourist' or 'local' from homepage selection
}

export function AuthForm({ redirectTo = '/home', defaultMode = 'login', role }: AuthFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      if (mode === 'login') {
        const validated = loginSchema.safeParse({
          email: formData.email,
          password: formData.password,
        })

        if (!validated.success) {
          const fieldErrors: Record<string, string> = {}
          validated.error.errors.forEach((error) => {
            if (error.path[0]) {
              fieldErrors[error.path[0].toString()] = error.message
            }
          })
          setErrors(fieldErrors)
          return
        }

        startTransition(async () => {
          try {
            console.log('🔐 Login attempt started')
            // Build redirect path with role if available
            const loginRedirect = role ? `${redirectTo}?role=${role}` : redirectTo
            const result = await login(validated.data, loginRedirect)
            console.log('🔐 Login result:', result)

            // If result exists and has error, show it
            if (result && !result.success) {
              console.error('❌ Login failed:', result.error)
              setErrors({ submit: result.error || 'Login failed' })
              return
            }

            // CRITICAL: Sign in on CLIENT SIDE to establish session cookies properly
            // Server actions can't reliably set cookies in all cases
            console.log('🔐 Signing in on client side to establish session...')
            const supabaseClient = (await import('@/lib/supabase/client')).createClient()
            const { error: clientSignInError } = await supabaseClient.auth.signInWithPassword({
              email: validated.data.email,
              password: validated.data.password,
            })

            if (clientSignInError) {
              console.error('❌ Client sign-in failed:', clientSignInError)
              setErrors({ submit: clientSignInError.message })
              return
            }

            console.log('✅ Client session established successfully')

            // Use redirect from server action result
            const redirectPath = result?.redirect || redirectTo
            console.log('🔄 Redirecting to:', redirectPath)

            // Force a hard redirect to ensure fresh state
            window.location.href = redirectPath
          } catch (err: any) {
            console.error('❌ Login error:', err)
            // Next.js redirect throws a special error - this is expected
            if (err?.message === 'NEXT_REDIRECT' ||
              err?.digest?.startsWith('NEXT_REDIRECT') ||
              (err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
              // Redirect is happening - use window.location as fallback
              const redirectPath = role ? `/onboarding?role=${role}` : '/onboarding'
              window.location.href = redirectPath
              return
            }
            setErrors({ submit: err.message || 'Login failed' })
          }
        })
      } else {
        const validated = signupSchema.safeParse(formData)

        if (!validated.success) {
          const fieldErrors: Record<string, string> = {}
          validated.error.errors.forEach((error) => {
            if (error.path[0]) {
              fieldErrors[error.path[0].toString()] = error.message
            }
          })
          setErrors(fieldErrors)
          return
        }

        startTransition(async () => {
          try {
            // Determine redirect path: if redirectTo is business onboarding, use it; otherwise use /onboarding with role
            const signupRedirect = redirectTo.includes('/business-portal')
              ? redirectTo
              : (role ? `/onboarding?role=${role}` : '/onboarding')
            console.log('📝 Signup attempt started, redirect to:', signupRedirect, 'role:', role)
            const result = await signup(validated.data, signupRedirect)
            console.log('📝 Signup result:', result)

            // If result exists and has error, show it
            if (result && !result.success) {
              console.error('❌ Signup failed:', result.error)
              setErrors({ submit: result.error || 'Signup failed' })
              return
            }

            // CRITICAL: Sign in on CLIENT SIDE to establish session cookies properly
            // Server actions can't reliably set cookies in all cases
            console.log('🔐 Signing in on client side to establish session...')
            const supabaseClient = (await import('@/lib/supabase/client')).createClient()
            const { error: clientSignInError } = await supabaseClient.auth.signInWithPassword({
              email: validated.data.email,
              password: validated.data.password,
            })

            if (clientSignInError) {
              console.error('❌ Client sign-in failed:', clientSignInError)
              // Still redirect to login so user can sign in manually
              window.location.href = '/auth/login'
              return
            }

            console.log('✅ Client session established successfully')

            // Use redirect from result if provided, otherwise use signupRedirect
            const redirectPath = result?.redirect || signupRedirect
            console.log('🔄 Redirecting to:', redirectPath)

            // Force a hard redirect
            window.location.href = redirectPath
          } catch (err: any) {
            console.error('❌ Signup error:', err)
            // Next.js redirect throws a special error - this is expected
            if (err?.message === 'NEXT_REDIRECT' ||
              err?.digest?.startsWith('NEXT_REDIRECT') ||
              (err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
              // Redirect is happening - use window.location as fallback
              const signupRedirect = redirectTo.includes('/business-portal')
                ? redirectTo
                : (role ? `/onboarding?role=${role}` : '/onboarding')
              console.log('🔄 NEXT_REDIRECT detected, redirecting to:', signupRedirect)
              window.location.href = signupRedirect
              return
            }
            // Other errors
            setErrors({ submit: err.message || 'Signup failed' })
          }
        })
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'An error occurred' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
              icon={Mail}
              autoComplete="email"
            />

            <div className="relative">
              <FloatingLabelInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Parola"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mova-gray hover:text-mova-dark"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <FloatingLabelInput
              id="fullName"
              type="text"
              label="Nume Complet"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              error={errors.fullName}
              icon={User}
              autoComplete="name"
            />

            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
              icon={Mail}
              autoComplete="email"
            />

            <div className="relative">
              <FloatingLabelInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Parola"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mova-gray hover:text-mova-dark"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errors.submit && (
        <div className="p-3 bg-blue-50 border border-red-200 rounded-airbnb">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-12 bg-mova-blue text-white font-semibold rounded-airbnb-lg shadow-airbnb-md hover:bg-[#2563EB] hover:shadow-airbnb-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>{mode === 'login' ? 'Autentificare' : 'Creează Cont'}</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setErrors({})
            setFormData({ email: '', password: '', fullName: '' })
          }}
          className="text-sm text-mova-gray hover:text-mova-dark transition-colors"
        >
          {mode === 'login' ? (
            <>Nu ai cont? <span className="font-semibold text-mova-blue">Înregistrează-te</span></>
          ) : (
            <>Ai deja cont? <span className="font-semibold text-mova-blue">Autentifică-te</span></>
          )}
        </button>
      </div>
    </form>
  )
}
