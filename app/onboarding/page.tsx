"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Car, Wallet, Utensils, Brain, ArrowRight, ArrowLeft, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { OnboardingState, INITIAL_STATE, ProtagonistType, MobilityType, BudgetPersona } from "./onboarding-data"
import { cn } from "@/lib/utils"
// Import CitySelect component - Assuming path exists based on previous files
import { CitySelect } from "@/components/features/auth/city-select"

// Icons mapping for visual flair
const STAGE_ICONS = {
  1: MapPin,
  2: Users,
  3: Car,
  4: Wallet,
  5: Utensils,
  6: Brain
}

export default function OnboardingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<OnboardingState>(INITIAL_STATE)
  const [currentStage, setCurrentStage] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Helper to update state
  const updateData = (updates: Partial<OnboardingState>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Navigation Logic
  const nextStage = () => {
    if (currentStage < 6) {
      setCurrentStage(prev => prev + 1)
    } else {
      finishOnboarding()
    }
  }

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(prev => prev - 1)
    }
  }

  const finishOnboarding = async () => {
    console.log("Finishing onboarding with data:", formData)

    // Determine Persona Name based on answers
    let personaName = "Urban Explorer"
    if (formData.budgetPersona === 'nomad') personaName = "Gastronomic Nomad"
    else if (formData.budgetPersona === 'comfort') personaName = "Comfort Seeker"
    else if (formData.budgetPersona === 'budget') personaName = "Ultra-Budget Hunter"
    else if (formData.adventurous > 70) personaName = "Adventurous Foodie"
    else if (formData.popularity > 70) personaName = "Hidden Gem Hunter"

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Save to profile
      // 1. Update Auth Metadata (Guaranteed to work without migration)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          onboarding_data: formData,
          persona: personaName,
          onboarding_completed: true,
          home_city_id: formData.homeCityId
        }
      })

      if (authError) console.error("Error saving auth metadata:", authError)

      // 2. Try to update Profile Table (Might fail if migration wasn't run)
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          home_city_id: formData.homeCityId,
          onboarding_data: formData as any,
          persona: personaName,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
      } catch (e) {
        console.warn("Profile table update failed (legacy schema?):", e)
      }
    }

    // Redirect
    router.push('/home')
  }

  // Render Functions for each Stage
  const renderStage = () => {
    switch (currentStage) {
      case 1: return <CityStage data={formData} update={updateData} />
      case 2: return <ProtagonistStage data={formData} update={updateData} />
      case 3: return <MobilityStage data={formData} update={updateData} />
      case 4: return <BudgetStage data={formData} update={updateData} />
      case 5: return <DietStage data={formData} update={updateData} />
      case 6: return <PsychographicsStage data={formData} update={updateData} />
      default: return null
    }
  }

  // Total stages
  const TOTAL_STAGES = 6

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-400">ETAPA {currentStage} DIN {TOTAL_STAGES}</span>
            <span className="text-xs font-bold text-slate-400">{Math.round((currentStage / TOTAL_STAGES) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStage / TOTAL_STAGES) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-6 md:p-10 min-h-[400px] flex flex-col"
        >
          {renderStage()}

          {/* Navigation Buttons */}
          <div className="mt-auto pt-8 flex justify-between items-center">
            {currentStage > 1 ? (
              <button
                onClick={prevStage}
                className="text-slate-500 font-medium hover:text-slate-800 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Înapoi
              </button>
            ) : <div />}

            <button
              onClick={nextStage}
              disabled={!canProceed(currentStage, formData)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {currentStage === TOTAL_STAGES ? 'Finalizează' : 'Continuă'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function canProceed(stage: number, data: OnboardingState): boolean {
  switch (stage) {
    case 1: return !!data.homeCityId
    case 2: return !!data.protagonist
    case 3: return !!data.mobility
    case 4: return !!data.budgetPersona
    case 5: return data.diet.length > 0
    case 6: return true
    default: return false
  }
}

// --- STAGE COMPONENTS ---

function CityStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Unde locuiești?</h2>
        <p className="text-slate-500">Selectează orașul tău pentru recomandări locale.</p>
      </div>

      <div className="max-w-md mx-auto">
        <CitySelect
          value={data.homeCityId}
          onChange={(cityId) => update({ homeCityId: cityId })}
        />
      </div>
    </div>
  )
}

function ProtagonistStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Cine sunt protagoniștii?</h2>
        <p className="text-slate-500">Spune-ne cu cine călătorești pentru a calibra atmosfera.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <OptionCard
          selected={data.protagonist === 'solo'}
          onClick={() => update({ protagonist: 'solo' })}
          title="Solo Traveler"
          desc="Doar eu și orașul"
        />
        <OptionCard
          selected={data.protagonist === 'couple'}
          onClick={() => update({ protagonist: 'couple' })}
          title="Cuplu"
          desc="Romantic & Relaxat"
        />
        <OptionCard
          selected={data.protagonist === 'family'}
          onClick={() => update({ protagonist: 'family' })}
          title="Familie"
          desc="Cu copii exploratori"
        />
        <OptionCard
          selected={data.protagonist === 'group'}
          onClick={() => update({ protagonist: 'group' })}
          title="Grup de Prieteni"
          desc="Fun & Social"
        />
      </div>

      {/* BRANCHING LOGIC */}
      <AnimatePresence>
        {data.protagonist === 'solo' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Care este starea ta de spirit?</p>
              <div className="flex gap-3">
                <ChoiceChip selected={data.soloMood === 'social'} onClick={() => update({ soloMood: 'social' })}>Socializare 🍻</ChoiceChip>
                <ChoiceChip selected={data.soloMood === 'quiet'} onClick={() => update({ soloMood: 'quiet' })}>Liniște 🧘</ChoiceChip>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-3">Confortabil să mănânci singur?</p>
              <div className="flex gap-3">
                <ChoiceChip selected={data.soloDining === 'low'} onClick={() => update({ soloDining: 'low' })}>Puțin (Quick bites)</ChoiceChip>
                <ChoiceChip selected={data.soloDining === 'high'} onClick={() => update({ soloDining: 'high' })}>Foarte (Fine dining)</ChoiceChip>
              </div>
            </div>
          </motion.div>
        )}

        {data.protagonist === 'family' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Vârsta copiilor? (Selectare multiplă)</p>
              <div className="flex flex-wrap gap-2">
                <ChoiceChip
                  selected={data.familyKids?.includes('0-4')}
                  onClick={() => toggleArray(data.familyKids || [], '0-4', (arr) => update({ familyKids: arr }))}
                >
                  Bebeluși (0-4)
                </ChoiceChip>
                <ChoiceChip
                  selected={data.familyKids?.includes('5-12')}
                  onClick={() => toggleArray(data.familyKids || [], '5-12', (arr) => update({ familyKids: arr }))}
                >
                  Școlari (5-12)
                </ChoiceChip>
                <ChoiceChip
                  selected={data.familyKids?.includes('13-18')}
                  onClick={() => toggleArray(data.familyKids || [], '13-18', (arr) => update({ familyKids: arr }))}
                >
                  Adolescenți (13-18)
                </ChoiceChip>
              </div>
            </div>
            {data.familyKids?.includes('0-4') && (
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={data.familyStroller} onChange={(e) => update({ familyStroller: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                <span className="text-slate-700">Acces cărucior necesar?</span>
              </label>
            )}
            {data.familyKids?.includes('13-18') && (
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={data.familyWifi} onChange={(e) => update({ familyWifi: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                <span className="text-slate-700">Wi-Fi & Instagrammable? (Important)</span>
              </label>
            )}
          </motion.div>
        )}

        {data.protagonist === 'group' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Cum gestionați nota?</p>
              <div className="flex gap-3">
                <ChoiceChip selected={data.groupBill === 'split'} onClick={() => update({ groupBill: 'split' })}>Împărțim egal (Sharing)</ChoiceChip>
                <ChoiceChip selected={data.groupBill === 'individual'} onClick={() => update({ groupBill: 'individual' })}>Individual</ChoiceChip>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-3">Vibe-ul principal?</p>
              <div className="flex gap-3">
                <ChoiceChip selected={data.groupVibe === 'party'} onClick={() => update({ groupVibe: 'party' })}>Petrecere 🕺</ChoiceChip>
                <ChoiceChip selected={data.groupVibe === 'talk'} onClick={() => update({ groupVibe: 'talk' })}>Discuții (Chill) 💬</ChoiceChip>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobilityStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Mobilitate & Logistică</h2>
        <p className="text-slate-500">Cum te deplasezi prin oraș?</p>
      </div>

      <div className="space-y-3">
        <OptionRow
          selected={data.mobility === 'car'}
          onClick={() => update({ mobility: 'car' })}
          title="Mașină personală / Închiriată"
        />
        <OptionRow
          selected={data.mobility === 'transit'}
          onClick={() => update({ mobility: 'transit' })}
          title="Uber / Bolt / Transport comun"
        />
        <OptionRow
          selected={data.mobility === 'transit_walk'}
          onClick={() => update({ mobility: 'transit_walk' })}
          title="Transport comun + Mers pe jos"
          desc="Flexibil și economic"
        />
        <OptionRow
          selected={data.mobility === 'walk'}
          onClick={() => update({ mobility: 'walk' })}
          title="Exclusiv pe jos"
        />
      </div>

      <AnimatePresence>
        {data.mobility === 'car' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Parcare la locație?</p>
              <div className="flex gap-3">
                <ChoiceChip selected={data.carParking === 'critical'} onClick={() => update({ carParking: 'critical' })}>Critică (Obligatoriu)</ChoiceChip>
                <ChoiceChip selected={data.carParking === 'flexible'} onClick={() => update({ carParking: 'flexible' })}>Mă descurc</ChoiceChip>
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={data.carDriver} onChange={(e) => update({ carDriver: e.target.checked })} className="w-5 h-5 text-purple-600 rounded" />
              <span className="text-slate-700">Avem șofer desemnat (non-alcool)?</span>
            </label>
          </motion.div>
        )}

        {(data.mobility === 'walk' || data.mobility === 'transit_walk') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Distanța maximă de mers?</p>
              <div className="flex gap-2">
                <ChoiceChip selected={data.walkDist === '500m'} onClick={() => update({ walkDist: '500m' })}>{'< 500m'}</ChoiceChip>
                <ChoiceChip selected={data.walkDist === '1.5km'} onClick={() => update({ walkDist: '1.5km' })}>1.5 km</ChoiceChip>
                <ChoiceChip selected={data.walkDist === '3km'} onClick={() => update({ walkDist: '3km' })}>3 km</ChoiceChip>
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={data.walkTradeoff} onChange={(e) => update({ walkTradeoff: e.target.checked })} className="w-5 h-5 text-purple-600 rounded" />
              <span className="text-slate-700">Aș merge dublu pentru o locație Top 5%?</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BudgetStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Matricea Bugetului</h2>
        <p className="text-slate-500">Care scenariu descrie cel mai bine prioritățile tale?</p>
      </div>

      <div className="space-y-3">
        <OptionRow
          selected={data.budgetPersona === 'nomad'}
          onClick={() => update({ budgetPersona: 'nomad' })}
          title="The Gastronomic Nomad"
          desc="Dorm ieftin, mănânc regește."
        />
        <OptionRow
          selected={data.budgetPersona === 'comfort'}
          onClick={() => update({ budgetPersona: 'comfort' })}
          title="The Comfort Seeker"
          desc="Hotel top, mâncare comodă."
        />
        <OptionRow
          selected={data.budgetPersona === 'balanced'}
          onClick={() => update({ budgetPersona: 'balanced' })}
          title="The Balanced Explorer"
          desc="Raport calitate-preț peste tot."
        />
        <OptionRow
          selected={data.budgetPersona === 'budget'}
          onClick={() => update({ budgetPersona: 'budget' })}
          title="The Ultra-Budget"
          desc="Minimalizez costurile peste tot."
        />
      </div>

      <div className="pt-6 border-t border-slate-100">
        <p className="font-bold text-slate-700 mb-3">Trade-off Adâncime</p>
        <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
          <input type="checkbox" checked={data.budgetPeriphery} onChange={(e) => update({ budgetPeriphery: e.target.checked })} className="w-5 h-5 mt-1 text-green-600 rounded" />
          <span className="text-slate-700 text-sm">Ești OK să stai la periferie dacă ajungi ușor la mâncare bună în centru?</span>
        </label>
      </div>
    </div>
  )
}

function DietStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Dietă & Restricții</h2>
        <p className="text-slate-500">Există preferințe alimentare speciale?</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {['Omnivor', 'Vegetarian', 'Vegan', 'Fără Gluten', 'Fără Lactoză', 'Pescatarian'].map(opt => (
          <ChoiceChip
            key={opt}
            selected={data.diet.includes(opt)}
            onClick={() => toggleArray(data.diet, opt, (arr) => update({ diet: arr }))}
          >
            {opt}
          </ChoiceChip>
        ))}
      </div>

      <AnimatePresence>
        {/* Check for mixed group logic: e.g. Omnivor + Vegan */}
        {data.diet.includes('Omnivor') && (data.diet.includes('Vegan') || data.diet.includes('Vegetarian')) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 space-y-6 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-700 mb-3">Conflict Grup Mixt: Cât de strictă e alegerea?</p>
              <div className="space-y-2">
                <OptionRow
                  selected={data.dietStrictness === 'strict'}
                  onClick={() => update({ dietStrictness: 'strict' })}
                  title="Doar locuri 100% Vegane"
                  compact
                />
                <OptionRow
                  selected={data.dietStrictness === 'flexible'}
                  onClick={() => update({ dietStrictness: 'flexible' })}
                  title="Locuri mixte cu opțiuni vegane bune"
                  compact
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PsychographicsStage({ data, update }: { data: OnboardingState, update: (d: Partial<OnboardingState>) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Psihografie & Vibe</h2>
        <p className="text-slate-500">Ce te atrage cel mai mult?</p>
      </div>

      <SliderControl
        label="Explorare"
        leftLabel="Familiar (Pizza/Paste)"
        rightLabel="Aventuros (Exotic/Local)"
        value={data.adventurous}
        onChange={(v) => update({ adventurous: v })}
      />

      <SliderControl
        label="Planificare"
        leftLabel="Planificat (Rezervare)"
        rightLabel="Spontan (Walk-in)"
        value={data.spontaneity}
        onChange={(v) => update({ spontaneity: v })}
      />

      <SliderControl
        label="Popularitate"
        leftLabel="Popular (TripAdvisor)"
        rightLabel="Hidden Gem (Secret)"
        value={data.popularity}
        onChange={(v) => update({ popularity: v })}
      />
    </div>
  )
}

// --- HELPER COMPONENTS ---

function OptionCard({ title, desc, selected, onClick }: { title: string, desc: string, selected: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-center min-h-[100px]",
        selected
          ? "border-blue-600 bg-blue-50/50"
          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
      )}
    >
      <h3 className={cn("font-bold text-lg mb-1", selected ? "text-blue-700" : "text-slate-800")}>{title}</h3>
      <p className="text-sm text-slate-500 leading-tight">{desc}</p>
    </div>
  )
}

function OptionRow({ title, desc, selected, onClick, compact }: { title: string, desc?: string, selected: boolean, onClick: () => void, compact?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
        selected
          ? "border-blue-600 bg-blue-50/50"
          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
        compact && "py-3"
      )}
    >
      <div>
        <h3 className={cn("font-bold", selected ? "text-blue-700" : "text-slate-800")}>{title}</h3>
        {desc && <p className="text-sm text-slate-500 mt-1">{desc}</p>}
      </div>
      {selected && <div className="w-4 h-4 rounded-full bg-blue-600" />}
    </div>
  )
}

function ChoiceChip({ children, selected, onClick }: { children: React.ReactNode, selected?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-bold border transition-all",
        selected
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      )}
    >
      {children}
    </button>
  )
}

function SliderControl({ label, leftLabel, rightLabel, value, onChange }: { label: string, leftLabel: string, rightLabel: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 text-center">{label}</h3>
      <div className="relative pt-6 pb-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      <div className="flex justify-between text-xs font-bold text-slate-500">
        <span className="max-w-[100px]">{leftLabel}</span>
        <span className="max-w-[100px] text-right">{rightLabel}</span>
      </div>
    </div>
  )
}

function toggleArray(arr: string[], val: string, set: (n: string[]) => void) {
  if (arr.includes(val)) {
    set(arr.filter(x => x !== val))
  } else {
    set([...arr, val])
  }
}
