"use client"

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

interface AuthFormProps {
  redirectTo?: string
  defaultMode?: 'login' | 'signup'
  role?: string // 'tourist' or 'local' from homepage selection
}

export function AuthForm({ redirectTo = '/home', defaultMode = 'login', role }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <LoginForm
            key="login"
            redirectTo={redirectTo}
            role={role}
          />
        ) : (
          <SignupForm
            key="signup"
            redirectTo={redirectTo}
            role={role}
          />
        )}
      </AnimatePresence>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-sm text-mova-gray hover:text-mova-dark transition-colors"
        >
          {mode === 'login' ? (
            <>Nu ai cont? <span className="font-semibold text-mova-blue">Înregistrează-te</span></>
          ) : (
            <>Ai deja cont? <span className="font-semibold text-mova-blue">Autentifică-te</span></>
          )}
        </button>
      </div>
    </div>
  )
}
