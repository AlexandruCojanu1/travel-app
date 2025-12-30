"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Calendar, Eye, Star, DollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

interface DashboardOverviewProps {
  businessId: string
}

interface Stats {
  revenueThisMonth: number
  pendingBookings: number
  profileViews: number
  averageRating: number
  revenueChange: number
  viewsChange: number
  ratingChange: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function getTimeAgo(date: Date): string {
  try {
    const distance = formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ro 
    })
    return distance.replace('în aproximativ ', '').replace('aproximativ ', '')
  } catch (error) {
    return 'Acum puțin timp'
  }
}

export function DashboardOverview({ businessId }: DashboardOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    revenueThisMonth: 0,
    pendingBookings: 0,
    profileViews: 0,
    averageRating: 0,
    revenueChange: 0,
    viewsChange: 0,
    ratingChange: 0,
  })
  const [bookingsData, setBookingsData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [statusDistribution, setStatusDistribution] = useState<any[]>([])
  const [newBookingsToday, setNewBookingsToday] = useState<number>(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [businessId])

  async function loadOverviewData() {
    const supabase = createClient()
    const now = new Date()
    // Set to start of month (00:00:00)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)
    // Set to end of month (23:59:59.999)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    // Set to start of last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    lastMonthStart.setHours(0, 0, 0, 0)
    // Set to end of last month
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    lastMonthEnd.setHours(23, 59, 59, 999)

    try {
      // Revenue this month
      const { data: monthBookings, error: monthError } = await supabase
        .from('bookings')
        .select('total_amount, created_at')
        .eq('business_id', businessId)
        .eq('status', 'confirmed')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      if (monthError) {
        console.error('Error loading month bookings:', monthError)
        // Continue with empty data instead of failing
      }

      // Revenue last month (for comparison)
      const { data: lastMonthBookings, error: lastMonthError } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('business_id', businessId)
        .eq('status', 'confirmed')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())

      if (lastMonthError) {
        console.error('Error loading last month bookings:', lastMonthError)
        // Continue with empty data instead of failing
      }

      const revenue = (monthBookings || []).reduce((sum, b: any) => {
        const amount = b.total_amount || b.amount || b.price || 0
        return sum + parseFloat(amount.toString())
      }, 0)
      const lastRevenue = (lastMonthBookings || []).reduce((sum, b: any) => {
        const amount = b.total_amount || b.amount || b.price || 0
        return sum + parseFloat(amount.toString())
      }, 0)
      const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0

      // Pending bookings
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'awaiting_payment')

      // New bookings today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      todayEnd.setHours(23, 59, 59, 999)
      const { count: newBookingsToday } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())

      // Profile views - current month
      const { count: profileViewsCount } = await supabase
        .from('business_views')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('viewed_at', monthStart.toISOString())
        .lte('viewed_at', monthEnd.toISOString())

      // Profile views - last month (for comparison)
      const { count: lastMonthViewsCount } = await supabase
        .from('business_views')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('viewed_at', lastMonthStart.toISOString())
        .lte('viewed_at', lastMonthEnd.toISOString())

      const profileViews = profileViewsCount || 0
      const lastMonthViews = lastMonthViewsCount || 0
      const viewsChange = lastMonthViews > 0 
        ? ((profileViews - lastMonthViews) / lastMonthViews) * 100 
        : (profileViews > 0 ? 100 : 0)

      // Average rating - current month
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .eq('business_id', businessId)

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      // Average rating - last month (for comparison)
      const { data: lastMonthReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('business_id', businessId)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())

      const lastMonthAvgRating = lastMonthReviews && lastMonthReviews.length > 0
        ? lastMonthReviews.reduce((sum, r) => sum + r.rating, 0) / lastMonthReviews.length
        : 0

      const ratingChange = lastMonthAvgRating > 0
        ? avgRating - lastMonthAvgRating
        : (avgRating > 0 ? avgRating : 0)

      // Bookings over last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('created_at, status')
        .eq('business_id', businessId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Group by day
      const bookingsByDay: Record<string, number> = {}
      recentBookings?.forEach(booking => {
        const date = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        bookingsByDay[date] = (bookingsByDay[date] || 0) + 1
      })

      const bookingsChartData = Object.entries(bookingsByDay)
        .map(([date, count]) => ({ date, bookings: count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Revenue by day
      const revenueByDay: Record<string, number> = {}
      monthBookings?.forEach(booking => {
        const date = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        revenueByDay[date] = (revenueByDay[date] || 0) + parseFloat(booking.total_amount.toString())
      })

      const revenueChartData = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Status distribution
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('status')
        .eq('business_id', businessId)

      const statusCounts: Record<string, number> = {}
      allBookings?.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
      })

      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
      }))

      // Recent activity - last 5 bookings and reviews
      const { data: recentBookingsActivity } = await supabase
        .from('bookings')
        .select('id, created_at, status')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: recentReviewsActivity } = await supabase
        .from('reviews')
        .select('id, created_at, rating')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(3)

      // Combine and sort activities
      const activities: any[] = []
      
      recentBookingsActivity?.forEach(booking => {
        activities.push({
          type: 'booking',
          id: booking.id,
          created_at: booking.created_at,
          status: booking.status,
        })
      })

      recentReviewsActivity?.forEach(review => {
        activities.push({
          type: 'review',
          id: review.id,
          created_at: review.created_at,
          rating: review.rating,
        })
      })

      // Sort by created_at descending and take top 5
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const todayBookingsCount = newBookingsToday || 0

      setStats({
        revenueThisMonth: revenue,
        pendingBookings: pendingCount || 0,
        profileViews,
        averageRating: avgRating,
        revenueChange,
        viewsChange,
        ratingChange,
      })
      setBookingsData(bookingsChartData)
      setRevenueData(revenueChartData)
      setStatusDistribution(statusData)
      setNewBookingsToday(todayBookingsCount)
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Venituri luna aceasta",
      value: `${stats.revenueThisMonth.toFixed(2)} RON`,
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(0)}%`,
      trend: stats.revenueChange >= 0 ? "up" as const : "down" as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Rezervări în așteptare",
      value: stats.pendingBookings.toString(),
      change: `${newBookingsToday} ${newBookingsToday === 1 ? 'nouă' : 'noi'} astăzi`,
      trend: "neutral" as const,
      icon: Calendar,
      color: "text-mova-blue"
    },
    {
      title: "Vizualizări profil",
      value: stats.profileViews.toLocaleString(),
      change: `+${stats.viewsChange}%`,
      trend: "up" as const,
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "Rating mediu",
      value: stats.averageRating.toFixed(1),
      change: `+${stats.ratingChange.toFixed(1)}`,
      trend: "up" as const,
      icon: Star,
      color: "text-yellow-600"
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-mova-gray">Se încarcă prezentarea...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="airbnb-card p-4 md:p-6 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-mova-gray">{card.title}</span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-mova-dark mb-1">
                {card.value}
              </div>
              <div className={cn(
                "text-sm font-medium",
                card.trend === "up" ? "text-green-600" :
                card.trend === "down" ? "text-red-600" : "text-mova-gray"
              )}>
                {card.change}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Bookings/Views Line Chart */}
        <div className="airbnb-card p-4 md:p-6 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-mova-dark mb-4">
            Rezervări în ultimele 30 de zile
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Rezervări"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Bar Chart */}
        <div className="airbnb-card p-4 md:p-6 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-mova-dark mb-4">
            Venituri pe zi
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Venituri (RON)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      {statusDistribution.length > 0 && (
        <div className="airbnb-card p-4 md:p-6 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-mova-dark mb-4">
            Distribuția statusurilor rezervărilor
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 min-w-0 overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Activitate recentă
        </h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const timeAgo = getTimeAgo(new Date(activity.created_at))
              return (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-airbnb bg-mova-light-gray">
                  {activity.type === 'booking' ? (
                    <>
                      <Calendar className="h-5 w-5 text-mova-blue" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-mova-dark">
                          Rezervare nouă primită
                          {activity.status && (
                            <span className="ml-2 text-xs text-mova-gray">
                              ({activity.status})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-mova-gray">{timeAgo}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Star className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-mova-dark">
                          Recenzie nouă primită
                          {activity.rating && (
                            <span className="ml-2 text-xs text-yellow-600">
                              {'★'.repeat(activity.rating)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-mova-gray">{timeAgo}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-mova-gray text-sm">
              Nu există activitate recentă
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

