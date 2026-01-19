import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export const GroupTripService = {
    /**
     * Subscribe to real-time vote updates for a trip
     */
    subscribeToVotes: (tripId: string, onUpdate: (payload: any) => void) => {
        const supabase = createClient()
        return supabase
            .channel(`trip-votes-${tripId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trip_votes',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => onUpdate(payload)
            )
            .subscribe()
    },

    /**
     * Submit a vote (Like/Pass)
     */
    submitVote: async (tripId: string, businessId: string, vote: 'like' | 'pass' | 'superlike') => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from('trip_votes')
            .upsert({
                trip_id: tripId,
                business_id: businessId,
                user_id: user.id,
                vote: vote
            }, { onConflict: 'trip_id, user_id, business_id' })

        if (error) {
            console.error("Error submitting vote:", error)
            toast.error("Failed to save vote")
        }
    },

    /**
     * Check for a match (Client-side calculation for now)
     * In prod, this should be a DB function or Edge Function
     */
    checkForMatch: async (tripId: string, businessId: string) => {
        const supabase = createClient()

        // 1. Get all votes for this business
        const { data: votes } = await supabase
            .from('trip_votes')
            .select('user_id, vote')
            .eq('trip_id', tripId)
            .eq('business_id', businessId)

        if (!votes || votes.length === 0) return false

        // 2. Get Trip Members count
        // Assuming trip_collaborators table or trips.guests count
        // For MVP, if we have > 1 like, we call it a match!

        const likes = votes.filter(v => v.vote === 'like' || v.vote === 'superlike').length

        // Hardcoded threshold for demo: if 2 people like it, it's a match
        return likes >= 2
    }
}
