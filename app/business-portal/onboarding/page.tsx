"use client"

import { CitySelect } from "@/components/features/auth/city-select"
import { ImageUpload } from "@/components/features/business/image-upload"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { businessSchema } from "@/lib/validations/business"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  CheckSquare,
  Clock,
  CreditCard,
  Facebook,
  Globe,
  Heart,
  Image as ImageIcon,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
  Wifi,
  Wind,
  X
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

const BUSINESS_CATEGORIES = [
  { value: 'Hotel', label: 'Hoteluri și Cazări', icon: '🏨', description: 'Hoteluri, pensiuni, B&Bs' },
  { value: 'Restaurant', label: 'Restaurante și Cafenele', icon: '🍽️', description: 'Restaurante, baruri, cafenele' },
  { value: 'Spa', label: 'Spa și Divertisment', icon: '🧘', description: 'Spa, wellness, parcuri distracții' },
  { value: 'Shop', label: 'Magazine și Centre Comerciale', icon: '🛍️', description: 'Magazine, mall-uri' },
] as const

type Step = 1 | 2 | 3 | 4
type BusinessCategory =
  | "Restaurant" | "Hotel" | "Spa" | "Shop" | ""

interface BusinessFormData {
  // Step 1: Identity & Category (Simplified)
  name: string
  tagline?: string
  phone: string
  website: string
  category: BusinessCategory

  // Step 1 Media (Moved from Step 4)
  image_url: string
  image_urls: string[] // Gallery
  cover_image_url?: string // Fotografie principală alias (kept for compatibility or UI label change)

  // Step 2: Location
  city_id: string
  address_line: string
  latitude: number | null
  longitude: number | null

  // Step 3: Type-specific config
  // Hotel
  star_rating?: number
  check_in_time?: string
  check_out_time?: string
  amenities?: string[]
  unit_type?: string
  hotel_amenities?: string[]
  smoking_allowed?: boolean
  children_policy?: string

  // Restaurant (Merged with Cafe)
  cuisine_type?: string[]
  price_level?: '€' | '€€' | '€€€' | '€€€€'
  opening_hours?: Record<string, string>
  operating_hours?: {
    type?: '24/7' | 'daily' | 'weekdays' | 'by_appointment'
    schedule?: Record<string, string>
  }
  accepts_reservations?: boolean
  reservation_link?: string
  menu_url?: string
  dietary_tags?: string[]
  specialty?: string // From Cafe

  // Spa (Merged with AmusementPark)
  activity_type?: string
  duration_minutes?: number
  max_participants?: number
  equipment_provided?: boolean
  spa_services?: Array<{ name: string; price: number; duration: number }>
  ticket_type?: string // From AmusementPark
  prices?: Record<string, number> // From AmusementPark
  average_visit_duration_hours?: number // From AmusementPark

  // Shop (Merged with Mall)
  shop_type?: string
  stores?: string[] // From Mall
  floors?: number // From Mall
  food_court?: boolean // From Mall
  cinema?: boolean // From Mall
  playground?: boolean // From Mall

  social_media?: Record<string, string>
  facilities?: Record<string, boolean>
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Pool', 'Gym', 'TV', 'Mini Bar', 'Balcony', 'Sea View', 'Breakfast'
]

const CUISINE_OPTIONS = [
  'Italian', 'Asian', 'Romanian', 'International', 'Mediterranean', 'Fast Food', 'Vegetarian', 'Vegan'
]

export default function BusinessOnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>(1)
  const [isChecking, setIsChecking] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)

  const [formData, setFormData] = useState<BusinessFormData>({
    name: "",
    tagline: "",
    phone: "",
    website: "",
    category: "",
    social_media: {},
    operating_hours: {},
    facilities: {},
    city_id: "",
    address_line: "",
    latitude: null,
    longitude: null,
    image_url: "",
    image_urls: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string>("")
  const [userCity, setUserCity] = useState<{ lat: number; lng: number } | null>(null)

  // Check if user is authenticated and has completed regular onboarding
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (!user || authError) {
        // Redirect to login with return path
        window.location.href = '/auth/login?redirect=/business-portal/onboarding'
        return
      }

      // For business onboarding, we don't require regular traveler onboarding
      // Business owners can go directly to business onboarding after signup/login

      // Try to get user's city from profile if available (optional for business)
      const { data: profile } = await supabase
        .from('profiles')
        .select('home_city_id')
        .eq('id', user.id)
        .maybeSingle()

      // Get user's city coordinates for map initial center (if profile exists)
      if (profile?.home_city_id) {
        const { data: city } = await supabase
          .from('cities')
          .select('latitude, longitude')
          .eq('id', profile.home_city_id)
          .single()

        if (city?.latitude && city?.longitude) {
          setUserCity({ lat: city.latitude, lng: city.longitude })
          setFormData(prev => ({
            ...prev,
            latitude: city.latitude,
            longitude: city.longitude
          }))
        }
      }

      // Check if user already has businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)

      if (businesses && businesses.length > 0) {
        router.push('/business-portal/dashboard')
        return
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [router])


  const handleNext = () => {
    setErrors({})

    if (step === 1) {
      if (!formData.name || formData.name.length < 2) {
        setErrors({ name: "Business name must be at least 2 characters" })
        return
      }
      if (!formData.category) {
        setErrors({ category: "Please select a category" })
        return
      }
      if (!formData.image_url && formData.image_urls.length === 0) {
        setErrors({ image_url: "Te rugăm să adaugi cel puțin o imagine" })
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.city_id) {
        setErrors({ city_id: "Please select a city" })
        return
      }
      setStep(3)
    } else if (step === 3) {
      // Type-specific validation happens in submit
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
      setErrors({})
    }
  }

  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat
    setFormData(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat
    }))
  }, [])

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isPending) {
      return
    }

    setErrors({})
    setServerError("")

    // Final validation
    if (!formData.name || formData.name.length < 2) {
      setErrors({ name: "Business name must be at least 2 characters" })
      setStep(1)
      return
    }
    if (!formData.category) {
      setErrors({ category: "Please select a category" })
      setStep(1)
      return
    }
    if (!formData.city_id) {
      setErrors({ city_id: "Please select a city" })
      setStep(2)
      return
    }

    console.log("Business onboarding: Submitting form data:", formData)

    startTransition(async () => {
      try {
        // Prepare data for validation - Trunchiul Comun
        const submitData: any = {
          name: formData.name,
          tagline: formData.tagline || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          category: formData.category,
          city_id: formData.city_id,
          address_line: formData.address_line || undefined,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
          image_url: formData.image_url || formData.image_urls[0] || undefined,
          cover_image_url: formData.cover_image_url || undefined,
          social_media: Object.keys(formData.social_media || {}).length > 0 ? formData.social_media : undefined,
          operating_hours: Object.keys(formData.operating_hours || {}).length > 0 ? formData.operating_hours : undefined,
          facilities: Object.keys(formData.facilities || {}).length > 0 ? formData.facilities : undefined,
        }

        // Add type-specific fields
        if (formData.category === 'Hotel') {
          if (formData.unit_type) submitData.unit_type = formData.unit_type
          if (formData.star_rating) submitData.star_rating = formData.star_rating
          if (formData.check_in_time) submitData.check_in_time = formData.check_in_time
          if (formData.check_out_time) submitData.check_out_time = formData.check_out_time
          if (formData.hotel_amenities) submitData.hotel_amenities = formData.hotel_amenities
          if (formData.smoking_allowed !== undefined) submitData.smoking_allowed = formData.smoking_allowed
          if (formData.children_policy) submitData.children_policy = formData.children_policy
        } else if (formData.category === 'Restaurant') {
          if (formData.cuisine_type) submitData.cuisine_type = formData.cuisine_type
          if (formData.price_level) submitData.price_level = formData.price_level
          if (formData.accepts_reservations !== undefined) submitData.accepts_reservations = formData.accepts_reservations
          if (formData.reservation_link) submitData.reservation_link = formData.reservation_link
          if (formData.menu_url) submitData.menu_url = formData.menu_url
          if (formData.dietary_tags) submitData.dietary_tags = formData.dietary_tags

        } else if (formData.category === 'Spa') {
          if (formData.spa_services && formData.spa_services.length > 0) {
            submitData.spa_services = formData.spa_services
          }
        } else if (formData.category === 'Shop') {
          if (formData.shop_type) submitData.shop_type = formData.shop_type
          if (formData.stores) submitData.stores = formData.stores
          if (formData.floors) submitData.floors = formData.floors
          if (formData.food_court !== undefined) submitData.food_court = formData.food_court
          if (formData.cinema !== undefined) submitData.cinema = formData.cinema
          if (formData.playground !== undefined) submitData.playground = formData.playground
        }

        const validated = businessSchema.safeParse(submitData)
        console.log("Business onboarding: Validation result:", validated.success ? "SUCCESS" : "FAILED")

        if (!validated.success) {
          console.error("Business onboarding: Validation errors:", validated.error.format())
          const fieldErrors: Record<string, string> = {}
          validated.error.errors.forEach((error: any) => {
            if (error.path[0]) {
              const fieldName = error.path[0].toString()
              fieldErrors[fieldName] = error.message
              toast.error(`Eroare la ${fieldName}: ${error.message}`)
            }
          })
          setErrors(fieldErrors)

          // Map fields to steps for redirection
          const step1Fields = ["name", "category", "tagline", "phone", "website", "image_url"]
          const step2Fields = ["city_id", "address_line", "latitude", "longitude"]

          const firstErrorField = validated.error.errors[0].path[0].toString()
          if (step1Fields.includes(firstErrorField)) {
            setStep(1)
          } else if (step2Fields.includes(firstErrorField)) {
            setStep(2)
          } else {
            setStep(3)
          }

          setServerError("Te rugăm să verifici datele introduse. Am găsit erori de validare.")
          return
        }

        console.log("Business onboarding: Proceeding to auth check...")
        // Verify user is authenticated before calling server action
        const supabase = createClient()
        const { data: { user: currentUser }, error: authCheckError } = await supabase.auth.getUser()

        if (authCheckError || !currentUser) {
          console.error("Business onboarding: Auth check failed:", authCheckError)
          setServerError("Sesiunea a expirat. Te rugăm să te autentifici din nou.")
          toast.error("Sesiunea a expirat. Te rugăm să te autentifici din nou.")
          setTimeout(() => {
            window.location.href = '/auth/login?redirect=/business-portal/onboarding'
          }, 2000)
          return
        }

        console.log("Business onboarding: User verified before createBusiness:", currentUser.id)

        // Use API route instead of server action for better cookie handling
        const response = await fetch('/api/business/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            data: validated.data,
            userId: currentUser.id,
          }),
        })

        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error("Business onboarding: Received non-JSON response:", text);
          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }

        console.log("Business onboarding: Create business result:", result)

        if (response.ok && result && result.success) {
          console.log("Business onboarding: Business created successfully, redirecting to dashboard", result)
          toast.success("Business-ul a fost creat cu succes!")

          // Use window.location for hard redirect immediately (no setTimeout)
          window.location.href = '/business-portal/dashboard'
        } else {
          console.error("Business onboarding: Failed to create business", result)
          const errorMessage = result?.error || "Nu s-a putut crea business-ul. Te rugăm să încerci din nou."
          setServerError(errorMessage)
          toast.error(errorMessage)
        }
      } catch (error: any) {
        console.error("Business onboarding error:", error)
        setServerError("A apărut o eroare neașteptată. Te rugăm să încerci din nou.")
      }
    })
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
      </div>
    )
  }

  const initialMapCenter = userCity || { lat: 45.9432, lng: 24.9668 } // Default to Romania center

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mova-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 lg:p-8 xl:p-12 max-w-full overflow-hidden"
        >
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-mova-gray">
                Pasul {step} din 5
              </span>
              <span className="text-sm font-semibold text-mova-gray">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-mova-light-gray rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-mova-blue"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Identity & Category */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Spune-ne despre business-ul tău
                  </h2>
                  <p className="text-slate-600">
                    Să începem cu elementele de bază și fotografiile
                  </p>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Numele Business-ului *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                      if (errors.name) setErrors({ ...errors, name: "" })
                    }}
                    placeholder="e.g., Grand Hotel Bucharest"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border-2 transition-all",
                      errors.name
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-200 bg-white focus:border-primary focus:ring-primary-20"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Categoria Business-ului *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, category: cat.value as BusinessCategory }))
                          if (errors.category) setErrors({ ...errors, category: "" })
                        }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          formData.category === cat.value
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        )}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className="font-semibold text-foreground text-sm">{cat.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tagline (Descriere scurtă) <span className="text-xs text-muted-foreground">(Max 100 caractere)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                      }
                    }}
                    placeholder="e.g., Cea mai bună experiență culinară din oraș"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.tagline?.length || 0}/100 caractere
                  </p>
                </div>

                {/* Contact Information (Simplified - Phone Only) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informații de Contact</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Telefon (Opțional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+40 123 456 789"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Website (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.website || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, website: e.target.value }))
                        }
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Photos (Moved from Step 4) */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Fotografii</h3>

                  {/* Main Photo */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Fotografie Principală *
                    </label>
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => {
                        setFormData((prev) => ({ ...prev, image_url: url }))
                        if (errors.image_url) setErrors({ ...errors, image_url: "" })
                      }}
                      onRemove={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                      className="h-48"
                    />
                    {errors.image_url && (
                      <p className="mt-1 text-sm text-destructive">{errors.image_url}</p>
                    )}
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Galerie Foto (Opțional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.image_urls.map((url, index) => (
                        <ImageUpload
                          key={index}
                          value={url}
                          onChange={(newUrl) => {
                            const newUrls = [...formData.image_urls]
                            newUrls[index] = newUrl
                            setFormData(prev => ({ ...prev, image_urls: newUrls }))
                          }}
                          onRemove={() => {
                            setFormData(prev => ({
                              ...prev,
                              image_urls: prev.image_urls.filter((_, i) => i !== index)
                            }))
                          }}
                          className="h-32"
                        />
                      ))}
                      {formData.image_urls.length < 9 && (
                        <ImageUpload
                          value=""
                          onChange={(url) => {
                            setFormData(prev => ({
                              ...prev,
                              image_urls: [...prev.image_urls, url]
                            }))
                          }}
                          onRemove={() => { }}
                          className="h-32"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Social Media</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Facebook className="inline h-4 w-4 mr-1" />
                        Facebook (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.social_media?.facebook || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social_media: { ...prev.social_media, facebook: e.target.value }
                          }))
                        }
                        placeholder="https://facebook.com/..."
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Instagram className="inline h-4 w-4 mr-1" />
                        Instagram (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.social_media?.instagram || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social_media: { ...prev.social_media, instagram: e.target.value }
                          }))
                        }
                        placeholder="https://instagram.com/..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        TikTok (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.social_media?.tiktok || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social_media: { ...prev.social_media, tiktok: e.target.value }
                          }))
                        }
                        placeholder="https://tiktok.com/@..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pinpoint Location */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Unde este localizat business-ul tău?
                  </h2>
                  <p className="text-slate-600">
                    Selectează orașul și indică locația exactă pe hartă
                  </p>
                </div>

                <div className="space-y-6">
                  {/* City Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-mova-dark mb-2">
                      Oraș *
                    </label>
                    <CitySelect
                      value={formData.city_id}
                      onChange={(cityId) => {
                        setFormData((prev) => ({ ...prev, city_id: cityId }))
                        setErrors({})
                      }}
                      onCityChange={(city) => {
                        // Update form data coordinates if city has them
                        if (city?.latitude && city?.longitude) {
                          setFormData(prev => ({
                            ...prev,
                            latitude: city.latitude ?? null,
                            longitude: city.longitude ?? null
                          }))
                        }
                      }}
                      error={errors.city_id}
                    />
                  </div>

                  {/* Interactive Map Removed */}
                  <div>
                    <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200 text-center">
                      <MapPin className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-700 mb-1">Locație Automată</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        Coordonatele au fost setate automat pe baza orașului selectat.
                      </p>
                      {formData.latitude && formData.longitude && (
                        <div className="text-xs font-mono bg-white inline-block px-3 py-1 rounded border border-slate-200 text-slate-400">
                          {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Line */}
                  <div>
                    <label className="block text-sm font-semibold text-mova-dark mb-2">
                      Adresă (Opțional)
                    </label>
                    <input
                      type="text"
                      value={formData.address_line}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address_line: e.target.value }))
                      }
                      placeholder="e.g., Strada Principală 123"
                      className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-mova-blue focus:ring-2 focus:ring-mova-blue/20 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Specific Configuration (Conditional UI) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Detalii Specifice Business
                  </h2>
                  <p className="text-muted-foreground">
                    Adaugă informații specifice pentru business-ul tău de tip {BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label || formData.category}
                  </p>
                </div>

                {/* Hotel Configuration */}
                {formData.category === 'Hotel' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Clasificare Stele
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, star_rating: stars }))}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all",
                              formData.star_rating === stars
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Star className={cn(
                              "h-6 w-6",
                              formData.star_rating && formData.star_rating >= stars
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            )} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Ora Check-in
                        </label>
                        <input
                          type="time"
                          value={formData.check_in_time || "15:00"}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, check_in_time: e.target.value }))
                          }
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Ora Check-out
                        </label>
                        <input
                          type="time"
                          value={formData.check_out_time || "11:00"}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, check_out_time: e.target.value }))
                          }
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Facilități
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {AMENITIES_OPTIONS.map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.amenities?.includes(amenity) || false}
                              onChange={(e) => {
                                const current = formData.amenities || []
                                setFormData(prev => ({
                                  ...prev,
                                  amenities: e.target.checked
                                    ? [...current, amenity]
                                    : current.filter(a => a !== amenity)
                                }))
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Restaurant Configuration */}
                {formData.category === 'Restaurant' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tip Bucătărie
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CUISINE_OPTIONS.map((cuisine) => (
                          <label key={cuisine} className="flex items-center gap-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.cuisine_type?.includes(cuisine) || false}
                              onChange={(e) => {
                                const current = formData.cuisine_type || []
                                setFormData(prev => ({
                                  ...prev,
                                  cuisine_type: e.target.checked
                                    ? [...current, cuisine]
                                    : current.filter(c => c !== cuisine)
                                }))
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{cuisine}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Nivel Preț
                      </label>
                      <div className="flex gap-3">
                        {(['€', '€€', '€€€', '€€€€'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, price_level: level }))}
                            className={cn(
                              "px-6 py-3 rounded-xl border-2 font-semibold transition-all",
                              formData.price_level === level
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-border cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accepts_reservations || false}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, accepts_reservations: e.target.checked }))
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-semibold">Acceptă Rezervări</span>
                      </label>
                    </div>


                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Link Meniu (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.menu_url || ""}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, menu_url: e.target.value }))
                        }
                        placeholder="https://example.com/menu.pdf"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}



                {/* Spa Configuration */}
                {formData.category === 'Spa' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Servicii / Activități
                      </label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adaugă serviciile oferite cu prețuri (ex: Masaj Relaxare - 150 RON, 60 min)
                      </p>
                      <div className="space-y-3">
                        {(formData.spa_services || []).map((service, index) => (
                          <div key={index} className="p-4 border-2 border-border rounded-xl space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => {
                                  const newServices = [...(formData.spa_services || [])]
                                  newServices[index] = { ...service, name: e.target.value }
                                  setFormData(prev => ({ ...prev, spa_services: newServices }))
                                }}
                                placeholder="Nume serviciu (ex: Masaj Relaxare)"
                                className="px-4 py-2 rounded-lg border-2 border-border bg-card focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                              />
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => {
                                  const newServices = [...(formData.spa_services || [])]
                                  newServices[index] = { ...service, price: parseFloat(e.target.value) || 0 }
                                  setFormData(prev => ({ ...prev, spa_services: newServices }))
                                }}
                                placeholder="Preț (RON)"
                                className="px-4 py-2 rounded-lg border-2 border-border bg-card focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="number"
                                value={service.duration || ""}
                                onChange={(e) => {
                                  const newServices = [...(formData.spa_services || [])]
                                  newServices[index] = { ...service, duration: parseInt(e.target.value) || 0 }
                                  setFormData(prev => ({ ...prev, spa_services: newServices }))
                                }}
                                placeholder="Durată (minute)"
                                className="px-4 py-2 rounded-lg border-2 border-border bg-card focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newServices = (formData.spa_services || []).filter((_, i) => i !== index)
                                  setFormData(prev => ({ ...prev, spa_services: newServices }))
                                }}
                                className="px-4 py-2 rounded-lg border-2 border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <X className="h-4 w-4 inline mr-1" />
                                Șterge
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              spa_services: [...(prev.spa_services || []), { name: "", price: 0, duration: 0 }]
                            }))
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                        >
                          + Adaugă Serviciu
                        </button>
                      </div>
                    </div>
                  </div>
                )}



                {/* No Category Selected */}
                {!formData.category && (
                  <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl">
                    <p className="text-sm text-yellow-600">
                      Te rugăm să selectezi o categorie în pasul anterior pentru a vedea câmpurile specifice.
                    </p>
                  </div>
                )}
              </motion.div>
            )
            }

            {/* Step 4: Review & Submit */}
            {
              step === 4 && (
                <motion.div
                  key="step4"


                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      Revizuire & Finalizare
                    </h2>
                    <p className="text-muted-foreground">
                      Revizuiește informațiile înainte de a crea business-ul
                    </p>
                  </div>

                  <div className="bg-muted/10 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Informații Business</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nume:</span>
                          <span className="font-semibold text-foreground">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Categorie:</span>
                          <span className="font-semibold text-foreground">
                            {BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label}
                          </span>
                        </div>

                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Locație</h3>
                      <div className="space-y-2 text-sm">
                        {formData.address_line && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Adresă:</span>
                            <span className="font-semibold text-foreground">{formData.address_line}</span>
                          </div>
                        )}
                        {formData.latitude && formData.longitude && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Coordonate:</span>
                            <span className="font-semibold text-foreground">
                              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.category === 'Hotel' && formData.star_rating && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Detalii Hotel</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clasificare Stele:</span>
                            <span className="font-semibold text-foreground">{formData.star_rating} stele</span>
                          </div>
                          {formData.check_in_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-in:</span>
                              <span className="font-semibold text-foreground">{formData.check_in_time}</span>
                            </div>
                          )}
                          {formData.check_out_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-out:</span>
                              <span className="font-semibold text-foreground">{formData.check_out_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {formData.image_url && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Imagine Principală</h3>
                        <img
                          src={formData.image_url}
                          alt="Business preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-border"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            }
          </AnimatePresence >

          {/* Server Error */}
          {
            serverError && (
              <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )
          }

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isPending}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                step === 1 || isPending
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuă
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se creează...
                  </>
                ) : (
                  <>
                    Creează Business
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div >
      </div >
    </div >
  )
}

