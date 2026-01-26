"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Check, Wallet, Banknote } from "lucide-react"
import { initiateSplitBooking } from "@/actions/payment"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface GroupCheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    totalAmount: number
    businessName: string
    startDate?: string
    endDate?: string
    businessId?: string
    collaboratorCount: number // Including self
}

export function GroupCheckoutModal({
    isOpen,
    onClose,
    tripId,
    totalAmount,
    businessName,
    startDate,
    endDate,
    businessId,
    collaboratorCount = 1
}: GroupCheckoutModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const splitAmount = totalAmount / collaboratorCount

    const handleConfirmSplit = async () => {
        setIsLoading(true)
        try {
            const result = await initiateSplitBooking(tripId, totalAmount, {
                business_id: businessId || "00000000-0000-0000-0000-000000000000", // Fallback UUID
                start_date: startDate || new Date().toISOString(),
                end_date: endDate || new Date(Date.now() + 86400000).toISOString(),
                guests: collaboratorCount
            })

            if (result.success) {
                toast.success("Plată de grup inițiată! Prietenii au primit notificare.")
                onClose()
                // Redirect to a 'Payment Room' or refresh
                router.refresh()
            } else {
                toast.error("Eroare la inițiere: " + result.error)
            }
        } catch (e) {
            toast.error("Ceva nu a mers bine.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl z-10"
                    >
                        {/* Hardware Knob for mobile feel */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 md:hidden" />

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Split with Group</h2>
                                <p className="text-sm text-gray-500">Împarte costul pentru {businessName}</p>
                            </div>
                        </div>

                        {/* Calculation Card */}
                        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Total de Plată</span>
                                <span className="font-bold text-lg">{totalAmount} RON</span>
                            </div>
                            <div className="w-full h-px bg-gray-200 mb-4" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <Users className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {collaboratorCount} Persoane
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-black text-primary">
                                        {splitAmount.toFixed(0)} RON
                                    </span>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">
                                        / persoană
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="flex gap-3 bg-secondary/10 p-4 rounded-xl mb-6">
                            <Wallet className="w-5 h-5 text-secondary flex-shrink-0" />
                            <p className="text-xs text-primary leading-relaxed">
                                <strong>Cum funcționează:</strong> Tu plătești partea ta acum ({splitAmount.toFixed(0)} RON).
                                Rezervarea este ținută "on-hold" timp de 24h până când plătesc și ceilalți.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="grid gap-3">
                            <button
                                onClick={handleConfirmSplit}
                                disabled={isLoading}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    "Se procesează..."
                                ) : (
                                    <>
                                        <Banknote className="w-5 h-5" />
                                        Plătește Partea Ta & Inițiază
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl"
                            >
                                Anulează
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
