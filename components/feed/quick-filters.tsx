"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Hotel, UtensilsCrossed, Trees, Compass } from "lucide-react"
import { cn } from "@/lib/utils"

const filters = [
  { id: "All", label: "All", icon: Compass },
  { id: "Hotels", label: "Hotels", icon: Hotel },
  { id: "Food", label: "Food & Dining", icon: UtensilsCrossed },
  { id: "Nature", label: "Nature", icon: Trees },
  { id: "Activities", label: "Activities", icon: Compass },
]

interface QuickFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id

          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/25"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeFilterIndicator"
                  className="absolute inset-0 rounded-full bg-slate-900 -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
