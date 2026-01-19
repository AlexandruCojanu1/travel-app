"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Plane, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { VacationCard } from "./vacation-card"
import { CreateVacationDialog } from "./create-vacation-dialog"
import { useVacationStore, Vacation } from "@/store/vacation-store"
import { toast } from "sonner"

interface VacationSelectorProps {
    onVacationSelected: (vacationId: string) => void
}

export function VacationSelector({ onVacationSelected }: VacationSelectorProps) {
    const {
        vacations,
        activeVacationId,
        isLoading,
        loadVacations,
        selectVacation,
        deleteVacation
    } = useVacationStore()

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingVacation, setEditingVacation] = useState<Vacation | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    useEffect(() => {
        loadVacations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSelect = (vacationId: string) => {
        selectVacation(vacationId)
        onVacationSelected(vacationId)
    }

    const handleEdit = (vacation: Vacation) => {
        setEditingVacation(vacation)
        setIsCreateDialogOpen(true)
    }

    const handleDelete = async (vacationId: string) => {
        const result = await deleteVacation(vacationId)
        if (result.success) {
            toast.success('Vacanța a fost ștearsă')
        } else {
            toast.error(result.error || 'Eroare la ștergere')
        }
        setDeleteConfirmId(null)
    }

    const handleCreateSuccess = (vacationId: string) => {
        setEditingVacation(null)
        if (!editingVacation) {
            // If creating new, select it and go to planning
            selectVacation(vacationId)
            onVacationSelected(vacationId)
        }
        loadVacations()
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Se încarcă vacanțele...</p>
            </div>
        )
    }

    // Empty state
    if (vacations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-center max-w-md">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="h-28 w-28 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25"
                    >
                        <Plane className="h-14 w-14 text-white" />
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold text-gray-900 mb-3"
                    >
                        Începe prima ta aventură
                    </motion.h2>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 mb-8 text-lg"
                    >
                        Creează-ți prima vacanță și începe să-ți planifici călătoria perfectă în România.
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Creează prima vacanță
                        </Button>
                    </motion.div>
                </div>

                <CreateVacationDialog
                    isOpen={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onSuccess={handleCreateSuccess}
                />
            </div>
        )
    }

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Vacanțele mele
                    </h1>
                    <p className="text-gray-500">
                        Selectează o vacanță pentru a continua planificarea sau creează una nouă
                    </p>
                </div>

                <Button
                    onClick={() => {
                        setEditingVacation(null)
                        setIsCreateDialogOpen(true)
                    }}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Vacanță nouă
                </Button>
            </div>

            {/* Active vacation highlight */}
            {activeVacationId && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-3 rounded-xl"
                >
                    <Sparkles className="h-4 w-4" />
                    <span>
                        Ai o vacanță activă selectată. Apasă pe ea pentru a continua planificarea.
                    </span>
                </motion.div>
            )}

            {/* Vacations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {vacations.map((vacation, index) => (
                        <motion.div
                            key={vacation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <VacationCard
                                vacation={vacation}
                                isActive={vacation.id === activeVacationId}
                                onSelect={() => handleSelect(vacation.id)}
                                onEdit={() => handleEdit(vacation)}
                                onDelete={() => setDeleteConfirmId(vacation.id)}
                            />
                        </motion.div>
                    ))}

                    {/* Add New Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: vacations.length * 0.05 }}
                    >
                        <button
                            onClick={() => {
                                setEditingVacation(null)
                                setIsCreateDialogOpen(true)
                            }}
                            className="w-full h-full min-h-[280px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <Plus className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-gray-500 group-hover:text-primary font-medium transition-colors">
                                Adaugă vacanță nouă
                            </span>
                        </button>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setDeleteConfirmId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Șterge vacanța?</h3>
                                    <p className="text-sm text-gray-500">Această acțiune nu poate fi anulată</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setDeleteConfirmId(null)}
                                >
                                    Anulează
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleDelete(deleteConfirmId)}
                                >
                                    Șterge
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Dialog */}
            <CreateVacationDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open)
                    if (!open) setEditingVacation(null)
                }}
                editingVacation={editingVacation}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
