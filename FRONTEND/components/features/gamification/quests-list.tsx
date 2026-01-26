"use client"

import { Target, CheckCircle2, Clock, Trophy, Play } from "lucide-react"
import { Progress } from "@/components/shared/ui/progress"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { startQuest } from "@/actions/gamification"
import type { Quest, UserQuest, QuestStep } from "@/types/gamification.types"

interface UserQuestWithQuest extends UserQuest {
    quest: Quest
}

interface QuestsListProps {
    activeQuests: UserQuest[]
    completedQuests: UserQuest[]
    availableQuests: Quest[]
}

// Helper function to safely access quest from UserQuest
function getUserQuestQuest(userQuest: UserQuest): Quest | undefined {
    return 'quest' in userQuest ? (userQuest as UserQuestWithQuest).quest : undefined
}

export function QuestsList({ activeQuests, completedQuests, availableQuests }: QuestsListProps) {
    return (
        <div className="space-y-6">
            {/* Active Quests */}
            {activeQuests.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-mova-dark">
                            Quest-uri Active ({activeQuests.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {activeQuests.map((userQuest) => (
                            <QuestCard
                                key={userQuest.id}
                                userQuest={userQuest}
                                type="active"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Available Quests */}
            {availableQuests.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Play className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-mova-dark">
                            Quest-uri Disponibile ({availableQuests.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {availableQuests.map((quest) => (
                            <AvailableQuestCard key={quest.id} quest={quest} />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Quests */}
            {completedQuests.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-bold text-mova-dark">
                            Quest-uri Finalizate ({completedQuests.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {completedQuests.map((userQuest) => (
                            <QuestCard
                                key={userQuest.id}
                                userQuest={userQuest}
                                type="completed"
                            />
                        ))}
                    </div>
                </div>
            )}

            {activeQuests.length === 0 && completedQuests.length === 0 && availableQuests.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Nu există quest-uri disponibile.</p>
                </div>
            )}
        </div>
    )
}

function QuestCard({ userQuest, type }: { userQuest: UserQuest; type: 'active' | 'completed' }) {
    const quest = getUserQuestQuest(userQuest)
    if (!quest) return null
    const steps = quest.steps || []
    const completedSteps = Object.values(userQuest.progress || {}).filter(Boolean).length
    const totalSteps = steps.length
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    const isCompleted = type === 'completed' || userQuest.status === 'completed'

    return (
        <div
            className={cn(
                "airbnb-card p-4",
                isCompleted
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-blue-50 border-blue-200"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-green-200" : "bg-blue-200"
                    )}
                >
                    {quest.icon_url ? (
                        <img
                            src={quest.icon_url}
                            alt={quest.quest_name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <Target className={cn("w-6 h-6", isCompleted ? "text-green-700" : "text-blue-700")} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-base text-mova-dark">
                            {quest.quest_name}
                        </h4>
                        {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                    </div>

                    {quest.quest_description && (
                        <p className="text-sm text-gray-700 mb-3">
                            {quest.quest_description}
                        </p>
                    )}

                    {/* Progress */}
                    {!isCompleted && (
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    Pas {userQuest.current_step} din {totalSteps}
                                </span>
                                <span className="font-semibold text-blue-700">
                                    {completedSteps}/{totalSteps} completate
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                        </div>
                    )}

                    {/* Steps List */}
                    {steps.length > 0 && (
                        <div className="space-y-1 mt-3">
                            {steps.slice(0, 3).map((step: QuestStep, index: number) => {
                                const stepCompleted = userQuest.progress?.[step.step_number] === true
                                return (
                                    <div
                                        key={step.step_number || index}
                                        className={cn(
                                            "flex items-center gap-2 text-xs",
                                            stepCompleted ? "text-green-700" : "text-gray-600"
                                        )}
                                    >
                                        {stepCompleted ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                        <span>{step.title || `Pas ${step.step_number}`}</span>
                                    </div>
                                )
                            })}
                            {steps.length > 3 && (
                                <p className="text-xs text-gray-500 pl-6">
                                    +{steps.length - 3} pași
                                </p>
                            )}
                        </div>
                    )}

                    {/* Rewards */}
                    {(quest.completion_xp > 0 || quest.completion_coins > 0) && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                            {quest.completion_xp > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Trophy className="w-4 h-4 text-yellow-600" />
                                    <span className="font-semibold text-yellow-700">
                                        +{quest.completion_xp} XP
                                    </span>
                                </div>
                            )}
                            {quest.completion_coins > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="text-lg">🪙</span>
                                    <span className="font-semibold text-yellow-700">
                                        +{quest.completion_coins} Coins
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Completed Date */}
                    {isCompleted && userQuest.completed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                            Finalizat: {new Date(userQuest.completed_at).toLocaleDateString('ro-RO')}
                        </p>
                    )}

                    {/* Expires At */}
                    {!isCompleted && userQuest.expires_at && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Clock className="w-3 h-3" />
                            <span>
                                Expiră: {new Date(userQuest.expires_at).toLocaleDateString('ro-RO')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function AvailableQuestCard({ quest }: { quest: Quest }) {
    const steps = quest.steps || []

    const handleStartQuest = async () => {
        try {
            const result = await startQuest(quest.id)
            if (result.success) {
                window.location.reload()
            } else {
                alert(result.error || "Eroare la pornirea quest-ului")
            }
        } catch (error) {
            console.error("Error starting quest:", error)
            alert("Eroare la pornirea quest-ului")
        }
    }

    return (
        <div className="airbnb-card p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200">
                    {quest.icon_url ? (
                        <img
                            src={quest.icon_url}
                            alt={quest.quest_name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <Target className="w-6 h-6 text-purple-700" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-mova-dark mb-1">
                        {quest.quest_name}
                    </h4>

                    {quest.quest_description && (
                        <p className="text-sm text-gray-700 mb-3">
                            {quest.quest_description}
                        </p>
                    )}

                    {/* Steps Count */}
                    {steps.length > 0 && (
                        <p className="text-xs text-gray-600 mb-3">
                            {steps.length} {steps.length === 1 ? 'pas' : 'pași'}
                        </p>
                    )}

                    {/* Rewards Preview */}
                    {(quest.completion_xp > 0 || quest.completion_coins > 0) && (
                        <div className="flex items-center gap-3 mb-3">
                            {quest.completion_xp > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Trophy className="w-4 h-4 text-yellow-600" />
                                    <span className="font-semibold text-yellow-700">
                                        +{quest.completion_xp} XP
                                    </span>
                                </div>
                            )}
                            {quest.completion_coins > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="text-lg">🪙</span>
                                    <span className="font-semibold text-yellow-700">
                                        +{quest.completion_coins} Coins
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Start Button */}
                    <Button
                        onClick={handleStartQuest}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Începe Quest-ul
                    </Button>
                </div>
            </div>
        </div>
    )
}
