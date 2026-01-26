"use client"

interface ProfileHeaderProps {
  profileData: {
    profile?: {
      full_name?: string | null
      avatar_url?: string | null
    }
    full_name?: string | null
    avatar_url?: string | null
    email?: string
  }
}

export function ProfileHeader({ profileData }: ProfileHeaderProps) {
  const profile = profileData.profile || profileData
  const fullName = profile.full_name
  const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={fullName || "User"}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {fullName || "User"}
          </h1>
          {profileData.email && <p className="text-slate-600">{profileData.email}</p>}
        </div>
      </div>
    </div>
  )
}

