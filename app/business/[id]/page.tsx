"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Loader2, Settings, Edit } from 'lucide-react'
import { HeroParallax } from '@/components/features/business/public/hero-parallax'
import { AttributeGrid } from '@/components/features/business/public/attribute-grid'
import { StickyActionBar } from '@/components/features/business/public/sticky-action-bar'
import { Gallery } from '@/components/features/business/public/gallery'
import { ReviewsSection } from '@/components/features/business/public/reviews-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { Button } from '@/components/shared/ui/button'
import { getBusinessById, type Business } from '@/services/business/business.service'
import { createClient } from '@/lib/supabase/client'
// Removed server-side ownership service import - using client-side check instead
import { logger } from '@/lib/logger'
import type { Review } from '@/components/features/business/public/review-card'

interface BusinessResource {
  id: string
  business_id: string
  name: string
  description: string | null
  image_url: string | null
  attributes: Record<string, any>
  created_at: string
}


export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [resources, setResources] = useState<BusinessResource[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [attributes, setAttributes] = useState<Record<string, any>>({})
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    async function loadBusinessData() {
      if (!businessId) return

      setIsLoading(true)
      try {
        const supabase = createClient()
        
        // Check if user is authenticated and is the owner
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check ownership using client-side query
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('owner_user_id')
            .eq('id', businessId)
            .single()
          
          setIsOwner(!businessError && business?.owner_user_id === user.id)
        }

        // Fetch business
        const businessData = await getBusinessById(businessId)
        if (!businessData) {
          logger.error('Business not found', undefined, { businessId })
          return
        }
        setBusiness(businessData)

        // Fetch business resources (if table exists)
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('business_resources')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: true })

        if (!resourcesError && resourcesData) {
          setResources(resourcesData)
          // Extract attributes from first resource if available
          if (resourcesData.length > 0 && resourcesData[0].attributes) {
            setAttributes(resourcesData[0].attributes)
          }
        }

        // Fetch reviews (if table exists)
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!reviewsError && reviewsData) {
          // Fetch user profiles for reviews
          const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))]
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds)

          const profilesMap = new Map(
            (profilesData || []).map((p: any) => [p.id, p])
          )

          setReviews(
            reviewsData.map((review: any) => {
              const profile = profilesMap.get(review.user_id)
              return {
                id: review.id,
                user_id: review.user_id,
                business_id: review.business_id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at,
                user_name: profile?.full_name || 'Anonymous',
                user_avatar: profile?.avatar_url || null,
              }
            })
          )
        }
      } catch (error) {
        console.error('Error loading business data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinessData()
  }, [businessId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-airbnb-red" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h2 className="text-2xl font-bold text-airbnb-dark mb-2">
          Business Not Found
        </h2>
        <p className="text-airbnb-gray">The business you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Calculate price based on category
  const getPrice = () => {
    if (business.category === 'Nature') return 'Free'
    if (business.category === 'Hotels') return '200 RON / night'
    if (business.category === 'Food') return '€€ per person'
    return 'Contact for pricing'
  }

  return (
    <div className="pb-32 md:pb-24">
      {/* Hero Parallax Header */}
      <HeroParallax business={business} />

      {/* Content Container */}
      <div className="relative -mt-12 bg-white rounded-t-3xl z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {/* Owner Actions Bar */}
          {isOwner && (
            <div className="mb-6 p-5 airbnb-card border-2 border-airbnb-red/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-airbnb bg-airbnb-red flex items-center justify-center shadow-airbnb-md">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-airbnb-dark text-base">Business Owner Dashboard</h3>
                    <p className="text-sm text-airbnb-gray">Manage your business, bookings, and promotions</p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/business-portal/dashboard')}
                  className="airbnb-button"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Open Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              {/* Gallery */}
              <Gallery businessId={businessId} />

              {/* Description */}
              {business.description && (
                <div>
                  <h3 className="text-xl font-bold text-airbnb-dark mb-3">
                    Description
                  </h3>
                  <p className="text-airbnb-gray leading-relaxed">
                    {business.description}
                  </p>
                </div>
              )}

              {/* Address */}
              {business.address && (
                <div>
                  <h3 className="text-xl font-bold text-airbnb-dark mb-3">
                    Location
                  </h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-airbnb-gray mt-0.5 flex-shrink-0" />
                    <p className="text-airbnb-dark">{business.address}</p>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              {business.latitude && business.longitude && (
                <div>
                  <h3 className="text-xl font-bold text-airbnb-dark mb-3">
                    Map
                  </h3>
                  <div className="relative w-full h-64 rounded-airbnb-lg overflow-hidden bg-airbnb-light-gray border border-gray-200">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude - 0.01},${business.latitude - 0.01},${business.longitude + 0.01},${business.latitude + 0.01}&layer=mapnik&marker=${business.latitude},${business.longitude}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      className="rounded-xl"
                      style={{ border: 0 }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Attributes */}
              <div>
                <h3 className="text-xl font-bold text-airbnb-dark mb-4">
                  Details
                </h3>
                <AttributeGrid business={business} attributes={attributes} />
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              {resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-gray-50 rounded-xl overflow-hidden"
                    >
                      {resource.image_url && (
                        <div className="relative w-full h-48">
                          <Image
                            src={resource.image_url}
                            alt={resource.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {resource.name}
                        </h4>
                        {resource.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {business.category === 'Hotels'
                      ? 'No rooms available'
                      : business.category === 'Nature'
                      ? 'No trails or spots available'
                      : 'No resources available'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <ReviewsSection
                reviews={reviews}
                averageRating={business.rating}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar business={business} price={getPrice()} />
    </div>
  )
}

