"use client"

import { DigitalPassport } from "./digital-passport"

import type { UserPassport } from "@/types/gamification.types"

interface PassportViewProps {
    passportData: UserPassport
}

export function PassportView({ passportData }: PassportViewProps) {
    if (!passportData || !passportData.profile) {
        return <div>Loading Passport...</div>
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <DigitalPassport
                userProfile={{
                    ...passportData.profile,
                    full_name: passportData.profile.full_name || 'Traveler'
                }}
                badges={passportData.badges}
            />

            <p className="mt-8 text-center text-sm text-gray-500 italic max-w-xs mx-auto">
                Tap the passport to open. Collect stamps by visiting new locations and completing challenges.
            </p>
        </div>
    )
}

