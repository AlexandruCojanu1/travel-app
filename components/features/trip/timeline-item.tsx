"use client"

import React, { useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Trash2, Bed, Utensils, Mountain, MapPin, GripVertical, Calendar, MoreVertical } from 'lucide-react'
import { useTripStore, type TripItem } from '@/store/trip-store'
import { Button } from '@/components/shared/ui/button'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { NavigationDialog } from './navigation-dialog'
import { getBusinessById } from '@/services/business/business.service'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/shared/ui/dropdown-menu"
import { cn } from '@/lib/utils'

interface TimelineItemProps {
  item: TripItem
  index: number
  isLast: boolean
  totalItems: number
  isDragging?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onDrag?: (y: number) => void
  daysCount: number
}

export function TimelineItem({
  item,
  index,
  isLast,
  totalItems,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDrag,
  daysCount,
}: TimelineItemProps) {
  const { removeItem, changeItemDay, budget, toggleItemVisited } = useTripStore()
  const y = useMotionValue(0)
  const dragStartY = useRef(0)
  const [isNavOpen, setIsNavOpen] = React.useState(false)
  const [navDestination, setNavDestination] = React.useState<{ latitude: number, longitude: number, name: string } | null>(null)

  const handleCardClick = async () => {
    // Prevent navigation if dragging
    if (isDragging) return

    try {
      const business = await getBusinessById(item.business_id)
      if (business && business.latitude && business.longitude) {
        setNavDestination({
          latitude: business.latitude,
          longitude: business.longitude,
          name: business.name
        })
        setIsNavOpen(true)
      } else {
        toast.error('Nu am găsit coordonatele pentru această locație')
      }
    } catch (error) {
      console.error('Failed to load business details', error)
      toast.error('Eroare la încărcarea detaliilor')
    }
  }

  // Get relative time slot based on index
  const getTimeSlot = (idx: number, total: number) => {
    if (idx === 0) return 'Începutul zilei'
    if (idx === total - 1) return 'Sfârșitul zilei'
    return 'Următoarea oprire'
  }

  const timeSlot = getTimeSlot(index, totalItems)

  // Reset y position when index changes (after reorder)
  React.useEffect(() => {
    y.set(0)
  }, [index, y])

  // Get category icon
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Hotels':
        return <Bed className="h-4 w-4" />
      case 'Food':
        return <Utensils className="h-4 w-4" />
      case 'Nature':
        return <Mountain className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  // Translate category to Romanian
  const translateCategory = (category?: string) => {
    const translations: Record<string, string> = {
      'Hotels': 'Hoteluri',
      'Food': 'Mâncare',
      'Nature': 'Natură',
      'Activities': 'Activități',
    }
    return translations[category || ''] || category || 'Activitate'
  }

  const categoryIcon = getCategoryIcon(item.business_category)
  const translatedCategory = translateCategory(item.business_category)

  return (
    <div className="relative">
      <motion.div
        className="relative flex gap-4"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        {/* Left: Time Slot */}
        <div className="w-24 flex-shrink-0 pt-1">
          <p className="text-sm font-medium text-gray-600">{timeSlot}</p>
        </div>

        {/* Center: Connector Line & Node */}
        <div className="flex flex-col items-center w-6 flex-shrink-0">
          {/* Node (Dot) */}
          <div className="w-4 h-4 rounded-full bg-mova-blue border-4 border-white shadow-airbnb-md z-10" />

          {/* Vertical Line */}
          {!isLast && (
            <div className="w-0.5 h-full bg-gray-300 mt-2 min-h-[80px]" />
          )}
        </div>

        {/* Right: Content Card */}
        <div className="flex-1 pb-6">
          <motion.div
            className="airbnb-card p-4 relative cursor-pointer hover:shadow-md transition-shadow"
            style={{ y }}
            drag="y"
            dragConstraints={{ top: -1000, bottom: 1000 }}
            dragElastic={0.1}
            onDragStart={(_, info) => {
              dragStartY.current = info.point.y
              if (onDragStart) onDragStart()
            }}
            onDragEnd={(_, info) => {
              y.set(0) // Reset position
              if (onDragEnd) onDragEnd()
            }}
            onDrag={(_, info) => {
              const offsetY = info.offset.y
              if (onDrag) {
                onDrag(offsetY)
              }
            }}
            whileDrag={{
              scale: 1.05,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 50,
              cursor: 'grabbing',
            }}
            dragMomentum={false}
            onClick={handleCardClick}
          >
            {/* Drag Handle - Visual indicator */}
            <div
              className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5" />
            </div>
            {/* Header */}
            <div className="flex items-start justify-between mb-2 pl-6">
              <div className="flex-1 min-w-0 flex items-start gap-3">
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={item.is_visited || false}
                    onChange={() => toggleItemVisited(item.id)}
                    className="border-slate-300"
                  />
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-mova-dark text-base mb-1 line-clamp-1 transition-all",
                    item.is_visited && "text-gray-400 line-through decoration-gray-400"
                  )}>
                    {item.business_name || 'Loc'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-mova-gray">
                    <div className="text-mova-gray">{categoryIcon}</div>
                    <span>{translatedCategory}</span>
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>

                  {/* Move to another day */}
                  <DropdownMenuLabel className="text-xs font-normal text-gray-500">Mută în ziua...</DropdownMenuLabel>
                  {Array.from({ length: daysCount }).map((_, i) => (
                    i !== item.day_index && (
                      <DropdownMenuItem
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          changeItemDay(item.id, i)
                        }}
                        className="cursor-pointer"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Ziua {i + 1}
                      </DropdownMenuItem>
                    )
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Șterge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Footer: Cost Badge - Only show if cost > 0 */}
            {item.estimated_cost > 0 && (
              <div className="flex items-center justify-end mt-3 pl-6">
                <span className="px-3 py-1 bg-mova-light-blue text-mova-blue rounded-full text-sm font-semibold">
                  {item.estimated_cost.toFixed(0)} {budget?.currency || 'RON'}
                </span>
              </div>
            )}
            {item.estimated_cost === 0 && (
              <div className="flex items-center justify-end mt-3 pl-6">
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                  Gratis
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      <NavigationDialog
        isOpen={isNavOpen}
        onOpenChange={setIsNavOpen}
        destination={navDestination}
      />
    </div>
  )
}
