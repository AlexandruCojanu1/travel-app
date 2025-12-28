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
}

export function AuthForm({ redirectTo = '/home', defaultMode = 'login' }: AuthFormProps) {
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
            const result = await login(validated.data, redirectTo)
            
            // If result exists and has error, show it
            if (result && !result.success) {
              setErrors({ submit: result.error || 'Login failed' })
              return
            }
            
            // If login successful, redirect will happen via server action redirect()
            // Use window.location for hard redirect to ensure clean state
            window.location.href = redirectTo
          } catch (err: any) {
            // Next.js redirect throws a special error - this is expected
            if (err?.message === 'NEXT_REDIRECT' || 
                err?.digest?.startsWith('NEXT_REDIRECT') ||
                (err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
              // Redirect is happening via server action - this is expected, do nothing
              return
            }
            // Other errors
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
            // Determine redirect path: if redirectTo is business onboarding, use it; otherwise use /onboarding for traveler
            const signupRedirect = redirectTo.includes('/business-portal') ? redirectTo : '/onboarding'
            const result = await signup(validated.data, signupRedirect)
            
            // If result exists and has error, show it
            if (result && !result.success) {
              setErrors({ submit: result.error || 'Signup failed' })
              return
            }
            
            // If signup successful, redirect will happen via server action redirect()
            // Use window.location for hard redirect to ensure clean state
            window.location.href = signupRedirect
          } catch (err: any) {
            // Next.js redirect throws a special error - this is expected
            if (err?.message === 'NEXT_REDIRECT' || 
                err?.digest?.startsWith('NEXT_REDIRECT') ||
                (err instanceof Error && err.message.includes('NEXT_REDIRECT'))) {
              // Redirect is happening - this is expected, do nothing
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
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              label="Full Name"
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
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
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
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          {mode === 'login' ? (
            <>Don't have an account? <span className="font-semibold text-blue-600">Sign up</span></>
          ) : (
            <>Already have an account? <span className="font-semibold text-blue-600">Sign in</span></>
          )}
        </button>
      </div>
    </form>
  )
}

