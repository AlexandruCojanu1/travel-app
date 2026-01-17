"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, ArrowRight, ArrowLeft, MapPin, Check, Plus, ThumbsUp, ChevronLeft, Search, Users, Minus, Car, Bus, Train, User } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'
import { useTripStore } from '@/store/trip-store'
import { useVacationStore } from '@/store/vacation-store'
import { useAppStore } from '@/store/app-store'
import { getActiveCities } from '@/services/auth/city.service'
import { cn } from '@/lib/utils'

interface CreateTripDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

const preferences = [
  { id: 'popular', label: 'Populare', emoji: '📌' },
  { id: 'museum', label: 'Muzee', emoji: '🏛️' },
  { id: 'nature', label: 'Natură', emoji: '🌿' },
  { id: 'foodie', label: 'Gastronomie', emoji: '🍕' },
  { id: 'history', label: 'Istorie', emoji: '📜' },
  { id: 'shopping', label: 'Cumpărături', emoji: '🛍️' },
]

const protagonistOptions = [
  { id: 'solo', label: 'Solo', icon: User, description: 'Doar eu și lumea' },
  { id: 'couple', label: 'Cuplu', icon: Users, description: 'O escapadă romantică' },
  { id: 'family', label: 'Familie', icon: Users, description: 'Distracție pentru toți' },
  { id: 'friends', label: 'Prieteni', icon: Users, description: 'Grup de aventurieri' },
]

const mobilityOptions = [
  { id: 'car_personal', label: 'Mașină Personală', icon: Car },
  { id: 'car_rental', label: 'Mașină Închiriată', icon: Car },
  { id: 'public_transport', label: 'Transport Public', icon: Bus },
  { id: 'rideshare', label: 'Ridesharing / Taxi', icon: Car },
]

export function CreateTripDialog({
  isOpen,
  onOpenChange,
}: CreateTripDialogProps) {
  const { currentCity } = useAppStore()
  const { initTrip, syncToDatabase } = useTripStore()
  const { loadVacations, selectVacation } = useVacationStore()

  const [step, setStep] = useState<Step>(1)
  const [searchTerm, setSearchTerm] = useState('')
  // Date state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })

  // Travelers state
  const [travelers, setTravelers] = useState(2)
  const [protagonist, setProtagonist] = useState<string>('couple')

  // Mobility
  const [mobility, setMobility] = useState<string>('car_personal')

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [budget, setBudget] = useState([2000])

  const [selectedCity, setSelectedCity] = useState(currentCity)
  const [cities, setCities] = useState<Array<{ id: string; name: string; country: string }>>([])

  useEffect(() => {
    getActiveCities().then((data) => {
      setCities(data.map((c) => ({ id: c.id, name: c.name, country: c.country })))
    })
  }, [])

  useEffect(() => {
    if (currentCity) setSelectedCity(currentCity)
  }, [currentCity])

  // Update budget based on travelers when travelers limit changes (simple heuristic)
  useEffect(() => {
    const basePerPerson = 1000
    setBudget([basePerPerson * travelers])
  }, [travelers])

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleNext = () => {
    if (step < 6) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleFinish = async () => {
    if (!selectedCity) return

    initTrip(
      {
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        startDate,
        endDate,
        title: selectedCity.name,
        guests: travelers,
        metadata: {
          protagonist,
          mobility,
          preferences: selectedPrefs
        }
      },
      {
        total: budget[0],
        currency: 'RON',
      },
      null
    )

    await syncToDatabase()

    // Refresh vacations list so the new one appears
    await loadVacations()

    // Select the newly created trip
    const state = useTripStore.getState()
    if (state.tripId) {
      selectVacation(state.tripId)
    }

    setStep(1)
    onOpenChange(false)
  }

  const togglePref = (id: string) => {
    setSelectedPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[40px] border-none shadow-2xl h-[85vh] md:h-[700px] max-h-[90vh] flex flex-col bg-white">
        <DialogTitle className="sr-only">Creează Călătorie nouă</DialogTitle>
        <DialogDescription className="sr-only">Formular interactiv pentru planificarea vacanței tale.</DialogDescription>
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 1: DESTINATION (Wheel Selector) */}
            {step === 1 && (
              <DestinationStep
                cities={cities}
                onSelect={(city) => {
                  setSelectedCity({
                    id: city.id,
                    name: city.name,
                    country: city.country,
                    // @ts-ignore
                    state_province: null,
                    latitude: 0,
                    longitude: 0,
                    is_active: true,
                    created_at: '',
                  })
                  handleNext()
                }}
                onClose={() => onOpenChange(false)}
              />
            )}

            {/* STEP 2: DATES (Range) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-0 flex flex-col"
                style={{ background: 'linear-gradient(180deg, #E5E9FF 0%, #FFFFFF 100%)' }}
              >
                <div className="p-8 pb-0">
                  <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-8 pt-4 pb-0 space-y-1">
                  <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Când plecăm?</h2>
                  <p className="text-gray-600 text-lg font-medium">Alege perioada călătoriei</p>
                </div>

                <div className="flex-1 px-8 flex flex-col items-center justify-center space-y-8">
                  {/* Start Date */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Data sosirii</label>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white shadow-lg p-1 group focus-within:border-mova-blue transition-colors">
                      <div className="flex items-center px-4 py-3 gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-mova-blue" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Data plecării</label>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white shadow-lg p-1 group focus-within:border-mova-blue transition-colors">
                      <div className="flex items-center px-4 py-3 gap-3">
                        <ArrowRight className="h-5 w-5 text-gray-400 group-focus-within:text-mova-blue" />
                        <input
                          type="date"
                          min={startDate}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duration Display */}
                  <div className="py-4 px-6 bg-white/50 rounded-2xl border border-white/50 shadow-sm">
                    <p className="text-center font-medium text-gray-600">
                      Durată: <span className="text-mova-dark font-bold text-lg">
                        {Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))} nopți
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-8">
                  <Button
                    onClick={handleNext}
                    disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmă Perioada
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PROTAGONISTS (Type + Count) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-0 flex flex-col"
                style={{ background: 'linear-gradient(180deg, #FEF3C7 0%, #FFFFFF 100%)' }}
              >
                <div className="p-8 pb-0">
                  <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-8 pt-4 space-y-1">
                  <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Cine sunteți?</h2>
                  <p className="text-gray-500 text-lg font-medium">Cu cine călătorești această dată?</p>
                </div>

                <div className="flex-1 px-8 py-6 flex flex-col space-y-8 min-h-0 overflow-y-auto">
                  {/* Protagonist Type */}
                  <div className="grid grid-cols-2 gap-3">
                    {protagonistOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setProtagonist(opt.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 text-center",
                          protagonist === opt.id
                            ? "border-yellow-500 bg-yellow-50 shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                          protagonist === opt.id ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                        )}>
                          <opt.icon className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-sm text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-gray-400 font-medium leading-tight">{opt.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Count */}
                  <div className="bg-white/50 p-6 rounded-[32px] border border-white/50 space-y-4">
                    <p className="text-center font-bold text-gray-500 uppercase text-xs tracking-wider">Câte persoane</p>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-all text-gray-600"
                      >
                        <Minus className="h-6 w-6" />
                      </button>
                      <span className="text-5xl font-black text-foreground w-16 text-center">{travelers}</span>
                      <button
                        onClick={() => setTravelers(Math.min(10, travelers + 1))}
                        className="w-14 h-14 rounded-full bg-black shadow-lg flex items-center justify-center active:scale-95 transition-all text-white"
                      >
                        <Plus className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <Button
                    onClick={handleNext}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl"
                  >
                    Confirmă
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: MOBILITY */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-0 flex flex-col"
                style={{ background: 'linear-gradient(180deg, #E0F2FE 0%, #FFFFFF 100%)' }}
              >
                <div className="p-8 pb-0">
                  <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-8 pt-4 space-y-1">
                  <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Logistică</h2>
                  <p className="text-gray-500 text-lg font-medium">Cum vă veți deplasa?</p>
                </div>

                <div className="flex-1 px-8 py-6 space-y-4 min-h-0 overflow-y-auto">
                  {mobilityOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setMobility(opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-[24px] border-2 transition-all",
                        mobility === opt.id
                          ? "border-sky-500 bg-sky-50 shadow-sm"
                          : "border-gray-50 hover:border-gray-100 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl",
                          mobility === opt.id ? "bg-sky-100 text-sky-700" : "bg-gray-50 text-gray-400"
                        )}>
                          <opt.icon className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg text-foreground">{opt.label}</span>
                      </div>
                      {mobility === opt.id && (
                        <div className="h-6 w-6 bg-sky-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <Button
                    onClick={handleNext}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl"
                  >
                    Confirmă
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PREFERENCES */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-0 flex flex-col"
                style={{ background: 'linear-gradient(180deg, #A2D9FF 0%, #FFFFFF 100%)' }}
              >
                <div className="p-8">
                  <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 px-8 space-y-8 min-h-0 overflow-y-auto">
                  <div className="h-16 w-16 bg-[#BBE5FC] rounded-3xl flex items-center justify-center text-3xl shadow-sm shrink-0">
                    <ThumbsUp className="h-8 w-8 text-primary" />
                  </div>

                  <div className="space-y-4 shrink-0">
                    <h2 className="text-5xl font-bold tracking-tighter text-foreground leading-[0.9]">Preferințe</h2>
                    <p className="text-gray-500 text-xl font-medium">Ce te interesează la această călătorie?</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pb-8">
                    {preferences.map((pref) => (
                      <button
                        key={pref.id}
                        onClick={() => togglePref(pref.id)}
                        className={cn(
                          "px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-sm border-2",
                          selectedPrefs.includes(pref.id)
                            ? "bg-white border-primary text-foreground scale-105"
                            : "bg-white border-white hover:border-gray-100 text-gray-500"
                        )}
                      >
                        <span>{pref.emoji}</span>
                        {pref.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 shrink-0">
                  <Button
                    onClick={handleNext}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl flex items-center justify-center gap-2"
                  >
                    <Check className="h-6 w-6" />
                    Continuă
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: BUDGET (Final) */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-8 space-y-12 flex flex-col bg-white"
              >
                <div className="flex items-center gap-4">
                  <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-4xl font-bold tracking-tight text-foreground">Aproape gata!</h2>
                  <p className="text-gray-500 text-lg">Care este bugetul total estimat?</p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-12 min-h-0">
                  <div className="text-center space-y-2">
                    <p className="text-6xl font-black tracking-tighter text-primary">
                      {budget[0].toLocaleString()} <span className="text-3xl text-gray-400">RON</span>
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      ~{(budget[0] / travelers).toFixed(0)} RON / persoană
                    </p>
                  </div>

                  <div className="px-4">
                    <Slider
                      value={budget}
                      onValueChange={setBudget}
                      min={500 * travelers} // Adjusted min based on travelers
                      max={20000 * travelers} // Adjusted max
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-4 text-sm font-bold text-gray-400">
                      <span>{(500 * travelers).toLocaleString()} RON</span>
                      <span>{(20000 * travelers).toLocaleString()} RON</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFinish}
                  className="w-full h-16 bg-primary text-white hover:bg-primary/90 rounded-full text-xl font-bold shadow-xl shrink-0"
                >
                  Creează Călătoria
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ITEM_HEIGHT = 80
const CIRCLE_RADIUS = 400 // For X offset calculation
const MAX_ANGLE = 50 // Much more rotation like Paris

function DestinationStep({
  cities,
  onSelect,
  onClose
}: {
  cities: any[],
  onSelect: (city: any) => void,
  onClose: () => void
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = React.useState(600)

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const spacerHeight = (containerHeight / 2) - (ITEM_HEIGHT / 2)

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#1e2328] text-white overflow-hidden rounded-[40px]"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Circle Arc - Small and tight around center like Paris */}
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full border border-white/20 pointer-events-none z-0"
        style={{
          width: 200,
          height: 200,
          left: -100, // Right edge at center item
        }}
      />

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Spacer to push first item to center */}
        <div style={{ height: spacerHeight }} />

        <div className="flex flex-col">
          {cities.map((city, i) => (
            <CityItem
              key={city.id}
              city={city}
              containerRef={containerRef}
              index={i}
              spacerHeight={spacerHeight}
              onClick={() => onSelect(city)}
            />
          ))}
        </div>

        {/* Spacer to allow last item to reach center */}
        <div style={{ height: spacerHeight }} />
      </div>

      {/* Scroll Indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-20 bg-white/10 rounded-full overflow-hidden">
        <div className="w-full h-6 bg-white/50 rounded-full" />
      </div>
    </motion.div>
  )
}

function CityItem({ city, containerRef, index, spacerHeight, onClick }: {
  city: any,
  containerRef: React.RefObject<HTMLDivElement>,
  index: number,
  spacerHeight: number,
  onClick: () => void
}) {
  const { scrollY } = useScroll({ container: containerRef, layoutEffect: false })

  // Calculate distance from center of viewport (in pixels)
  // Account for the spacer that pushes items down
  const distanceFromCenter = useTransform(scrollY, (value) => {
    const container = containerRef.current
    if (!container) return 0

    const viewportHeight = container.clientHeight
    const centerY = viewportHeight / 2
    const scrollTop = value
    // Item position = spacer + (index * height) + half item height
    const itemCenter = spacerHeight + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - scrollTop

    return itemCenter - centerY
  })

  // Normalize to -1 to 1 range
  const normalized = useTransform(distanceFromCenter, (d) => {
    const maxDist = 400 // Even more gradual transition
    return Math.max(-1, Math.min(1, d / maxDist))
  })

  // RotateZ: Text follows the arc tangent
  // In CSS: positive rotation = clockwise, negative = counterclockwise
  // Top items (negative normalized) should tilt counterclockwise (negative angle) - like /
  // Bottom items (positive normalized) should tilt clockwise (positive angle) - like \
  const rotateZ = useTransform(normalized, [-1, 0, 1], [-MAX_ANGLE, 0, MAX_ANGLE])

  // X offset: Items curve LEFT as they move away from center (arc effect)
  // Using arc formula: offset = R - R*cos(θ) where θ is based on normalized position
  const xOffset = useTransform(normalized, (n) => {
    const angle = n * (MAX_ANGLE * Math.PI / 180)
    const arcOffset = CIRCLE_RADIUS * (1 - Math.cos(angle))
    return -arcOffset // Negative to move left
  })

  // Distance from center (0 to 1) for scale/opacity
  const absNormalized = useTransform(normalized, (n) => Math.abs(n))

  // Scale: 1.1 at center, 0.4 at edges (center MUCH bigger)
  const scale = useTransform(absNormalized, [0, 0.3, 1], [1.1, 0.7, 0.4])

  // Opacity: 1 at center, 0.15 at edges (sharper falloff)
  const opacity = useTransform(absNormalized, [0, 0.3, 1], [1, 0.5, 0.15])

  // Color: white at center, gray at edges
  const color = useTransform(absNormalized, [0, 0.3, 1], ["#ffffff", "#9ca3af", "#4b5563"])

  // Font weight: bold at center, normal at edges
  const fontWeight = useTransform(absNormalized, [0, 0.3, 1], [700, 500, 400])

  return (
    <motion.div
      onClick={onClick}
      style={{
        height: ITEM_HEIGHT,
        scale,
        opacity,
        rotate: rotateZ,
        x: xOffset,
        transformOrigin: "left center", // Pivot from left edge
      }}
      className="flex items-center snap-center cursor-pointer pl-[100px]"
    >
      <motion.span
        className="font-serif text-[1.7rem] uppercase tracking-widest whitespace-nowrap"
        style={{ color, fontWeight }}
      >
        {city.name}
      </motion.span>
    </motion.div>
  )
}
