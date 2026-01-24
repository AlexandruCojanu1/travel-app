
import { createClient } from '@/lib/supabase/client'
import { Vacation } from '@/store/vacation-store'

export async function fetchUserVacations(userId: string): Promise<Vacation[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('trips')
        .select('*, cities(id, name, latitude, longitude), trip_items(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
            console.warn('[VacationService] RLS or schema issue detected during fetch')
        }
        throw new Error(error.message)
    }

    return (data || []).map((trip: any) => ({
        id: trip.id,
        title: trip.title || trip.cities?.name || 'Destinație',
        cityId: trip.city_id,
        cityName: trip.cities?.name || 'Necunoscut',
        startDate: trip.start_date,
        endDate: trip.end_date,
        budgetTotal: trip.budget_total || 0,
        currency: 'RON',
        spotsCount: (trip.trip_items && trip.trip_items[0]) ? trip.trip_items[0].count : 0,
        status: trip.status || 'planning',
        coverImage: trip.cover_image,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at || trip.created_at,
    }))
}

export async function createVacation(
    vacationData: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt' | 'spotsCount' | 'currency'>,
    userId: string
): Promise<Vacation> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('trips')
        .insert({
            user_id: userId,
            city_id: vacationData.cityId,
            title: vacationData.title,
            start_date: vacationData.startDate,
            end_date: vacationData.endDate,
            budget_total: vacationData.budgetTotal,
            status: vacationData.status || 'planning',
        })
        .select('*, cities(id, name)')
        .single()

    if (error) throw new Error(error.message)

    return {
        id: data.id,
        title: data.title || (data as any).cities?.name || 'Destinație',
        cityId: data.city_id,
        cityName: (data as any).cities?.name || 'Necunoscut',
        startDate: data.start_date,
        endDate: data.end_date,
        budgetTotal: data.budget_total || 0,
        currency: 'RON',
        spotsCount: 0,
        status: (data.status as 'planning' | 'active' | 'completed') || 'planning',
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
    }
}

export async function updateVacation(id: string, updates: Partial<Vacation>): Promise<void> {
    const supabase = createClient()

    const dbUpdates: any = {
        updated_at: new Date().toISOString(),
    }

    if (updates.title) dbUpdates.title = updates.title
    if (updates.cityId) dbUpdates.city_id = updates.cityId
    if (updates.startDate) dbUpdates.start_date = updates.startDate
    if (updates.endDate) dbUpdates.end_date = updates.endDate
    if (updates.budgetTotal !== undefined) dbUpdates.budget_total = updates.budgetTotal
    if (updates.status) dbUpdates.status = updates.status

    const { error } = await supabase
        .from('trips')
        .update(dbUpdates)
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function deleteVacation(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
}

export async function getCityById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}
