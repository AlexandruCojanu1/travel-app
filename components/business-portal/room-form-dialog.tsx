"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  name: string
  base_price: number
  capacity: number
  bed_type: string
  room_size_m2?: number
  amenities: string[]
  images: string[]
  is_active: boolean
  created_at: string
}

interface RoomFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (room: Omit<Room, 'id' | 'created_at'>) => void
  room: Room | null
  bedTypes: readonly string[]
  amenitiesOptions: string[]
}

export function RoomFormDialog({
  isOpen,
  onClose,
  onSave,
  room,
  bedTypes,
  amenitiesOptions,
}: RoomFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    base_price: 0,
    capacity: 2,
    bed_type: "double",
    room_size_m2: undefined as number | undefined,
    amenities: [] as string[],
    images: [] as string[],
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        base_price: room.base_price,
        capacity: room.capacity,
        bed_type: room.bed_type,
        room_size_m2: room.room_size_m2,
        amenities: room.amenities,
        images: room.images,
        is_active: room.is_active,
      })
    } else {
      setFormData({
        name: "",
        base_price: 0,
        capacity: 2,
        bed_type: "double",
        room_size_m2: undefined,
        amenities: [],
        images: [],
        is_active: true,
      })
    }
    setErrors({})
  }, [room, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: "Room name is required" })
      return
    }
    if (formData.base_price <= 0) {
      setErrors({ base_price: "Price must be greater than 0" })
      return
    }
    if (formData.capacity < 1) {
      setErrors({ capacity: "Capacity must be at least 1" })
      return
    }

    onSave(formData)
  }

  function toggleAmenity(amenity: string) {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  function addImageUrl() {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ""]
    }))
  }

  function updateImageUrl(index: number, url: string) {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? url : img)
    }))
  }

  function removeImageUrl(index: number) {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {room ? "Edit Room" : "Add New Room"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              placeholder="e.g., Deluxe Suite, Standard Double"
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

          {/* Price & Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Base Price (RON/night) *
              </label>
              <input
                type="number"
                value={formData.base_price || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))
                  if (errors.base_price) setErrors({ ...errors, base_price: "" })
                }}
                min="0"
                step="0.01"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.base_price
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.base_price && (
                <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Capacity (guests) *
              </label>
              <input
                type="number"
                value={formData.capacity || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))
                  if (errors.capacity) setErrors({ ...errors, capacity: "" })
                }}
                min="1"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.capacity
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
              )}
            </div>
          </div>

          {/* Bed Type & Room Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bed Type *
              </label>
              <select
                value={formData.bed_type}
                onChange={(e) => setFormData(prev => ({ ...prev, bed_type: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
              >
                {bedTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Room Size (m²)
              </label>
              <input
                type="number"
                value={formData.room_size_m2 || ""}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, room_size_m2: parseFloat(e.target.value) || undefined }))
                }
                min="0"
                step="0.1"
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenitiesOptions.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Room Images
            </label>
            <div className="space-y-3">
              {formData.images.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {formData.images.length < 5 && (
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600"
                >
                  + Add Image URL
                </button>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-semibold">Room is active and available for booking</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              {room ? "Update Room" : "Create Room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

