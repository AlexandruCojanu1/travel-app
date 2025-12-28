"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
  max_participants: number
  description: string
  image_url?: string
  is_active: boolean
  created_at: string
}

interface ServiceFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Omit<Service, 'id' | 'created_at'>) => void
  service: Service | null
}

export function ServiceFormDialog({
  isOpen,
  onClose,
  onSave,
  service,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    duration_minutes: 60,
    max_participants: 1,
    description: "",
    image_url: "",
    is_active: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        max_participants: service.max_participants,
        description: service.description,
        image_url: service.image_url || "",
        is_active: service.is_active,
      })
    } else {
      setFormData({
        name: "",
        price: 0,
        duration_minutes: 60,
        max_participants: 1,
        description: "",
        image_url: "",
        is_active: true,
      })
    }
    setErrors({})
  }, [service, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: "Service name is required" })
      return
    }
    if (formData.price <= 0) {
      setErrors({ price: "Price must be greater than 0" })
      return
    }
    if (formData.duration_minutes < 1) {
      setErrors({ duration_minutes: "Duration must be at least 1 minute" })
      return
    }
    if (formData.max_participants < 1) {
      setErrors({ max_participants: "Max participants must be at least 1" })
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {service ? "Edit Service" : "Add New Service"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              placeholder="e.g., Thai Massage 60min, Yoga Class"
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 transition-all",
                errors.name
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 focus:border-blue-500"
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the service..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Price (RON) *
              </label>
              <input
                type="number"
                value={formData.price || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                  if (errors.price) setErrors({ ...errors, price: "" })
                }}
                min="0"
                step="0.01"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.price
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Duration (min) *
              </label>
              <input
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 1 }))
                  if (errors.duration_minutes) setErrors({ ...errors, duration_minutes: "" })
                }}
                min="1"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.duration_minutes
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Max Participants *
              </label>
              <input
                type="number"
                value={formData.max_participants || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))
                  if (errors.max_participants) setErrors({ ...errors, max_participants: "" })
                }}
                min="1"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.max_participants
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.max_participants && (
                <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, image_url: e.target.value }))
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Preview"
                className="mt-3 w-full h-32 object-cover rounded-xl border-2 border-slate-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                }
                className="rounded"
              />
              <span className="text-sm font-semibold">Service is active and available for booking</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {service ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

