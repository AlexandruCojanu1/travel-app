import { useState } from "react"
import { Plus, Home, Search, Calendar as CalendarIcon, User, Map, Globe } from "lucide-react"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"
import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"

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
                <div className="bg-muted p-1 rounded-full flex mb-12 relative border border-black/5 max-w-xs mx-auto md:mx-0">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-semibold rounded-full text-center transition-all duration-300 z-10",
                            activeTab === 'active' ? "text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-semibold rounded-full text-center transition-all duration-300 z-10",
                            activeTab === 'past' ? "text-white" : "text-muted-foreground hover:text-foreground"
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
                            {/* Add New Trip Card - FIRST on mobile, last on desktop */}
                            <div className="order-first md:order-last">
                                <button
                                    onClick={handleOpenCreate}
                                    className="w-full min-h-[80px] py-4 border-2 border-dashed border-border rounded-3xl text-muted-foreground font-medium hover:bg-secondary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <Plus className="h-8 w-8" />
                                    Planifică o nouă călătorie
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
                            <button
                                onClick={handleOpenCreate}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all text-sm flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Planifică acum
                            </button>
                        )}
                    </div>
                )}
            </div>

            <CreateTripDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    )
}
