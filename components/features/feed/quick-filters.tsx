"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Hotel, UtensilsCrossed, Trees, Compass } from "lucide-react"
import { cn } from "@/lib/utils"

const filters = [
  { id: "All", label: "Toate", icon: Compass },
  { id: "Hotels", label: "Hoteluri", icon: Hotel },
  { id: "Food", label: "Mâncare & Restaurante", icon: UtensilsCrossed },
  { id: "Nature", label: "Natură", icon: Trees },
  { id: "Activities", label: "Activități", icon: Compass },
]

interface QuickFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  className?: string
}

export function QuickFilters({ activeFilter, onFilterChange, className }: QuickFiltersProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 justify-center">
        {filters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id

          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-mova-blue text-white shadow-airbnb-md hover:bg-[#2563EB]"
                  : "bg-white text-mova-dark hover:bg-mova-light-gray border border-gray-200 hover:border-mova-blue/30"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-mova-gray")} />
              <span>{filter.label}</span>

              {isActive && (
                <motion.div
                  layoutId="activeFilterIndicator"
                  className="absolute inset-0 rounded-full bg-mova-blue -z-10"
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
