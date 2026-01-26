'use server'

import { 
  getBusinessById as getBusinessByIdService,
  recordSwipe as recordSwipeService,
  type Business,
  type MapBusiness
} from '@/services/business/business.service'

// Re-export types for client components
export type { Business, MapBusiness }

/**
 * Get business by ID
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  return await getBusinessByIdService(id)
}

/**
 * Record a swipe action on a business
 */
export async function recordSwipe(
  userId: string,
  businessId: string,
  direction: 'left' | 'right' | 'like' | 'pass'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Normalize to 'like' or 'pass' for the service
    let action: 'like' | 'pass'
    if (direction === 'right' || direction === 'like') {
      action = 'like'
    } else {
      action = 'pass'
    }
    await recordSwipeService(userId, businessId, action)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
