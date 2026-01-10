"use client"

import { CitySelect } from "@/components/features/auth/city-select"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { businessSchema } from "@/lib/validations/business"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Baby,
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
import { ImageUpload } from "@/components/features/business/image-upload"
import { toast } from "sonner"

const CATEGORY_GROUPS = [
  {
    title: "FOOD & DRINKS (Horeca)",
    description: "Se adresează nevoilor zilnice de nutriție și socializare.",
    categories: [
      { value: 'Restaurant', label: 'Restaurant', icon: '🍽️', description: 'Italian, Tradițional, Fast Food, Fine Dining' },
      { value: 'Cafe', label: 'Cafenele & Ceainării', icon: '☕', description: 'Specialty Coffee, To go, Locuri de studiu' },
      { value: 'Bakery', label: 'Brutării & Patiserii', icon: '🥐', description: 'Gustări rapide, Micul dejun' },
      { value: 'Nightlife', label: 'Nightlife', icon: '🍸', description: 'Baruri, Cluburi, Pub-uri' },
      { value: 'Dessert', label: 'Gelaterii & Deserturi', icon: '🍦', description: 'Înghețată, dulciuri' },
    ]
  },
  {
    title: "CAZARE (Hospitality)",
    description: "Locurile unde turistul înnoptează.",
    categories: [
      { value: 'Hotel', label: 'Hoteluri', icon: '🏨', description: 'De la 1 la 5 stele' },
      { value: 'Apartment', label: 'Apartamente', icon: '🏠', description: 'Regim hotelier (Airbnb/Booking)' },
      { value: 'Guesthouse', label: 'Pensiuni & Guest Houses', icon: '🏡', description: 'Boutique, Agroturism' },
      { value: 'Hostel', label: 'Hosteluri', icon: '🛏️', description: 'Buget redus, tineret' },
      { value: 'Camping', label: 'Camping & Glamping', icon: '⛺', description: 'Pentru zonele naturale' },
      { value: 'Resort', label: 'Resort-uri', icon: '🏝️', description: 'All inclusive' },
    ]
  },
  {
    title: "TIMP LIBER & ATRACȚII",
    description: "Motivul principal pentru care oamenii vizitează orașul.",
    categories: [
      { value: 'Museum', label: 'Muzee & Artă', icon: '🏛️', description: 'Muzee, Galerii de Artă' },
      { value: 'Religious', label: 'Lăcașuri de Cult', icon: '⛪', description: 'Biserici, Mănăstiri, Sinagogi' },
      { value: 'Theater', label: 'Teatre & Spectacole', icon: '🎭', description: 'Teatru, Operă, Cinema' },
      { value: 'Event', label: 'Evenimente', icon: '🎪', description: 'Festivaluri, Târguri, Concerte' },
      { value: 'AmusementPark', label: 'Parcuri de Distracții', icon: '🎢', description: 'Aqua Parks, Zoo, Tematice' },
      { value: 'Spa', label: 'SPA & Wellness', icon: '🧘', description: 'Masaj, Piscine, Saune' },
      { value: 'Nature', label: 'Atracții Naturale', icon: '🏔️', description: 'Parcuri, Peșteri, Trasee' },
      { value: 'Sport', label: 'Sport & Activități', icon: '⚽', description: 'Fitness, Tenis, Bowling' },
      { value: 'Tour', label: 'Tururi & Experiențe', icon: '🗺️', description: 'Ghizi, Ateliere, Food tours' },
    ]
  },
  {
    title: "SHOPPING (Retail)",
    description: "De la suveniruri la necesități.",
    categories: [
      { value: 'Mall', label: 'Mall-uri', icon: '🏬', description: 'Centre Comerciale' },
      { value: 'Supermarket', label: 'Supermarket-uri', icon: '🛒', description: 'Apă, snacks, necesități' },
      { value: 'Souvenir', label: 'Suveniruri', icon: '🎁', description: 'Produse locale, cadouri' },
      { value: 'Fashion', label: 'Fashion & Haine', icon: '👗', description: 'Outlet-uri, Designeri' },
      { value: 'Electronics', label: 'Electronice & IT', icon: '📱', description: 'Cabluri, încărcătoare, foto' },
      { value: 'DutyFree', label: 'Duty Free', icon: '✈️', description: 'Aeroport sau graniță' },
    ]
  },
  {
    title: "SERVICII & LOGISTICĂ",
    description: "Infrastructura care face călătoria posibilă.",
    categories: [
      { value: 'RentACar', label: 'Rent-a-Car', icon: '🚗', description: 'Închirieri auto' },
      { value: 'RentBike', label: 'Închirieri Velo/Moto', icon: '🚲', description: 'Biciclete, Trotinete, Scutere' },
      { value: 'Taxi', label: 'Taxi / Ridesharing', icon: '🚕', description: 'Puncte de așteptare' },
      { value: 'Parking', label: 'Parcări', icon: '🅿️', description: 'Publice, Private' },
      { value: 'GasStation', label: 'Benzinării', icon: '⛽', description: 'Stații de alimentare' },
      { value: 'EVCharging', label: 'Stații EV', icon: '⚡', description: 'Încărcare electrică' },
      { value: 'CarService', label: 'Service Auto', icon: '🔧', description: 'Vulcanizare, Urgențe' },
      { value: 'CarWash', label: 'Spălătorii Auto', icon: '🚿', description: 'Cosmetică auto' },
      { value: 'Laundry', label: 'Spălătorii Haine', icon: '🧺', description: 'Self-service, Curățătorii' },
      { value: 'Beauty', label: 'Saloane & Frizerii', icon: '💇', description: 'Servicii rapide' },
      { value: 'Coworking', label: 'Coworking', icon: '💻', description: 'Hub-uri, Digital Nomads' },
      { value: 'Storage', label: 'Depozitare Bagaje', icon: '🧳', description: 'Luggage Storage' },
    ]
  },
  {
    title: "SIGURANȚĂ & FINANCIAR",
    description: "Categoria critică în caz de probleme.",
    categories: [
      { value: 'Hospital', label: 'Spitale & Clinici', icon: '🏥', description: 'Urgențe medicale' },
      { value: 'Pharmacy', label: 'Farmacii', icon: '💊', description: 'Medicamente, Non-Stop' },
      { value: 'Dentist', label: 'Stomatologie', icon: '🦷', description: 'Urgențe dentare' },
      { value: 'Vet', label: 'Veterinar', icon: '🐾', description: 'Clinici Pet friendly' },
      { value: 'ATM', label: 'Bancomate', icon: '🏧', description: 'Retragere numerar' },
      { value: 'Exchange', label: 'Schimb Valutar', icon: '💱', description: 'Exchange offices' },
      { value: 'Bank', label: 'Bănci', icon: '🏦', description: 'Sucursale fizice' },
      { value: 'Police', label: 'Poliție', icon: '👮', description: 'Secții, Poliție Turistică' },
      { value: 'Embassy', label: 'Ambasade', icon: '🏳️', description: 'Consulate, Diplomație' },
    ]
  }
] as const

const BUSINESS_CATEGORIES = CATEGORY_GROUPS.flatMap(group => group.categories) as any[]

type Step = 1 | 2 | 3 | 4 | 5
type BusinessCategory = string

export interface BusinessFormData {
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

  // Common Fields (New)
  parking_type?: 'private_free' | 'private_paid' | 'public_easy' | 'none'
  internet_access?: 'none' | 'basic' | 'high_speed'
  stroller_friendly?: boolean

  // Horeca Specific Fields (New)
  price_category?: '$' | '$$' | '$$$' | '$$$$'
  average_bill?: number
  kids_menu?: boolean // Mandatory
  high_chairs?: boolean
  play_area?: boolean
  vegetarian_friendly?: boolean
  vegan_friendly?: boolean
  gluten_free_options?: boolean
  dedicated_restaurant?: boolean
  atmosphere?: string[]
  split_bill?: boolean
  solo_dining?: boolean

  // Step 3: Type-specific config (Legacy/Other)
  // Hotel
  star_rating?: number
  check_in_time?: string
  check_out_time?: string
  amenities?: string[]
  unit_type?: string
  hotel_amenities?: string[]
  smoking_allowed?: boolean
  children_policy?: string
  // Restaurant (Legacy - some overlap)
  cuisine_type?: string[]
  price_level?: '€' | '€€' | '€€€' | '€€€€' // To remove/ignore
  opening_hours?: Record<string, string>
  operating_hours?: {
    type?: '24/7' | 'daily' | 'weekdays' | 'by_appointment'
    schedule?: Record<string, string>
  }
  accepts_reservations?: boolean
  reservation_link?: string
  menu_url?: string
  dietary_tags?: string[] // Overlapped by new fields
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
  parking_type_legacy?: string // renamed to avoid conflict or reuse
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
  facilities?: Record<string, any> // Relaxed type for dynamic keys
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
                    Să începem cu elementele de bază
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
                  <div className="space-y-8 max-h-[600px] overflow-y-auto no-scrollbar pr-2 pb-4">
                    {CATEGORY_GROUPS.map((group) => (
                      <div key={group.title} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-800 text-lg">{group.title}</h3>
                          <p className="text-sm text-slate-500">{group.description}</p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.categories.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat.value }))
                                if (errors.category) setErrors({ ...errors, category: "" })
                              }}
                              className={cn(
                                "p-3 rounded-xl border-2 transition-all text-left flex flex-col h-full",
                                formData.category === cat.value
                                  ? "border-primary bg-white shadow-md ring-1 ring-primary/20"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                              )}
                            >
                              <div className="text-2xl mb-2">{cat.icon}</div>
                              <div className="font-semibold text-foreground text-sm leading-tight mb-1">{cat.label}</div>
                              <div className="text-[10px] text-muted-foreground leading-tight">{cat.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Descriere Detaliată *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Povestea locului, misiune, ce face business-ul tău special..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                {/* Contact Information */}
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
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
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

                {/* Visual Identity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Identitate Vizuală</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Logo URL (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.logo_url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                        }
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Cover Image URL (Opțional)
                      </label>
                      <input
                        type="url"
                        value={formData.cover_image_url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))
                        }
                        placeholder="https://example.com/cover.jpg"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Program de Funcționare</h3>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
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
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Orare Specifice
                      </label>
                      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day) => (
                        <div key={day} className="flex items-center gap-2">
                          <span className="w-24 text-sm text-foreground">{day}:</span>
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
                            className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* General Facilities */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Facilități Generale & Mobilitate</h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary/50">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.accepts_card || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, accepts_card: e.target.checked }
                          }))
                        }
                        className="rounded text-primary focus:ring-primary"
                      />
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-semibold">Acceptă Card</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary/50">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.wheelchair_accessible || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, wheelchair_accessible: e.target.checked }
                          }))
                        }
                        className="rounded text-primary focus:ring-primary"
                      />
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-semibold">Accesibil Scaun Rulant</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary/50">
                      <input
                        type="checkbox"
                        checked={formData.stroller_friendly || false}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, stroller_friendly: e.target.checked }))
                        }
                        className="rounded text-primary focus:ring-primary"
                      />
                      <Baby className="h-4 w-4" />
                      <span className="text-sm font-semibold">Accesibil Cărucior</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary/50">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.pet_friendly || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, pet_friendly: e.target.checked }
                          }))
                        }
                        className="rounded text-primary focus:ring-primary"
                      />
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-semibold">Pet Friendly</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary/50">
                      <input
                        type="checkbox"
                        checked={formData.facilities?.air_conditioning || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facilities: { ...prev.facilities, air_conditioning: e.target.checked }
                          }))
                        }
                        className="rounded text-primary focus:ring-primary"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Parking Type */}
                    <div>
                      <label className="block text-sm font-semibold text-mova-dark mb-2">
                        <Car className="inline h-4 w-4 mr-1" />
                        Tip Parcare
                      </label>
                      <select
                        value={formData.parking_type || "none"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            parking_type: e.target.value as any
                          }))
                        }
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-mova-blue focus:ring-2 focus:ring-mova-blue/20 transition-all"
                      >
                        <option value="none">Fără parcare (Zonă pietonală)</option>
                        <option value="private_free">Privată (Gratuită)</option>
                        <option value="private_paid">Privată (Cu plată)</option>
                        <option value="public_easy">Publică (Facilă la stradă)</option>
                      </select>
                    </div>

                    {/* Internet Access */}
                    <div>
                      <label className="block text-sm font-semibold text-mova-dark mb-2">
                        <Wifi className="inline h-4 w-4 mr-1" />
                        Conexiune Internet
                      </label>
                      <select
                        value={formData.internet_access || "none"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            internet_access: e.target.value as any
                          }))
                        }
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 bg-white focus:border-mova-blue focus:ring-2 focus:ring-mova-blue/20 transition-all"
                      >
                        <option value="none">Nu există</option>
                        <option value="basic">Basic (Email/Browsing)</option>
                        <option value="high_speed">High Speed (Streaming/Video Calls)</option>
                      </select>
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
                      error={errors.city_id}
                    />
                  </div>

                  {/* Interactive Map */}
                  <div>
                    <label className="block text-sm font-semibold text-mova-dark mb-2">
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

                {/* HORECA Common Configuration */}
                {['Restaurant', 'Cafe', 'Bakery', 'Nightlife', 'Dessert'].includes(formData.category) && (
                  <div className="space-y-8 mb-8">
                    {/* Price Section */}
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Buget & Prețuri
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-emerald-900 mb-2">
                            Categorie Preț (Medie/Persoană)
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                              { val: '$', label: 'Budget', range: '30-60 RON' },
                              { val: '$$', label: 'Mediu', range: '61-120 RON' },
                              { val: '$$$', label: 'Premium', range: '121-250 RON' },
                              { val: '$$$$', label: 'Luxury', range: '> 250 RON' }
                            ].map((price) => (
                              <button
                                key={price.val}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, price_category: price.val as any }))}
                                className={cn(
                                  "p-3 rounded-xl border-2 transition-all text-center",
                                  formData.price_category === price.val
                                    ? "border-emerald-600 bg-emerald-100 text-emerald-900 shadow-sm"
                                    : "border-white bg-white/50 hover:border-emerald-300"
                                )}
                              >
                                <div className="text-lg font-bold">{price.val}</div>
                                <div className="text-xs font-semibold">{price.label}</div>
                                <div className="text-[10px] opacity-70">{price.range}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-emerald-900 mb-2">
                            Bon Mediu Estimat (RON)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.average_bill || ""}
                              onChange={(e) => setFormData(prev => ({ ...prev, average_bill: parseFloat(e.target.value) || undefined }))}
                              placeholder="ex: 85"
                              className="w-full px-4 py-3 rounded-xl border-2 border-white bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all pl-12"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">RON</span>
                          </div>
                          <p className="text-xs text-emerald-700 mt-1">Valoarea medie a unui bon (mâncare + băutură)</p>
                        </div>
                      </div>
                    </div>

                    {/* Family Friendly */}
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                      <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Baby className="h-5 w-5" />
                        Familie & Copii
                      </h3>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-transparent hover:border-blue-200 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={formData.kids_menu || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, kids_menu: e.target.checked }))}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">Meniu Copii *</span>
                            <span className="text-xs text-slate-500">Aveți porții dedicate pentru cei mici?</span>
                          </div>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-transparent hover:border-blue-200 cursor-pointer transition-all">
                            <input
                              type="checkbox"
                              checked={formData.high_chairs || false}
                              onChange={(e) => setFormData(prev => ({ ...prev, high_chairs: e.target.checked }))}
                              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-semibold text-slate-900">Scaune Înalte</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-transparent hover:border-blue-200 cursor-pointer transition-all">
                            <input
                              type="checkbox"
                              checked={formData.play_area || false}
                              onChange={(e) => setFormData(prev => ({ ...prev, play_area: e.target.checked }))}
                              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-semibold text-slate-900">Loc de Joacă</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Diet & Nutrition */}
                    <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                      <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Dietă & Nutriție
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border cursor-pointer hover:border-green-300">
                          <input
                            type="checkbox"
                            checked={formData.vegetarian_friendly || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, vegetarian_friendly: e.target.checked }))}
                            className="rounded text-green-600"
                          />
                          <span className="font-semibold text-sm">Vegetarian Friendly</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border cursor-pointer hover:border-green-300">
                          <input
                            type="checkbox"
                            checked={formData.vegan_friendly || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, vegan_friendly: e.target.checked }))}
                            className="rounded text-green-600"
                          />
                          <span className="font-semibold text-sm">Vegan Friendly</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border cursor-pointer hover:border-green-300">
                          <input
                            type="checkbox"
                            checked={formData.gluten_free_options || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, gluten_free_options: e.target.checked }))}
                            className="rounded text-green-600"
                          />
                          <span className="font-semibold text-sm">Gluten Free Options</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white rounded-xl border cursor-pointer hover:border-green-300">
                          <input
                            type="checkbox"
                            checked={formData.dedicated_restaurant || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, dedicated_restaurant: e.target.checked }))}
                            className="rounded text-green-600"
                          />
                          <span className="font-semibold text-sm">Restaurant Dedicat (Veg/Vegan)</span>
                        </label>
                      </div>
                    </div>

                    {/* Vibe */}
                    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                      <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Atmosferă / Vibe
                        <span className="text-xs font-normal text-purple-600 ml-2">(Max 3)</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {['Romantic', 'Business', 'Vibrant', 'Chill', 'Tradițional', 'Instagrammable'].map((vibe) => (
                          <button
                            key={vibe}
                            type="button"
                            onClick={() => {
                              const current = formData.atmosphere || []
                              if (current.includes(vibe)) {
                                setFormData(prev => ({ ...prev, atmosphere: current.filter(v => v !== vibe) }))
                              } else if (current.length < 3) {
                                setFormData(prev => ({ ...prev, atmosphere: [...current, vibe] }))
                              }
                            }}
                            className={cn(
                              "px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all",
                              formData.atmosphere?.includes(vibe)
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white text-slate-600 border-purple-200 hover:border-purple-400"
                            )}
                          >
                            {vibe}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Social */}
                    <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                      <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Social & Payment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.split_bill || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, split_bill: e.target.checked }))}
                            className="rounded text-orange-600"
                          />
                          <span className="font-semibold text-slate-800">Split Bill Accepted</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.solo_dining || false}
                            onChange={(e) => setFormData(prev => ({ ...prev, solo_dining: e.target.checked }))}
                            className="rounded text-orange-600"
                          />
                          <span className="font-semibold text-slate-800">Solo Dining Friendly</span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}

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
                  </div>
                )}

                {/* Cafe Configuration */}
                {formData.category === 'Cafe' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Specialitate
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Specialty Coffee', 'To Go', 'Brunch', 'Co-working friendly'].map((spec) => (
                          <label key={spec} className="flex items-center gap-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer">
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
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{spec}</span>
                          </label>
                        ))}
                      </div>
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

                {/* Nature/Hiking Configuration */}
                {formData.category === 'Nature' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
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
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Condiții Traseu (Opțional)
                      </label>
                      <textarea
                        value={formData.trail_conditions || ""}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, trail_conditions: e.target.value }))
                        }
                        placeholder="Starea actuală a traseului, avertismente, etc."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>
                  </div>
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
                      <h2 className="text-3xl font-bold text-foreground mb-2">
                        Adaugă Fotografii
                      </h2>
                      <p className="text-muted-foreground">
                        O imagine face cât 1000 de cuvinte. Încarcă imagini de calitate.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Primary Image */}
                      <div>
                        <label className="block text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                          Imagine Principală (Cover) <span className="text-red-500">*</span>
                        </label>
                        <ImageUpload
                          value={formData.image_url}
                          onChange={(url) => {
                            setFormData((prev) => ({ ...prev, image_url: url }))
                          }}
                          onRemove={() => {
                            setFormData((prev) => ({ ...prev, image_url: "" }))
                          }}
                          bucket="business-media"
                          className="min-h-[300px]"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Aceasta este imaginea care va apărea prima pe cardul business-ului. Recomandăm format landscape (16:9).
                        </p>
                      </div>

                      {/* Gallery */}
                      <div>
                        <label className="block text-lg font-bold text-foreground mb-3">
                          Galerie Foto (Opțional)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {/* Existing + 1 Upload Slot Logic */}
                          {formData.image_urls.map((url, index) => (
                            <ImageUpload
                              key={url + index} // Use URL as key or consistent index
                              value={url}
                              onChange={(newUrl) => {
                                // Update existing slot (unused in upload flow usually, but handles replace)
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
                              bucket="business-media"
                              className="min-h-[150px]"
                            />
                          ))}

                          {/* Upload New Slot */}
                          {formData.image_urls.length < 9 && (
                            <ImageUpload
                              value=""
                              onChange={(newUrl) => {
                                setFormData(prev => ({
                                  ...prev,
                                  image_urls: [...prev.image_urls, newUrl]
                                }))
                              }}
                              onRemove={() => { }} // No-op for empty slot
                              bucket="business-media"
                              className="min-h-[150px]"
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Poți adăuga până la 10 fotografii în galerie.
                        </p>
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
                              {formData.description && (
                                <div>
                                  <span className="text-muted-foreground">Descriere:</span>
                                  <p className="text-foreground mt-1">{formData.description}</p>
                                </div>
                              )}
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
                )}
                    </AnimatePresence>

                    {/* Server Error */}
                    {serverError && (
                      <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
                        <p className="text-sm text-destructive">{serverError}</p>
                      </div>
                    )}

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

                      {step < 5 ? (
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
                  </motion.div>
      </div>
    </div>
          )
}

