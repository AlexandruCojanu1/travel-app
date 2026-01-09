"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, type UserProfileData } from "@/services/auth/profile.service"
import { ProfileHeader } from "@/components/features/auth/profile-header"
import { PreferencesForm } from "@/components/features/auth/preferences-form"
import { LogoutButton } from "@/components/shared/logout-button"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Settings,
  HelpCircle,
  Bookmark,
  ChevronRight,
  Edit,
  Brain,
  Wallet,
  Car,
  User,
  MapPin
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Fetch profile data
        const data = await getUserProfile(user.id)
        setProfileData(data)
      } catch (err) {
        console.error("Error loading profile:", err)
        setError("Failed to load profile. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="airbnb-card p-8">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-10 w-10 rounded-lg mx-auto mb-2" />
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-mova-dark mb-2">
            Ceva nu a mers bine
          </h3>
          <p className="text-mova-gray mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="airbnb-button px-6 py-3"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  const dnaData = profileData.onboarding_data || {}

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-20">
      {/* Profile Header (Original) */}
      <ProfileHeader profileData={profileData} />

      {/* NEW: Travel DNA Section */}
      {profileData.onboarding_completed && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                <Brain className="w-4 h-4" />
                Travel DNA
              </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2">{profileData.persona || "Explorer"}</h2>
            <p className="text-slate-500 max-w-lg mb-8">
              Profilul tău de călătorie este calibrat pentru a-ți oferi cele mai bune recomandări.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={Wallet}
                label="Budget Style"
                value={dnaData.budgetPersona ? capitalize(dnaData.budgetPersona) : '-'}
                color="bg-green-100 text-green-700"
              />
              <StatCard
                icon={User}
                label="Team"
                value={dnaData.protagonist ? capitalize(dnaData.protagonist) : '-'}
                color="bg-orange-100 text-orange-700"
              />
              <StatCard
                icon={Car}
                label="Mobility"
                value={dnaData.mobility ? capitalize(dnaData.mobility) : '-'}
                color="bg-purple-100 text-purple-700"
              />
            </div>

            {/* Vibe Sliders (Read Only) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VibeCard label="Aventură" value={dnaData.adventurous || 50} />
              <VibeCard label="Spontaneitate" value={dnaData.spontaneity || 50} />
              <VibeCard label="Popularitate" value={dnaData.popularity || 50} />
            </div>
          </div>
        </div>
      )}

      {/* Menu List (Original) */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-mova-dark px-2">Acțiuni rapide</h2>

        {/* Saved Places */}
        <Link
          href="/profile/saved"
          className="flex items-center justify-between airbnb-card p-5 group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-airbnb bg-purple-50 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-mova-dark group-hover:text-mova-blue transition-colors text-base">
                Locuri salvate
              </h3>
              <p className="text-sm text-mova-gray">
                {profileData.stats.savedPlacesCount} salvate
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-mova-gray group-hover:text-mova-blue transition-colors" />
        </Link>

        {/* Account Settings */}
        <Link
          href="/profile/settings"
          className="flex items-center justify-between airbnb-card p-5 group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-airbnb bg-mova-light-gray flex items-center justify-center">
              <Settings className="h-6 w-6 text-mova-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-mova-dark group-hover:text-mova-blue transition-colors text-base">
                Setări cont
              </h3>
              <p className="text-sm text-mova-gray">
                Gestionează detaliile contului tău
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-mova-gray group-hover:text-mova-blue transition-colors" />
        </Link>

        {/* Help & Support */}
        <Link
          href="/profile/help"
          className="flex items-center justify-between airbnb-card p-5 group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-airbnb bg-green-50 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-mova-dark group-hover:text-mova-blue transition-colors text-base">
                Ajutor și suport
              </h3>
              <p className="text-sm text-mova-gray">Obține ajutor când ai nevoie</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-mova-gray group-hover:text-mova-blue transition-colors" />
        </Link>
      </div>

      {/* Travel Preferences (Original) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-mova-dark">Preferințe cont (Legacy)</h2>
          <button className="text-mova-blue text-sm font-semibold hover:underline transition-colors flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editează
          </button>
        </div>

        <PreferencesForm profileData={profileData} />
      </div>

      {/* Logout Section */}
      <div className="pt-4">
        <LogoutButton />
      </div>

      {/* App Version */}
      <div className="text-center py-4">
        <p className="text-xs text-mova-gray">MOVA v1.0.0</p>
      </div>
    </div>
  )
}

// Helper Components for Travel DNA
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

function VibeCard({ label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <div className="flex justify-between mb-2">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-bold text-blue-600">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function capitalize(s: string) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
