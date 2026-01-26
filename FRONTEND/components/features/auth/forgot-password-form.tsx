"use client"

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '@/actions/auth'
import { passwordResetRequestSchema } from '@/lib/validations/auth'
import { FloatingLabelInput } from './floating-label-input'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [email, setEmail] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setSuccess(false)

        const validated = passwordResetRequestSchema.safeParse({ email })

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
                const result = await requestPasswordReset(validated.data.email)

                if (result && !result.success) {
                    setErrors({ submit: result.error || 'Eroare la trimiterea email-ului' })
                    return
                }

                // Always show success message to prevent email enumeration
                setSuccess(true)
            } catch (err: any) {
                console.error('❌ Password reset request error:', err)
                // Still show success to prevent email enumeration
                setSuccess(true)
            }
        })
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="p-6 bg-green-50 border border-green-200 rounded-airbnb-lg">
                    <div className="flex items-start gap-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-green-900 mb-1">
                                Email trimis cu succes!
                            </h3>
                            <p className="text-sm text-green-700">
                                Dacă există un cont asociat cu această adresă de email, vei primi un link de resetare a parolei.
                                Verifică inbox-ul și folderul spam.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    href="/auth/login"
                    className="block w-full text-center text-sm text-mova-blue hover:text-[#2563EB] transition-colors font-medium"
                >
                    ← Înapoi la autentificare
                </Link>
            </motion.div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
            >
                <div>
                    <p className="text-sm text-mova-gray mb-4">
                        Introdu adresa ta de email și îți vom trimite un link pentru resetarea parolei.
                    </p>
                    <FloatingLabelInput
                        id="email"
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                        icon={Mail}
                        autoComplete="email"
                        required
                    />
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
                        <span>Trimite link de resetare</span>
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
    )
}
