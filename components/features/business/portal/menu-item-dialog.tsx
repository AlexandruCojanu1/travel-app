"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  grams?: number
  allergens: string[]
  dietary_tags: string[]
  image_url?: string
  is_available: boolean
}

interface MenuItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<MenuItem, 'id'>, sectionId: string) => void
  item: MenuItem | null
  sectionId: string
  allergens: string[]
  dietaryTags: string[]
}

export function MenuItemDialog({
  isOpen,
  onClose,
  onSave,
  item,
  sectionId,
  allergens,
  dietaryTags,
}: MenuItemDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    grams: undefined as number | undefined,
    allergens: [] as string[],
    dietary_tags: [] as string[],
    image_url: "",
    is_available: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        grams: item.grams,
        allergens: item.allergens,
        dietary_tags: item.dietary_tags,
        image_url: item.image_url || "",
        is_available: item.is_available,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        grams: undefined,
        allergens: [],
        dietary_tags: [],
        image_url: "",
        is_available: true,
      })
    }
    setErrors({})
  }, [item, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: "Item name is required" })
      return
    }
    if (formData.price <= 0) {
      setErrors({ price: "Price must be greater than 0" })
      return
    }

    onSave(formData, sectionId)
  }

  function toggleAllergen(allergen: string) {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  function toggleDietaryTag(tag: string) {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {item ? "Edit Menu Item" : "Add Menu Item"}
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
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              placeholder="e.g., Caesar Salad"
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the dish..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    ? "border-red-300 bg-blue-50"
                    : "border-slate-200 focus:border-blue-500"
                )}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Portion Size (grams)
              </label>
              <input
                type="number"
                value={formData.grams || ""}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, grams: parseFloat(e.target.value) || undefined }))
                }
                min="0"
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
              />
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Dietary Tags
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dietaryTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-green-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.dietary_tags.includes(tag)}
                    onChange={() => toggleDietaryTag(tag)}
                    className="rounded"
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Allergens
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allergens.map((allergen) => (
                <label
                  key={allergen}
                  className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-yellow-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                    className="rounded"
                  />
                  <span className="text-sm">{allergen}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, is_available: e.target.checked }))
                }
                className="rounded"
              />
              <span className="text-sm font-semibold">Item is available</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

