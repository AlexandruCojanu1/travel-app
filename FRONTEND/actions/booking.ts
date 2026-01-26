'use server'

import { 
  createBooking as createBookingService,
  calculateBookingPrice as calculateBookingPriceService,
  confirmBooking as confirmBookingService,
  cancelBooking as cancelBookingService,
  type Booking,
  type BookingStatus,
  type PaymentStatus,
  type PaymentOption,
  type CancellationPolicy,
  type BookingPriceCalculation,
  type CreateBookingInput
} from '@/services/booking/booking.service'

// Re-export types for client components
export type { 
  Booking, 
  BookingStatus, 
  PaymentStatus, 
  PaymentOption, 
  CancellationPolicy,
  BookingPriceCalculation,
  CreateBookingInput
}

/**
 * Create a new booking
 */
export async function createBooking(params: CreateBookingInput): Promise<{ success: boolean; booking?: Booking | null; error?: string }> {
  try {
    const booking = await createBookingService(params)
    if (!booking) {
      return { success: false, error: 'Failed to create booking' }
    }
    return { success: true, booking }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create booking' }
  }
}

/**
 * Calculate booking price
 */
export async function calculateBookingPrice(
  roomId: string,
  checkIn: Date | string,
  checkOut: Date | string,
  roomsCount: number,
  paymentOption?: PaymentOption
): Promise<BookingPriceCalculation | null> {
  const checkInStr = checkIn instanceof Date ? checkIn.toISOString().split('T')[0] : checkIn
  const checkOutStr = checkOut instanceof Date ? checkOut.toISOString().split('T')[0] : checkOut
  return await calculateBookingPriceService(roomId, checkInStr, checkOutStr, roomsCount, paymentOption)
}

/**
 * Confirm a booking
 */
export async function confirmBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await confirmBookingService(bookingId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm booking' }
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await cancelBookingService(bookingId, reason)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' }
  }
}
