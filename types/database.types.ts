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
          full_name: string | null
          avatar_url: string | null
          home_city_id: string | null
          role: 'tourist' | 'local' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          home_city_id?: string | null
          role?: 'tourist' | 'local' | null
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
          owner_user_id: string | null
          type: string | null
          lat: number | null
          lng: number | null
          address_line: string | null
          phone: string | null
          website: string | null
          tagline: string | null
          logo_url: string | null
          cover_image_url: string | null
          email: string | null
          social_media: Json | null
          operating_hours: Json | null
          facilities: Json | null
          attributes: Json | null
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
          owner_user_id?: string | null
          type?: string | null
          lat?: number | null
          lng?: number | null
          address_line?: string | null
          phone?: string | null
          website?: string | null
          tagline?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          email?: string | null
          social_media?: Json | null
          operating_hours?: Json | null
          facilities?: Json | null
          attributes?: Json | null
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
          owner_user_id?: string | null
          type?: string | null
          lat?: number | null
          lng?: number | null
          address_line?: string | null
          phone?: string | null
          website?: string | null
          tagline?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          email?: string | null
          social_media?: Json | null
          operating_hours?: Json | null
          facilities?: Json | null
          attributes?: Json | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Json | null
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
    }
  }
}
