"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { nanoid } from "nanoid"

/**
 * Generate a unique invite link for a trip
 */
export async function generateInviteLink(tripId: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (!user || authError) {
            throw new Error("Unauthorized")
        }

        // Verify user is owner or admin of the trip
        const { data: trip } = await supabase
            .from("trips")
            .select("user_id, invite_token")
            .eq("id", tripId)
            .single()

        if (!trip) throw new Error("Trip not found")

        // Check if user is owner
        if (trip.user_id !== user.id) {
            // Also check if admin collaborator
            const { data: collaborator } = await supabase
                .from("trip_collaborators")
                .select("role")
                .eq("trip_id", tripId)
                .eq("user_id", user.id)
                .single()

            if (!collaborator || collaborator.role !== 'admin') {
                throw new Error("Only admins can invite members")
            }
        }

        // Return existing token if configured
        if (trip.invite_token) {
            return { success: true, token: trip.invite_token }
        }

        // Generate new token
        const token = nanoid(10) // 10 chars should be enough entropy
        const { error } = await supabase
            .from("trips")
            .update({ invite_token: token })
            .eq("id", tripId)

        if (error) throw new Error("Failed to generate invite link")

        return { success: true, token }
    } catch (error: any) {
        console.error("Generate link error:", error)
        return { error: error.message || "Failed to generate link" }
    }
}

/**
 * Join a trip via token
 */
export async function joinTrip(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // If not logged in, we might want to redirect to login with a "next" param
        // But for server action, we just throw
        return { error: "Must be logged in to join" }
    }

    // Find trip by token
    const { data: trip } = await supabase
        .from("trips")
        .select("id")
        .eq("invite_token", token)
        .single()

    if (!trip) {
        return { error: "Invalid invite link" }
    }

    // Check if duplicate
    const { data: existing } = await supabase
        .from("trip_collaborators")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .single()

    if (existing) {
        return { success: true, tripId: trip.id } // Already joined
    }

    // Check if owner
    const { data: ownerTrip } = await supabase
        .from("trips")
        .select("id")
        .eq("id", trip.id)
        .eq("user_id", user.id)
        .single()

    if (ownerTrip) {
        return { success: true, tripId: trip.id }
    }

    // Insert collaborator
    const { error } = await supabase
        .from("trip_collaborators")
        .insert({
            trip_id: trip.id,
            user_id: user.id,
            role: "collaborator"
        })

    if (error) {
        return { error: "Failed to join trip" }
    }

    revalidatePath(`/plan`)
    return { success: true, tripId: trip.id }
}

export async function getTripCollaborators(tripId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("trip_collaborators")
        .select(`
            role,
            user:user_id (
                id,
                email,
                user_metadata
            )
        `)
        .eq("trip_id", tripId)

    if (error) return []

    // Also get the owner
    const { data: trip } = await supabase
        .from("trips")
        .select(`
            user_id
        `)
        .eq("id", tripId)
        .single()

    // Fetch owner profile if needed, usually handled in UI by combining
    // Ideally we return a unified list including owner

    return data
}
