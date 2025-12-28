"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, XCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface TrailStatusManagerProps {
  businessId: string
}

export function TrailStatusManager({ businessId }: TrailStatusManagerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({
    is_open: true,
    status_message: "",
    difficulty_current: "",
    conditions: "",
    last_updated: new Date().toISOString(),
  })
  const [business, setBusiness] = useState<any>(null)

  useEffect(() => {
    loadStatus()
  }, [businessId])

  async function loadStatus() {
    const supabase = createClient()
    
    // Load business data
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (businessData) {
      setBusiness(businessData)
      const attrs = businessData.attributes || {}
      
      // Try to load from business_resources first
      const { data: resourceData } = await supabase
        .from('business_resources')
        .select('*')
        .eq('business_id', businessId)
        .eq('resource_type', 'trail_status')
        .single()

      if (resourceData) {
        const resourceAttrs = resourceData.attributes || {}
        setStatus({
          is_open: resourceAttrs.is_open !== false,
          status_message: resourceAttrs.status_message || "",
          difficulty_current: resourceAttrs.difficulty_current || attrs.difficulty || "",
          conditions: resourceAttrs.conditions || "",
          last_updated: resourceData.updated_at || new Date().toISOString(),
        })
      } else {
        // Fallback to business attributes
        setStatus({
          is_open: attrs.is_open !== false,
          status_message: attrs.status_message || "",
          difficulty_current: attrs.difficulty_current || attrs.difficulty || "",
          conditions: attrs.conditions || "",
          last_updated: businessData.updated_at || new Date().toISOString(),
        })
      }
    }
    setIsLoading(false)
  }

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()

    const attributes = {
      is_open: status.is_open,
      status_message: status.status_message,
      difficulty_current: status.difficulty_current,
      conditions: status.conditions,
      last_updated: new Date().toISOString(),
    }

    // Try to update or create in business_resources
    const { data: existing } = await supabase
      .from('business_resources')
      .select('id')
      .eq('business_id', businessId)
      .eq('resource_type', 'trail_status')
      .single()

    if (existing) {
      await supabase
        .from('business_resources')
        .update({ attributes })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('business_resources')
        .insert({
          business_id: businessId,
          resource_type: 'trail_status',
          name: 'Trail Status',
          attributes,
        })
    }

    // Also update business attributes as fallback
    const businessAttrs = business?.attributes || {}
    await supabase
      .from('businesses')
      .update({
        attributes: { ...businessAttrs, ...attributes }
      })
      .eq('id', businessId)

    setIsSaving(false)
    await loadStatus()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading trail status...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Trail Status Management</h3>
        <p className="text-sm text-slate-600 mt-1">
          Manage trail availability, conditions, and status updates
        </p>
      </div>

      {/* Status Toggle */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Trail Status</h4>
            <p className="text-sm text-slate-600">
              {status.is_open ? "Trail is currently open" : "Trail is currently closed"}
            </p>
          </div>
          <button
            onClick={() => setStatus(prev => ({ ...prev, is_open: !prev.is_open }))}
            className={cn(
              "relative inline-flex h-12 w-24 items-center rounded-full transition-colors",
              status.is_open ? "bg-green-500" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-10 w-10 transform rounded-full bg-white transition-transform",
                status.is_open ? "translate-x-12" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {!status.is_open && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Trail Closed</p>
              <p className="text-sm text-red-700 mt-1">
                This trail is currently closed. Visitors will see a warning message.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Status Message
        </label>
        <textarea
          value={status.status_message}
          onChange={(e) =>
            setStatus(prev => ({ ...prev, status_message: e.target.value }))
          }
          placeholder="e.g., Closed for maintenance until Jan 15, 2025"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          This message will be displayed to visitors when the trail is closed
        </p>
      </div>

      {/* Current Difficulty */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Current Difficulty Level
        </label>
        <select
          value={status.difficulty_current}
          onChange={(e) =>
            setStatus(prev => ({ ...prev, difficulty_current: e.target.value }))
          }
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
        >
          <option value="">Select difficulty...</option>
          <option value="Easy">Easy</option>
          <option value="Moderate">Moderate</option>
          <option value="Hard">Hard</option>
          <option value="Expert">Expert</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Current difficulty may differ from base difficulty due to weather or trail conditions
        </p>
      </div>

      {/* Trail Conditions */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Trail Conditions
        </label>
        <textarea
          value={status.conditions}
          onChange={(e) =>
            setStatus(prev => ({ ...prev, conditions: e.target.value }))
          }
          placeholder="e.g., Muddy after rain, Ice on upper section, Clear and dry"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Describe current trail conditions, warnings, or important information for hikers
        </p>
      </div>

      {/* Last Updated */}
      {status.last_updated && (
        <div className="text-sm text-slate-600">
          Last updated: {new Date(status.last_updated).toLocaleString()}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Status
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

