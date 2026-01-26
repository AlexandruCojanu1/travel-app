/**
 * API Client for communicating with the backend server
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface ApiError {
  error: string
  code?: string
  statusCode?: number
}

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = 'An error occurred'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Auth
  async verifyToken(token: string) {
    return this.request<{ valid: boolean; user?: any }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me')
  }

  // Bookings
  async createBooking(data: any) {
    return this.request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBookings() {
    return this.request<any[]>('/bookings')
  }

  async getBooking(id: string) {
    return this.request<any>(`/bookings/${id}`)
  }

  async cancelBooking(id: string, reason?: string) {
    return this.request<any>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async calculateBookingPrice(data: {
    room_id: string
    check_in: string
    check_out: string
    rooms_count?: number
  }) {
    return this.request<any>('/bookings/calculate-price', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Businesses
  async getBusinesses(params?: {
    city_id?: string
    category?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<{ businesses: any[]; total: number }>(`/businesses${query ? `?${query}` : ''}`)
  }

  async getBusiness(id: string) {
    return this.request<any>(`/businesses/${id}`)
  }

  async getMapMarkers(params?: { city_id?: string; category?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<any[]>(`/businesses/map/markers${query ? `?${query}` : ''}`)
  }

  async recordSwipe(businessId: string, action: 'like' | 'pass') {
    return this.request<{ success: boolean }>(`/businesses/${businessId}/swipe`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }

  async saveBusiness(businessId: string) {
    return this.request<{ success: boolean }>(`/businesses/${businessId}/save`, {
      method: 'POST',
    })
  }

  async unsaveBusiness(businessId: string) {
    return this.request<{ success: boolean }>(`/businesses/${businessId}/save`, {
      method: 'DELETE',
    })
  }

  async getSavedBusinesses() {
    return this.request<any[]>('/businesses/user/saved')
  }

  // Payments
  async createPaymentIntent(data: any) {
    return this.request<{
      clientSecret: string
      id: string
      amount: number
    }>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Trips
  async getTrips() {
    return this.request<any[]>('/trips')
  }

  async getTrip(id: string) {
    return this.request<any>(`/trips/${id}`)
  }

  async createTrip(data: any) {
    return this.request<any>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTrip(id: string, data: any) {
    return this.request<any>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTrip(id: string) {
    return this.request<{ success: boolean }>(`/trips/${id}`, {
      method: 'DELETE',
    })
  }

  async addBusinessToTrip(tripId: string, businessId: string, dayIndex?: number) {
    return this.request<any>(`/trips/${tripId}/businesses`, {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, day_index: dayIndex }),
    })
  }

  async removeBusinessFromTrip(tripId: string, businessId: string) {
    return this.request<{ success: boolean }>(`/trips/${tripId}/businesses/${businessId}`, {
      method: 'DELETE',
    })
  }

  async generateTripInvite(tripId: string) {
    return this.request<{ token: string; invite_url: string }>(`/trips/${tripId}/invite`, {
      method: 'POST',
    })
  }

  async joinTrip(token: string) {
    return this.request<{ success: boolean; trip_id: string }>(`/trips/join/${token}`, {
      method: 'POST',
    })
  }

  async voteForBusiness(tripId: string, businessId: string, vote: 'up' | 'down') {
    return this.request<{ success: boolean }>(`/trips/${tripId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, vote }),
    })
  }

  // Reviews
  async getBusinessReviews(businessId: string, params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<{ reviews: any[]; total: number }>(
      `/reviews/business/${businessId}${query ? `?${query}` : ''}`
    )
  }

  async createReview(data: { business_id: string; rating: number; content: string; images?: string[] }) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Weather
  async getWeather(lat: number, lng: number, city?: string) {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
    if (city) params.append('city', city)
    return this.request<any>(`/weather?${params}`)
  }

  // Gamification
  async getPassport() {
    return this.request<{ xp: number; coins: number; level: number; stamps: any[] }>('/gamification/passport')
  }

  async getAchievements() {
    return this.request<any[]>('/gamification/achievements')
  }

  async getAvailableAchievements() {
    return this.request<any[]>('/gamification/achievements/available')
  }

  async getQuests() {
    return this.request<any[]>('/gamification/quests')
  }

  async getAvailableQuests() {
    return this.request<any[]>('/gamification/quests/available')
  }

  async startQuest(questId: string) {
    return this.request<any>(`/gamification/quests/${questId}/start`, {
      method: 'POST',
    })
  }

  async checkin(businessId: string, cityId?: string) {
    return this.request<any>('/gamification/checkin', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, city_id: cityId }),
    })
  }

  // Admin
  async getAdminData(table: string, params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams({ table })
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    return this.request<any>(`/admin?${searchParams}`)
  }

  async createAdminRecord(table: string, data: any) {
    return this.request<any>('/admin', {
      method: 'POST',
      body: JSON.stringify({ table, data }),
    })
  }

  async updateAdminRecord(table: string, id: string, data: any) {
    return this.request<any>(`/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ table, data }),
    })
  }

  async deleteAdminRecord(table: string, id: string) {
    return this.request<{ success: boolean }>(`/admin/${id}?table=${table}`, {
      method: 'DELETE',
    })
  }

  async getAlgorithmSettings() {
    return this.request<any>('/admin/algorithm')
  }

  async updateAlgorithmSettings(weights: Record<string, number>) {
    return this.request<any>('/admin/algorithm', {
      method: 'PUT',
      body: JSON.stringify({ weights }),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }
