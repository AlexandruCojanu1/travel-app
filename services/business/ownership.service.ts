import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface Business {
  id: string
  name: string
  category: string
  city_id: string
  owner_user_id: string | null
  [key: string]: unknown
}

/**
 * Centralized service for business ownership verification
 * Standardizes on owner_user_id column
 */
export class BusinessOwnershipService {
  /**
   * Check if a user owns a specific business
   * Client-side version
   */
  static async isOwner(businessId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient()
      
      const { data: business, error } = await supabase
        .from('businesses')
        .select('owner_user_id')
        .eq('id', businessId)
        .single()

      if (error) {
        logger.warn('Business ownership check failed', {
          businessId,
          userId,
          error: error.message,
          code: error.code,
        })
        return false
      }

      return business?.owner_user_id === userId
    } catch (error) {
      logger.error('Error checking business ownership', error, {
        businessId,
        userId,
      })
      return false
    }
  }

  /**
   * Check if a user owns a specific business
   * Server-side version
   */
  static async isOwnerServer(businessId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createServerClient()
      
      const { data: business, error } = await supabase
        .from('businesses')
        .select('owner_user_id')
        .eq('id', businessId)
        .single()

      if (error) {
        logger.warn('Business ownership check failed (server)', {
          businessId,
          userId,
          error: error.message,
          code: error.code,
        })
        return false
      }

      return business?.owner_user_id === userId
    } catch (error) {
      logger.error('Error checking business ownership (server)', error, {
        businessId,
        userId,
      })
      return false
    }
  }

  /**
   * Verify business ownership and throw if user doesn't own it
   * Client-side version
   */
  static async verifyOwnership(businessId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwner(businessId, userId)
    if (!isOwner) {
      throw new Error('Access denied: User does not own this business')
    }
  }

  /**
   * Verify business ownership and throw if user doesn't own it
   * Server-side version
   */
  static async verifyOwnershipServer(businessId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwnerServer(businessId, userId)
    if (!isOwner) {
      throw new Error('Access denied: User does not own this business')
    }
  }

  /**
   * Get all businesses owned by a user
   * Client-side version
   */
  static async getUserBusinesses(userId: string): Promise<Business[]> {
    try {
      const supabase = createClient()
      
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching user businesses', error, { userId })
        return []
      }

      return (businesses || []) as Business[]
    } catch (error) {
      logger.error('Error in getUserBusinesses', error, { userId })
      return []
    }
  }

  /**
   * Get all businesses owned by a user
   * Server-side version
   */
  static async getUserBusinessesServer(userId: string): Promise<Business[]> {
    try {
      const supabase = await createServerClient()
      
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching user businesses (server)', error, { userId })
        return []
      }

      return (businesses || []) as Business[]
    } catch (error) {
      logger.error('Error in getUserBusinessesServer', error, { userId })
      return []
    }
  }

  /**
   * Check if user owns any businesses
   * Client-side version
   */
  static async userHasBusinesses(userId: string): Promise<boolean> {
    try {
      const businesses = await this.getUserBusinesses(userId)
      return businesses.length > 0
    } catch (error) {
      logger.error('Error checking if user has businesses', error, { userId })
      return false
    }
  }

  /**
   * Check if user owns any businesses
   * Server-side version
   */
  static async userHasBusinessesServer(userId: string): Promise<boolean> {
    try {
      const businesses = await this.getUserBusinessesServer(userId)
      return businesses.length > 0
    } catch (error) {
      logger.error('Error checking if user has businesses (server)', error, { userId })
      return false
    }
  }
}

