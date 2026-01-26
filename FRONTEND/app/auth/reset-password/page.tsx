"use client"

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { updatePassword } from '@/actions/auth'
import { passwordResetSchema } from '@/lib/validations/auth'
import { FloatingLabelInput } from '@/components/features/auth/floating-label-input'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || undefined
  
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    // If no token and user is not authenticated, redirect to forgot password
    if (!token) {
      // Check if user is authenticated - if yes, they can reset password
      // If no, redirect to forgot password
      const checkAuth = async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/forgot-password')
        }
      }
      checkAuth()
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    const validated = passwordResetSchema.safeParse({
      ...formData,
      token: token,
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
        const result = await updatePassword(validated.data.password, token)

        if (result && !result.success) {
          setErrors({ submit: result.error || 'Eroare la actualizarea parolei' })
          return
        }

        setSuccess(true)
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login?message=password-reset-success')
        }, 2000)
      } catch (err: any) {
        console.error('❌ Password reset error:', err)
        setErrors({ submit: err.message || 'Eroare la actualizarea parolei' })
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-md rounded-airbnb-lg shadow-airbnb-lg border border-gray-200">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Parolă actualizată!</h1>
            <p className="text-muted-foreground">
              Parola ta a fost resetată cu succes. Vei fi redirecționat la pagina de autentificare...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-md rounded-airbnb-lg shadow-airbnb-lg border border-gray-200">
        <div className="mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-airbnb-lg bg-white shadow-airbnb-md mx-auto mb-4 overflow-hidden">
            <Image
              src="/images/mova-logo.png"
              alt="MOVA Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Nouă Parolă</h1>
          <p className="text-muted-foreground text-sm">
            Introdu o parolă nouă pentru contul tău
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="relative">
              <FloatingLabelInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Parolă Nouă"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                icon={Lock}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mova-gray hover:text-mova-dark"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <FloatingLabelInput
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirmă Parola"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={errors.confirmPassword}
                icon={Lock}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mova-gray hover:text-mova-dark"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-airbnb">
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
                <span>Actualizează Parola</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-mova-gray hover:text-mova-dark transition-colors"
            >
              ← Înapoi la autentificare
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
