"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export interface BusinessMedia {
  id: string
  business_id: string
  url: string
  media_type: 'image' | 'video'
  sort_order: number
  caption: string | null
  created_at: string
}

interface GalleryProps {
  businessId: string
}

export function Gallery({ businessId }: GalleryProps) {
  const [media, setMedia] = useState<BusinessMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)

  React.useEffect(() => {
    async function loadMedia() {
      const supabase = createClient()

      try {
        // Fetch from business_media table
        const { data, error } = await supabase
          .from('business_media')
          .select('*')
          .eq('business_id', businessId)
          .eq('media_type', 'image')
          .order('sort_order', { ascending: true })

        if (!error && data) {
          setMedia(data)
        } else {
          // Fallback: If table doesn't exist, use business.image_url
          const { data: business } = await supabase
            .from('businesses')
            .select('image_url')
            .eq('id', businessId)
            .single()

          if (business?.image_url) {
            setMedia([
              {
                id: 'fallback',
                business_id: businessId,
                url: business.image_url,
                media_type: 'image',
                sort_order: 0,
                caption: null,
                created_at: new Date().toISOString(),
              },
            ])
          }
        }
      } catch (error) {
        console.error('Error loading media:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMedia(false)
      }
    }

    if (businessId) {
      loadMedia()
    }
  }, [businessId])

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return

    if (direction === 'prev') {
      setSelectedIndex(
        selectedIndex > 0 ? selectedIndex - 1 : media.length - 1
      )
    } else {
      setSelectedIndex(
        selectedIndex < media.length - 1 ? selectedIndex + 1 : 0
      )
    }
  }

  // Handle keyboard navigation
  React.useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateImage('prev')
      if (e.key === 'ArrowRight') navigateImage('next')
      if (e.key === 'Escape') closeLightbox()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex])

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse" />
    )
  }

  if (media.length === 0) {
    return null
  }

  const featuredImage = media[0]
  const otherImages = media.slice(1, 6) // Show up to 5 more images
  const remainingCount = media.length - otherImages.length - 1

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Photos</h3>

        {/* Mobile: Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:hidden">
          {/* Featured Image (Larger) */}
          <div className="flex-shrink-0 w-[280px] h-[200px] rounded-xl overflow-hidden bg-gray-100 relative">
            <Image
              src={featuredImage.url}
              alt={featuredImage.caption || 'Business photo'}
              fill
              className="object-cover cursor-pointer"
              onClick={() => openLightbox(0)}
              sizes="280px"
            />
          </div>

          {/* Other Images */}
          {otherImages.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[200px] h-[200px] rounded-xl overflow-hidden bg-gray-100 relative"
            >
              <Image
                src={item.url}
                alt={item.caption || 'Business photo'}
                fill
                className="object-cover cursor-pointer"
                onClick={() => openLightbox(index + 1)}
                sizes="200px"
              />
              {index === otherImages.length - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => openLightbox(0)}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    View All {media.length} Photos
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-3 md:h-[300px]">
          {/* Featured Image (2x2) */}
          <div className="col-span-2 row-span-2 rounded-xl overflow-hidden bg-gray-100 relative">
            <Image
              src={featuredImage.url}
              alt={featuredImage.caption || 'Business photo'}
              fill
              className="object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => openLightbox(0)}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Other Images */}
          {otherImages.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden bg-gray-100 relative"
            >
              <Image
                src={item.url}
                alt={item.caption || 'Business photo'}
                fill
                className="object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => openLightbox(index + 1)}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => openLightbox(0)}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    +{remainingCount} More
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <Dialog open={true} onOpenChange={closeLightbox}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-0">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Navigation Buttons */}
                {media.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 z-50 text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 z-50 text-white hover:bg-white/20"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                {/* Image with Shared Layout ID for smooth transitions */}
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-full"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x

                    if (swipe < -10000) {
                      navigateImage('next')
                    } else if (swipe > 10000) {
                      navigateImage('prev')
                    }
                  }}
                >
                  <Image
                    src={media[selectedIndex].url}
                    alt={media[selectedIndex].caption || 'Business photo'}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </motion.div>

                {/* Caption */}
                {media[selectedIndex].caption && (
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white bg-black/50 px-4 py-2 rounded-lg inline-block">
                      {media[selectedIndex].caption}
                    </p>
                  </div>
                )}

                {/* Image Counter */}
                {media.length > 1 && (
                  <div className="absolute top-4 left-4 text-white bg-black/50 px-4 py-2 rounded-lg">
                    {selectedIndex + 1} / {media.length}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}

