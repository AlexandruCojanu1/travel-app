"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

export interface BillItem {
    id: string
    name: string
    price: number
    quantity: number
    assignedTo: string[] // user_ids
}

export interface RestaurantBill {
    id: string
    restaurantName: string
    items: BillItem[]
    totalAmount: number
    status: 'active' | 'paid'
    currency: string
}

/**
 * SIMULATION: Create a demo bill
 */
export async function createDemoBill(tripId: string) {
    const supabase = await createClient()

    const items: BillItem[] = [
        { id: nanoid(), name: "Burger MOVA Special", price: 45, quantity: 1, assignedTo: [] },
        { id: nanoid(), name: "Pizza Quattro Formaggi", price: 38, quantity: 1, assignedTo: [] },
        { id: nanoid(), name: "Craft Beer IPA", price: 22, quantity: 1, assignedTo: [] },
        { id: nanoid(), name: "Limonadă Mentă", price: 18, quantity: 1, assignedTo: [] },
        { id: nanoid(), name: "Platou Brânzeturi (Share)", price: 80, quantity: 1, assignedTo: [] }, // Intended for sharing
        { id: nanoid(), name: "Tiramisu", price: 25, quantity: 1, assignedTo: [] },
    ]

    const total = items.reduce((acc, item) => acc + item.price, 0)

    const { data, error } = await supabase
        .from('restaurant_bills')
        .insert({
            trip_id: tripId, // Optional/Nullable in schema actually
            restaurant_name: "GastroPub 'La Giont'",
            items: items, // Postgres will JSON stringify
            total_amount: total,
            status: 'active'
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating bill", error)
        return null
    }
    return data
}

/**
 * Claim or Unclaim an item
 * Logic: Toggle. If I already claimed, remove me. If not, add me.
 */
export async function toggleItemClaim(billId: string, itemId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // 1. Fetch current bill
    const { data: bill, error: fetchError } = await supabase
        .from('restaurant_bills')
        .select('*')
        .eq('id', billId)
        .single()

    if (fetchError || !bill) return { error: "Bill not found" }

    const items = bill.items as unknown as BillItem[]
    const targetItemIndex = items.findIndex(i => i.id === itemId)

    if (targetItemIndex === -1) return { error: "Item not found" }

    const item = items[targetItemIndex]

    // Toggle logic
    const isClaimedByMe = item.assignedTo.includes(user.id)

    if (isClaimedByMe) {
        // Remove
        item.assignedTo = item.assignedTo.filter(id => id !== user.id)
    } else {
        // Add
        item.assignedTo.push(user.id)
    }

    // Update DB
    const { error: updateError } = await supabase
        .from('restaurant_bills')
        .update({ items: items }) // Send back full array
        .eq('id', billId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/pay/demo')
    return { success: true }
}

/**
 * Fetch bill for realtime updates (Polling fallback)
 */
export async function getBill(billId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('restaurant_bills')
        .select('*')
        .eq('id', billId)
        .single()
    return data
}
