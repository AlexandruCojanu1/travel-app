import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { checkAvailability, getRoomById } from '@/services/hotel/room.service'

// ============================================
// TYPES
// ============================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'checked_in'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
export type PaymentOption = 'full' | 'deposit' | 'on_site'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

export interface Booking {
  id: string
  user_id: string
  business_id: string
  room_id: string
  trip_id: string | null
  check_in: string
  check_out: string
  guests: number
  rooms_count: number
  price_per_night: number
  total_nights: number
  subtotal: number
  taxes: number
  total_price: number
  payment_option: PaymentOption
  deposit_amount: number | null
  amount_paid: number
  payment_status: PaymentStatus
  payment_intent_id: string | null
  status: BookingStatus
  cancellation_policy: CancellationPolicy
  cancelled_at: string | null
  cancellation_reason: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  special_requests: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  // Joined data
  room?: {
    name: string
    room_type: string
    images: string[]
  }
  business?: {
    name: string
    image_url: string | null
  }
}

export interface CreateBookingInput {
  user_id: string
  business_id: string
  room_id: string
  trip_id?: string
  check_in: string
  check_out: string
  guests: number
  rooms_count?: number
  payment_option?: PaymentOption
  cancellation_policy?: CancellationPolicy
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  special_requests?: string
}

export interface BookingPriceCalculation {
  nights: number
  price_per_night: number
  rooms_count: number
  subtotal: number
  taxes: number
  total: number
  deposit_amount: number | null
}

// ============================================
// PRICE CALCULATION
// ============================================

export async function calculateBookingPrice(
  roomId: string,
  checkIn: string,
  checkOut: string,
  roomsCount: number = 1,
  paymentOption: PaymentOption = 'full'
): Promise<BookingPriceCalculation | null> {
  const room = await getRoomById(roomId)
  if (!room) return null

  const startDate = new Date(checkIn)
  const endDate = new Date(checkOut)
  const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (nights <= 0) return null

  const subtotal = room.price_per_night * nights * roomsCount
  const taxes = subtotal * 0.09 // 9% TVA
  const total = subtotal + taxes

  // Calculate deposit if needed (20% of total)
  const depositAmount = paymentOption === 'deposit' ? total * 0.2 : null

  return {
    nights,
    price_per_night: room.price_per_night,
    rooms_count: roomsCount,
    subtotal,
    taxes,
    total,
    deposit_amount: depositAmount,
  }
}

// ============================================
// BOOKING CRUD
// ============================================

export async function createBooking(input: CreateBookingInput): Promise<Booking | null> {
  const supabase = createClient()

  // Check availability first
  const availabilityCheck = await checkAvailability(
    input.room_id,
    input.check_in,
    input.check_out,
    input.rooms_count || 1
  )

  if (!availabilityCheck.available) {
    logger.error('Room not available for selected dates', {
      roomId: input.room_id,
      unavailableDates: availabilityCheck.unavailableDates
    })
    throw new Error('Camera nu este disponibilă pentru datele selectate')
  }

  // Calculate price
  const pricing = await calculateBookingPrice(
    input.room_id,
    input.check_in,
    input.check_out,
    input.rooms_count || 1,
    input.payment_option || 'full'
  )

  if (!pricing) {
    throw new Error('Nu s-a putut calcula prețul')
  }

  // Create booking
  const bookingData = {
    user_id: input.user_id,
    business_id: input.business_id,
    room_id: input.room_id,
    trip_id: input.trip_id || null,
    check_in: input.check_in,
    check_out: input.check_out,
    guests: input.guests,
    rooms_count: input.rooms_count || 1,
    price_per_night: pricing.price_per_night,
    total_nights: pricing.nights,
    subtotal: pricing.subtotal,
    taxes: pricing.taxes,
    total_price: pricing.total,
    payment_option: input.payment_option || 'full',
    deposit_amount: pricing.deposit_amount,
    cancellation_policy: input.cancellation_policy || 'flexible',
    guest_name: input.guest_name || null,
    guest_email: input.guest_email || null,
    guest_phone: input.guest_phone || null,
    special_requests: input.special_requests || null,
    status: 'pending',
    payment_status: 'pending',
  }

  const { data, error } = await supabase
    .from('hotel_bookings')
    .insert(bookingData)
    .select()
    .single()


  if (error) {
    logger.error('Error creating booking', error, { input })
    throw new Error('Eroare la crearea rezervării')
  }

  // Update room availability (decrease available count)
  await updateAvailabilityOnBooking(
    input.room_id,
    input.check_in,
    input.check_out,
    input.rooms_count || 1,
    'decrease'
  )

  return data
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hotel_bookings')
    .select(`
      *,
      room:hotel_rooms(name, room_type, images),
      business:businesses(name, image_url)
    `)
    .eq('id', bookingId)
    .single()

  if (error) {
    logger.error('Error fetching booking', error, { bookingId })
    return null
  }

  return data
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hotel_bookings')
    .select(`
      *,
      room:hotel_rooms(name, room_type, images),
      business:businesses(name, image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching user bookings', error, { userId })
    return []
  }

  return data || []
}

export async function getBusinessBookings(businessId: string): Promise<Booking[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hotel_bookings')
    .select(`
      *,
      room:hotel_rooms(name, room_type, images)
    `)
    .eq('business_id', businessId)
    .order('check_in', { ascending: true })

  if (error) {
    logger.error('Error fetching business bookings', error, { businessId })
    return []
  }

  return data || []
}

// ============================================
// BOOKING STATUS UPDATES
// ============================================

export async function confirmBooking(bookingId: string): Promise<Booking | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hotel_bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    logger.error('Error confirming booking', error, { bookingId })
    return null
  }

  return data
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; refundAmount: number }> {
  const supabase = createClient()

  // Get booking to calculate refund
  const booking = await getBookingById(bookingId)
  if (!booking) {
    return { success: false, refundAmount: 0 }
  }

  // Calculate refund based on cancellation policy
  const refundAmount = calculateRefund(booking)

  // Update booking status
  const { error } = await supabase
    .from('hotel_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    logger.error('Error cancelling booking', error, { bookingId })
    return { success: false, refundAmount: 0 }
  }

  // Restore room availability
  await updateAvailabilityOnBooking(
    booking.room_id,
    booking.check_in,
    booking.check_out,
    booking.rooms_count,
    'increase'
  )

  return { success: true, refundAmount }
}

// ============================================
// PAYMENT HANDLING
// ============================================

export async function updatePaymentStatus(
  bookingId: string,
  paymentIntentId: string,
  amountPaid: number
): Promise<Booking | null> {
  const supabase = createClient()

  const booking = await getBookingById(bookingId)
  if (!booking) return null

  const newAmountPaid = booking.amount_paid + amountPaid
  let paymentStatus: PaymentStatus = 'pending'

  if (newAmountPaid >= booking.total_price) {
    paymentStatus = 'paid'
  } else if (newAmountPaid > 0) {
    paymentStatus = 'partial'
  }

  const { data, error } = await supabase
    .from('hotel_bookings')
    .update({
      payment_intent_id: paymentIntentId,
      amount_paid: newAmountPaid,
      payment_status: paymentStatus,
      status: paymentStatus === 'paid' ? 'confirmed' : booking.status,
      confirmed_at: paymentStatus === 'paid' ? new Date().toISOString() : booking.confirmed_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    logger.error('Error updating payment status', error, { bookingId })
    return null
  }

  return data
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateRefund(booking: Booking): number {
  const now = new Date()
  const checkIn = new Date(booking.check_in)
  const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  switch (booking.cancellation_policy) {
    case 'flexible':
      // Full refund until check-in day
      return daysUntilCheckIn >= 0 ? booking.amount_paid : 0

    case 'moderate':
      // Full refund 5+ days before, 50% after
      if (daysUntilCheckIn >= 5) return booking.amount_paid
      if (daysUntilCheckIn >= 0) return booking.amount_paid * 0.5
      return 0

    case 'strict':
      // 50% refund 7+ days before, nothing after
      if (daysUntilCheckIn >= 7) return booking.amount_paid * 0.5
      return 0

    default:
      return 0
  }
}

async function updateAvailabilityOnBooking(
  roomId: string,
  checkIn: string,
  checkOut: string,
  roomsCount: number,
  action: 'increase' | 'decrease'
): Promise<void> {
  const supabase = createClient()

  const startDate = new Date(checkIn)
  const endDate = new Date(checkOut)

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]

    // Get current availability
    const { data: current } = await supabase
      .from('room_availability')
      .select('available_count')
      .eq('room_id', roomId)
      .eq('date', dateStr)
      .single()

    const currentCount = current?.available_count || 0
    const newCount = action === 'increase'
      ? currentCount + roomsCount
      : Math.max(0, currentCount - roomsCount)

    await supabase
      .from('room_availability')
      .upsert({
        room_id: roomId,
        date: dateStr,
        available_count: newCount,
      }, { onConflict: 'room_id,date' })
  }
}
