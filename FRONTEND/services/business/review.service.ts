
import { createClient } from '@/lib/supabase/client'

export interface Review {
    id: string
    business_id: string
    user_id: string
    rating: number
    content: string
    created_at: string
    user?: {
        name: string
        avatar_url: string
    }
}

export interface CreateReviewInput {
    business_id: string
    user_id: string
    rating: number
    content: string
}

export async function getBusinessReviews(businessId: string): Promise<Review[]> {
    const supabase = createClient()

    // In a real app we would join with a profiles table. 
    // For now we might not have a public profiles table set up for joining easily in one query 
    // if 'auth.users' is protected. 
    // Assuming we have a 'profiles' table or similar. If not, we'll just return the review.

    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            profile:profiles(full_name, avatar_url)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching reviews:', error)
        return []
    }

    return data.map((review: any) => ({
        ...review,
        user: {
            name: review.profile?.full_name || 'Utilizator',
            avatar_url: review.profile?.avatar_url
        }
    }))
}

export async function createReview(input: CreateReviewInput): Promise<Review | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('reviews')
        .insert(input)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
