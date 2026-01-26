"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitVote(tripId: string, businessId: string, vote: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Unauthorized" }
    }

    // 1. Record the vote
    const { error: voteError } = await supabase
        .from("trip_votes")
        .upsert({
            trip_id: tripId,
            business_id: businessId,
            user_id: user.id,
            vote: vote,
            created_at: new Date().toISOString()
        }, {
            onConflict: "trip_id, business_id, user_id"
        })

    if (voteError) {
        console.error("Vote error:", voteError)
        return { error: "Failed to record vote" }
    }

    // if vote is NO, we don't need to check for match (unless we want to remove? no, let's keep it simple)
    if (!vote) {
        return { success: true, matched: false }
    }

    // 2. Check for Consensus / Match
    // Get total members count
    const { count: collaboratorsCount, error: countError } = await supabase
        .from("trip_collaborators")
        .select("*", { count: 'exact', head: true })
        .eq("trip_id", tripId)

    // Add 1 for the owner
    const totalMembers = (collaboratorsCount || 0) + 1
    const threshold = Math.floor(totalMembers / 2) + 1

    // Get positive votes count
    const { count: positiveVotes, error: votesError } = await supabase
        .from("trip_votes")
        .select("*", { count: 'exact', head: true })
        .eq("trip_id", tripId)
        .eq("business_id", businessId)
        .eq("vote", true)

    if (votesError) {
        return { success: true, matched: false } // Vote saved, but failed to check match
    }

    const currentLikes = positiveVotes || 0

    if (currentLikes >= threshold) {
        // MATCH! Add to trip items if not already present
        // Check existence
        const { data: existingItem } = await supabase
            .from("trip_items")
            .select("id")
            .eq("trip_id", tripId)
            .eq("business_id", businessId)
            .single()

        if (!existingItem) {
            // Add to Plan (Unscheduled / Day 0 for now)
            const { error: addError } = await supabase
                .from("trip_items")
                .insert({
                    trip_id: tripId,
                    business_id: businessId,
                    day_index: 0, // Unscheduled bucket
                    is_booked: false
                })

            if (!addError) {
                revalidatePath(`/plan`)
                return { success: true, matched: true }
            }
        } else {
            return { success: true, matched: true, alreadyAdded: true }
        }
    }

    return { success: true, matched: false }
}
