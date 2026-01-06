"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, ArrowRight, ArrowLeft, MapPin, Check, Plus, ThumbsUp, ChevronLeft, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'
import { useTripStore } from '@/store/trip-store'
import { useAppStore } from '@/store/app-store'
import { getActiveCities } from '@/services/auth/city.service'
import { VerticalPicker } from '@/components/shared/ui/vertical-picker'
import { cn } from '@/lib/utils'

interface CreateTripDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3 | 4

const preferences = [
  { id: 'popular', label: 'Popular', emoji: '📌' },
  { id: 'museum', label: 'Museum', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'foodie', label: 'Foodie', emoji: '🍕' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
]

export function CreateTripDialog({
  isOpen,
  onOpenChange,
}: CreateTripDialogProps) {
  const { currentCity, openCitySelector } = useAppStore()
  const { initTrip, syncToDatabase } = useTripStore()

  const [step, setStep] = useState<Step>(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [duration, setDuration] = useState(7)
  const [isFlexible, setIsFlexible] = useState(true)
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [budget, setBudget] = useState([2000])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

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

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleFinish = async () => {
    if (!selectedCity) return

    const end = new Date(startDate)
    end.setDate(end.getDate() + duration)
    const endDate = end.toISOString().split('T')[0]

    initTrip(
      {
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        startDate,
        endDate,
        title: `Călătorie în ${selectedCity.name}`,
      },
      {
        total: budget[0],
        currency: 'RON',
      }
    )

    await syncToDatabase()
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
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: DESTINATION */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-8 space-y-6 flex flex-col bg-white"
              >
                <div className="flex items-center justify-between">
                  <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="text-4xl font-extrabold tracking-tighter text-mova-dark">Unde mergem?</h2>
                  <p className="text-gray-500 text-lg font-medium">Alege destinația visurilor tale</p>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mova-blue transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Caută destinații..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-mova-blue focus:bg-white rounded-[24px] outline-none transition-all font-medium text-lg"
                  />
                </div>

                <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4 min-h-0">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCity({
                            id: city.id,
                            name: city.name,
                            country: city.country,
                            state_province: null,
                            latitude: 0,
                            longitude: 0,
                            is_active: true,
                            created_at: '',
                          })
                          handleNext()
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-5 rounded-[28px] border-2 transition-all",
                          selectedCity?.id === city.id
                            ? "border-mova-blue bg-mova-blue/5 shadow-sm"
                            : "border-gray-50 hover:border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className={cn(
                            "p-3 rounded-2xl transition-colors",
                            selectedCity?.id === city.id ? "bg-mova-blue/10" : "bg-gray-50"
                          )}>
                            <MapPin className={cn(
                              "h-6 w-6",
                              selectedCity?.id === city.id ? "text-mova-blue" : "text-gray-400"
                            )} />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-mova-dark">{city.name}</p>
                            <p className="text-gray-500 text-sm font-medium">{city.country}</p>
                          </div>
                        </div>
                        {selectedCity?.id === city.id && (
                          <div className="h-7 w-7 bg-mova-blue rounded-full flex items-center justify-center shadow-lg shadow-mova-blue/20">
                            <Check className="h-4 w-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="p-6 bg-gray-50 rounded-full">
                        <Search className="h-10 w-10 text-gray-200" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold text-lg">Niciun rezultat</p>
                        <p className="text-gray-400 font-medium">Încearcă să cauți alt oraș sau țară.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DURATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-0 flex flex-col"
                style={{ background: 'linear-gradient(180deg, #99F2E6 0%, #FFFFFF 100%)' }}
              >
                <div className="p-8 flex items-center justify-between">
                  <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <div className="bg-white/80 backdrop-blur-md rounded-full p-1 flex gap-1 shadow-sm">
                    <button
                      onClick={() => setIsFlexible(false)}
                      className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", !isFlexible ? "bg-white shadow-sm text-black" : "text-gray-500")}
                    >
                      Dates
                    </button>
                    <button
                      onClick={() => setIsFlexible(true)}
                      className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", isFlexible ? "bg-white shadow-sm text-black" : "text-gray-500")}
                    >
                      Flexible
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-8 flex flex-col items-center justify-center text-center space-y-12">
                  <h2 className="text-5xl font-bold tracking-tighter text-mova-dark">Câte zile?</h2>

                  <VerticalPicker
                    value={duration}
                    onChange={setDuration}
                    className="w-full max-w-[200px]"
                  />
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

            {/* STEP 3: PREFERENCES */}
            {step === 3 && (
              <motion.div
                key="step3"
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
                    <ThumbsUp className="h-8 w-8 text-mova-blue" />
                  </div>

                  <div className="space-y-4 shrink-0">
                    <h2 className="text-5xl font-bold tracking-tighter text-mova-dark leading-[0.9]">Preferințe</h2>
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
                            ? "bg-white border-mova-blue text-mova-dark scale-105"
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

            {/* STEP 4: BUDGET */}
            {step === 4 && (
              <motion.div
                key="step4"
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
                  <h2 className="text-4xl font-bold tracking-tight text-mova-dark">Aproape gata!</h2>
                  <p className="text-gray-500 text-lg">Care este bugetul călătoriei tale?</p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-12 min-h-0">
                  <div className="text-center space-y-2">
                    <p className="text-6xl font-black tracking-tighter text-mova-blue">
                      {budget[0].toLocaleString()} <span className="text-3xl text-gray-400">RON</span>
                    </p>
                  </div>

                  <div className="px-4">
                    <Slider
                      value={budget}
                      onValueChange={setBudget}
                      min={500}
                      max={20000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-4 text-sm font-bold text-gray-400">
                      <span>500 RON</span>
                      <span>20.000 RON</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFinish}
                  className="w-full h-16 bg-mova-blue text-white hover:bg-mova-blue/90 rounded-full text-xl font-bold shadow-xl shrink-0"
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
