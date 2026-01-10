"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Shield,
  Globe,
  Bell,
  DollarSign,
  Trash2,
  Save,
  ArrowLeft
} from "lucide-react"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import { Select } from "@/components/shared/ui/select"
import { Label } from "@/components/shared/ui/label"
import { Skeleton } from "@/components/shared/ui/skeleton"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/services/auth/profile.service"
import { logger } from "@/lib/logger"
import {
  updateProfile,
  updatePreferences,
  changePassword,
  toggleTwoFactor,
  deleteAccount,
  type UpdateProfileData,
  type UpdatePreferencesData,
  type ChangePasswordData,
} from "@/actions/profile"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "masculin" as "masculin" | "feminin" | "prefer-sa-nu-spun"
  })

  // Security State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // App Preferences State
  const [preferences, setPreferences] = useState({
    language: "romana",
    theme: "light" as "light" | "dark" | "system",
    pushNotifications: {
      urgent: true,
      checkin: true
    },
    emailNotifications: {
      newsletter: false,
      offers: true
    },
    currency: "RON"
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Load profile data
        const profileData = await getUserProfile(user.id)

        // Set personal information
        setPersonalInfo({
          fullName: profileData.full_name || "",
          email: user.email || "",
          phone: (profileData as any).phone || "",
          birthDate: (profileData as any).birth_date || "",
          gender: (profileData as any).gender || "masculin",
        })

        // Set two-factor authentication
        setTwoFactorEnabled((profileData as any).two_factor_enabled || false)

        // Set theme
        const theme = (profileData as any).theme || "light"
        setPreferences(prev => ({ ...prev, theme }))

        // Set preferences
        if (profileData.preferences) {
          setPreferences(prev => ({
            ...prev,
            language: profileData.preferences?.preferred_language || "romana",
            pushNotifications: {
              urgent: (profileData.preferences as any).push_notifications_urgent ?? true,
              checkin: (profileData.preferences as any).push_notifications_checkin ?? true,
            },
            emailNotifications: {
              newsletter: (profileData.preferences as any).email_notifications_newsletter ?? false,
              offers: (profileData.preferences as any).email_notifications_offers ?? true,
            },
          }))
        }

        setIsLoading(false)
      } catch (err) {
        logger.error("Error loading settings", err)
        setError("Eroare la încărcarea setărilor. Te rugăm să reîmprospătezi pagina.")
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [router])

  if (isLoading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-airbnb" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="airbnb-card p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const handleSavePersonalInfo = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const data: UpdateProfileData = {
        full_name: personalInfo.fullName || undefined,
        phone: personalInfo.phone || undefined,
        birth_date: personalInfo.birthDate || undefined,
        gender: personalInfo.gender,
      }

      const result = await updateProfile(data)

      if (result.success) {
        setSuccess(result.message || "Informațiile personale au fost salvate cu succes!")
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(result.error || "Eroare la salvarea informațiilor.")
      }
    } catch (error) {
      logger.error("Error saving personal info", error)
      setError("Eroare la salvarea informațiilor. Te rugăm să încerci din nou.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Parolele nu se potrivesc!")
      return
    }
    if (passwordData.newPassword.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere!")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const data: ChangePasswordData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }

      const result = await changePassword(data)

      if (result.success) {
        setSuccess(result.message || "Parola a fost schimbată cu succes!")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setShowPasswordFields(false)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(result.error || "Eroare la schimbarea parolei.")
      }
    } catch (error) {
      logger.error("Error changing password", error)
      setError("Eroare la schimbarea parolei. Te rugăm să încerci din nou.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const data: UpdatePreferencesData = {
        preferred_language: preferences.language,
        theme: preferences.theme,
        push_notifications_urgent: preferences.pushNotifications.urgent,
        push_notifications_checkin: preferences.pushNotifications.checkin,
        email_notifications_newsletter: preferences.emailNotifications.newsletter,
        email_notifications_offers: preferences.emailNotifications.offers,
      }

      const result = await updatePreferences(data)

      if (result.success) {
        setSuccess(result.message || "Preferințele au fost salvate cu succes!")
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(result.error || "Eroare la salvarea preferințelor.")
      }
    } catch (error) {
      logger.error("Error saving preferences", error)
      setError("Eroare la salvarea preferințelor. Te rugăm să încerci din nou.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleTwoFactor = async (enabled: boolean) => {
    setError(null)
    setSuccess(null)

    try {
      const result = await toggleTwoFactor(enabled)

      if (result.success) {
        setTwoFactorEnabled(enabled)
        setSuccess(result.message || "Autentificarea în 2 pași a fost actualizată!")
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(result.error || "Eroare la actualizarea autentificării în 2 pași.")
      }
    } catch (error) {
      logger.error("Error toggling 2FA", error)
      setError("Eroare la actualizarea autentificării în 2 pași.")
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Ești sigur că vrei să ștergi contul? Această acțiune este ireversibilă și toate datele tale vor fi șterse permanent."
    )

    if (!confirmed) return

    setError(null)
    setSuccess(null)

    try {
      const result = await deleteAccount()

      if (result.success) {
        if (result.redirect) {
          router.push(result.redirect)
        } else {
          setSuccess(result.message || "Contul a fost șters cu succes!")
          setTimeout(() => router.push("/auth/login"), 2000)
        }
      } else {
        setError(result.error || "Eroare la ștergerea contului.")
      }
    } catch (error) {
      logger.error("Error deleting account", error)
      setError("Eroare la ștergerea contului. Te rugăm să încerci din nou sau să contactezi suportul.")
    }
  }

  const ToggleSwitch = ({
    enabled,
    onChange,
    label
  }: {
    enabled: boolean
    onChange: (enabled: boolean) => void
    label: string
  }) => {
    return (
      <div className="flex items-center justify-between py-3">
        <Label htmlFor={label} className="text-sm font-medium text-mova-dark cursor-pointer">
          {label}
        </Label>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onChange(!enabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-mova-blue focus:ring-offset-2
            ${enabled ? 'bg-mova-blue' : 'bg-gray-300'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="airbnb-card p-4 bg-red-50 border border-red-200 rounded-airbnb">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="airbnb-card p-4 bg-green-50 border border-green-200 rounded-airbnb">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-mova-dark">Setări cont</h1>
          <p className="text-sm text-mova-gray mt-1">Gestionează detaliile și preferințele contului tău</p>
        </div>
      </div>

      {/* Section 1: Informații Personale */}
      <div className="airbnb-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="h-10 w-10 rounded-airbnb bg-mova-light-blue flex items-center justify-center">
            <User className="h-5 w-5 text-mova-blue" />
          </div>
          <h2 className="text-xl font-bold text-mova-dark">Informații Personale</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-mova-dark">
              Nume complet
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
              <Input
                id="fullName"
                type="text"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                className="pl-10"
                placeholder="Introdu numele complet"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-mova-dark">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
              <Input
                id="email"
                type="email"
                value={personalInfo.email}
                disabled
                className="pl-10 bg-gray-50"
              />
            </div>
            <p className="text-xs text-mova-gray">Email-ul nu poate fi modificat</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-mova-dark">
              Număr de telefon
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
              <Input
                id="phone"
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                className="pl-10"
                placeholder="+40 712 345 678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-sm font-medium text-mova-dark">
              Data nașterii
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
              <Input
                id="birthDate"
                type="date"
                value={personalInfo.birthDate}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gender" className="text-sm font-medium text-mova-dark">
              Gen
            </Label>
            <Select
              id="gender"
              value={personalInfo.gender}
              onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value as "masculin" | "feminin" | "prefer-sa-nu-spun" })}
              className="w-full h-11 rounded-airbnb border border-gray-300 focus-visible:ring-2 focus-visible:ring-mova-blue focus-visible:ring-offset-2 focus-visible:border-mova-blue"
            >
              <option value="masculin">Masculin</option>
              <option value="feminin">Feminin</option>
              <option value="prefer-sa-nu-spun">Prefer să nu spun</option>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleSavePersonalInfo}
            disabled={isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Se salvează..." : "Salvează modificările"}
          </Button>
        </div>
      </div>

      {/* Section 2: Securitate */}
      <div className="airbnb-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="h-10 w-10 rounded-airbnb bg-red-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-mova-dark">Securitate</h2>
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-mova-dark">Schimbă parola</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              {showPasswordFields ? "Anulează" : "Schimbă parola"}
            </Button>
          </div>

          {showPasswordFields && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-mova-dark">
                  Parola actuală
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pl-10"
                    placeholder="Introdu parola actuală"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-mova-dark">
                  Parola nouă
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pl-10"
                    placeholder="Introdu parola nouă (min. 8 caractere)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-mova-dark">
                  Confirmă parola nouă
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="pl-10"
                    placeholder="Confirmă parola nouă"
                  />
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isSaving ? "Se schimbă..." : "Schimbă parola"}
              </Button>
            </div>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="pt-4 border-t border-gray-200">
          <ToggleSwitch
            enabled={twoFactorEnabled}
            onChange={handleToggleTwoFactor}
            label="Activează autentificarea în 2 pași"
          />
        </div>
      </div>

      {/* Section 3: Preferințe Aplicație */}
      <div className="airbnb-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="h-10 w-10 rounded-airbnb bg-purple-50 flex items-center justify-center">
            <Bell className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-mova-dark">Preferințe Aplicație</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium text-mova-dark">
              Limbă
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray z-10" />
              <Select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="pl-10 w-full h-11 rounded-airbnb border border-gray-300 focus-visible:ring-2 focus-visible:ring-mova-blue focus-visible:ring-offset-2 focus-visible:border-mova-blue"
              >
                <option value="romana">Română</option>
                <option value="english">English</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme" className="text-sm font-medium text-mova-dark">
              Temă
            </Label>
            <Select
              id="theme"
              value={preferences.theme}
              onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as "light" | "dark" | "system" })}
              className="w-full h-11 rounded-airbnb border border-gray-300 focus-visible:ring-2 focus-visible:ring-mova-blue focus-visible:ring-offset-2 focus-visible:border-mova-blue"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-mova-dark">
              Monedă
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-mova-gray" />
              <Input
                id="currency"
                type="text"
                value={preferences.currency}
                disabled
                className="pl-10 bg-gray-50"
              />
            </div>
            <p className="text-xs text-mova-gray">Moneda este setată pe RON</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold text-mova-dark">Notificări</h3>

          <div className="space-y-1">
            <h4 className="text-sm font-medium text-mova-gray mb-2">Notificări Push</h4>
            <ToggleSwitch
              enabled={preferences.pushNotifications.urgent}
              onChange={(enabled) => setPreferences({
                ...preferences,
                pushNotifications: { ...preferences.pushNotifications, urgent: enabled }
              })}
              label="Urgențe zbor"
            />
            <ToggleSwitch
              enabled={preferences.pushNotifications.checkin}
              onChange={(enabled) => setPreferences({
                ...preferences,
                pushNotifications: { ...preferences.pushNotifications, checkin: enabled }
              })}
              label="Check-in"
            />
          </div>

          <div className="space-y-1 pt-2 border-t border-gray-100">
            <h4 className="text-sm font-medium text-mova-gray mb-2">Email</h4>
            <ToggleSwitch
              enabled={preferences.emailNotifications.newsletter}
              onChange={(enabled) => setPreferences({
                ...preferences,
                emailNotifications: { ...preferences.emailNotifications, newsletter: enabled }
              })}
              label="Newsletter"
            />
            <ToggleSwitch
              enabled={preferences.emailNotifications.offers}
              onChange={(enabled) => setPreferences({
                ...preferences,
                emailNotifications: { ...preferences.emailNotifications, offers: enabled }
              })}
              label="Oferte"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Se salvează..." : "Salvează preferințele"}
          </Button>
        </div>
      </div>

      {/* Section 4: Administrare Cont */}
      <div className="airbnb-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="h-10 w-10 rounded-airbnb bg-red-50 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-mova-dark">Administrare Cont</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-airbnb">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Zonă de pericol</h3>
            <p className="text-sm text-red-700 mb-4">
              Această acțiune este ireversibilă. Toate datele tale vor fi șterse permanent.
            </p>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge contul
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

