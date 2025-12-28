"use client"

interface PreferencesFormProps {
  preferences?: any
  onSave?: (preferences: any) => void
  profileData?: any
}

export function PreferencesForm({ preferences, onSave, profileData }: PreferencesFormProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Preferences</h2>
      <p className="text-slate-600">Preferences form - Coming soon</p>
    </div>
  )
}

