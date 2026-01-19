"use client"

import { DigitalPassport } from "./digital-passport"

interface PassportViewProps {
    passportData: {
        profile: {
            full_name: string
            level: number
            xp: number
            next_threshold: number
            avatar_url?: string
        }
        badges: any[]
    }
}

export function PassportView({ passportData }: PassportViewProps) {
    if (!passportData || !passportData.profile) {
        return <div>Loading Passport...</div>
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <DigitalPassport
                userProfile={passportData.profile}
                badges={passportData.badges}
            />

            <p className="mt-8 text-center text-sm text-gray-500 italic max-w-xs mx-auto">
                Tap the passport to open. Collect stamps by visiting new locations and completing challenges.
            </p>
        </div>
    )
}

