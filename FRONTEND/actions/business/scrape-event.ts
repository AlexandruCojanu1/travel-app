'use server'

/**
 * Scrape event functionality - This should be called through the backend API
 * For now, we return a placeholder that indicates the feature is not available
 * in the frontend-only context.
 */

export interface ScrapedEvent {
  title: string
  description: string | null
  date_start: string | null
  date_end: string | null
  time_start: string | null
  time_end: string | null
  location: string | null
  image_url: string | null
  source_url: string
}

export async function scrapeAndSaveEvent(
  url: string,
  businessId: string
): Promise<{ success: boolean; event?: ScrapedEvent; error?: string }> {
  // This functionality has been moved to the backend
  // Use the backend API endpoint instead
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const response = await fetch(`${apiUrl}/events/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, business_id: businessId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to scrape event' }
    }

    const event = await response.json()
    return { success: true, event }
  } catch (error) {
    return { 
      success: false, 
      error: 'Event scraping is temporarily unavailable. Please add event details manually.' 
    }
  }
}
