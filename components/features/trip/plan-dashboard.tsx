import { useState } from "react"
import { Plus, Home, Search, Calendar as CalendarIcon, User, Map, Globe } from "lucide-react"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"
import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"
import Image from "next/image"
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

    // Handle open create dialog (merging props and internal state logic)
    const handleOpenCreate = () => {
        setIsCreateDialogOpen(true)
        onCreate() // Call parent handler if needed side effects exist
    }

    return (
        <div className="min-h-screen bg-background pb-24 relative">
            {/* Animated Background Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
                <Image
                    src="/images/travel-pattern.svg"
                    alt="Pattern"
                    fill
                    className="object-cover"
                />
            </div>

            <div className="max-w-md mx-auto px-6 pt-8 relative z-10">
                <h1 className="text-3xl font-bold text-foreground mb-6">Planificări</h1>

                {/* Custom Segmented Control */}
                <div className="bg-muted p-1 rounded-full flex mb-12 relative border border-black/5 max-w-xs mx-auto">
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

                {/* Content */}
                {filteredVacations.length > 0 ? (
                    <div className="space-y-6">
                        {filteredVacations.map((vacation) => (
                            <TripSummaryCard
                                key={vacation.id}
                                title={vacation.title}
                                cityName={vacation.cityName}
                                startDate={vacation.startDate}
                                endDate={vacation.endDate}
                                spotsCount={vacation.spotsCount}
                                imageUrl={vacation.coverImage}
                                onClick={() => onSelect(vacation.id)}
                            />
                        ))}
                        {/* Add New Trip Button (Floating or inline) */}
                        <button
                            onClick={handleOpenCreate}
                            className="w-full py-4 border-2 border-dashed border-border rounded-3xl text-muted-foreground font-medium hover:bg-secondary/20 hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Planifică o nouă călătorie
                        </button>
                    </div>
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
