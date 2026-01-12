
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
    const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })

    if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create payment intent')
    }

    return res.json()
}
