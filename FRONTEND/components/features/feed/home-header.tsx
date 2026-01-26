"use client"

import React from 'react'
import Image from 'next/image'

interface HomeHeaderProps {
    userProfile?: {
        avatar_url?: string | null
        full_name?: string | null
    }
}

export function HomeHeader({ userProfile }: HomeHeaderProps) {
    return (
        <header className="flex items-center justify-between py-4 px-2">
            <div />

            <div className="h-12 w-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-[#E2E8F0] flex items-center justify-center text-[#475569] font-bold">
                {userProfile?.avatar_url ? (
                    <Image
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || 'Profile'}
                        width={48}
                        height={48}
                        className="object-cover"
                    />
                ) : (
                    <span>
                        {userProfile?.full_name ? userProfile.full_name[0].toUpperCase() : 'U'}
                    </span>
                )}
            </div>
        </header>
    )
}
