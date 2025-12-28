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
import {
  Settings,
  HelpCircle,
  Bookmark,
  ChevronRight,
  Edit,
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
        <div className="bg-white rounded-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      {/* Profile Header */}
      <ProfileHeader profileData={profileData} />

      {/* Menu List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 px-2">Quick Actions</h2>

        {/* Saved Places */}
        <Link
          href="/profile/saved"
          className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Saved Places
              </h3>
              <p className="text-sm text-slate-600">
                {profileData.stats.savedPlacesCount} saved
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        {/* Account Settings */}
        <Link
          href="/profile/settings"
          className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Account Settings
              </h3>
              <p className="text-sm text-slate-600">
                Manage your account details
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        {/* Help & Support */}
        <Link
          href="/profile/help"
          className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Help & Support
              </h3>
              <p className="text-sm text-slate-600">Get help when you need it</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>

      {/* Travel Preferences */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-slate-900">Travel Preferences</h2>
          <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Edit
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
        <p className="text-xs text-slate-400">TravelPWA v1.0.0</p>
      </div>
    </div>
  )
}
