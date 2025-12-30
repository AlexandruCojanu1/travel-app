export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          home_city_id: string | null
          role: 'tourist' | 'local' | null
          phone: string | null
          birth_date: string | null
          gender: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme: 'light' | 'dark' | 'system' | null
          two_factor_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
          phone?: string | null
          birth_date?: string | null
          gender?: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme?: 'light' | 'dark' | 'system' | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
          phone?: string | null
          birth_date?: string | null
          gender?: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme?: 'light' | 'dark' | 'system' | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          country: string
          state_province: string | null
          latitude: number
          longitude: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          state_province?: string | null
          latitude: number
          longitude: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          state_province?: string | null
          latitude?: number
          longitude?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_language: string
          currency: string
          notification_enabled: boolean
          travel_style: string | null
          budget_split_hotel: number | null
          budget_split_food: number | null
          budget_split_activities: number | null
          activity_prefs: string[] | null
          food_prefs: string[] | null
          push_notifications_urgent: boolean | null
          push_notifications_checkin: boolean | null
          email_notifications_newsletter: boolean | null
          email_notifications_offers: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_language?: string
          currency?: string
          notification_enabled?: boolean
          travel_style?: string | null
          budget_split_hotel?: number | null
          budget_split_food?: number | null
          budget_split_activities?: number | null
          activity_prefs?: string[] | null
          food_prefs?: string[] | null
          push_notifications_urgent?: boolean | null
          push_notifications_checkin?: boolean | null
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_language?: string
          currency?: string
          notification_enabled?: boolean
          travel_style?: string | null
          budget_split_hotel?: number | null
          budget_split_food?: number | null
          budget_split_activities?: number | null
          activity_prefs?: string[] | null
          food_prefs?: string[] | null
          push_notifications_urgent?: boolean | null
          push_notifications_checkin?: boolean | null
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          title: string
          destination_city_id: string
          start_date: string
          end_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          destination_city_id: string
          start_date: string
          end_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination_city_id?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          business_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      city_posts: {
        Row: {
          id: string
          city_id: string
          author_id: string
          title: string
          content: string
          excerpt: string | null
          image_url: string | null
          category: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id: string
          author_id: string
          title: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          category?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          author_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          category?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          city_id: string
          name: string
          description: string | null
          category: string
          address: string | null
          latitude: number | null
          longitude: number | null
          image_url: string | null
          rating: number | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          description?: string | null
          category: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          rating?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          description?: string | null
          category?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          rating?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          discount_percentage: number | null
          is_active: boolean
          valid_from: string
          valid_until: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          discount_percentage?: number | null
          is_active?: boolean
          valid_from: string
          valid_until: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          discount_percentage?: number | null
          is_active?: boolean
          valid_from?: string
          valid_until?: string
          created_at?: string
        }
      }
    }
  }
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          home_city_id: string | null
          role: 'tourist' | 'local' | null
          phone: string | null
          birth_date: string | null
          gender: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme: 'light' | 'dark' | 'system' | null
          two_factor_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
          phone?: string | null
          birth_date?: string | null
          gender?: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme?: 'light' | 'dark' | 'system' | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
          phone?: string | null
          birth_date?: string | null
          gender?: 'masculin' | 'feminin' | 'prefer-sa-nu-spun' | null
          theme?: 'light' | 'dark' | 'system' | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          country: string
          state_province: string | null
          latitude: number
          longitude: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          state_province?: string | null
          latitude: number
          longitude: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          state_province?: string | null
          latitude?: number
          longitude?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_language: string
          currency: string
          notification_enabled: boolean
          travel_style: string | null
          budget_split_hotel: number | null
          budget_split_food: number | null
          budget_split_activities: number | null
          activity_prefs: string[] | null
          food_prefs: string[] | null
          push_notifications_urgent: boolean | null
          push_notifications_checkin: boolean | null
          email_notifications_newsletter: boolean | null
          email_notifications_offers: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_language?: string
          currency?: string
          notification_enabled?: boolean
          travel_style?: string | null
          budget_split_hotel?: number | null
          budget_split_food?: number | null
          budget_split_activities?: number | null
          activity_prefs?: string[] | null
          food_prefs?: string[] | null
          push_notifications_urgent?: boolean | null
          push_notifications_checkin?: boolean | null
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_language?: string
          currency?: string
          notification_enabled?: boolean
          travel_style?: string | null
          budget_split_hotel?: number | null
          budget_split_food?: number | null
          budget_split_activities?: number | null
          activity_prefs?: string[] | null
          food_prefs?: string[] | null
          push_notifications_urgent?: boolean | null
          push_notifications_checkin?: boolean | null
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          title: string
          destination_city_id: string
          start_date: string
          end_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          destination_city_id: string
          start_date: string
          end_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination_city_id?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          business_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      city_posts: {
        Row: {
          id: string
          city_id: string
          author_id: string
          title: string
          content: string
          excerpt: string | null
          image_url: string | null
          category: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id: string
          author_id: string
          title: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          category?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          author_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          category?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          city_id: string
          name: string
          description: string | null
          category: string
          address: string | null
          latitude: number | null
          longitude: number | null
          image_url: string | null
          rating: number | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          description?: string | null
          category: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          rating?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          description?: string | null
          category?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          rating?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          discount_percentage: number | null
          is_active: boolean
          valid_from: string
          valid_until: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          discount_percentage?: number | null
          is_active?: boolean
          valid_from: string
          valid_until: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          discount_percentage?: number | null
          is_active?: boolean
          valid_from?: string
          valid_until?: string
          created_at?: string
        }
      }
    }
  }
}


