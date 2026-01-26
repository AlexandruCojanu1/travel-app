"use client"

import { Trophy, Lock, CheckCircle2 } from "lucide-react"
import type { AchievementWithStatus } from "@/types/gamification.types"
import { Progress } from "@/components/shared/ui/progress"
import { cn } from "@/lib/utils"

interface AchievementsListProps {
    achievements: AchievementWithStatus[]
}

const tierColors = {
    bronze: "bg-amber-100 text-amber-800 border-amber-300",
    silver: "bg-gray-100 text-gray-800 border-gray-300",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-300"
}

const tierIcons = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇"
}

export function AchievementsList({ achievements }: AchievementsListProps) {
    const unlockedAchievements = achievements.filter(a => a.unlocked)
    const lockedAchievements = achievements.filter(a => !a.unlocked)

    return (
        <div className="space-y-6">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-bold text-mova-dark">
                            Deblocate ({unlockedAchievements.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unlockedAchievements.map((achievement) => (
                            <AchievementCard
                                key={achievement.id}
                                achievement={achievement}
                                unlocked={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-mova-dark">
                            Blocate ({lockedAchievements.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lockedAchievements.map((achievement) => (
                            <AchievementCard
                                key={achievement.id}
                                achievement={achievement}
                                unlocked={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {achievements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Nu există achievements disponibile.</p>
                </div>
            )}
        </div>
    )
}

function AchievementCard({
    achievement,
    unlocked
}: {
    achievement: AchievementWithStatus
    unlocked: boolean
}) {
    const tier = (achievement.tier || 'bronze') as 'bronze' | 'silver' | 'gold'
    const progress = achievement.progress || 0

    return (
        <div
            className={cn(
                "airbnb-card p-4 transition-all",
                unlocked
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-gray-50 border-gray-200 opacity-75"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl",
                        unlocked ? tierColors[tier] : "bg-gray-200 text-gray-400"
                    )}
                >
                    {achievement.icon_url ? (
                        <img
                            src={achievement.icon_url}
                            alt={achievement.name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <span>{unlocked ? tierIcons[tier] : "🔒"}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                            className={cn(
                                "font-bold text-base",
                                unlocked ? "text-mova-dark" : "text-gray-500"
                            )}
                        >
                            {achievement.name}
                        </h4>
                        {unlocked && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                    </div>

                    <p
                        className={cn(
                            "text-sm mb-2",
                            unlocked ? "text-gray-700" : "text-gray-500"
                        )}
                    >
                        {achievement.description || "Fără descriere"}
                    </p>

                    {/* Progress Bar (for locked achievements with progress) */}
                    {!unlocked && progress > 0 && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-gray-500">{progress}% completat</p>
                        </div>
                    )}

                    {/* Unlocked Date */}
                    {unlocked && achievement.unlocked_at && (
                        <p className="text-xs text-gray-500 mt-1">
                            Deblocat: {new Date(achievement.unlocked_at).toLocaleDateString('ro-RO')}
                        </p>
                    )}

                    {/* Tier Badge */}
                    <div className="mt-2">
                        <span
                            className={cn(
                                "inline-block px-2 py-1 text-xs font-semibold rounded-full border",
                                unlocked ? tierColors[tier] : "bg-gray-200 text-gray-500 border-gray-300"
                            )}
                        >
                            {tier.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
