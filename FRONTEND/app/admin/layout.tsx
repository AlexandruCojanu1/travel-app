"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  Users,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Star,
  Plane,
  Hotel,
  UtensilsCrossed,
  Tag,
  FileText,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Trophy,
  Ticket,
  Car,
  Heart,
  MessageSquare,
  Layers
} from "lucide-react"

const TABLES = [
  { name: "Dashboard", slug: "", icon: LayoutDashboard },
  { name: "Users & Profiles", slug: "profiles", icon: Users },
  { name: "Businesses", slug: "businesses", icon: Building2 },
  { name: "Cities", slug: "cities", icon: MapPin },
  { name: "Bookings", slug: "bookings", icon: Calendar },
  { name: "Hotel Bookings", slug: "hotel_bookings", icon: Hotel },
  { name: "Hotel Rooms", slug: "hotel_rooms", icon: Hotel },
  { name: "Trips", slug: "trips", icon: Plane },
  { name: "Trip Items", slug: "trip_items", icon: Layers },
  { name: "Trip Collaborators", slug: "trip_collaborators", icon: Users },
  { name: "Trip Votes", slug: "trip_votes", icon: Star },
  { name: "Events", slug: "events", icon: Calendar },
  { name: "Reviews", slug: "reviews", icon: MessageSquare },
  { name: "Categories", slug: "categories", icon: Tag },
  { name: "Promotions", slug: "promotions", icon: Ticket },
  { name: "Achievements", slug: "achievements", icon: Trophy },
  { name: "User Achievements", slug: "user_achievements", icon: Trophy },
  { name: "Gamification Badges", slug: "gamification_badges", icon: Trophy },
  { name: "User Badges", slug: "user_badges", icon: Trophy },
  { name: "User Progress", slug: "user_progress", icon: Trophy },
  { name: "Wallet Transactions", slug: "wallet_transactions", icon: CreditCard },
  { name: "Gamification Rules", slug: "gamification-rules", icon: Settings },
  { name: "Gamification Quests", slug: "gamification-quests", icon: Trophy },
  { name: "User Quests", slug: "user_quests", icon: Trophy },
  { name: "Business Resources", slug: "business_resources", icon: Database },
  { name: "Business Images", slug: "business_images", icon: FileText },
  { name: "Business Amenities", slug: "business_amenities", icon: Star },
  { name: "Saved Businesses", slug: "saved_businesses", icon: Heart },
  { name: "User Swipes", slug: "user_swipes", icon: Heart },
  { name: "User Preferences", slug: "user_preferences", icon: Settings },
  { name: "Payments", slug: "payment_splits", icon: CreditCard },
  { name: "Restaurant Bills", slug: "restaurant_bills", icon: UtensilsCrossed },
  { name: "Flight Offers", slug: "flight_offers", icon: Plane },
  { name: "City Posts", slug: "city_posts", icon: FileText },
  { name: "Transport Providers", slug: "transport_providers", icon: Car },
  { name: "Error Logs", slug: "error_logs", icon: AlertCircle },
  { name: "Group Bookings", slug: "group_bookings", icon: Users },
  { name: "Group Swipes", slug: "group_swipes", icon: Heart },
  { name: "City Check-ins", slug: "city_checkins", icon: MapPin },
  { name: "User Stamps", slug: "user_stamps", icon: Trophy },
  { name: "Cancellation Policies", slug: "cancellation_policies", icon: FileText },
  { name: "Amenities", slug: "amenities", icon: Star },
  { name: "Algorithm Tuner", slug: "algorithm", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const currentTable = pathname.split("/admin/")[1] || ""

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 fixed h-full z-50`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-white">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {TABLES.map((table) => {
            const Icon = table.icon
            const isActive = currentTable === table.slug || pathname.includes(table.slug)
            const href = 
              table.slug === "algorithm" ? "/admin/algorithm" :
              table.slug === "gamification-rules" ? "/admin/gamification-rules" :
              table.slug === "gamification-quests" ? "/admin/gamification-quests" :
              (table.slug ? `/admin?table=${table.slug}` : "/admin")

            return (
              <Link
                key={table.slug}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                title={collapsed ? table.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {table.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 ${collapsed ? "ml-16" : "ml-64"} transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  )
}
