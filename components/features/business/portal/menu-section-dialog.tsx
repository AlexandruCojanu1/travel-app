"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"

interface MenuSection {
  id: string
  name: string
  items: any[]
  order: number
  is_expanded: boolean
}

interface MenuSectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  section: MenuSection | null
}

export function MenuSectionDialog({
  isOpen,
  onClose,
  onSave,
  section,
}: MenuSectionDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (section) {
      setName(section.name)
    } else {
      setName("")
    }
    setError("")
  }, [section, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Section name is required")
      return
    }

    onSave(name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {section ? "Edit Section" : "Add Menu Section"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
              placeholder="e.g., Starters, Mains, Desserts"
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 transition-all",
                error
                  ? "border-red-300 bg-blue-50"
                  : "border-slate-200 focus:border-blue-500"
              )}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {section ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

