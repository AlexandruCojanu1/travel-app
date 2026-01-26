"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { useHaptic } from "@/hooks/use-haptic"
import { Crown, ChevronLeft, ChevronRight } from "lucide-react"
import { IdentityPage, VisasPage } from "./passport-pages"

interface DigitalPassportProps {
    userProfile: {
        full_name: string
        level: number
        xp: number
        next_threshold: number
        avatar_url?: string
    }
    badges: any[]
}

// Hook to detect mobile
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

// Mobile version with swipe pages
function MobilePassport({ userProfile, badges }: DigitalPassportProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const { softTick } = useHaptic()

    const pages = [
        { id: 'cover', label: 'Copertă' },
        { id: 'identity', label: 'Identitate' },
        { id: 'stamps', label: 'Ștampile' },
    ]

    const goToPage = (index: number) => {
        if (index >= 0 && index < pages.length) {
            softTick()
            setCurrentPage(index)
        }
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50
        if (info.offset.x < -threshold && currentPage < pages.length - 1) {
            goToPage(currentPage + 1)
        } else if (info.offset.x > threshold && currentPage > 0) {
            goToPage(currentPage - 1)
        }
    }

    return (
        <div className="w-full max-w-sm mx-auto px-4">
            {/* Page Container */}
            <div className="relative w-full aspect-[3/4] max-h-[70vh] overflow-hidden rounded-2xl shadow-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className="w-full h-full"
                    >
                        {currentPage === 0 && (
                            <div
                                className="w-full h-full rounded-2xl overflow-hidden relative bg-primary"
                            >
                                {/* Texture */}
                                <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />

                                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8 z-10 relative">
                                    {/* Emblem */}
                                    <div className="w-24 h-24 rounded-full border-[3px] border-yellow-500/70 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.3)] bg-yellow-900/10 backdrop-blur-sm">
                                        <Crown className="w-12 h-12 text-yellow-500/90" />
                                    </div>

                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-serif font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 uppercase drop-shadow-sm">
                                            MOVA
                                        </h1>
                                        <p className="text-xs font-bold tracking-[0.3em] text-yellow-500/80 uppercase">
                                            Official Passport
                                        </p>
                                    </div>

                                    <p className="text-yellow-500/50 text-sm mt-8">
                                        Swipe pentru a răsfoi →
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentPage === 1 && (
                            <div className="w-full h-full bg-[#fdfbf7] rounded-2xl overflow-hidden">
                                <IdentityPage userProfile={userProfile} isMobile={true} />
                            </div>
                        )}

                        {currentPage === 2 && (
                            <div className="w-full h-full bg-[#fdfbf7] rounded-2xl overflow-hidden">
                                <VisasPage badges={badges} isMobile={true} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                {currentPage > 0 && (
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/30 transition-colors z-20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                {currentPage < pages.length - 1 && (
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/30 transition-colors z-20"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Page Indicators */}
            <div className="flex justify-center gap-2 mt-6">
                {pages.map((page, index) => (
                    <button
                        key={page.id}
                        onClick={() => goToPage(index)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${currentPage === index
                            ? 'bg-secondary text-white shadow-lg'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${currentPage === index ? 'bg-white' : 'bg-gray-400'
                            }`} />
                        <span className="text-xs font-medium">{page.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

// Desktop version with 3D flip
function DesktopPassport({ userProfile, badges }: DigitalPassportProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { softTick, heavyImpact } = useHaptic()

    const toggleOpen = () => {
        if (!isOpen) {
            softTick()
        } else {
            heavyImpact()
        }
        setIsOpen(!isOpen)
    }

    return (
        <div className="flex items-center justify-center py-6 min-h-[380px] overflow-x-auto overflow-y-visible px-4">
            <motion.div
                className="relative perspective-1500 cursor-pointer select-none transform-gpu origin-center"
                onClick={toggleOpen}
                animate={{
                    width: isOpen ? 440 : 220,
                }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                }}
                style={{
                    height: 320,
                }}
            >
                {/* BASE PAGE (Right Side / Visas) */}
                <motion.div
                    className="absolute top-0 bg-[#fdfbf7] rounded-r-2xl rounded-l-sm shadow-xl overflow-hidden border-l border-gray-200"
                    animate={{
                        left: isOpen ? 220 : 0,
                        opacity: isOpen ? 1 : 0,
                    }}
                    style={{
                        width: 220,
                        height: 320,
                    }}
                >
                    <VisasPage badges={badges} />
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                </motion.div>

                {/* FLIPPING COVER */}
                <motion.div
                    initial={false}
                    animate={{ rotateY: isOpen ? -180 : 0 }}
                    transition={{
                        duration: 0.6,
                        type: "spring",
                        stiffness: 120,
                        damping: 20
                    }}
                    style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "right center",
                        width: 220,
                        height: 320,
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                    className="z-20"
                >
                    {/* FRONT FACE (Outside Cover) */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-primary"
                        style={{
                            backfaceVisibility: "hidden",
                            boxShadow: isOpen ? 'none' : '0 10px 30px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-900/80 to-transparent" />

                        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 z-10 relative">
                            <div className="w-16 h-16 rounded-full border-[2px] border-yellow-500/70 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] bg-yellow-900/10 backdrop-blur-sm">
                                <Crown className="w-8 h-8 text-yellow-500/90" />
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-2xl font-serif font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 uppercase drop-shadow-sm">
                                    MOVA
                                </h1>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-yellow-500/80 uppercase">
                                    Official Passport
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BACK FACE (Inside Left / Identity) */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-[#fdfbf7]"
                        style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                        }}
                    >
                        <IdentityPage userProfile={userProfile} />
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

// Main component that switches between mobile and desktop
export function DigitalPassport({ userProfile, badges }: DigitalPassportProps) {
    const isMobile = useIsMobile()

    if (isMobile) {
        return <MobilePassport userProfile={userProfile} badges={badges} />
    }

    return <DesktopPassport userProfile={userProfile} badges={badges} />
}
