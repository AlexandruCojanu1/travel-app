"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, User, Compass, Home, Loader2, ArrowRight } from "lucide-react"
import { CitySelect } from "@/components/features/auth/city-select"
import { completeOnboarding } from "@/actions/auth"
import { onboardingSchema } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { getCityById } from "@/services/auth/city.service"
import { createClient } from "@/lib/supabase/client"

type Role = "tourist" | "local"

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2>(1)
  const { setCity } = useAppStore()
  const [formData, setFormData] = useState({
    homeCityId: "",
    role: "" as Role | "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string>("")
  const [isChecking, setIsChecking] = useState(true)

  // Check if user has already completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if onboarding is already complete
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('home_city_id, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Onboarding: Error checking profile:', profileError)
        // If it's not a "not found" error, it might be RLS - continue anyway
        if (profileError.code !== 'PGRST116') {
          console.warn('Onboarding: RLS or other error, but continuing with onboarding check')
        }
        setIsChecking(false)
        return
      }

      if (profile && profile.home_city_id && profile.role) {
        // Onboarding already complete - redirect to home
        console.log('Onboarding: Already complete, redirecting to home')
        router.push('/home')
        return
      }

      setIsChecking(false)
    }

    checkOnboardingStatus()
  }, [router])

  const handleNext = () => {
    if (!formData.homeCityId) {
      setErrors({ homeCityId: "Please select your city" })
      return
    }
    setErrors({})
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    setErrors({})
    setServerError("")

    // Validate before submitting
    if (!formData.homeCityId) {
      setErrors({ homeCityId: "Please select your city" })
      return
    }

    if (!formData.role) {
      setErrors({ role: "Please select your role" })
      return
    }

    console.log("Onboarding: Submitting form data:", {
      homeCityId: formData.homeCityId,
      role: formData.role
    })

    startTransition(async () => {
      try {
        const validated = onboardingSchema.safeParse(formData)

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

        // Set currentCity in store BEFORE calling completeOnboarding
        // This ensures it's set even if redirect happens immediately
        if (validated.data.homeCityId) {
          try {
            const city = await getCityById(validated.data.homeCityId)
            if (city) {
              setCity(city)
              console.log("Onboarding: City set in store:", city.name)
            }
          } catch (error) {
            console.error("Error loading city for store:", error)
            // Continue anyway, will be loaded on home page
          }
        }

        // Call completeOnboarding
        const result = await completeOnboarding(validated.data)
        
        if (result && result.success) {
          // Onboarding completed successfully, redirect to home
          console.log("Onboarding: Onboarding completed, redirecting to home")
          window.location.href = '/home'
        } else {
          // Show error message
          console.error("Onboarding: Failed to complete onboarding", result)
          setServerError(result?.error || "Failed to complete onboarding. Please try again.")
        }
      } catch (error: any) {
        // Next.js redirect throws a special error - this is expected and normal
        // We need to check for the redirect error and let it propagate
        if (error?.message === 'NEXT_REDIRECT' || 
            error?.digest?.startsWith('NEXT_REDIRECT') ||
            (error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
          // This is the redirect happening - it's expected, use window.location
          console.log("Onboarding: Redirect exception (expected), using window.location")
          window.location.href = '/home'
          return
        }
        
        // Check if it's a result object with an error
        if (error?.success === false && error?.error) {
          setServerError(error.error)
          return
        }
        
        console.error("Onboarding error:", error)
        setServerError("An unexpected error occurred. Please try again.")
      }
    })
  }

  // Show loading state while checking onboarding status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div
              className={cn(
                "h-2 w-24 rounded-full transition-colors",
                step >= 1 ? "bg-blue-600" : "bg-slate-200"
              )}
            />
            <div
              className={cn(
                "h-2 w-24 rounded-full transition-colors",
                step >= 2 ? "bg-blue-600" : "bg-slate-200"
              )}
            />
          </div>
          <p className="text-center text-sm text-slate-600 mt-3">
            Step {step} of 2
          </p>
        </div>

        {/* Card Container */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12"
        >
          {step === 1 ? (
            <>
              {/* Step 1: City Selection */}
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl shadow-blue-500/25 mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Where are you from?
                </h1>
                <p className="text-slate-600 text-lg">
                  Select your home city to personalize your experience
                </p>
              </div>

              <div className="space-y-6">
                <CitySelect
                  value={formData.homeCityId}
                  onChange={(cityId) => {
                    console.log("Onboarding: City selected, ID:", cityId)
                    setFormData((prev) => ({ ...prev, homeCityId: cityId }))
                    setErrors({}) // Clear errors when city is selected
                  }}
                  error={errors.homeCityId}
                />

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Role Selection */}
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl shadow-blue-500/25 mx-auto mb-4">
                  <User className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  How will you use TravelPWA?
                </h1>
                <p className="text-slate-600 text-lg">
                  Choose your primary role to customize your experience
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Tourist Option */}
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "tourist" }))}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 transition-all text-left group",
                    formData.role === "tourist"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                        formData.role === "tourist"
                          ? "bg-blue-600"
                          : "bg-slate-100 group-hover:bg-blue-100"
                      )}
                    >
                      <Compass
                        className={cn(
                          "h-6 w-6",
                          formData.role === "tourist"
                            ? "text-white"
                            : "text-slate-600 group-hover:text-blue-600"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-xl font-bold mb-1",
                          formData.role === "tourist" ? "text-blue-900" : "text-slate-900"
                        )}
                      >
                        Tourist / Traveler
                      </h3>
                      <p className="text-slate-600 text-sm">
                        I'm planning trips and exploring new destinations around the world
                      </p>
                    </div>
                    {formData.role === "tourist" && (
                      <svg
                        className="h-6 w-6 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Local Option */}
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "local" }))}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 transition-all text-left group",
                    formData.role === "local"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                        formData.role === "local"
                          ? "bg-purple-600"
                          : "bg-slate-100 group-hover:bg-purple-100"
                      )}
                    >
                      <Home
                        className={cn(
                          "h-6 w-6",
                          formData.role === "local"
                            ? "text-white"
                            : "text-slate-600 group-hover:text-purple-600"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-xl font-bold mb-1",
                          formData.role === "local" ? "text-purple-900" : "text-slate-900"
                        )}
                      >
                        Local / Guide
                      </h3>
                      <p className="text-slate-600 text-sm">
                        I want to share my city's best spots and help travelers discover authentic experiences
                      </p>
                    </div>
                    {formData.role === "local" && (
                      <svg
                        className="h-6 w-6 text-purple-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              </div>

              {errors.role && (
                <p className="text-red-600 text-sm font-medium mb-4 px-1">
                  {errors.role}
                </p>
              )}

              {serverError && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm font-medium">{serverError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isPending}
                  className="flex-1 h-14 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Complete Setup</span>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
