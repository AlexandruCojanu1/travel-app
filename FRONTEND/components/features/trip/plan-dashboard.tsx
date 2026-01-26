"use client"

import { useState } from "react"
import { Plus, Home, Search, Calendar as CalendarIcon, User, Map, Globe } from "lucide-react"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"

import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"
import { JoinTripDialog } from "@/components/features/trip/join-trip-dialog"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface PlanDashboardProps {
    vacations: any[]
    onSelect: (id: string) => void
    onCreate: () => void
}

export function PlanDashboard({ vacations, onSelect, onCreate }: PlanDashboardProps) {
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
    const [showAllMobile, setShowAllMobile] = useState(false)

    // Filter vacations
    const now = new Date()
    const filteredVacations = vacations.filter(vacation => {
        const endDate = new Date(vacation.endDate)
        if (activeTab === 'active') {
            return endDate >= now
        } else {
            return endDate < now
        }
    })

    // Get vacations to display on mobile (first 1 unless expanded)
    const mobileVacations = showAllMobile ? filteredVacations : filteredVacations.slice(0, 1)
    const hasMoreVacations = filteredVacations.length > 1

    // Handle open create dialog (merging props and internal state logic)
    const handleOpenCreate = () => {
        setIsCreateDialogOpen(true)
        onCreate() // Call parent handler if needed side effects exist
    }

    return (
        <div className="bg-background relative">


            <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-6 pt-2 relative z-10">
                <h1 className="text-3xl font-bold text-foreground mb-6">Planificări</h1>

                {/* Custom Segmented Control */}
                <div className="glass-card p-1.5 rounded-full flex mb-12 relative border border-white/20 max-w-xs mx-auto md:mx-0 shadow-lg">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-full text-center transition-all duration-300 z-10",
                            activeTab === 'active' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-full text-center transition-all duration-300 z-10",
                            activeTab === 'past' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Anterioare
                    </button>

                    {/* Animated Background Pill */}
                    <div
                        className={cn(
                            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 ease-spring shadow-lg shadow-primary/20",
                            activeTab === 'active' ? "left-1" : "left-[calc(50%+2px)]"
                        )}
                    />
                </div>

                {/* Content - Responsive Grid */}
                {filteredVacations.length > 0 ? (
                    <>
                        {/* Mobile: Show limited, Desktop: Show all */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Add New Trip Card & Join Card */}
                            <div className="order-first md:order-last flex flex-col gap-4">
                                <button
                                    onClick={handleOpenCreate}
                                    className="w-full h-[220px] rounded-[32px] border-2 border-dashed border-gray-200 hover:border-primary/30 hover:bg-white/50 transition-all flex flex-col items-center justify-center gap-4 group"
                                >
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                                        <Plus className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">Planifică o călătorie</span>
                                        <span className="text-sm text-gray-500">Începe o nouă aventură</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setIsJoinDialogOpen(true)}
                                    className="w-full py-4 rounded-[24px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-primary"
                                >
                                    <User className="h-4 w-4" />
                                    Ai un cod? Intră în grup
                                </button>
                            </div>

                            {/* Vacation cards */}
                            {filteredVacations.map((vacation, index) => (
                                <div
                                    key={vacation.id}
                                    className={cn(
                                        // On mobile, hide items beyond first 1 unless expanded
                                        index >= 1 && !showAllMobile ? "hidden md:block" : "block"
                                    )}
                                >
                                    <TripSummaryCard
                                        title={vacation.title}
                                        cityName={vacation.cityName}
                                        startDate={vacation.startDate}
                                        endDate={vacation.endDate}
                                        spotsCount={vacation.spotsCount}
                                        imageUrl={vacation.coverImage}
                                        onClick={() => onSelect(vacation.id)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Mobile "Vezi toate" / "Vezi mai puțin" button */}
                        {hasMoreVacations && (
                            <button
                                onClick={() => setShowAllMobile(!showAllMobile)}
                                className="mt-6 w-full py-3 text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-2 md:hidden"
                            >
                                {showAllMobile ? (
                                    <>
                                        Vezi mai puțin
                                        <Map className="h-4 w-4 rotate-180" />
                                    </>
                                ) : (
                                    <>
                                        Vezi toate ({filteredVacations.length})
                                        <Map className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    /* Empty State - Minimalist */
                    <div className="flex flex-col items-center justify-center pt-12 text-center">
                        <div className="mb-6 p-4 rounded-full bg-secondary/20 border border-primary/10">
                            <Globe className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {activeTab === 'active' ? "Nicio călătorie planificată" : "Nicio călătorie anterioară"}
                        </h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-8 text-sm">
                            {activeTab === 'active'
                                ? "Începe o nouă aventură acum. Planifică itinerariul, bugetul și descoperă locuri noi."
                                : "Istoricul tău de călătorii va apărea aici după ce finalizezi prima aventură."}
                        </p>

                        {activeTab === 'active' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleOpenCreate}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-sm flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Planifică acum
                                </button>
                                <button
                                    onClick={() => setIsJoinDialogOpen(true)}
                                    className="px-6 py-3 rounded-full font-semibold border border-input hover:bg-accent hover:text-accent-foreground transition-all text-sm flex items-center gap-2"
                                >
                                    Ai un link? Colaborează
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateTripDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <JoinTripDialog
                isOpen={isJoinDialogOpen}
                onOpenChange={setIsJoinDialogOpen}
            />
        </div>
    )
}
