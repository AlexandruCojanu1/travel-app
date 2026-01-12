import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

// ============================================
// TYPES
// ============================================

export interface HotelRoom {
    id: string
    business_id: string
    room_type: string
    name: string
    description: string | null
    price_per_night: number
    max_guests: number
    total_rooms: number
    amenities: string[]
    images: string[]
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface RoomAvailability {
    id: string
    room_id: string
    date: string
    available_count: number
    price_override: number | null
}

export interface CreateRoomInput {
    business_id: string
    room_type: string
    name: string
    description?: string
    price_per_night: number
    max_guests: number
    total_rooms: number
    amenities?: string[]
    images?: string[]
}

// ============================================
// ROOM CRUD OPERATIONS
// ============================================

export async function getRoomsByHotel(businessId: string): Promise<HotelRoom[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('price_per_night', { ascending: true })

    if (error) {
        logger.error('Error fetching hotel rooms', error, { businessId })
        return []
    }

    return data || []
}

export async function getRoomById(roomId: string): Promise<HotelRoom | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

    if (error) {
        logger.error('Error fetching room', error, { roomId })
        return null
    }

    return data
}

export async function createRoom(input: CreateRoomInput): Promise<HotelRoom | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('hotel_rooms')
        .insert({
            business_id: input.business_id,
            room_type: input.room_type,
            name: input.name,
            description: input.description || null,
            price_per_night: input.price_per_night,
            max_guests: input.max_guests,
            total_rooms: input.total_rooms,
            amenities: input.amenities || [],
            images: input.images || [],
        })
        .select()
        .single()

    if (error) {
        logger.error('Error creating room', error, { input })
        return null
    }

    return data
}

export async function updateRoom(
    roomId: string,
    updates: Partial<CreateRoomInput>
): Promise<HotelRoom | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('hotel_rooms')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .single()

    if (error) {
        logger.error('Error updating room', error, { roomId, updates })
        return null
    }

    return data
}

export async function deleteRoom(roomId: string): Promise<boolean> {
    const supabase = createClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase
        .from('hotel_rooms')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', roomId)

    if (error) {
        logger.error('Error deleting room', error, { roomId })
        return false
    }

    return true
}

// ============================================
// AVAILABILITY MANAGEMENT
// ============================================

export async function setRoomAvailability(
    roomId: string,
    dates: { date: string; available_count: number; price_override?: number }[]
): Promise<boolean> {
    const supabase = createClient()

    // Upsert availability for each date
    const { error } = await supabase
        .from('room_availability')
        .upsert(
            dates.map(d => ({
                room_id: roomId,
                date: d.date,
                available_count: d.available_count,
                price_override: d.price_override || null,
            })),
            { onConflict: 'room_id,date' }
        )

    if (error) {
        logger.error('Error setting room availability', error, { roomId, dates })
        return false
    }

    return true
}

export async function getRoomAvailability(
    roomId: string,
    startDate: string,
    endDate: string
): Promise<RoomAvailability[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('room_availability')
        .select('*')
        .eq('room_id', roomId)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true })

    if (error) {
        logger.error('Error fetching room availability', error, { roomId, startDate, endDate })
        return []
    }

    return data || []
}

export async function checkAvailability(
    roomId: string,
    checkIn: string,
    checkOut: string,
    roomsNeeded: number = 1
): Promise<{ available: boolean; unavailableDates: string[] }> {
    const availability = await getRoomAvailability(roomId, checkIn, checkOut)

    const unavailableDates: string[] = []
    const dateMap = new Map(availability.map(a => [a.date, a.available_count]))

    // Check each date
    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const available = dateMap.get(dateStr) || 0

        if (available < roomsNeeded) {
            unavailableDates.push(dateStr)
        }
    }

    return {
        available: unavailableDates.length === 0,
        unavailableDates,
    }
}

// ============================================
// ROOM INITIALIZATION
// ============================================

/**
 * Initialize availability for a room for the next N days
 */
export async function initializeRoomAvailability(
    roomId: string,
    daysAhead: number = 365
): Promise<boolean> {
    const room = await getRoomById(roomId)
    if (!room) return false

    const dates: { date: string; available_count: number }[] = []
    const today = new Date()

    for (let i = 0; i < daysAhead; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push({
            date: date.toISOString().split('T')[0],
            available_count: room.total_rooms,
        })
    }

    return setRoomAvailability(roomId, dates)
}
