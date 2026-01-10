"use client"

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, User, LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CreateMenuProps {
    isOpen: boolean
    onClose: () => void
}

const menuItems: {
    id: string
    title: string
    image?: string
    icon?: LucideIcon
    href: string
    bgColor: string
    textColor: string
}[] = [
        {
            id: 'new-trip',
            title: 'Călătorie Nouă',
            image: '/images/ui/menu/new_trip.png',
            href: '/plan?action=new',
            bgColor: 'bg-[#0A0A0A]',
            textColor: 'text-white'
        },
        {
            id: 'find-trip',
            title: 'Noutăți',
            image: '/images/ui/menu/find_trip.png',
            href: '/home',
            bgColor: 'bg-[#E0F7FF]',
            textColor: 'text-[#0A2A3A]'
        },
        {
            id: 'reservations',
            title: 'Rezervări',
            image: '/images/ui/menu/reservations.png',
            href: '/bookings',
            bgColor: 'bg-white',
            textColor: 'text-[#1A1A1A]'
        },
        {
            id: 'profile',
            title: 'Profil',
            icon: User,
            href: '/profile',
            bgColor: 'bg-[#f4f4f5]',
            textColor: 'text-[#18181b]'
        }
    ]

export function CreateMenu({ isOpen, onClose }: CreateMenuProps) {
    const router = useRouter()

    const handleItemClick = (href: string) => {
        router.push(href)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-xl"
                    />

                    {/* Menu Items Container */}
                    <div className="absolute inset-x-0 bottom-0 p-6 pb-12 flex flex-col items-center gap-4">
                        <div className="w-full flex flex-col gap-4 max-w-sm">
                            {menuItems.map((item, index) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: { delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 30,
                                        scale: 0.9,
                                        transition: { delay: (menuItems.length - index - 1) * 0.05 }
                                    }}
                                    onClick={() => handleItemClick(item.href)}
                                    className={cn(
                                        "relative w-full h-32 rounded-[32px] overflow-hidden flex items-center justify-between px-8 transition-transform active:scale-[0.97] shadow-lg",
                                        item.bgColor,
                                        item.textColor
                                    )}
                                >
                                    <span className="text-2xl font-bold tracking-tight">
                                        {item.title}
                                    </span>
                                    <div className="relative w-28 h-28 -mr-6 flex items-center justify-center">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 768px) 150px, 150px"
                                                className="object-contain"
                                            />
                                        ) : item.icon ? (
                                            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
                                                <item.icon className="h-10 w-10 opacity-50" />
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            onClick={onClose}
                            className="mt-4 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center text-black border border-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </motion.button>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}
