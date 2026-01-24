"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { login } from '@/actions/auth'
import { loginSchema } from '@/lib/validations/auth'
import { FloatingLabelInput } from './floating-label-input'
import { cn } from '@/lib/utils'

interface LoginFormProps {
    redirectTo: string
    role?: string
}

export function LoginForm({ redirectTo, role }: LoginFormProps) {
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

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
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        <span>Autentificare</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    )
}
