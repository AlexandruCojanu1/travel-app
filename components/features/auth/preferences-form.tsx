"use client"

import { Users, Car, Wallet, Utensils, MapPin } from "lucide-react"

interface PreferencesFormProps {
  preferences?: any
  onSave?: (preferences: any) => void
  profileData?: any
}

export function PreferencesForm({ profileData }: PreferencesFormProps) {
  const data = profileData?.onboarding_data || {}
  const hasData = profileData?.onboarding_completed

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <p className="text-slate-500 text-center py-4">Nu ai completat încă profilul de călător.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Location */}
      <InfoCard
        icon={MapPin}
        title="Locație"
        color="text-indigo-600 bg-indigo-50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Oraș de reședință" value={profileData?.home_city?.name || "Neselectat"} />
        </div>
      </InfoCard>

      {/* Protagonists */}
      <InfoCard
        icon={Users}
        title="Cine călătorește?"
        color="text-blue-600 bg-blue-50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Tip Grup" value={capitalize(data.protagonist)} />

          {data.protagonist === 'solo' && (
            <>
              <DetailRow label="Stare de spirit" value={data.soloMood === 'social' ? 'Socializare' : 'Liniște'} />
              <DetailRow label="Dining Comfort" value={data.soloDining === 'high' ? 'High (Fine Dining)' : 'Low (Quick Bites)'} />
            </>
          )}

          {data.protagonist === 'family' && (
            <>
              <DetailRow label="Vârstă copii" value={data.familyKids?.join(', ') || '-'} />
              <DetailRow label="Cărucior" value={data.familyStroller ? 'Da' : 'Nu'} />
              <DetailRow label="Wi-Fi (Teens)" value={data.familyWifi ? 'Da' : 'Nu'} />
            </>
          )}

          {data.protagonist === 'group' && (
            <>
              <DetailRow label="Nota de plată" value={data.groupBill === 'split' ? 'Split' : 'Individual'} />
              <DetailRow label="Vibe" value={data.groupVibe === 'party' ? 'Party' : 'Chill'} />
            </>
          )}
        </div>
      </InfoCard>

      {/* Mobility */}
      <InfoCard
        icon={Car}
        title="Mobilitate"
        color="text-purple-600 bg-purple-50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Mod Deplasare" value={mapMobility(data.mobility)} />

          {data.mobility === 'car' && (
            <>
              <DetailRow label="Parcare" value={data.carParking === 'critical' ? 'Critică' : 'Flexibilă'} />
              <DetailRow label="Șofer Desemnat" value={data.carDriver ? 'Da' : 'Nu'} />
            </>
          )}

          {(data.mobility === 'walk' || data.mobility === 'transit_walk') && (
            <>
              <DetailRow label="Distanță Max" value={data.walkDist} />
              <DetailRow label="Trade-off Distanță" value={data.walkTradeoff ? 'Da (pentru Top 5%)' : 'Nu'} />
            </>
          )}
        </div>
      </InfoCard>

      {/* Budget */}
      <InfoCard
        icon={Wallet}
        title="Buget & Strategie"
        color="text-green-600 bg-green-50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Persona" value={mapBudget(data.budgetPersona)} />
          <DetailRow label="Trade-off Periferie" value={data.budgetPeriphery ? 'Acceptat' : 'Refuzat'} />
        </div>
      </InfoCard>

      {/* Diet */}
      <InfoCard
        icon={Utensils}
        title="Dietă"
        color="text-orange-600 bg-orange-50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Preferințe" value={data.diet?.join(', ') || 'Fără restricții'} />
          {data.dietStrictness && (
            <DetailRow label="Strictetțe Grup" value={data.dietStrictness === 'strict' ? 'Doar Restaurant Dedicat' : 'Mixt / Opțiuni'} />
          )}
        </div>
      </InfoCard>
    </div>
  )
}

function InfoCard({ icon: Icon, title, children, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  )
}

function capitalize(s: string) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function mapMobility(type: string) {
  if (type === 'transit_walk') return 'Transit + Walk'
  if (type === 'transit') return 'Public Transit'
  return capitalize(type)
}

function mapBudget(type: string) {
  if (type === 'nomad') return 'Gastronomic Nomad'
  if (type === 'comfort') return 'Comfort Seeker'
  if (type === 'balanced') return 'Balanced Explorer'
  if (type === 'budget') return 'Ultra-Budget'
  return capitalize(type)
}
