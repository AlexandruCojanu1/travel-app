"use client"

import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/shared/ui/dialog'
import { useTripStore } from '@/store/trip-store'
import { useVacationStore } from '@/store/vacation-store'
import { useAppStore } from '@/store/app-store'
import { getActiveCities } from '@/services/auth/city.service'
import { generateInviteLink } from '@/actions/trip/collaboration'
import { toast } from 'sonner'
import { CitySelector } from '@/components/features/create-trip/city-selector'
import { TripDateRangePicker } from '@/components/features/create-trip/trip-date-range-picker'
import { TripTypeSelector } from '@/components/features/create-trip/trip-type-selector'
import { MobilitySelector } from '@/components/features/create-trip/mobility-selector'
import { PreferencesSelector } from '@/components/features/create-trip/preferences-selector'
import { BudgetEstimator } from '@/components/features/create-trip/budget-estimator'
import { TripInviteStep } from '@/components/features/create-trip/trip-invite-step'

interface CreateTripDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function CreateTripDialog({
  isOpen,
  onOpenChange,
}: CreateTripDialogProps) {
  const { currentCity } = useAppStore()
  const { initTrip, syncToDatabase } = useTripStore()
  const { loadVacations, selectVacation } = useVacationStore()

  const [step, setStep] = useState<Step>(1)

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

  // Invite Step State
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

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
    await loadVacations()

    const state = useTripStore.getState()
    if (state.tripId) {
      selectVacation(state.tripId)
    }

    if (travelers > 1 && state.tripId) {
      setStep(7)
      setIsGeneratingLink(true)
      try {
        const result = await generateInviteLink(state.tripId)
        if (result.success && result.token) {
          setInviteToken(result.token)
        } else {
          toast.error("Nu s-a putut genera link-ul de invitație.")
        }
      } catch (e: any) {
        console.error(e)
        toast.error("A apărut o eroare la generarea invitației. Încearcă din nou.")
      } finally {
        setIsGeneratingLink(false)
      }
    } else {
      setStep(1)
      onOpenChange(false)
    }
  }

  const handleCloseFinal = () => {
    setStep(1)
    onOpenChange(false)
    setInviteToken(null)
  }

  const togglePref = (id: string) => {
    setSelectedPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // Handle city selection
  const handleCitySelect = (city: any) => {
    setSelectedCity({
      id: city.id,
      name: city.name,
      country: city.country,
      // @ts-ignore - keeping minimal properties needed
      state_province: null,
      latitude: 0,
      longitude: 0,
      is_active: true,
      created_at: '',
    })
    handleNext()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[40px] border-none shadow-2xl h-[85vh] md:h-[700px] max-h-[90vh] flex flex-col bg-white">
        <DialogTitle className="sr-only">Creează Călătorie nouă</DialogTitle>
        <DialogDescription className="sr-only">Formular interactiv pentru planificarea vacanței tale.</DialogDescription>
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 1: DESTINATION */}
            {step === 1 && (
              <CitySelector
                cities={cities}
                onSelect={handleCitySelect}
                onClose={() => onOpenChange(false)}
              />
            )}

            {/* STEP 2: DATES */}
            {step === 2 && (
              <TripDateRangePicker
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* STEP 3: PROTAGONISTS */}
            {step === 3 && (
              <TripTypeSelector
                protagonist={protagonist}
                setProtagonist={setProtagonist}
                travelers={travelers}
                setTravelers={setTravelers}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* STEP 4: MOBILITY */}
            {step === 4 && (
              <MobilitySelector
                mobility={mobility}
                setMobility={setMobility}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* STEP 5: PREFERENCES */}
            {step === 5 && (
              <PreferencesSelector
                selectedPrefs={selectedPrefs}
                togglePref={togglePref}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {/* STEP 6: BUDGET */}
            {step === 6 && (
              <BudgetEstimator
                budget={budget}
                setBudget={setBudget}
                travelers={travelers}
                onFinish={handleFinish}
                onBack={handleBack}
              />
            )}

            {/* STEP 7: INVITE */}
            {step === 7 && (
              <TripInviteStep
                travelers={travelers}
                isGeneratingLink={isGeneratingLink}
                inviteToken={inviteToken}
                onClose={handleCloseFinal}
              />
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
