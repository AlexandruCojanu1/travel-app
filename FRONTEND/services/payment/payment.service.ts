import { createClient } from '@/lib/supabase/client'

export interface CreatePaymentIntentParams {
    roomId: string
    checkIn: string
    checkOut: string
    roomsCount: number
    paymentOption: 'full' | 'deposit' | 'on_site'
    guests: number
    bookingId?: string // Optional, if we created a booking row first
}

export interface PaymentIntentResponse {
    clientSecret: string
    id: string
    amount: number
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
    // Use backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const authToken = session?.access_token

    const res = await fetch(`${apiUrl}/payments/intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(params),
    })

    if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create payment intent')
    }

    return res.json()
}
