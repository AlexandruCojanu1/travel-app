"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Calendar, Eye, Star, DollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [businessId])

  async function loadOverviewData() {
    const supabase = createClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

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

      // Profile views (mock - would need analytics table)
      const profileViews = 1234 // Placeholder
      const viewsChange = 23 // Placeholder

      // Average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('business_id', businessId)

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      // Bookings over last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
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

      setStats({
        revenueThisMonth: revenue,
        pendingBookings: pendingCount || 0,
        profileViews,
        averageRating: avgRating,
        revenueChange,
        viewsChange,
        ratingChange: 0.2, // Placeholder
      })
      setBookingsData(bookingsChartData)
      setRevenueData(revenueChartData)
      setStatusDistribution(statusData)
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Revenue this Month",
      value: `${stats.revenueThisMonth.toFixed(2)} RON`,
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(0)}%`,
      trend: stats.revenueChange >= 0 ? "up" as const : "down" as const,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings.toString(),
      change: "3 new today",
      trend: "neutral" as const,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Profile Views",
      value: stats.profileViews.toLocaleString(),
      change: `+${stats.viewsChange}%`,
      trend: "up" as const,
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "Average Rating",
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
        <div className="text-slate-600">Loading overview...</div>
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
            <div key={index} className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{card.title}</span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {card.value}
              </div>
              <div className={cn(
                "text-sm font-medium",
                card.trend === "up" ? "text-green-600" :
                card.trend === "down" ? "text-red-600" : "text-slate-600"
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
        <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Bookings Over Last 30 Days
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
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Bar Chart */}
        <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue by Day
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (RON)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      {statusDistribution.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Booking Status Distribution
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
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">New booking received</p>
              <p className="text-xs text-slate-600">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <Star className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">New review received</p>
              <p className="text-xs text-slate-600">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

