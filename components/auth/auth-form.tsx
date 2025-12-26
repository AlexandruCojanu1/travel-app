"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, Mail, Lock, User } from "lucide-react"
import { FloatingLabelInput } from "./floating-label-input"
import { login, signup } from "@/actions/auth"
import { loginSchema, signupSchema } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "signup"

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string>("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    setServerError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError("")

    startTransition(async () => {
      try {
        if (mode === "login") {
          // Validate
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

          // Call server action
          const result = await login(validated.data)

          if (!result.success && result.error) {
            setServerError(result.error)
          }
        } else {
          // Validate
          const validated = signupSchema.safeParse({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
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

          // Call server action
          const result = await signup(validated.data)

          if (!result.success && result.error) {
            setServerError(result.error)
          }
        }
      } catch (error) {
        console.error("Form error:", error)
        setServerError("An unexpected error occurred. Please try again.")
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Mode Toggle */}
      <div className="relative mb-8 bg-slate-100 rounded-2xl p-1.5">
        <motion.div
          className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm"
          animate={{
            x: mode === "login" ? 6 : "calc(100% + 6px)",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
        <div className="relative grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "relative z-10 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200",
              mode === "login" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "relative z-10 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200",
              mode === "signup" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence mode="wait">
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FloatingLabelInput
                id="fullName"
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                error={errors.fullName}
                disabled={isPending}
                autoComplete="name"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingLabelInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          error={errors.email}
          disabled={isPending}
          autoComplete="email"
        />

        <FloatingLabelInput
          id="password"
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          error={errors.password}
          disabled={isPending}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <p className="text-red-600 text-sm font-medium">{serverError}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "relative w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 overflow-hidden group",
            "hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
            initial={{ x: "-100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </button>

        {mode === "login" && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}
      </form>

      {/* Social Proof / Trust Indicators */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <p className="text-center text-sm text-slate-500 mb-4">
          Trusted by travelers worldwide
        </p>
        <div className="flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Mail className="h-4 w-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Lock className="h-4 w-4" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User className="h-4 w-4" />
            <span>Private</span>
          </div>
        </div>
      </div>
    </div>
  )
}



import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, Mail, Lock, User } from "lucide-react"
import { FloatingLabelInput } from "./floating-label-input"
import { login, signup } from "@/actions/auth"
import { loginSchema, signupSchema } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "signup"

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string>("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    setServerError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError("")

    startTransition(async () => {
      try {
        if (mode === "login") {
          // Validate
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

          // Call server action
          const result = await login(validated.data)

          if (!result.success && result.error) {
            setServerError(result.error)
          }
        } else {
          // Validate
          const validated = signupSchema.safeParse({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
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

          // Call server action
          const result = await signup(validated.data)

          if (!result.success && result.error) {
            setServerError(result.error)
          }
        }
      } catch (error) {
        console.error("Form error:", error)
        setServerError("An unexpected error occurred. Please try again.")
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Mode Toggle */}
      <div className="relative mb-8 bg-slate-100 rounded-2xl p-1.5">
        <motion.div
          className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm"
          animate={{
            x: mode === "login" ? 6 : "calc(100% + 6px)",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
        <div className="relative grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "relative z-10 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200",
              mode === "login" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "relative z-10 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200",
              mode === "signup" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence mode="wait">
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FloatingLabelInput
                id="fullName"
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                error={errors.fullName}
                disabled={isPending}
                autoComplete="name"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingLabelInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          error={errors.email}
          disabled={isPending}
          autoComplete="email"
        />

        <FloatingLabelInput
          id="password"
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          error={errors.password}
          disabled={isPending}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <p className="text-red-600 text-sm font-medium">{serverError}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "relative w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 overflow-hidden group",
            "hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
            initial={{ x: "-100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </button>

        {mode === "login" && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}
      </form>

      {/* Social Proof / Trust Indicators */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <p className="text-center text-sm text-slate-500 mb-4">
          Trusted by travelers worldwide
        </p>
        <div className="flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Mail className="h-4 w-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Lock className="h-4 w-4" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User className="h-4 w-4" />
            <span>Private</span>
          </div>
        </div>
      </div>
    </div>
  )
}

