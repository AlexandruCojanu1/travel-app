"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, Loader2, ArrowRight } from "lucide-react"
import { CitySelect } from "@/components/features/auth/city-select"
import { onboardingSchema } from "@/lib/validations/auth"
import { useAppStore } from "@/store/app-store"
import { getCityById } from "@/services/auth/city.service"
import { createClient } from "@/lib/supabase/client"

type Role = "tourist" | "local"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { setCity } = useAppStore()
  // Get role from URL params (set from homepage) or default to 'tourist'
  const roleFromUrl = searchParams?.get('role') as Role | null
  const [formData, setFormData] = useState({
    homeCityId: "",
    role: (roleFromUrl || "tourist") as Role, // Default to tourist if not provided
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string>("")
  const [isChecking, setIsChecking] = useState(true)

  // Check if user has already completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      const supabase = createClient()
      
      // First refresh session to ensure cookies are up to date
      // This is critical for existing users who logged in before
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.warn('Onboarding: Session refresh warning:', sessionError)
          // If session error, try to refresh it
          if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
            console.log('Onboarding: Session expired, redirecting to login')
            router.push('/auth/login')
            return
          }
        }
        
        // If no session, redirect to login
        if (!session) {
          console.log('Onboarding: No session found, redirecting to login')
          router.push('/auth/login')
          return
        }
      } catch (sessionRefreshError) {
        console.warn('Onboarding: Failed to refresh session:', sessionRefreshError)
        router.push('/auth/login')
        return
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Onboarding: User not authenticated:', userError)
        // If it's a session error, redirect to login
        if (userError?.message?.includes('session') || userError?.message?.includes('JWT') || userError?.message?.includes('expired')) {
          router.push('/auth/login')
          return
        }
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

  const handleSubmit = async () => {
    setErrors({})
    setServerError("")

    // Validate before submitting
    if (!formData.homeCityId) {
      setErrors({ homeCityId: "Please select your city" })
      return
    }

    // Role is already set from URL or default, no need to validate
    if (!formData.role) {
      // Fallback: if somehow role is missing, default to tourist
      setFormData(prev => ({ ...prev, role: "tourist" }))
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

        // Use client-side Supabase to complete onboarding
        // This ensures we have direct access to the session
        const supabase = createClient()
        
        // First verify user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Onboarding: User not authenticated:", userError)
          setServerError("Nu ești autentificat. Te rugăm să te autentifici din nou.")
          return
        }
        
        console.log("Onboarding: User authenticated, saving profile:", user.id)
        
        // Save profile directly using client-side Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            home_city_id: validated.data.homeCityId,
            role: validated.data.role,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          })
        
        if (profileError) {
          console.error("Onboarding: Error saving profile:", profileError)
          setServerError(`Eroare la salvare: ${profileError.message || 'Failed to save profile'}`)
          return
        }
        
        console.log("Onboarding: Profile saved successfully, redirecting to home")
        
        // Redirect to home
        window.location.href = '/home'
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
        <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Indicator - Single step now */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-48 rounded-full bg-mova-blue" />
          </div>
          <p className="text-center text-sm text-mova-gray mt-3">
            Finalizare setare
          </p>
        </div>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-airbnb-lg shadow-airbnb-lg border border-gray-200 p-8 md:p-12"
        >
          {/* City Selection - Only Step */}
          <div className="text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-airbnb-lg bg-mova-blue shadow-airbnb-lg mx-auto mb-4">
              <MapPin className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-mova-dark mb-2">
              Unde locuiești?
            </h1>
            <p className="text-mova-gray text-lg">
              Selectează orașul tău pentru a personaliza experiența
            </p>
            {/* Show role info if available */}
            {formData.role && (
              <p className="text-sm text-mova-gray mt-2">
                {formData.role === 'tourist' ? 'Călător' : 'Proprietar de afacere'}
              </p>
            )}
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

            {serverError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm font-medium">{serverError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !formData.homeCityId}
              className="airbnb-button w-full h-14 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Se procesează...</span>
                </>
              ) : (
                <>
                  <span>Finalizează setarea</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
