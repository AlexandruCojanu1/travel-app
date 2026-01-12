
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { calculateBookingPrice } from '@/services/booking/booking.service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16', // Use latest stable version available to the project
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { bookingId, roomId, checkIn, checkOut, roomsCount, paymentOption, guests } = body

        if (!roomId || !checkIn || !checkOut) {
            return NextResponse.json(
                { error: 'Missing required booking details' },
                { status: 400 }
            )
        }

        // 1. Calculate price server-side to ensure security
        // We do NOT trust the price sent from the client
        const pricing = await calculateBookingPrice(
            roomId,
            checkIn,
            checkOut,
            roomsCount || 1,
            paymentOption || 'full'
        )

        if (!pricing) {
            return NextResponse.json(
                { error: 'Invalid booking parameters, could not calculate price' },
                { status: 400 }
            )
        }

        // 2. Determine amount to charge (in bani/cents)
        // If paymentOption is 'deposit', charge only the deposit amount.
        // Otherwise charge full total.
        const amountToCharge = paymentOption === 'deposit'
            ? pricing.deposit_amount
            : pricing.total

        if (!amountToCharge || amountToCharge <= 0) {
            return NextResponse.json(
                { error: 'Calculated amount is invalid' },
                { status: 400 }
            )
        }

        // Stripe expects amount in smallest currency unit (bani)
        const amountInBani = Math.round(amountToCharge * 100)

        // 3. Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInBani,
            currency: 'ron',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                bookingId: bookingId || 'temp_booking', // meaningful ID if we have it, else placeholder
                roomId,
                checkIn,
                checkOut
            }
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id,
            amount: amountToCharge
        })

    } catch (error) {
        console.error('Stripe Error:', error)
        return NextResponse.json(
            { error: 'Error creating payment intent' },
            { status: 500 }
        )
    }
}
