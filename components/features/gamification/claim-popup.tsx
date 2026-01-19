"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Achievement } from "@/actions/gamification"
import { Stamp, Check } from "lucide-react"
import confetti from "canvas-confetti"

interface ClaimPopupProps {
    achievement: Achievement | null
    isOpen: boolean
    onClose: () => void
}

export function ClaimPopup({ achievement, isOpen, onClose }: ClaimPopupProps) {

    useEffect(() => {
        if (isOpen && achievement) {
            // Trigger haptic if available
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200)
            }
            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4f46e5', '#818cf8', '#fbbf24']
            })
        }
    }, [isOpen, achievement])

    if (!achievement) return null

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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Popup Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                                delay: 0.1
                            }
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
                    >
                        {/* Stamp Animation Impact */}
                        <motion.div
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 10 }}
                            className="w-32 h-32 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6 border-4 border-primary border-double"
                        >
                            <Stamp className="w-16 h-16 text-primary" />
                        </motion.div>

                        <div className="space-y-4">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-2xl font-black text-gray-900 uppercase tracking-tight"
                            >
                                Viză Obținută!
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-primary/5 p-4 rounded-xl border border-primary/10"
                            >
                                <p className="font-bold text-primary text-lg mb-1">{achievement.name}</p>
                                <p className="text-primary/80 text-sm">{achievement.description}</p>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 mt-4"
                            >
                                Super! Adaugă în Pașaport
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
