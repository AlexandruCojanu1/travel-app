"use client"

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { signup } from '@/actions/auth'
import { signupSchema } from '@/lib/validations/auth'
import { FloatingLabelInput } from './floating-label-input'
import { cn } from '@/lib/utils'

interface SignupFormProps {
    redirectTo: string
    role?: string
}

export function SignupForm({ redirectTo, role }: SignupFormProps) {
    const [isPending, startTransition] = useTransition()
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        <span>Creează Cont</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    )
}
