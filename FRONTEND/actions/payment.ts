"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

/**
 * Initiate a Group Split for a Booking
 */
export async function initiateSplitBooking(
    tripId: string,
    totalAmount: number,
    bookingDetails: {
        business_id: string,
        start_date: string,
        end_date: string,
        guests: number
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // 1. Get Collaborators to split with
    const { data: collaborators } = await supabase
        .from('trip_collaborators')
        .select('user_id')
        .eq('trip_id', tripId)

    // Include the owner and collaborators
    const participants = [user.id, ...(collaborators?.map(c => c.user_id) || [])]

    // Calculate split amount (even split for MVP)
    const splitAmount = Number((totalAmount / participants.length).toFixed(2))

    // 2. Create the Booking Record in 'collecting' status
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            user_id: user.id,
            trip_id: tripId,
            status: 'pending', // Pending real confirmation
            payment_method: 'split',
            split_status: 'collecting',
            total_amount: totalAmount,
            business_id: bookingDetails.business_id,
            start_at: bookingDetails.start_date,
            end_at: bookingDetails.end_date,
            persons: bookingDetails.guests
        })
        .select()
        .single()

    if (bookingError) return { error: bookingError.message }

    // 3. Create Payment Splits
    const splits = participants.map(userId => ({
        booking_id: booking.id,
        user_id: userId,
        amount: splitAmount,
        status: userId === user.id ? 'paid' : 'pending', // Initiator pays immediately? Or all pending?
        // Let's say Initiator Auto-Pays their share for better UX flow
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    }))

    // If initiator pays immediately, we mark as paid. 
    // real implementation would handle Stripe intent here.

    const { error: splitError } = await supabase
        .from('payment_splits')
        .insert(splits)

    if (splitError) return { error: splitError.message }

    revalidatePath('/dashboard')
    return { success: true, bookingId: booking.id }
}

/**
 * Pay a specific split share
 */
export async function payShare(splitId: string) {
    const supabase = await createClient()

    // 1. Mark split as paid
    const { data: split, error } = await supabase
        .from('payment_splits')
        .update({ status: 'paid' })
        .eq('id', splitId)
        .select('booking_id')
        .single()

    if (error) return { error: error.message }

    // 2. Check if all splits for this booking are paid
    const { data: allSplits } = await supabase
        .from('payment_splits')
        .select('status')
        .eq('booking_id', split.booking_id)

    const allPaid = allSplits?.every(s => s.status === 'paid')

    if (allPaid) {
        // Confirm Booking
        await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                split_status: 'completed'
            })
            .eq('id', split.booking_id)
    }

    revalidatePath('/dashboard') // Refresh dashboard
    return { success: true, allPaid }
}

/**
 * Get active splits for the user (Dashboard Wallet)
 */
export async function getMySplits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('payment_splits')
        //.select('*, bookings(business_id, total_amount)') // Join not always easy with autotypes, simplified:
        .select(`
            *,
            bookings (
                id,
                total_amount,
                split_status
            )
        `)
        .eq('user_id', user.id)
        .neq('status', 'paid') // Only Show Pending? Or history too?
        .order('created_at', { ascending: false })

    return data || []
}
