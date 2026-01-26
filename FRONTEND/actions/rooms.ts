'use server'

import { 
  getRoomsByHotel as getRoomsByHotelService,
  getRoomById as getRoomByIdService,
  checkAvailability as checkAvailabilityService,
  createRoom as createRoomService,
  updateRoom as updateRoomService,
  deleteRoom as deleteRoomService,
  type HotelRoom,
  type CreateRoomInput
} from '@/services/hotel/room.service'

// Re-export types for client components
export type { HotelRoom, CreateRoomInput }

/**
 * Get all rooms for a hotel
 */
export async function getRoomsByHotel(hotelId: string): Promise<HotelRoom[]> {
  return await getRoomsByHotelService(hotelId)
}

/**
 * Get room by ID
 */
export async function getRoomById(roomId: string): Promise<HotelRoom | null> {
  return await getRoomByIdService(roomId)
}

/**
 * Check room availability
 */
export async function checkAvailability(
  roomId: string,
  checkIn: Date | string,
  checkOut: Date | string,
  roomsNeeded: number = 1
): Promise<{ available: boolean; unavailableDates: string[] }> {
  const checkInStr = checkIn instanceof Date ? checkIn.toISOString().split('T')[0] : checkIn
  const checkOutStr = checkOut instanceof Date ? checkOut.toISOString().split('T')[0] : checkOut
  return await checkAvailabilityService(roomId, checkInStr, checkOutStr, roomsNeeded)
}

/**
 * Create a new room
 */
export async function createRoom(input: CreateRoomInput): Promise<{ success: boolean; room?: HotelRoom; error?: string }> {
  try {
    const room = await createRoomService(input)
    if (!room) {
      return { success: false, error: 'Failed to create room' }
    }
    return { success: true, room }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create room' }
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(
  roomId: string, 
  updates: Partial<CreateRoomInput>
): Promise<{ success: boolean; room?: HotelRoom; error?: string }> {
  try {
    const room = await updateRoomService(roomId, updates)
    if (!room) {
      return { success: false, error: 'Failed to update room' }
    }
    return { success: true, room }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update room' }
  }
}

/**
 * Delete a room (soft delete)
 */
export async function deleteRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await deleteRoomService(roomId)
    if (!result) {
      return { success: false, error: 'Failed to delete room' }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete room' }
  }
}
