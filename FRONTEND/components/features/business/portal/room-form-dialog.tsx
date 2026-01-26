"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import type { HotelRoom } from "@/actions/rooms"

interface RoomFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (room: Partial<HotelRoom>) => void
  room: HotelRoom | null
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
  const [formData, setFormData] = useState<Partial<HotelRoom>>({
    name: "",
    price_per_night: 0,
    max_guests: 2,
    bed_type: "double",
    size_sqm: undefined,
    amenities: [],
    images: [],
    is_active: true,
    total_rooms: 1,
    room_type: 'standard', // default
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        price_per_night: room.price_per_night,
        max_guests: room.max_guests,
        bed_type: room.bed_type || "double",
        size_sqm: room.size_sqm,
        amenities: room.amenities || [],
        images: room.images || [],
        is_active: room.is_active,
        total_rooms: room.total_rooms,
        room_type: room.room_type,
      })
    } else {
      setFormData({
        name: "",
        price_per_night: 0,
        max_guests: 2,
        bed_type: "double",
        size_sqm: undefined,
        amenities: [],
        images: [],
        is_active: true,
        total_rooms: 1,
        room_type: 'standard',
      })
    }
    setErrors({})
  }, [room, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!formData.name?.trim()) {
      setErrors({ name: "Room name is required" })
      return
    }
    if ((formData.price_per_night || 0) <= 0) {
      setErrors({ price_per_night: "Price must be greater than 0" })
      return
    }
    if ((formData.max_guests || 0) < 1) {
      setErrors({ max_guests: "Capacity must be at least 1" })
      return
    }

    onSave(formData)
  }

  function toggleAmenity(amenity: string) {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }))
  }

  function addImageUrl() {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ""]
    }))
  }

  function updateImageUrl(index: number, url: string) {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map((img, i) => i === index ? url : img)
    }))
  }

  function removeImageUrl(index: number) {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
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
              value={formData.name || ""}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              placeholder="e.g., Deluxe Suite, Standard Double"
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 transition-all",
                errors.name
                  ? "border-red-300 bg-blue-50"
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
                Price per Night (RON) *
              </label>
              <input
                type="number"
                value={formData.price_per_night || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, price_per_night: parseFloat(e.target.value) || 0 }))
                  if (errors.price_per_night) setErrors({ ...errors, price_per_night: "" })
                }}
                min="0"
                step="0.01"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.price_per_night
                    ? "border-red-300 bg-blue-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.price_per_night && (
                <p className="mt-1 text-sm text-red-600">{errors.price_per_night}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Max Guests *
              </label>
              <input
                type="number"
                value={formData.max_guests || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, max_guests: parseInt(e.target.value) || 1 }))
                  if (errors.max_guests) setErrors({ ...errors, max_guests: "" })
                }}
                min="1"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 transition-all",
                  errors.max_guests
                    ? "border-red-300 bg-blue-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.max_guests && (
                <p className="mt-1 text-sm text-red-600">{errors.max_guests}</p>
              )}
            </div>
          </div>

          {/* Total Rooms (Inventory) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Rooms Available (Inventory) *
            </label>
            <input
              type="number"
              value={formData.total_rooms || 1}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, total_rooms: parseInt(e.target.value) || 1 }))
              }}
              min="1"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
            />
          </div>

          {/* Bed Type & Room Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bed Type
              </label>
              <select
                value={formData.bed_type || "double"}
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
                value={formData.size_sqm || ""}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, size_sqm: parseFloat(e.target.value) || undefined }))
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
                    checked={formData.amenities?.includes(amenity)}
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
              Room Images URLs
            </label>
            <div className="space-y-3">
              {formData.images?.map((url, index) => (
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
                    className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-blue-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(formData.images?.length || 0) < 5 && (
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
