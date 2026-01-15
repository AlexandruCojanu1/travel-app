"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, type UserProfileData } from "@/services/auth/profile.service"
import { ProfileHeader } from "@/components/features/auth/profile-header"

import { LogoutButton } from "@/components/shared/logout-button"
import { Skeleton } from "@/components/shared/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Settings,
  HelpCircle,
  Bookmark,
  ChevronRight,

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
        setProfileData(null) // Clear any stale data first

        const supabase = createClient()

        // Force fresh user check
        console.log('[ProfilePage] Getting current user...')
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log('[ProfilePage] Current user:', user?.id, user?.email)

        if (userError || !user) {
          console.log('[ProfilePage] No user, redirecting to login')
          router.push("/auth/login")
          return
        }

        // Fetch profile data
        console.log('[ProfilePage] Fetching profile for user:', user.id)
        const data = await getUserProfile(user.id)
        console.log('[ProfilePage] Profile loaded:', data.email, 'id:', data.id)

        // Double-check the loaded profile matches current user
        if (data.id !== user.id) {
          console.error('[ProfilePage] CRITICAL: Profile ID mismatch!', data.id, '!==', user.id)
          setError("Eroare de izolare date. Te rugăm să te deconectezi și să te reconectezi.")
          return
        }

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

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-20">
      {/* Profile Header (Original) */}
      <ProfileHeader profileData={profileData} />

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
