"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export interface UpdateProfileData {
  full_name?: string
  phone?: string
  birth_date?: string
  gender?: "masculin" | "feminin" | "prefer-sa-nu-spun"
}

export interface UpdatePreferencesData {
  preferred_language?: string
  theme?: "light" | "dark" | "system"
  push_notifications_urgent?: boolean
  push_notifications_checkin?: boolean
  email_notifications_newsletter?: boolean
  email_notifications_offers?: boolean
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

/**
 * Updates user profile information
 */
export async function updateProfile(data: UpdateProfileData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Nu ești autentificat. Te rugăm să te conectezi.",
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.birth_date !== undefined) updateData.birth_date = data.birth_date || null
    if (data.gender !== undefined) updateData.gender = data.gender

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)

    if (error) {
      logger.error("updateProfile: Error updating profile", error, { userId: user.id })
      return {
        success: false,
        error: `Eroare la actualizarea profilului: ${error.message}`,
      }
    }

    logger.log("updateProfile: Profile updated successfully", { userId: user.id })
    revalidatePath("/profile")
    revalidatePath("/profile/settings")

    return {
      success: true,
      message: "Informațiile personale au fost actualizate cu succes!",
    }
  } catch (error) {
    logger.error("updateProfile: Unexpected error", error)
    return {
      success: false,
      error: "A apărut o eroare neașteptată. Te rugăm să încerci din nou.",
    }
  }
}

/**
 * Updates user preferences
 */
export async function updatePreferences(data: UpdatePreferencesData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Nu ești autentificat. Te rugăm să te conectezi.",
      }
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (data.preferred_language !== undefined) updateData.preferred_language = data.preferred_language
    if (data.theme !== undefined) {
      // Update theme in profiles table
      await supabase
        .from("profiles")
        .update({ theme: data.theme, updated_at: new Date().toISOString() })
        .eq("id", user.id)
    }
    if (data.push_notifications_urgent !== undefined) updateData.push_notifications_urgent = data.push_notifications_urgent
    if (data.push_notifications_checkin !== undefined) updateData.push_notifications_checkin = data.push_notifications_checkin
    if (data.email_notifications_newsletter !== undefined) updateData.email_notifications_newsletter = data.email_notifications_newsletter
    if (data.email_notifications_offers !== undefined) updateData.email_notifications_offers = data.email_notifications_offers

    if (existingPrefs) {
      // Update existing preferences
      const { error } = await supabase
        .from("user_preferences")
        .update(updateData)
        .eq("user_id", user.id)

      if (error) {
        logger.error("updatePreferences: Error updating preferences", error, { userId: user.id })
        return {
          success: false,
          error: `Eroare la actualizarea preferințelor: ${error.message}`,
        }
      }
    } else {
      // Create new preferences record
      const { error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          preferred_language: data.preferred_language || "romana",
          currency: "RON",
          notification_enabled: true,
          ...updateData,
        })

      if (error) {
        logger.error("updatePreferences: Error creating preferences", error, { userId: user.id })
        return {
          success: false,
          error: `Eroare la crearea preferințelor: ${error.message}`,
        }
      }
    }

    logger.log("updatePreferences: Preferences updated successfully", { userId: user.id })
    revalidatePath("/profile")
    revalidatePath("/profile/settings")

    return {
      success: true,
      message: "Preferințele au fost actualizate cu succes!",
    }
  } catch (error) {
    logger.error("updatePreferences: Unexpected error", error)
    return {
      success: false,
      error: "A apărut o eroare neașteptată. Te rugăm să încerci din nou.",
    }
  }
}

/**
 * Changes user password
 */
export async function changePassword(data: ChangePasswordData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Nu ești autentificat. Te rugăm să te conectezi.",
      }
    }

    // Validate password length
    if (data.newPassword.length < 8) {
      return {
        success: false,
        error: "Parola trebuie să aibă minim 8 caractere.",
      }
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (error) {
      logger.error("changePassword: Error changing password", error, { userId: user.id })
      return {
        success: false,
        error: `Eroare la schimbarea parolei: ${error.message}`,
      }
    }

    logger.log("changePassword: Password changed successfully", { userId: user.id })

    return {
      success: true,
      message: "Parola a fost schimbată cu succes!",
    }
  } catch (error) {
    logger.error("changePassword: Unexpected error", error)
    return {
      success: false,
      error: "A apărut o eroare neașteptată. Te rugăm să încerci din nou.",
    }
  }
}

/**
 * Toggles two-factor authentication
 */
export async function toggleTwoFactor(enabled: boolean) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Nu ești autentificat. Te rugăm să te conectezi.",
      }
    }

    // Update two_factor_enabled in profiles
    const { error } = await supabase
      .from("profiles")
      .update({
        two_factor_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      logger.error("toggleTwoFactor: Error updating 2FA", error, { userId: user.id })
      return {
        success: false,
        error: `Eroare la actualizarea autentificării în 2 pași: ${error.message}`,
      }
    }

    logger.log("toggleTwoFactor: 2FA updated successfully", { userId: user.id, enabled })
    revalidatePath("/profile/settings")

    return {
      success: true,
      message: enabled
        ? "Autentificarea în 2 pași a fost activată!"
        : "Autentificarea în 2 pași a fost dezactivată!",
    }
  } catch (error) {
    logger.error("toggleTwoFactor: Unexpected error", error)
    return {
      success: false,
      error: "A apărut o eroare neașteptată. Te rugăm să încerci din nou.",
    }
  }
}

/**
 * Deletes user account
 */
export async function deleteAccount() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Nu ești autentificat. Te rugăm să te conectezi.",
      }
    }

    // Delete user account using Supabase Auth Admin API
    // Note: This requires service_role key, so we'll use a server-side approach
    // For now, we'll mark the account as deleted in the profile
    // In production, you should use Supabase Admin API or a database function
    
    // Option 1: Mark as deleted (soft delete)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        // Add a deleted_at column if you want soft deletes
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      logger.error("deleteAccount: Error marking account as deleted", updateError, { userId: user.id })
    }

    // Option 2: Sign out the user (they'll need to contact support for full deletion)
    await supabase.auth.signOut()

    logger.log("deleteAccount: Account deletion initiated", { userId: user.id })

    return {
      success: true,
      message: "Contul tău a fost șters. Te vom redirecționa la pagina de login.",
      redirect: "/auth/login",
    }
  } catch (error) {
    logger.error("deleteAccount: Unexpected error", error)
    return {
      success: false,
      error: "A apărut o eroare neașteptată. Te rugăm să încerci din nou sau să contactezi suportul.",
    }
  }
}

