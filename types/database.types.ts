export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number | null
          business_id: string
          business_notes: string | null
          cancellation_deadline: string | null
          cancellation_policy_id: string | null
          created_at: string
          currency: string
          end_at: string
          end_date: string | null
          gift_message: string | null
          gift_recipient_email: string | null
          guest_count: number | null
          id: string
          is_gift: boolean | null
          payment_intent_id: string | null
          persons: number
          refund_amount: number | null
          resource_id: string | null
          start_at: string
          start_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number | null
          trip_id: string | null
          trip_item_id: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
          payment_method: 'prepay_full' | 'split' | null
          split_status: 'collecting' | 'completed' | 'voided' | null
        }
        Insert: {
          amount?: number | null
          business_id: string
          business_notes?: string | null
          cancellation_deadline?: string | null
          cancellation_policy_id?: string | null
          created_at?: string
          currency?: string
          end_at: string
          end_date?: string | null
          gift_message?: string | null
          gift_recipient_email?: string | null
          guest_count?: number | null
          id?: string
          is_gift?: boolean | null
          payment_intent_id?: string | null
          persons?: number
          refund_amount?: number | null
          resource_id?: string | null
          start_at: string
          start_date?: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          trip_id?: string | null
          trip_item_id?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          amount?: number | null
          business_id?: string
          business_notes?: string | null
          cancellation_deadline?: string | null
          cancellation_policy_id?: string | null
          created_at?: string
          currency?: string
          end_at?: string
          end_date?: string | null
          gift_message?: string | null
          gift_recipient_email?: string | null
          guest_count?: number | null
          id?: string
          is_gift?: boolean | null
          payment_intent_id?: string | null
          persons?: number
          refund_amount?: number | null
          resource_id?: string | null
          start_at?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          trip_id?: string | null
          trip_item_id?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "business_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_item_id_fkey"
            columns: ["trip_item_id"]
            isOneToOne: false
            referencedRelation: "trip_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          criteria: Json
          icon_url: string | null
          tier: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          criteria?: Json
          icon_url?: string | null
          tier?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          criteria?: Json
          icon_url?: string | null
          tier?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string | null
          progress: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string | null
          progress?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string | null
          progress?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        ]
      }
      payment_splits: {
        Row: {
          id: string
          booking_id: string | null
          bill_id: string | null
          user_id: string
          amount: number
          status: 'pending' | 'paid' | 'failed'
          stripe_intent_id: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          bill_id?: string | null
          user_id: string
          amount: number
          status?: 'pending' | 'paid' | 'failed'
          stripe_intent_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string | null
          bill_id?: string | null
          user_id?: string
          amount?: number
          status?: 'pending' | 'paid' | 'failed'
          stripe_intent_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      restaurant_bills: {
        Row: {
          id: string
          trip_id: string | null
          restaurant_name: string
          items: Json
          total_amount: number
          status: 'active' | 'paid'
          created_at: string
        }
        Insert: {
          id?: string
          trip_id?: string | null
          restaurant_name: string
          items?: Json
          total_amount: number
          status?: 'active' | 'paid'
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string | null
          restaurant_name?: string
          items?: Json
          total_amount?: number
          status?: 'active' | 'paid'
          created_at?: string
        }
        Relationships: []
      }
      trip_collaborators: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: "admin" | "collaborator"
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: "admin" | "collaborator"
          joined_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: "admin" | "collaborator"
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_collaborators_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_votes: {
        Row: {
          id: string
          trip_id: string
          business_id: string
          user_id: string
          vote: boolean
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          business_id: string
          user_id: string
          vote: boolean
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          business_id?: string
          user_id?: string
          vote?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_votes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_votes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      business_amenities: {
        Row: {
          amenity_id: string
          business_id: string
          created_at: string
          id: string
        }
        Insert: {
          amenity_id: string
          business_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amenity_id?: string
          business_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_amenities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_images: {
        Row: {
          alt_text: string | null
          business_id: string
          created_at: string
          display_order: number | null
          id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          business_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          business_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_resources: {
        Row: {
          availability_schedule: Json | null
          business_id: string
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          name: string
          price: number | null
          price_currency: string | null
          price_unit: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          availability_schedule?: Json | null
          business_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          name: string
          price?: number | null
          price_currency?: string | null
          price_unit?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          availability_schedule?: Json | null
          business_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          name?: string
          price?: number | null
          price_currency?: string | null
          price_unit?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_resources_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          amenities: Json | null
          attributes: Json | null
          category: string
          city_id: string
          contact_email: string | null
          contact_phone: string | null
          contact_website: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string | null
          price_level: number | null
          rating: number | null
          review_count: number | null
          tags: string[] | null
          type: Database["public"]["Enums"]["business_type"] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          attributes?: Json | null
          category: string
          city_id: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["business_type"] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          attributes?: Json | null
          category?: string
          city_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          price_level?: number | null
          rating?: number | null
          review_count?: number | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["business_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          country: string
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          state_province: string | null
          timezone: string | null
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          country?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          state_province?: string | null
          timezone?: string | null
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          country?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_province?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      city_posts: {
        Row: {
          author_id: string
          category: string | null
          city_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          city_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          city_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          location: string | null
          start_date: string
          title: string
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          location?: string | null
          start_date: string
          title: string
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          location?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_offers: {
        Row: {
          airline: string
          arrival_time: string
          booking_link: string | null
          created_at: string
          departure_time: string
          destination: string
          flight_number: string
          id: string
          origin: string
          price: number
          trip_id: string | null
        }
        Insert: {
          airline: string
          arrival_time: string
          booking_link?: string | null
          created_at?: string
          departure_time: string
          destination: string
          flight_number: string
          id?: string
          origin: string
          price: number
          trip_id?: string | null
        }
        Update: {
          airline?: string
          arrival_time?: string
          booking_link?: string | null
          created_at?: string
          departure_time?: string
          destination?: string
          flight_number?: string
          id?: string
          origin?: string
          price?: number
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_offers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_bookings: {
        Row: {
          booking_ref: string
          business_id: string
          check_in_date: string
          check_out_date: string
          confirmed_at: string | null
          created_at: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          guests_count: number
          id: string
          number_of_guests: number
          room_id: string
          special_requests: string | null
          status: string | null
          total_price: number
          trip_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_ref?: string
          business_id: string
          check_in_date: string
          check_out_date: string
          confirmed_at?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          guests_count?: number
          id?: string
          number_of_guests: number
          room_id: string
          special_requests?: string | null
          status?: string | null
          total_price: number
          trip_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_ref?: string
          business_id?: string
          check_in_date?: string
          check_out_date?: string
          confirmed_at?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          guests_count?: number
          id?: string
          number_of_guests?: number
          room_id?: string
          special_requests?: string | null
          status?: string | null
          total_price?: number
          trip_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_rooms: {
        Row: {
          amenities: string[] | null
          available_count: number | null
          business_id: string
          capacity: number
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          name: string
          price_per_night: number
          size_sqm: number | null
          updated_at: string | null
          view_type: string | null
        }
        Insert: {
          amenities?: string[] | null
          available_count?: number | null
          business_id: string
          capacity: number
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          name: string
          price_per_night: number
          size_sqm?: number | null
          updated_at?: string | null
          view_type?: string | null
        }
        Update: {
          amenities?: string[] | null
          available_count?: number | null
          business_id?: string
          capacity?: number
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          name?: string
          price_per_night?: number
          size_sqm?: number | null
          updated_at?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          email: string
          full_name: string | null
          gender: string | null
          home_city_id: string | null
          id: string
          instagram_handle: string | null
          is_onboarded: boolean | null
          metadata: Json | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          onboarding_step: number | null
          persona: string | null
          phone: string | null
          preferences: Json | null
          role: string | null
          theme: string | null
          tiktok_handle: string | null
          travel_style: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gender?: string | null
          home_city_id?: string | null
          id: string
          instagram_handle?: string | null
          is_onboarded?: boolean | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          persona?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          theme?: string | null
          tiktok_handle?: string | null
          travel_style?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gender?: string | null
          home_city_id?: string | null
          id?: string
          instagram_handle?: string | null
          is_onboarded?: boolean | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          persona?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          theme?: string | null
          tiktok_handle?: string | null
          travel_style?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          business_id: string
          city_id: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          is_active: boolean
          promo_code: string | null
          status: Database["public"]["Enums"]["promo_status"] | null
          title: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          business_id: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_code?: string | null
          status?: Database["public"]["Enums"]["promo_status"] | null
          title: string
          valid_from: string
          valid_until: string
        }
        Update: {
          business_id?: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_code?: string | null
          status?: Database["public"]["Enums"]["promo_status"] | null
          title?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_businesses: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_providers: {
        Row: {
          api_key: string | null
          city_id: string
          contact_info: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          api_key?: string | null
          city_id: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          api_key?: string | null
          city_id?: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }

      trip_items: {
        Row: {
          block: string | null
          business_id: string
          created_at: string
          day_index: number
          end_time: string | null
          estimated_cost: number | null
          id: string
          is_booked: boolean
          notes: string | null
          start_time: string | null
          trip_id: string
        }
        Insert: {
          block?: string | null
          business_id: string
          created_at?: string
          day_index: number
          end_time?: string | null
          estimated_cost?: number | null
          id?: string
          is_booked?: boolean
          notes?: string | null
          start_time?: string | null
          trip_id: string
        }
        Update: {
          block?: string | null
          business_id?: string
          created_at?: string
          day_index?: number
          end_time?: string | null
          estimated_cost?: number | null
          id?: string
          is_booked?: boolean
          notes?: string | null
          start_time?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_total: number | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          destination_city_id: string
          end_date: string
          guests: number | null
          invite_token: string | null
          id: string
          is_public: boolean
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_total?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_city_id: string
          end_date: string
          guests?: number | null
          invite_token?: string | null
          id?: string
          is_public?: boolean
          start_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_total?: number | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_city_id?: string
          end_date?: string
          guests?: number | null
          invite_token?: string | null
          id?: string
          is_public?: boolean
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          activity_prefs: string[] | null
          budget_split_activities: number | null
          budget_split_food: number | null
          budget_split_hotel: number | null
          created_at: string
          currency: string
          email_notifications_newsletter: boolean | null
          email_notifications_offers: boolean | null
          food_prefs: string[] | null
          id: string
          notification_enabled: boolean
          preferred_language: string
          push_notifications_checkin: boolean | null
          push_notifications_urgent: boolean | null
          travel_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_prefs?: string[] | null
          budget_split_activities?: number | null
          budget_split_food?: number | null
          budget_split_hotel?: number | null
          created_at?: string
          currency?: string
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          food_prefs?: string[] | null
          id?: string
          notification_enabled?: boolean
          preferred_language?: string
          push_notifications_checkin?: boolean | null
          push_notifications_urgent?: boolean | null
          travel_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_prefs?: string[] | null
          budget_split_activities?: number | null
          budget_split_food?: number | null
          budget_split_hotel?: number | null
          created_at?: string
          currency?: string
          email_notifications_newsletter?: boolean | null
          email_notifications_offers?: boolean | null
          food_prefs?: string[] | null
          id?: string
          notification_enabled?: boolean
          preferred_language?: string
          push_notifications_checkin?: boolean | null
          push_notifications_urgent?: boolean | null
          travel_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_swipes: {
        Row: {
          action: string
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_swipes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status:
      | "pending"
      | "awaiting_payment"
      | "confirmed"
      | "cancelled"
      | "completed"
      | "no_show"
      | "failed"
      business_type:
      | "hotel"
      | "restaurant"
      | "cafe"
      | "activity"
      | "nature_spot"
      | "transport_partner"
      | "other"
      promo_status: "draft" | "active" | "paused" | "ended"
      resource_kind:
      | "room"
      | "table"
      | "slot"
      | "open_access"
      | "menu_section"
      | "menu_item"
      trip_status: "draft" | "generated" | "active" | "archived"
      user_role: "user" | "business" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any, Views: any }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"]
    : never)
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any, Views: any }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
        Row: infer R
      }
    ? R
    : never
    : never)
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never)
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
    : never)
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never)
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
    : never)
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicEnumNameOrOptions["schema"]] extends { Enums: any }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never)
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]] extends { Enums: any }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : never)
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[PublicCompositeTypeNameOrOptions["schema"]] extends { CompositeTypes: any }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never)
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicCompositeTypeNameOrOptions["schema"]] extends { CompositeTypes: any }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : never)
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
