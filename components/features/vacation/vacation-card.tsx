"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { motion } from "framer-motion"
import {
    MapPin,
    Calendar,
    DollarSign,
    MoreVertical,
    Edit2,
    Trash2,
    Check,
    Plane
} from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Vacation } from "@/store/vacation-store"

interface VacationCardProps {
    vacation: Vacation
    isActive: boolean
    onSelect: () => void
    onEdit: () => void
    onDelete: () => void
}

export function VacationCard({ vacation, isActive, onSelect, onEdit, onDelete }: VacationCardProps) {
    const [showMenu, setShowMenu] = useState(false)

    const formatDate = (date: string) => {
        return format(new Date(date), "d MMM", { locale: ro })
    }

    const getDaysCount = () => {
        const start = new Date(vacation.startDate)
        const end = new Date(vacation.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    const getStatusColor = () => {
        switch (vacation.status) {
            case 'active':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'completed':
                return 'bg-gray-100 text-gray-600 border-gray-200'
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200'
        }
    }

    const getStatusLabel = () => {
        switch (vacation.status) {
            case 'active':
                return 'În desfășurare'
            case 'completed':
                return 'Finalizată'
            default:
                return 'Planificare'
        }
    }

    // Generate a gradient based on city name for visual variety
    const getCardGradient = () => {
        const gradients = [
            'from-blue-500 to-purple-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-pink-600',
            'from-indigo-500 to-blue-600',
            'from-rose-500 to-orange-600',
        ]
        const index = vacation.cityName.charCodeAt(0) % gradients.length
        return gradients[index]
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 ${isActive
                    ? 'ring-4 ring-blue-500 ring-offset-2 shadow-blue-500/25'
                    : 'hover:shadow-xl'
                }`}
            onClick={onSelect}
        >
            {/* Cover Image / Gradient */}
            <div className={`h-32 bg-gradient-to-br ${getCardGradient()} relative`}>
                {vacation.coverImage ? (
                    <img
                        src={vacation.coverImage}
                        alt={vacation.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Plane className="h-12 w-12 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                    {getStatusLabel()}
                </div>

                {/* Active Indicator */}
                {isActive && (
                    <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-lg">
                        <Check className="h-4 w-4 text-blue-600" />
                    </div>
                )}

                {/* Menu Button */}
                <div className="absolute bottom-3 right-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-md"
                    >
                        <MoreVertical className="h-4 w-4 text-gray-700" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div
                            className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[140px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    setShowMenu(false)
                                    onEdit()
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Edit2 className="h-4 w-4" />
                                Editează
                            </button>
                            <button
                                onClick={() => {
                                    setShowMenu(false)
                                    onDelete()
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Șterge
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-white">
                <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">
                    {vacation.title}
                </h3>

                <div className="space-y-2">
                    {/* City */}
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm truncate">{vacation.cityName}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm">
                            {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)} ({getDaysCount()} zile)
                        </span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">
                            {vacation.budgetTotal.toLocaleString()} {vacation.currency}
                        </span>
                    </div>
                </div>
            </div>

            {/* Click Overlay for closing menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                    }}
                />
            )}
        </motion.div>
    )
}
