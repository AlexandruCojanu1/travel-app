import { z } from 'zod'

/**
 * Base business schema - common fields for all business types
 */
export const baseBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  tagline: z.string().max(100).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string()
    .transform((val) => {
      if (!val) return val;
      if (!/^https?:\/\//i.test(val)) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.string().url().optional().or(z.literal('')))
    .or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  category: z.string(),
  city_id: z.string().uuid(),
  address_line: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  image_url: z.string().url().optional().or(z.literal('')),
  image_urls: z.array(z.string().url()).optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  social_media: z.record(z.string()).optional(),
  operating_hours: z.record(z.string()).optional(),
  facilities: z.record(z.any()).optional(),
})

/**
 * Hotel-specific fields
 */
export const hotelFieldsSchema = z.object({
  star_rating: z.number().min(1).max(5).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  amenities: z.array(z.string()).optional(),
}).optional()

/**
 * Restaurant-specific fields
 */
export const restaurantFieldsSchema = z.object({
  cuisine_type: z.array(z.string()).optional(),
  price_level: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
  accepts_reservations: z.boolean().optional(),
}).optional()

/**
 * Nature/Hiking-specific fields
 */
export const natureFieldsSchema = z.object({
  difficulty: z.enum(['Easy', 'Moderate', 'Hard', 'Expert']).optional(),
  length_km: z.number().positive().optional(),
  elevation_gain_m: z.number().optional(),
  estimated_duration_hours: z.number().positive().optional(),
  trail_conditions: z.string().optional(),
}).optional()

/**
 * Spa/Activity-specific fields
 */
export const spaFieldsSchema = z.object({
  activity_type: z.string().optional(),
  duration_minutes: z.number().positive().optional(),
  max_participants: z.number().positive().optional(),
  equipment_provided: z.boolean().optional(),
}).optional()

/**
 * Combined business schema
 * Merges base schema with type-specific schemas
 */
export const businessSchema = baseBusinessSchema.extend({
  // Hotel fields
  star_rating: z.number().min(1).max(5).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  // Restaurant fields
  cuisine_type: z.array(z.string()).optional(),
  price_level: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
  accepts_reservations: z.boolean().optional(),
  // Nature fields
  difficulty: z.enum(['Easy', 'Moderate', 'Hard', 'Expert']).optional(),
  length_km: z.number().positive().optional(),
  elevation_gain_m: z.number().optional(),
  estimated_duration_hours: z.number().positive().optional(),
  trail_conditions: z.string().optional(),
  // Spa/Activity fields
  activity_type: z.string().optional(),
  duration_minutes: z.number().positive().optional(),
  max_participants: z.number().positive().optional(),
  equipment_provided: z.boolean().optional(),
})

export type BusinessInput = z.infer<typeof businessSchema>
