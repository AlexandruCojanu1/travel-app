"use client"

import { CitySelect } from "@/components/features/auth/city-select"
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
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import Map, { Marker, NavigationControl } from 'react-map-gl'
import { toast } from "sonner"

const BUSINESS_CATEGORIES = [
  { value: 'Restaurant', label: 'Restaurante', icon: '🍽️', description: 'Restaurante, baruri' },
  { value: 'Cafe', label: 'Cafelele', icon: '☕', description: 'Cafenele, cofetării' },
  { value: 'Hotel', label: 'Hoteluri și Cazări', icon: '🏨', description: 'Hoteluri, pensiuni, B&Bs' },
  { value: 'Spa', label: 'Centre Spa', icon: '🧘', description: 'Spa, wellness, relaxare' },
  { value: 'AmusementPark', label: 'Parcuri de Distracții', icon: '🎢', description: 'Parcuri tematice, distracții' },
  { value: 'Shop', label: 'Magazine', icon: '🛍️', description: 'Magazine, retail' },
  { value: 'Mall', label: 'Mall-uri și Centre Comerciale', icon: '🏬', description: 'Centre comerciale, mall-uri' },
  { value: 'Museum', label: 'Muzee/Galerii/Schituri/Biserici', icon: '🏛️', description: 'Cultură, istorie, artă' },
  { value: 'Event', label: 'Evenimente', icon: '🎪', description: 'Evenimente, festivaluri' },
  { value: 'Theater', label: 'Teatre/Operă/Spectacole', icon: '🎭', description: 'Teatru, operă, spectacole' },
  { value: 'Nature', label: 'Atracții Naturale', icon: '🏔️', description: 'Trasee montane, natură' },
  { value: 'CurrencyExchange', label: 'Servicii de Schimb Valutar', icon: '💱', description: 'Schimb valutar' },
  { value: 'Parking', label: 'Parcări', icon: '🅿️', description: 'Parcări publice și private' },
  { value: 'Laundry', label: 'Spălătorii de Haine', icon: '🧺', description: 'Spălătorie, curățătorie' },
  { value: 'DutyFree', label: 'Duty Free', icon: '✈️', description: 'Magazine duty free' },
  { value: 'Hospital', label: 'Spitale', icon: '🏥', description: 'Spitale, clinici' },
  { value: 'Pharmacy', label: 'Farmacii', icon: '💊', description: 'Farmacii, medicamente' },
] as const

type Step = 1 | 2 | 3 | 4 | 5
type BusinessCategory =
  | "Restaurant" | "Cafe" | "Hotel" | "Spa" | "AmusementPark"
  | "Shop" | "Mall" | "Museum" | "Event" | "Theater"
  | "Nature" | "CurrencyExchange" | "Parking" | "Laundry"
  | "DutyFree" | "Hospital" | "Pharmacy" | ""

interface BusinessFormData {
  // Step 1: Identity & Category
  name: string
  tagline?: string
  description: string
  phone: string
  website: string
  email?: string
  category: BusinessCategory

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
  // Restaurant
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
  specialty?: string
  // Nature
  difficulty?: 'Easy' | 'Moderate' | 'Hard' | 'Expert'
  length_km?: number
  elevation_gain_m?: number
  estimated_duration_hours?: number
  trail_conditions?: string
  equipment_needed?: string
  seasonal?: string
  // Spa/Activity
  activity_type?: string
  duration_minutes?: number
  max_participants?: number
  equipment_provided?: boolean
  spa_services?: Array<{ name: string; price: number; duration: number }>
  // Museum/Event/Theater
  ticket_type?: string
  prices?: Record<string, number>
  average_visit_duration_hours?: number
  museum_type?: string
  events_calendar_url?: string
  ticket_prices?: Record<string, number>
  // Shop/Mall
  shop_type?: string
  stores?: string[]
  floors?: number
  food_court?: boolean
  cinema?: boolean
  playground?: boolean
  // Currency Exchange
  commission_type?: string
  commission_value?: number
  currencies_available?: string[]
  // Parking
  parking_type?: string
  parking_pricing?: Record<string, any>
  capacity?: number
  max_height_meters?: number
  // Laundry
  service_type?: string
  laundry_pricing?: Record<string, any>
  average_wait_time_minutes?: number
  // Duty Free
  duty_free_location?: string
  // Hospital
  hospital_type?: string
  specializations?: string[]
  emergency_phone?: string
  // Pharmacy
  pharmacy_type?: string
  accepts_compensated_prescriptions?: boolean
  has_lab?: boolean
  pharmacy_emergency_phone?: string

  // Step 4: Media
  image_url: string
  image_urls: string[] // Gallery
  logo_url?: string
  cover_image_url?: string
  social_media?: Record<string, string>
  facilities?: Record<string, boolean>
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Pool', 'Gym', 'Parking', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Sea View', 'Breakfast'
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
    description: "",
    phone: "",
    website: "",
    email: "",
    category: "",
    logo_url: "",
    cover_image_url: "",
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
        .single()

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
    } else if (step === 4) {
      if (!formData.image_url && formData.image_urls.length === 0) {
        setErrors({ image_url: "Please add at least one image" })
        return
      }
      setStep(5)
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
          description: formData.description || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          email: formData.email || undefined,
          category: formData.category,
          city_id: formData.city_id,
          address_line: formData.address_line || undefined,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
          image_url: formData.image_url || formData.image_urls[0] || undefined,
          logo_url: formData.logo_url || undefined,
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
        } else if (formData.category === 'Cafe') {
          if (formData.specialty) submitData.specialty = formData.specialty
          if (formData.price_level) submitData.price_level = formData.price_level
          if (formData.menu_url) submitData.menu_url = formData.menu_url
          if (formData.dietary_tags) submitData.dietary_tags = formData.dietary_tags
        } else if (formData.category === 'Spa') {
          if (formData.spa_services && formData.spa_services.length > 0) {
            submitData.spa_services = formData.spa_services
          }
        } else if (formData.category === 'Nature') {
          if (formData.difficulty) submitData.difficulty = formData.difficulty
          if (formData.length_km) submitData.length_km = formData.length_km
          if (formData.elevation_gain_m) submitData.elevation_gain_m = formData.elevation_gain_m
          if (formData.estimated_duration_hours) submitData.estimated_duration_hours = formData.estimated_duration_hours
          if (formData.trail_conditions) submitData.trail_conditions = formData.trail_conditions
          if (formData.equipment_needed) submitData.equipment_needed = formData.equipment_needed
          if (formData.seasonal !== undefined) submitData.seasonal = formData.seasonal
        } else if (formData.category === 'Museum') {
          if (formData.ticket_type) submitData.ticket_type = formData.ticket_type
          if (formData.prices) submitData.prices = formData.prices
          if (formData.average_visit_duration_hours) submitData.average_visit_duration_hours = formData.average_visit_duration_hours
          if (formData.museum_type) submitData.museum_type = formData.museum_type
        } else if (formData.category === 'Theater') {
          if (formData.events_calendar_url) submitData.events_calendar_url = formData.events_calendar_url
          if (formData.ticket_prices) submitData.ticket_prices = formData.ticket_prices
        } else if (formData.category === 'AmusementPark') {
          if (formData.ticket_type) submitData.ticket_type = formData.ticket_type
          if (formData.prices) submitData.prices = formData.prices
          if (formData.average_visit_duration_hours) submitData.average_visit_duration_hours = formData.average_visit_duration_hours
        } else if (formData.category === 'Shop') {
          if (formData.shop_type) submitData.shop_type = formData.shop_type
        } else if (formData.category === 'Mall') {
          if (formData.stores) submitData.stores = formData.stores
          if (formData.floors) submitData.floors = formData.floors
          if (formData.food_court !== undefined) submitData.food_court = formData.food_court
          if (formData.cinema !== undefined) submitData.cinema = formData.cinema
          if (formData.playground !== undefined) submitData.playground = formData.playground
        } else if (formData.category === 'CurrencyExchange') {
          if (formData.commission_type) submitData.commission_type = formData.commission_type
          if (formData.commission_value) submitData.commission_value = formData.commission_value
          if (formData.currencies_available) submitData.currencies_available = formData.currencies_available
        } else if (formData.category === 'Parking') {
          if (formData.parking_type) submitData.parking_type = formData.parking_type
          if (formData.parking_pricing) submitData.parking_pricing = formData.parking_pricing
          if (formData.capacity) submitData.capacity = formData.capacity
          if (formData.max_height_meters) submitData.max_height_meters = formData.max_height_meters
        } else if (formData.category === 'Laundry') {
          if (formData.service_type) submitData.service_type = formData.service_type
          if (formData.laundry_pricing) submitData.laundry_pricing = formData.laundry_pricing
          if (formData.average_wait_time_minutes) submitData.average_wait_time_minutes = formData.average_wait_time_minutes
        } else if (formData.category === 'DutyFree') {
          if (formData.duty_free_location) submitData.duty_free_location = formData.duty_free_location
        } else if (formData.category === 'Hospital') {
          if (formData.hospital_type) submitData.hospital_type = formData.hospital_type
          if (formData.specializations) submitData.specializations = formData.specializations
          if (formData.emergency_phone) submitData.emergency_phone = formData.emergency_phone
        } else if (formData.category === 'Pharmacy') {
          if (formData.pharmacy_type) submitData.pharmacy_type = formData.pharmacy_type
          if (formData.accepts_compensated_prescriptions !== undefined) submitData.accepts_compensated_prescriptions = formData.accepts_compensated_prescriptions
          if (formData.has_lab !== undefined) submitData.has_lab = formData.has_lab
          if (formData.pharmacy_emergency_phone) submitData.pharmacy_emergency_phone = formData.pharmacy_emergency_phone
        }

        const validated = businessSchema.safeParse(submitData)

        if (!validated.success) {
          const fieldErrors: Record<string, string> = {}
          validated.error.errors.forEach((error: any) => {
            if (error.path[0]) {
              fieldErrors[error.path[0].toString()] = error.message
            }
          })
          setErrors(fieldErrors)
          return
        }

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
        // Include credentials to ensure cookies are sent
        const response = await fetch('/api/business/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // CRITICAL: Include cookies for session
          body: JSON.stringify({
            data: validated.data,
            userId: currentUser.id,
          }),
        })
        
        const result = await response.json()

        console.log("Business onboarding: Create business result:", JSON.stringify(result, null, 2))

        if (result && result.success) {
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
        <Loader2 className="h-8 w-8 animate-spin text-airbnb-red" />
      </div>
    )
  }

  const initialMapCenter = userCity || { lat: 45.9432, lng: 24.9668 } // Default to Romania center

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-airbnb-red/5 rounded-full blur-3xl" />
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
              <span className="text-sm font-semibold text-airbnb-gray">
                Pasul {step} din 5
              </span>
              <span className="text-sm font-semibold text-airbnb-gray">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-airbnb-light-gray rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-airbnb-red"
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
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Spune-ne despre business-ul tău
                  </h2>
                  <p className="text-slate-600">
                    Să începem cu elementele de bază
                  </p>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                        : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-200"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Categoria Business-ului *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto overflow-x-hidden">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, category: cat.value }))
                          if (errors.category) setErrors({ ...errors, category: "" })
                        }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          formData.category === cat.value
                            ? "border-airbnb-red bg-airbnb-light-red shadow-airbnb-md"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        )}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className="font-semibold text-airbnb-dark text-sm">{cat.label}</div>
                        <div className="text-xs text-airbnb-gray mt-1">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                    Tagline (Descriere scurtă) <span className="text-xs text-slate-500">(Max 100 caractere)</span>
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
                    className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.tagline?.length || 0}/100 caractere
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                    Descriere Detaliată *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Povestea locului, misiune, ce face business-ul tău special..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Informații de Contact</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email Public (Opțional)
                      </label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="contact@example.com"
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                      className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Social Media</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Identity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Identitate Vizuală</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Logo URL (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.logo_url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                        }
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Cover Image URL (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.cover_image_url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))
                        }
                        placeholder="https://example.com/cover.jpg"
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Program de Funcționare</h3>

                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      Tip Program
                    </label>
                    <select
                      value={formData.operating_hours?.type || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          operating_hours: {
                            ...prev.operating_hours,
                            type: e.target.value as '24/7' | 'daily' | 'weekdays' | 'by_appointment'
                          }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                    >
                      <option value="">Selectează tip program</option>
                      <option value="24/7">24/7</option>
                      <option value="daily">Zilnic</option>
                      <option value="weekdays">Luni-Vineri</option>
                      <option value="by_appointment">Doar pe bază de programare</option>
                    </select>
                  </div>

                  {formData.operating_hours?.type && formData.operating_hours.type !== '24/7' && formData.operating_hours.type !== 'by_appointment' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Orare Specifice
                      </label>
                      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day) => (
                        <div key={day} className="flex items-center gap-2">
                          <span className="w-24 text-sm text-slate-700">{day}:</span>
                          <input
                            type="text"
                            value={(formData.operating_hours?.schedule as any)?.[day.toLowerCase()] || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                operating_hours: {
                                  ...(prev.operating_hours || {}),
                                  schedule: {
                                    ...((prev.operating_hours?.schedule as Record<string, string>) || {}),
                                    [day.toLowerCase()]: e.target.value
                                  }
                                }
                              }))
                            }
                            placeholder="09:00-18:00"
                            className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* General Facilities */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Facilități Generale</h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.accepts_card || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, accepts_card: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-semibold">Acceptă Card</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.wifi || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, wifi: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm font-semibold">WiFi Gratuit</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.wheelchair_accessible || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, wheelchair_accessible: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-semibold">Accesibilitate</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.pet_friendly || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, pet_friendly: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-semibold">Pet Friendly</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.air_conditioning || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, air_conditioning: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <Wind className="h-4 w-4" />
                      <span className="text-sm font-semibold">Aer Condiționat</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.public_restrooms || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, public_restrooms: e.target.checked }
                          }))
                        }
                        className="rounded"
                      />
                      <CheckSquare className="h-4 w-4" />
                      <span className="text-sm font-semibold">Toalete Publice</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      <Car className="inline h-4 w-4 mr-1" />
                      Parcare
                    </label>
                    <select
                      value={typeof formData.facilities?.parking === 'string' ? formData.facilities.parking : ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          facilities: { ...prev.facilities, parking: e.target.value as any }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
                    >
                      <option value="">Selectează opțiune</option>
                      <option value="None">Fără parcare</option>
                      <option value="Free">Parcare gratuită</option>
                      <option value="Paid">Parcare cu plată</option>
                    </select>
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
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      Oraș *
                    </label>
                    <CitySelect
                      value={formData.city_id}
                      onChange={(cityId) => {
                        setFormData((prev) => ({ ...prev, city_id: cityId }))
                        setErrors({})
                      }}
                      error={errors.city_id}
                    />
                  </div>

                  {/* Interactive Map */}
                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      Indică Locația pe Hartă *
                    </label>
                    <div className="h-64 md:h-96 rounded-xl overflow-hidden border-2 border-slate-200">
                      <Map
                        initialViewState={{
                          latitude: initialMapCenter.lat,
                          longitude: initialMapCenter.lng,
                          zoom: 13
                        }}
                        onClick={handleMapClick}
                        onLoad={() => setMapLoaded(true)}
                        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                        mapLib={import('maplibre-gl') as any}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {formData.latitude && formData.longitude && (
                          <Marker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            draggable
                            onDragEnd={(event) => {
                              setFormData(prev => ({
                                ...prev,
                                latitude: event.lngLat.lat,
                                longitude: event.lngLat.lng
                              }))
                            }}
                          >
                            <div className="relative">
                              <MapPin className="h-8 w-8 text-blue-600 fill-blue-600" />
                            </div>
                          </Marker>
                        )}
                        <NavigationControl position="top-right" />
                      </Map>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Apasă pe hartă sau trage pin-ul pentru a seta locația business-ului tău
                    </p>
                  </div>

                  {/* Address Line */}
                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      Adresă (Opțional)
                    </label>
                    <input
                      type="text"
                      value={formData.address_line}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address_line: e.target.value }))
                      }
                      placeholder="e.g., Strada Principală 123"
                      className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 transition-all"
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
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Detalii Specifice Business
                  </h2>
                  <p className="text-slate-600">
                    Adaugă informații specifice pentru business-ul tău de tip {BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label || formData.category}
                  </p>
                </div>

                {/* Hotel Configuration */}
                {formData.category === 'Hotel' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            )}
                          >
                            <Star className={cn(
                              "h-6 w-6",
                              formData.star_rating && formData.star_rating >= stars
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            )} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Ora Check-in
                        </label>
                        <input
                          type="time"
                          value={formData.check_in_time || "15:00"}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, check_in_time: e.target.value }))
                          }
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Ora Check-out
                        </label>
                        <input
                          type="time"
                          value={formData.check_out_time || "11:00"}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, check_out_time: e.target.value }))
                          }
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Facilități
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {AMENITIES_OPTIONS.map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 cursor-pointer">
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
                              className="rounded"
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
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Tip Bucătărie
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CUISINE_OPTIONS.map((cuisine) => (
                          <label key={cuisine} className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 cursor-pointer">
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
                              className="rounded"
                            />
                            <span className="text-sm">{cuisine}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 hover:border-blue-300"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accepts_reservations || false}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, accepts_reservations: e.target.checked }))
                          }
                          className="rounded"
                        />
                        <span className="text-sm font-semibold">Acceptă Rezervări</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Cafe Configuration */}
                {formData.category === 'Cafe' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Specialitate
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Specialty Coffee', 'To Go', 'Brunch', 'Co-working friendly'].map((spec) => (
                          <label key={spec} className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.specialty?.includes(spec) || false}
                              onChange={(e) => {
                                const current = Array.isArray(formData.specialty) ? formData.specialty : (formData.specialty ? [formData.specialty] : [])
                                setFormData(prev => ({
                                  ...prev,
                                  specialty: e.target.checked
                                    ? [...current, spec].join(', ')
                                    : current.filter((s: string) => s !== spec).join(', ')
                                }))
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
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
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 hover:border-blue-300"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Link Meniu (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.menu_url || ""}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, menu_url: e.target.value }))
                        }
                        placeholder="https://example.com/menu.pdf"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                )}

                {/* Nature/Hiking Configuration */}
                {formData.category === 'Nature' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Nivel Dificultate
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['Easy', 'Moderate', 'Hard', 'Expert'] as const).map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, difficulty: diff }))}
                            className={cn(
                              "px-4 py-3 rounded-xl border-2 font-semibold transition-all",
                              formData.difficulty === diff
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 hover:border-blue-300"
                            )}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                          Lungime (km)
                        </label>
                        <input
                          type="number"
                          value={formData.length_km || ""}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, length_km: parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="5.2"
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                          Elevație (m)
                        </label>
                        <input
                          type="number"
                          value={formData.elevation_gain_m || ""}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, elevation_gain_m: parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="500"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                          Durată (ore)
                        </label>
                        <input
                          type="number"
                          value={formData.estimated_duration_hours || ""}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, estimated_duration_hours: parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="3.5"
                          min="0"
                          step="0.5"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Condiții Traseu (Opțional)
                      </label>
                      <textarea
                        value={formData.trail_conditions || ""}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, trail_conditions: e.target.value }))
                        }
                        placeholder="Starea actuală a traseului, avertismente, etc."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Spa Configuration */}
                {formData.category === 'Spa' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                        Servicii Spa
                      </label>
                      <p className="text-sm text-slate-600 mb-4">
                        Adaugă serviciile oferite cu prețuri (ex: Masaj Relaxare - 150 RON, 60 min)
                      </p>
                      <div className="space-y-3">
                        {(formData.spa_services || []).map((service, index) => (
                          <div key={index} className="p-4 border-2 border-slate-200 rounded-xl space-y-3">
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
                                className="px-4 py-2 rounded-lg border-2 border-slate-200"
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
                                className="px-4 py-2 rounded-lg border-2 border-slate-200"
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
                                className="px-4 py-2 rounded-lg border-2 border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newServices = (formData.spa_services || []).filter((_, i) => i !== index)
                                  setFormData(prev => ({ ...prev, spa_services: newServices }))
                                }}
                                className="px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50"
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600"
                        >
                          + Adaugă Serviciu
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Categories - Generic Message */}
                {!['Hotel', 'Restaurant', 'Cafe', 'Nature', 'Spa'].includes(formData.category) && formData.category && (
                  <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      Câmpurile specifice pentru categoria <strong>{BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label}</strong> vor fi implementate în curând.
                      Poți continua cu pașii următori pentru a finaliza înregistrarea business-ului.
                    </p>
                  </div>
                )}

                {/* No Category Selected */}
                {!formData.category && (
                  <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      Te rugăm să selectezi o categorie în pasul anterior pentru a vedea câmpurile specifice.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Media Gallery */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <ImageIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Adaugă Fotografii
                  </h2>
                  <p className="text-slate-600">
                    Prezintă business-ul tău cu imagini frumoase
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Primary Image */}
                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      URL Imagine Principală *
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                        if (errors.image_url) setErrors({ ...errors, image_url: "" })
                      }}
                      placeholder="https://example.com/image.jpg"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 transition-all",
                        errors.image_url
                          ? "border-red-300 bg-red-50 focus:border-red-500"
                          : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      )}
                    />
                    {errors.image_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.image_url}</p>
                    )}
                    {formData.image_url && (
                      <div className="mt-3">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Images */}
                  <div>
                    <label className="block text-sm font-semibold text-airbnb-dark mb-2">
                      Imagini Adiționale (Opțional)
                    </label>
                    <div className="space-y-3">
                      {formData.image_urls.map((url, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.image_urls]
                              newUrls[index] = e.target.value
                              setFormData(prev => ({ ...prev, image_urls: newUrls }))
                            }}
                            placeholder="https://example.com/image2.jpg"
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                image_urls: prev.image_urls.filter((_, i) => i !== index)
                              }))
                            }}
                            className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {formData.image_urls.length < 9 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              image_urls: [...prev.image_urls, ""]
                            }))
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all"
                        >
                          + Adaugă Altă Imagine
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Poți adăuga până la 10 imagini în total (1 principală + 9 adiționale)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Revizuire & Finalizare
                  </h2>
                  <p className="text-slate-600">
                    Revizuiește informațiile înainte de a crea business-ul
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Informații Business</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Nume:</span>
                        <span className="font-semibold text-slate-900">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Categorie:</span>
                        <span className="font-semibold text-slate-900">
                          {BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label}
                        </span>
                      </div>
                      {formData.description && (
                        <div>
                          <span className="text-slate-600">Descriere:</span>
                          <p className="text-slate-900 mt-1">{formData.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Locație</h3>
                    <div className="space-y-2 text-sm">
                      {formData.address_line && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Adresă:</span>
                          <span className="font-semibold text-slate-900">{formData.address_line}</span>
                        </div>
                      )}
                      {formData.latitude && formData.longitude && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Coordonate:</span>
                          <span className="font-semibold text-slate-900">
                            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.category === 'Hotel' && formData.star_rating && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Detalii Hotel</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Clasificare Stele:</span>
                          <span className="font-semibold text-slate-900">{formData.star_rating} stele</span>
                        </div>
                        {formData.check_in_time && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Check-in:</span>
                            <span className="font-semibold text-slate-900">{formData.check_in_time}</span>
                          </div>
                        )}
                        {formData.check_out_time && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Check-out:</span>
                            <span className="font-semibold text-slate-900">{formData.check_out_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.image_url && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Imagine Principală</h3>
                      <img
                        src={formData.image_url}
                        alt="Business preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Server Error */}
          {serverError && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isPending}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                step === 1 || isPending
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuă
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      </div>
    </div>
  )
}
