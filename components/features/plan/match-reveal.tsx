"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react"
import { useHaptic } from "@/hooks/use-haptic"
import { Heart, X } from "lucide-react"

interface MatchRevealProps {
    isOpen: boolean
    onClose: () => void
    businessName: string
    imageUrl?: string
    onAddToPlan: () => void
}

export function MatchReveal({ isOpen, onClose, businessName, imageUrl, onAddToPlan }: MatchRevealProps) {
    const { successSequence } = useHaptic()

    useEffect(() => {
        if (isOpen) {
            successSequence()
        }
    }, [isOpen, successSequence])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 100 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Confetti / Burst Effect (CSS) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: "50%",
                                        y: "50%",
                                        opacity: 1,
                                        scale: 0
                                    }}
                                    animate={{
                                        x: `${Math.random() * 200 - 100}%`,
                                        y: `${Math.random() * 200 - 100}%`,
                                        opacity: 0,
                                        scale: Math.random() * 1.5 + 0.5
                                    }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                    className="absolute w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500"
                                    style={{ left: '50%', top: '50%' }}
                                />
                            ))}
                        </div>

                        {/* Image */}
                        <div className="h-64 relative">
                            <img
                                src={imageUrl || "/placeholder-hotel.jpg"}
                                alt={businessName}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-6 left-0 right-0 text-center">
                                <h2 className="text-3xl font-black text-white italic drop-shadow-lg transform -rotate-2">
                                    IT'S A MATCH!
                                </h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{businessName}</h3>
                                <p className="text-sm text-gray-500 mt-1">Everyone in the group liked this!</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Keep Swiping
                                </button>
                                <button
                                    onClick={() => { onAddToPlan(); onClose(); }}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg transform hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                >
                                    <Heart className="w-5 h-5 fill-current" />
                                    Add to Plan
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
