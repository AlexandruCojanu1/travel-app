"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Loader2,
  RefreshCw,
  Download,
  Database,
  AlertTriangle,
  Check,
  Copy,
  Eye
} from "lucide-react"

// Table schema definitions for proper field handling
const TABLE_SCHEMAS: Record<string, { columns: string[]; primaryKey: string; hiddenColumns?: string[] }> = {
  profiles: {
    columns: ["id", "email", "full_name", "username", "avatar_url", "bio", "phone", "role", "home_city_id", "travel_style", "persona", "is_onboarded", "onboarding_completed", "onboarding_step", "created_at", "updated_at"],
    primaryKey: "id",
    hiddenColumns: ["onboarding_data", "metadata", "preferences"]
  },
  businesses: {
    columns: ["id", "name", "category", "type", "description", "address", "city_id", "owner_id", "latitude", "longitude", "image_url", "rating", "review_count", "price_level", "is_verified", "contact_email", "contact_phone", "contact_website", "tags", "created_at", "updated_at"],
    primaryKey: "id",
    hiddenColumns: ["amenities", "attributes"]
  },
  cities: {
    columns: ["id", "name", "country", "country_code", "state_province", "latitude", "longitude", "center_lat", "center_lng", "timezone", "is_active", "created_at"],
    primaryKey: "id"
  },
  bookings: {
    columns: ["id", "user_id", "business_id", "resource_id", "trip_id", "trip_item_id", "status", "start_at", "end_at", "start_date", "end_date", "persons", "guest_count", "amount", "total_amount", "currency", "payment_intent_id", "payment_method", "split_status", "is_gift", "gift_message", "gift_recipient_email", "user_notes", "business_notes", "cancellation_policy_id", "cancellation_deadline", "refund_amount", "created_at", "updated_at"],
    primaryKey: "id"
  },
  hotel_bookings: {
    columns: ["id", "user_id", "business_id", "room_id", "trip_id", "booking_ref", "guest_name", "guest_email", "guest_phone", "check_in_date", "check_out_date", "number_of_guests", "guests_count", "total_price", "status", "special_requests", "confirmed_at", "created_at", "updated_at"],
    primaryKey: "id"
  },
  hotel_rooms: {
    columns: ["id", "business_id", "name", "description", "capacity", "price_per_night", "size_sqm", "view_type", "amenities", "images", "available_count", "created_at", "updated_at"],
    primaryKey: "id"
  },
  trips: {
    columns: ["id", "user_id", "title", "description", "destination_city_id", "start_date", "end_date", "status", "budget_total", "currency", "guests", "is_public", "invite_token", "cover_image_url", "created_at", "updated_at"],
    primaryKey: "id"
  },
  trip_items: {
    columns: ["id", "trip_id", "business_id", "day_index", "block", "start_time", "end_time", "estimated_cost", "notes", "is_booked", "created_at"],
    primaryKey: "id"
  },
  trip_collaborators: {
    columns: ["id", "trip_id", "user_id", "role", "joined_at"],
    primaryKey: "id"
  },
  trip_votes: {
    columns: ["id", "trip_id", "business_id", "user_id", "vote", "created_at"],
    primaryKey: "id"
  },
  events: {
    columns: ["id", "city_id", "title", "description", "location", "image_url", "start_date", "end_date", "created_at"],
    primaryKey: "id"
  },
  reviews: {
    columns: ["id", "user_id", "business_id", "rating", "comment", "created_at"],
    primaryKey: "id"
  },
  categories: {
    columns: ["id", "name", "slug", "description", "icon_name", "created_at"],
    primaryKey: "id"
  },
  promotions: {
    columns: ["id", "business_id", "city_id", "title", "description", "image_url", "promo_code", "discount_percentage", "valid_from", "valid_until", "status", "is_active", "created_at"],
    primaryKey: "id"
  },
  achievements: {
    columns: ["id", "slug", "name", "description", "icon_url", "tier", "criteria", "created_at"],
    primaryKey: "id"
  },
  user_achievements: {
    columns: ["id", "user_id", "achievement_id", "unlocked_at", "progress", "created_at"],
    primaryKey: "id"
  },
  business_resources: {
    columns: ["id", "business_id", "name", "kind", "description", "price", "price_currency", "price_unit", "capacity", "quantity", "is_active", "image_url", "availability_schedule", "created_at", "updated_at"],
    primaryKey: "id"
  },
  business_images: {
    columns: ["id", "business_id", "url", "alt_text", "display_order", "created_at"],
    primaryKey: "id"
  },
  business_amenities: {
    columns: ["id", "business_id", "amenity_id", "created_at"],
    primaryKey: "id"
  },
  saved_businesses: {
    columns: ["id", "user_id", "business_id", "created_at"],
    primaryKey: "id"
  },
  user_swipes: {
    columns: ["id", "user_id", "business_id", "action", "created_at"],
    primaryKey: "id"
  },
  user_preferences: {
    columns: ["id", "user_id", "preferred_language", "currency", "notification_enabled", "travel_style", "food_prefs", "activity_prefs", "budget_split_hotel", "budget_split_food", "budget_split_activities", "push_notifications_urgent", "push_notifications_checkin", "email_notifications_offers", "email_notifications_newsletter", "created_at", "updated_at"],
    primaryKey: "id"
  },
  payment_splits: {
    columns: ["id", "booking_id", "bill_id", "user_id", "amount", "status", "stripe_intent_id", "expires_at", "created_at"],
    primaryKey: "id"
  },
  restaurant_bills: {
    columns: ["id", "trip_id", "restaurant_name", "total_amount", "status", "items", "created_at"],
    primaryKey: "id"
  },
  flight_offers: {
    columns: ["id", "trip_id", "airline", "flight_number", "origin", "destination", "departure_time", "arrival_time", "price", "booking_link", "created_at"],
    primaryKey: "id"
  },
  city_posts: {
    columns: ["id", "city_id", "author_id", "title", "excerpt", "content", "image_url", "category", "is_published", "created_at", "updated_at"],
    primaryKey: "id"
  },
  transport_providers: {
    columns: ["id", "city_id", "name", "type", "is_active", "api_key", "contact_info", "created_at"],
    primaryKey: "id"
  },
  error_logs: {
    columns: ["id", "user_id", "error_message", "error_stack", "url", "user_agent", "context", "created_at"],
    primaryKey: "id"
  },
  group_bookings: {
    columns: ["id", "booking_id", "user_id", "share_amount", "status", "created_at"],
    primaryKey: "id"
  },
  group_swipes: {
    columns: ["id", "trip_id", "business_id", "user_id", "action", "created_at"],
    primaryKey: "id"
  },
  city_checkins: {
    columns: ["id", "user_id", "city_id", "checked_in_at", "created_at"],
    primaryKey: "id"
  },
  user_stamps: {
    columns: ["id", "user_id", "stamp_type", "city_id", "business_id", "earned_at", "created_at"],
    primaryKey: "id"
  },
  cancellation_policies: {
    columns: ["id", "business_id", "name", "description", "hours_before", "refund_percentage", "created_at"],
    primaryKey: "id"
  },
  amenities: {
    columns: ["id", "name", "icon", "category", "created_at"],
    primaryKey: "id"
  },
  algorithm_settings: {
    columns: ["id", "split_ratio_hotel", "split_ratio_food", "split_ratio_activity", "weight_price_fit", "weight_distance", "weight_affinity", "weight_rating", "penalty_per_km", "updated_at", "updated_by"],
    primaryKey: "id"
  },
  // Gamification tables
  gamification_badges: {
    columns: ["id", "name", "description", "icon_url", "rarity", "category", "xp_value", "metadata", "created_at"],
    primaryKey: "id"
  },
  user_badges: {
    columns: ["id", "user_id", "badge_id", "earned_at", "is_seen", "visual_state"],
    primaryKey: "id"
  },
  user_progress: {
    columns: ["user_id", "total_xp", "current_level", "next_level_threshold", "stamps_collected", "coins", "updated_at"],
    primaryKey: "user_id"
  },
  wallet_transactions: {
    columns: ["id", "user_id", "amount", "source", "metadata", "created_at"],
    primaryKey: "id"
  },
  gamification_rules: {
    columns: ["id", "rule_name", "rule_type", "trigger_event", "conditions", "xp_reward", "coins_reward", "badge_id", "achievement_id", "priority", "is_active", "description", "metadata", "created_at", "updated_at"],
    primaryKey: "id"
  },
  gamification_quests: {
    columns: ["id", "quest_name", "quest_slug", "quest_description", "steps", "quest_type", "time_limit_days", "is_repeatable", "completion_xp", "completion_coins", "completion_badge_id", "completion_achievement_id", "is_active", "start_date", "end_date", "icon_url", "banner_image_url", "created_at", "updated_at"],
    primaryKey: "id"
  },
  user_quests: {
    columns: ["id", "user_id", "quest_id", "current_step", "progress", "status", "started_at", "completed_at", "expires_at"],
    primaryKey: "id"
  },
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
}

interface TableInfo {
  name: string
  exists: boolean
  count: number
}

export default function AdminPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTable = searchParams.get("table") || ""

  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingData, setEditingData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([])
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Fetch available tables on mount
  useEffect(() => {
    async function fetchTables() {
      setTablesLoading(true)
      try {
        // Use backend API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token

        const response = await fetch(`${apiUrl}/admin/tables`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
        })
        const result = await response.json()
        
        if (result.error) {
          setTableError(result.error)
          return
        }
        
        setAvailableTables(result.tables || [])
        setMissingTables(result.missingTables || [])
      } catch (error) {
        setTableError("Failed to fetch tables")
        console.error(error)
      } finally {
        setTablesLoading(false)
      }
    }
    
    fetchTables()
  }, [])

  const fetchData = useCallback(async () => {
    if (!currentTable) return

    setLoading(true)
    setTableError(null)
    try {
      const params = new URLSearchParams({
        table: currentTable,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      })

      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(`${apiUrl}/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
      })
      const result = await response.json()

      if (result.error) {
        if (result.tableExists === false) {
          setTableError(`Table "${currentTable}" does not exist in the database`)
          setData([])
        } else {
          showToast("error", result.error)
        }
        return
      }

      setData(result.data || [])
      if (result.pagination) {
        setPagination(result.pagination)
      }
    } catch (error) {
      showToast("error", "Failed to fetch data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [currentTable, pagination.page, pagination.limit, searchQuery, showToast])

  useEffect(() => {
    if (currentTable) {
      setTableError(null)
      setData([])
      fetchData()
    }
  }, [currentTable, fetchData])

  const handleCreate = async () => {
    setSaving(true)
    try {
      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(`${apiUrl}/admin`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ table: currentTable, data: editingData }),
      })
      const result = await response.json()

      if (result.error) {
        showToast("error", result.error)
        return
      }

      showToast("success", "Record created successfully")
      setIsCreateModalOpen(false)
      setEditingData({})
      fetchData()
    } catch (error) {
      showToast("error", "Failed to create record")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRow) return

    setSaving(true)
    try {
      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(
        `${apiUrl}/admin/${selectedRow.id}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ table: currentTable, data: editingData }),
        }
      )
      const result = await response.json()

      if (result.error) {
        showToast("error", result.error)
        return
      }

      showToast("success", "Record updated successfully")
      setIsEditModalOpen(false)
      setSelectedRow(null)
      setEditingData({})
      fetchData()
    } catch (error) {
      showToast("error", "Failed to update record")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRow) return

    setSaving(true)
    try {
      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(
        `${apiUrl}/admin/${selectedRow.id}?table=${currentTable}`,
        {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
        }
      )
      const result = await response.json()

      if (result.error) {
        showToast("error", result.error)
        return
      }

      showToast("success", "Record deleted successfully")
      setIsDeleteModalOpen(false)
      setSelectedRow(null)
      fetchData()
    } catch (error) {
      showToast("error", "Failed to delete record")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (row: Record<string, unknown>) => {
    setSelectedRow(row)
    setEditingData({ ...row })
    setIsEditModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingData({})
    setIsCreateModalOpen(true)
  }

  const openDeleteModal = (row: Record<string, unknown>) => {
    setSelectedRow(row)
    setIsDeleteModalOpen(true)
  }

  const openViewModal = (row: Record<string, unknown>) => {
    setSelectedRow(row)
    setIsViewModalOpen(true)
  }

  const exportData = async () => {
    if (!currentTable) return

    setLoading(true)
    try {
      // Fetch all records (not just current page)
      const allData: Record<string, unknown>[] = []
      let currentPage = 1
      let hasMore = true
      const fetchLimit = 100 // Fetch in batches of 100

      while (hasMore) {
        const params = new URLSearchParams({
          table: currentTable,
          page: currentPage.toString(),
          limit: fetchLimit.toString(),
          ...(searchQuery && { search: searchQuery }),
        })

        // Use backend API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token

        const response = await fetch(`${apiUrl}/admin?${params}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
        })
        const result = await response.json()

        if (result.error) {
          showToast("error", `Export failed: ${result.error}`)
          return
        }

        if (result.data && result.data.length > 0) {
          allData.push(...result.data)
          currentPage++

          // Check if there are more pages
          const totalPages = result.pagination?.totalPages || 1
          hasMore = currentPage <= totalPages
        } else {
          hasMore = false
        }
      }

      // Export all data
      const json = JSON.stringify(allData, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${currentTable}_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast("success", `Exported ${allData.length} records successfully`)
    } catch (error) {
      console.error("Export error:", error)
      showToast("error", "Failed to export data")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast("info", "Copied to clipboard")
  }

  const getVisibleColumns = () => {
    if (!currentTable || !data.length) return []
    const schema = TABLE_SCHEMAS[currentTable]
    if (schema) {
      return schema.columns.filter(
        (col) => !schema.hiddenColumns?.includes(col)
      )
    }
    return Object.keys(data[0]).slice(0, 10) // Limit to first 10 columns
  }

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "object") return JSON.stringify(value).slice(0, 50) + "..."
    if (typeof value === "string" && value.length > 50) return value.slice(0, 50) + "..."
    return String(value)
  }

  const getTableStats = () => {
    return {
      total: pagination.total,
      page: pagination.page,
      totalPages: pagination.totalPages,
    }
  }

  // Dashboard view when no table is selected
  if (!currentTable) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">
            Select a table from the sidebar to view and manage records.
          </p>
        </div>

        {tablesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <span className="ml-3 text-slate-400">Loading tables...</span>
          </div>
        ) : tableError ? (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <span>{tableError}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Available Tables */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Available Tables ({availableTables.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => router.push(`/admin?table=${table.name}`)}
                    className="p-5 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-base font-semibold text-white capitalize">
                          {table.name.replace(/_/g, " ")}
                        </h3>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        {table.count} rows
                      </span>
                    </div>
                    {TABLE_SCHEMAS[table.name] && (
                      <p className="text-slate-500 text-xs">
                        {TABLE_SCHEMAS[table.name].columns.length} columns
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Missing Tables */}
            {missingTables.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-400 mb-4">
                  Missing Tables ({missingTables.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missingTables.map((table) => (
                    <div
                      key={table}
                      className="p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 text-left opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base font-semibold text-slate-400 capitalize">
                          {table.replace(/_/g, " ")}
                        </h3>
                      </div>
                      <p className="text-slate-500 text-xs mt-2">
                        Table not found in database
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const columns = getVisibleColumns()
  const stats = getTableStats()

  // Show error if table doesn't exist
  if (tableError && currentTable) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white capitalize mb-2">
            {currentTable.replace(/_/g, " ")}
          </h1>
        </div>
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-3 text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="font-semibold">Table Not Found</span>
          </div>
          <p className="text-slate-300">{tableError}</p>
          <p className="text-slate-400 text-sm mt-2">
            This table may need to be created via a database migration.
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-white"
            }`}
          >
            {toast.type === "success" && <Check className="w-4 h-4" />}
            {toast.type === "error" && <AlertTriangle className="w-4 h-4" />}
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              {currentTable.replace(/_/g, " ")}
            </h1>
            <p className="text-slate-400 text-sm">
              {stats.total} records • Page {stats.page} of {stats.totalPages || 1}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={exportData}
              disabled={loading}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export All Records (JSON)"
            >
              <Download className={`w-5 h-5 ${loading ? "animate-pulse" : ""}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center"
                  >
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={row.id ? String(row.id) : `row-${index}-${JSON.stringify(row).slice(0, 50)}`}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openViewModal(row)}
                          className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(row)}
                          className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-emerald-400"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(row)}
                          className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap max-w-xs truncate"
                        title={String(row[column] ?? "")}
                      >
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-slate-300 text-sm px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">View Record</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-400 capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    <div className="flex items-start gap-2">
                      <pre className="flex-1 p-3 bg-slate-900 rounded-lg text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value ?? "null")}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            typeof value === "object"
                              ? JSON.stringify(value, null, 2)
                              : String(value ?? "")
                          )
                        }
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Record</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedRow(null)
                  setEditingData({})
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-400 capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    {key === "id" ? (
                      <input
                        type="text"
                        value={String(value ?? "")}
                        disabled
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                      />
                    ) : typeof value === "boolean" ? (
                      <select
                        value={String(editingData[key] ?? value ?? false)}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [key]: e.target.value === "true",
                          })
                        }
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : typeof value === "object" ? (
                      <textarea
                        value={
                          typeof editingData[key] === "object"
                            ? JSON.stringify(editingData[key], null, 2)
                            : editingData[key] !== undefined
                            ? String(editingData[key])
                            : JSON.stringify(value, null, 2)
                        }
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value)
                            setEditingData({ ...editingData, [key]: parsed })
                          } catch {
                            setEditingData({ ...editingData, [key]: e.target.value })
                          }
                        }}
                        rows={4}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      />
                    ) : (
                      <input
                        type={
                          typeof value === "number"
                            ? "number"
                            : key.includes("date") || key.includes("_at")
                            ? "datetime-local"
                            : key.includes("email")
                            ? "email"
                            : key.includes("url") || key.includes("link") || key.includes("website")
                            ? "url"
                            : "text"
                        }
                        value={
                          editingData[key] !== undefined
                            ? String(editingData[key])
                            : String(value ?? "")
                        }
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [key]:
                              typeof value === "number"
                                ? parseFloat(e.target.value) || 0
                                : e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedRow(null)
                  setEditingData({})
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create New Record</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingData({})
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TABLE_SCHEMAS[currentTable]?.columns
                  .filter((col) => col !== "id" && col !== "created_at" && col !== "updated_at")
                  .map((column) => (
                    <div key={column} className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-400 capitalize">
                        {column.replace(/_/g, " ")}
                      </label>
                      <input
                        type={
                          column.includes("date") || column.includes("_at")
                            ? "datetime-local"
                            : column.includes("email")
                            ? "email"
                            : column.includes("url") || column.includes("link") || column.includes("website")
                            ? "url"
                            : column.includes("price") || column.includes("amount") || column.includes("count") || column.includes("rating") || column.includes("level") || column.includes("index") || column.includes("order")
                            ? "number"
                            : "text"
                        }
                        value={String(editingData[column] ?? "")}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [column]: e.target.value,
                          })
                        }
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        placeholder={column.replace(/_/g, " ")}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingData({})
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Create Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Delete Record</h2>
                  <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this record?
                <br />
                <span className="text-slate-400 text-sm font-mono">
                  ID: {String(selectedRow.id)}
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setSelectedRow(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
