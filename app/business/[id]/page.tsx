"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { getBusinessById, type Business } from '@/services/business/business.service'
import { BusinessDetailsContent } from '@/components/features/business/public/business-details-content'

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBusinessData() {
      if (!businessId) return
      setIsLoading(true)
      try {
        const businessData = await getBusinessById(businessId)
        setBusiness(businessData)
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Se încarcă...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Business Not Found
        </h2>
        <p className="text-slate-500">The business you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/home')}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
        >
          Back Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          Înapoi
        </button>
        <BusinessDetailsContent business={business} isFullPage />
      </div>
    </div>
  )
}
