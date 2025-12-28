"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Star, Zap, Check, Loader2, Clock, X } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { createPromotion } from "@/actions/business-portal"
import { toast } from "sonner"
import Link from "next/link"

interface Business {
  id: string
  name: string
}

interface ActivePromotion {
  id: string
  package_type: string
  amount: number
  valid_from: string
  valid_until: string
  status: string
}

const PACKAGES = [
  {
    id: 'silver',
    name: 'Boost',
    price: 50,
    duration_days: 3,
    icon: TrendingUp,
    color: 'from-slate-500 to-slate-600',
    features: [
      'Appear higher in search results',
      'Priority listing in category',
      'Boost badge on profile',
    ],
  },
  {
    id: 'gold',
    name: 'Featured',
    price: 150,
    duration_days: 7,
    icon: Star,
    color: 'from-yellow-500 to-yellow-600',
    features: [
      'Homepage carousel placement',
      'Featured badge on profile',
      'Priority in search + map',
      'Email newsletter inclusion',
    ],
    popular: true,
  },
  {
    id: 'platinum',
    name: 'Push',
    price: 300,
    duration_days: 14,
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    features: [
      'Push notification to nearby users',
      'All Gold features',
      'Social media promotion',
      'Analytics dashboard access',
    ],
  },
] as const

export default function PromotePage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusinessId) {
      loadActivePromotions()
    }
  }, [selectedBusinessId])

  async function loadBusinesses() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login?redirect=/business-portal/promote')
      return
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setBusinesses(data)
      setSelectedBusinessId(data[0].id)
    }
    setIsLoading(false)
  }

  async function loadActivePromotions() {
    if (!selectedBusinessId) return

    const supabase = createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', selectedBusinessId)
      .in('status', ['active', 'pending_payment'])
      .gte('valid_until', now)
      .order('created_at', { ascending: false })

    if (data) {
      setActivePromotions(data)
    }
  }

  async function handleSelectPackage(packageId: string) {
    if (!selectedBusinessId) {
      toast.error('Please select a business first')
      return
    }

    setIsProcessing(true)
    const packageData = PACKAGES.find(p => p.id === packageId)
    if (!packageData) return

    try {
      const result = await createPromotion({
        business_id: selectedBusinessId,
        package_type: packageId,
        amount: packageData.price,
        duration_days: packageData.duration_days,
      })

      if (result.success && result.data) {
        // Redirect to checkout/payment
        toast.success('Promotion created! Redirecting to payment...')
        // For now, we'll activate it directly (in production, redirect to Stripe)
        // In production: router.push(`/business-portal/promote/checkout?promotion_id=${result.data.id}`)
        
        // Mock: Activate directly for testing
        const supabase = createClient()
        await supabase
          .from('promotions')
          .update({ status: 'active' })
          .eq('id', result.data.id)

        await loadActivePromotions()
        toast.success('Promotion activated!')
      } else {
        toast.error(result.error || 'Failed to create promotion')
      }
    } catch (error) {
      console.error('Error creating promotion:', error)
      toast.error('An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  function getDaysRemaining(validUntil: string): number {
    const now = new Date()
    const until = new Date(validUntil)
    const diff = until.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Star className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Business Found
          </h2>
          <p className="text-slate-600 mb-6">
            Create a business first to promote it
          </p>
          <Button asChild>
            <Link href="/business-portal/onboarding">
              Create Business
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Promote Your Business
          </h1>
          <p className="text-slate-600 text-lg">
            Boost your visibility and reach more customers
          </p>
        </div>

        {/* Business Selector */}
        {businesses.length > 1 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Business
            </label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active Promotions */}
        {activePromotions.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Active Promotions
            </h2>
            <div className="space-y-3">
              {activePromotions.map((promotion) => {
                const packageData = PACKAGES.find(p => p.id === promotion.package_type)
                const daysRemaining = getDaysRemaining(promotion.valid_until)
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      {packageData && (
                        <>
                          <div className={cn(
                            "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            packageData.color
                          )}>
                            {packageData.icon && <packageData.icon className="h-6 w-6 text-white" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {packageData.name} Package
                            </div>
                            <div className="text-sm text-slate-600">
                              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        Valid until: {new Date(promotion.valid_until).toLocaleDateString()}
                      </span>
                      {promotion.status === 'pending_payment' && (
                        <Button size="sm" variant="outline">
                          Complete Payment
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative bg-white rounded-2xl border-2 p-8 transition-all hover:shadow-xl",
                  pkg.popular
                    ? "border-yellow-400 shadow-lg scale-105"
                    : "border-slate-200 hover:border-blue-300"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={cn(
                    "h-16 w-16 rounded-2xl bg-gradient-to-br mx-auto mb-4 flex items-center justify-center",
                    pkg.color
                  )}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">
                      {pkg.price}
                    </span>
                    <span className="text-slate-600 ml-2">RON</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {pkg.duration_days} {pkg.duration_days === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPackage(pkg.id)}
                  disabled={isProcessing || !selectedBusinessId}
                  className={cn(
                    "w-full",
                    pkg.popular
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                      : ""
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select Package'
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Compare Packages
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Feature</th>
                  {PACKAGES.map((pkg) => (
                    <th key={pkg.id} className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      {pkg.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-700">Duration</td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-3 text-center text-sm text-slate-900">
                      {pkg.duration_days} days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-700">Price</td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {pkg.price} RON
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-700">Search Boost</td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-3 text-center">
                      {pkg.id !== 'silver' ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-700">Homepage Carousel</td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-3 text-center">
                      {pkg.id === 'gold' || pkg.id === 'platinum' ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-700">Push Notifications</td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-3 text-center">
                      {pkg.id === 'platinum' ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

