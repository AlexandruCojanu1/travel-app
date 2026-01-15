"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { Users, CreditCard, Loader2, BedDouble, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/shared/ui/drawer"
import { toast } from "sonner"
import { useVacationStore } from "@/store/vacation-store"
import { createClient } from "@/lib/supabase/client"
import { type User } from "@supabase/supabase-js"
import { createBooking, calculateBookingPrice, type BookingPriceCalculation } from "@/services/booking/booking.service"
import { getRoomsByHotel, type HotelRoom } from "@/services/hotel/room.service"
import type { MapBusiness } from "@/services/business/business.service"

// Stripe
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { createPaymentIntent } from "@/services/payment/payment.service"

// Initialize Stripe outside component
// Initialize Stripe outside component
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

// Separate component for the actual payment form to context scope
function PaymentForm({
    onSubmit,
    isProcessing,
    totalAmount,
    paymentOption
}: {
    onSubmit: (paymentMethodId?: string) => Promise<void>,
    isProcessing: boolean,
    totalAmount: number,
    paymentOption: 'full' | 'deposit' | 'on_site'
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) return

        // If paying on site, just submit without Stripe confirm
        if (paymentOption === 'on_site') {
            await onSubmit()
            return
        }

        const { error: submitError } = await elements.submit()
        if (submitError) {
            setError(submitError.message || "Eroare la procesarea plății")
            return
        }

        // We don't confirm here immediately because we want to create the booking first
        // But for this flow, we might need to confirm the intent.
        // Actually, best practice: Create Booking -> Create Payment Intent -> Client side Confirm

        // Pass control back to parent to finalize
        await onSubmit()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Only show card input if not paying locally */}
            {paymentOption !== 'on_site' && (
                <div className="p-4 border rounded-xl bg-white">
                    <PaymentElement />
                </div>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button
                type="submit"
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 mt-4"
                disabled={isProcessing || (paymentOption !== 'on_site' && (!stripe || !elements))}
            >
                {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                )}
                {paymentOption === 'on_site'
                    ? 'Rezervă (Plată la locație)'
                    : `Plătește ${totalAmount.toFixed(2)} RON`
                }
            </Button>
        </form>
    )
}


interface HotelBookingDrawerProps {
    business: MapBusiness | null
    isOpen: boolean
    onClose: () => void
    onBooked?: () => void
}

export function HotelBookingDrawer({ business, isOpen, onClose, onBooked }: HotelBookingDrawerProps) {
    const [user, setUser] = useState<User | null>(null)
    const { getActiveVacation } = useVacationStore()
    const activeVacation = getActiveVacation()

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }, [])

    const [step, setStep] = useState<'rooms' | 'details'>('rooms')
    const [rooms, setRooms] = useState<HotelRoom[]>([])
    const [loadingRooms, setLoadingRooms] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null)

    // Dates
    const [startDate, setStartDate] = useState(
        activeVacation ? new Date(activeVacation.startDate).toISOString().split('T')[0] : ''
    )
    const [endDate, setEndDate] = useState(
        activeVacation ? new Date(activeVacation.endDate).toISOString().split('T')[0] : ''
    )

    const [guests, setGuests] = useState(2)
    const [pricing, setPricing] = useState<BookingPriceCalculation | null>(null)
    const [calculating, setCalculating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [paymentOption, setPaymentOption] = useState<'full' | 'deposit' | 'on_site'>('full')

    // Stripe State
    const [clientSecret, setClientSecret] = useState<string | null>(null)

    // Load rooms when drawer opens
    useEffect(() => {
        if (isOpen && business) {
            loadRooms()
            setStep('rooms')
            setSelectedRoom(null)
            setClientSecret(null)
        }
    }, [isOpen, business])

    // Calculate price when room/dates change
    useEffect(() => {
        if (selectedRoom && startDate && endDate) {
            calculatePrice()
        }
    }, [selectedRoom, startDate, endDate, guests, paymentOption])

    // Create Payment Intent when entering details step (if paid option)
    useEffect(() => {
        if (step === 'details' && pricing && paymentOption !== 'on_site' && selectedRoom) {
            createPaymentIntent({
                roomId: selectedRoom.id,
                checkIn: startDate,
                checkOut: endDate,
                roomsCount: pricing.rooms_count,
                guests,
                paymentOption
            }).then(res => {
                setClientSecret(res.clientSecret)
            }).catch(err => {
                console.error("Payment intent init error:", err)
                toast.error("Eroare la inițializarea plății")
            })
        } else if (paymentOption === 'on_site') {
            setClientSecret(null)
        }
    }, [step, pricing, paymentOption, selectedRoom])

    async function loadRooms() {
        if (!business) return
        setLoadingRooms(true)
        try {
            const data = await getRoomsByHotel(business.id)
            setRooms(data)
        } catch (error) {
            console.error('Error loading rooms:', error)
            toast.error('Nu am putut încărca camerele disponibile')
        } finally {
            setLoadingRooms(false)
        }
    }

    async function calculatePrice() {
        if (!selectedRoom || !startDate || !endDate) return
        setCalculating(true)
        try {
            const result = await calculateBookingPrice(
                selectedRoom.id,
                startDate,
                endDate,
                Math.ceil(guests / selectedRoom.max_guests),
                paymentOption
            )
            setPricing(result)
        } catch (error) {
            console.error('Error calculating price:', error)
        } finally {
            setCalculating(false)
        }
    }

    async function handleBook(stripeElements?: any) {
        if (!user || !business || !selectedRoom || !startDate || !endDate || !pricing) return

        setSubmitting(true)
        try {
            // 1. Create Booking in DB
            const booking = await createBooking({
                user_id: user.id,
                business_id: business.id,
                room_id: selectedRoom.id,
                trip_id: activeVacation?.id,
                check_in: startDate,
                check_out: endDate,
                guests,
                rooms_count: pricing.rooms_count,
                payment_option: paymentOption,
                guest_name: user.email?.split('@')[0],
                guest_email: user.email,
                cancellation_policy: 'flexible',
            })

            if (!booking) throw new Error("Could not create booking")

            // 2. If Stripe payment needed, confirm it now using the Elements instance
            if (paymentOption !== 'on_site' && stripeElements) {
                const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
                if (stripe) {
                    const { error } = await stripe.confirmPayment({
                        elements: stripeElements,
                        confirmParams: {
                            return_url: `${window.location.origin}/profile/bookings/${booking.id}`,
                        },
                        redirect: "if_required"
                    })

                    if (error) {
                        // TODO: Cancel created booking or mark as failed payment?
                        toast.error(`Plata a eșuat: ${error.message}`)
                        setSubmitting(false)
                        return
                    }
                }
            }

            if (onBooked) onBooked()
            toast.success("Rezervare confirmată cu succes!")
            onClose()
        } catch (error) {
            console.error('Booking error:', error)
            toast.error('A apărut o eroare la rezervare. Te rugăm să încerci din nou.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!business) return null
    const today = new Date().toISOString().split('T')[0]

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="max-h-[96vh]">
                <DrawerHeader>
                    <DrawerTitle className="text-2xl font-bold">Rezervă la {business.name}</DrawerTitle>
                    <DrawerDescription>Complează detaliile pentru cazare</DrawerDescription>
                </DrawerHeader>

                <div className="p-4 overflow-y-auto max-h-[70vh]">
                    {/* Step 1: Room Selection */}
                    {step === 'rooms' && (
                        <div className="space-y-6">
                            {/* Date & Guest Picker (unchanged) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Check-in</Label>
                                    <Input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Check-out</Label>
                                    <Input type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Oaspeți</Label>
                                <Input type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} />
                            </div>

                            {/* Room List (unchanged) */}
                            <div className="space-y-4 pt-4">
                                {loadingRooms ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                                ) : rooms.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Nu sunt camere disponibile.</div>
                                ) : (
                                    rooms.map((room) => (
                                        <div key={room.id}
                                            className={cn("border rounded-xl p-4 cursor-pointer hover:shadow-md", selectedRoom?.id === room.id ? "border-blue-500 bg-blue-50" : "")}
                                            onClick={() => setSelectedRoom(room)}
                                        >
                                            <div className="flex justify-between">
                                                <h4 className="font-bold">{room.name}</h4>
                                                <span className="text-blue-600 font-bold">{room.price_per_night} RON/noapte</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{room.room_type} • {room.max_guests} pers</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Button className="w-full mt-4" disabled={!selectedRoom || !startDate || !endDate} onClick={() => setStep('details')}>
                                Continuă
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Payment & Confirmation */}
                    {step === 'details' && selectedRoom && (
                        <div className="space-y-6">
                            {/* Summary Box */}
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <h3 className="font-bold">{selectedRoom.name}</h3>
                                <p className="text-sm text-gray-600">{startDate} - {endDate} • {guests} oaspeți</p>
                            </div>

                            {/* Payment Options (unchanged logic, just ensuring state updates) */}
                            <div className="space-y-3">
                                <div onClick={() => setPaymentOption('full')} className={cn("p-3 border rounded-lg cursor-pointer flex gap-3", paymentOption === 'full' && "border-blue-500 bg-blue-50")}>
                                    <div className="font-medium">Plată integrală</div>
                                </div>
                                <div onClick={() => setPaymentOption('deposit')} className={cn("p-3 border rounded-lg cursor-pointer flex gap-3", paymentOption === 'deposit' && "border-blue-500 bg-blue-50")}>
                                    <div className="font-medium">Avans (20%)</div>
                                </div>
                                <div onClick={() => setPaymentOption('on_site')} className={cn("p-3 border rounded-lg cursor-pointer flex gap-3", paymentOption === 'on_site' && "border-blue-500 bg-blue-50")}>
                                    <div className="font-medium">Plată la locație</div>
                                </div>
                            </div>

                            {/* Totals */}
                            {pricing && (
                                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{pricing.subtotal.toFixed(2)} RON</span></div>
                                    <div className="flex justify-between"><span>Taxe</span><span>{pricing.taxes.toFixed(2)} RON</span></div>
                                    <div className="border-t border-slate-700 my-2" />
                                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{pricing.total.toFixed(2)} RON</span></div>
                                    {paymentOption === 'deposit' && <div className="text-blue-300 font-bold pt-2">De plată acum: {pricing.deposit_amount?.toFixed(2)} RON</div>}
                                </div>
                            )}

                            {/* Stripe Payment Form */}
                            {(paymentOption === 'on_site' || clientSecret) && (
                                <div className="pt-4">
                                    {paymentOption !== 'on_site' ? (
                                        stripePromise ? (
                                            <Elements stripe={stripePromise} options={{ clientSecret: clientSecret ?? undefined }}>
                                                <PaymentForm
                                                    onSubmit={async () => {
                                                        handleBook()
                                                    }}
                                                    isProcessing={submitting}
                                                    totalAmount={paymentOption === 'deposit' ? pricing?.deposit_amount || 0 : pricing?.total || 0}
                                                    paymentOption={paymentOption}
                                                />
                                            </Elements>
                                        ) : (
                                            <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-xl text-center">
                                                <div className="font-bold mb-1">Plată Online Indisponibilă</div>
                                                <div>Configurarea Stripe lipsește. Te rugăm să selectezi "Plată la locație".</div>
                                            </div>
                                        )
                                    ) : (
                                        <Button className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700" onClick={() => handleBook()} disabled={submitting}>
                                            {submitting ? <Loader2 className="animate-spin" /> : "Rezervă acum"}
                                        </Button>
                                    )}
                                </div>
                            )}

                            <Button variant="ghost" onClick={() => setStep('rooms')} className="w-full">Înapoi</Button>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
