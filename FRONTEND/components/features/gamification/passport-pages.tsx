"use client"

import { Stamp } from "./stamp"
import { Progress } from "@/components/shared/ui/progress"
import { Shield, Star, MapPin } from "lucide-react"

interface PassportPagesProps {
    userProfile: {
        full_name: string
        level: number
        xp: number
        next_threshold: number
        avatar_url?: string
    }
    badges: any[]
}

interface IdentityPageProps {
    userProfile: PassportPagesProps['userProfile']
    isMobile?: boolean
}

interface VisasPageProps {
    badges: PassportPagesProps['badges']
    isMobile?: boolean
}

export function IdentityPage({ userProfile, isMobile = false }: IdentityPageProps) {
    const progressPercent = Math.min(100, (userProfile.xp / userProfile.next_threshold) * 100) || 0
    const mrzName = userProfile.full_name?.replace(/\s+/g, '<').toUpperCase().padEnd(20, '<').slice(0, 20) || 'UNKNOWN<<<<<<<<<<<<'

    if (isMobile) {
        return (
            <div className="w-full h-full p-6 flex flex-col relative bg-[#fdfbf7] overflow-hidden">
                {/* Guilloche Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle at 50% 50%, transparent 40%, #1e3a8a 41%, transparent 42%), radial-gradient(circle at 50% 50%, transparent 60%, #1e3a8a 61%, transparent 62%)",
                        backgroundSize: "50px 50px"
                    }}
                />

                <div className="mb-6 text-center z-10">
                    <h3 className="text-sm font-serif font-black text-primary uppercase tracking-[0.2em] border-b-2 border-primary/20 pb-2">
                        Identitate
                    </h3>
                </div>

                <div className="flex gap-5 z-10 flex-1">
                    {/* Photo Frame - Larger for mobile */}
                    <div className="w-24 h-32 bg-gray-100 border-2 border-gray-300 shadow-inner flex-shrink-0 relative overflow-hidden rounded">
                        {userProfile.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover grayscale contrast-125 sepia-[.2]" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400">
                                <div className="w-12 h-12 rounded-full bg-gray-300 mb-2" />
                                <span className="text-[10px] tracking-widest opacity-50">FOTO</span>
                            </div>
                        )}
                    </div>

                    {/* Text Stats - Larger for mobile */}
                    <div className="flex-1 space-y-4 font-mono text-primary/90">
                        <div>
                            <span className="block text-xs text-primary/40 uppercase tracking-wider mb-1">Nume</span>
                            <span className="font-bold text-lg tracking-wide truncate block">{userProfile.full_name || 'TRAVELER'}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-primary/40 uppercase tracking-wider mb-1">Status</span>
                            <span className="font-bold text-base text-secondary">MOVA CITIZEN</span>
                        </div>
                    </div>
                </div>

                {/* Level / XP Section - Larger */}
                <div className="mt-auto mb-4 z-10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-primary uppercase">Nivel {userProfile.level}</span>
                        <span className="text-sm font-mono text-secondary">{userProfile.xp}/{userProfile.next_threshold} XP</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/10 rounded-full overflow-hidden border border-secondary/20">
                        <div
                            className="h-full bg-secondary shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* MRZ */}
                <div className="font-mono text-[10px] leading-relaxed tracking-[0.12em] text-gray-500/80 break-all border-t-2 border-dashed border-gray-300 pt-3 mt-2">
                    P&lt;MOV{mrzName}
                    <br />
                    1308213M9213&lt;&lt;&lt;02
                </div>
            </div>
        )
    }

    // Desktop version (original)
    return (
        <div className="w-full h-full p-4 flex flex-col relative bg-[#fdfbf7] overflow-hidden">
            {/* Guilloche Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle at 50% 50%, transparent 40%, #1e3a8a 41%, transparent 42%), radial-gradient(circle at 50% 50%, transparent 60%, #1e3a8a 61%, transparent 62%)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="mb-3 text-center z-10">
                <h3 className="text-[10px] font-serif font-black text-primary uppercase tracking-[0.15em] border-b border-primary/20 pb-1">
                    Identity
                </h3>
            </div>

            <div className="flex gap-3 z-10">
                {/* Photo Frame - Compact */}
                <div className="w-14 h-18 bg-gray-100 border border-gray-300 shadow-inner flex-shrink-0 relative overflow-hidden">
                    {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover grayscale contrast-125 sepia-[.2]" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400">
                            <div className="w-8 h-8 rounded-full bg-gray-300 mb-1" />
                            <span className="text-[7px] tracking-widest opacity-50">PHOTO</span>
                        </div>
                    )}
                </div>

                {/* Text Stats - Compact */}
                <div className="flex-1 space-y-2 font-mono text-[10px] text-primary/90">
                    <div>
                        <span className="block text-[8px] text-primary/40 uppercase tracking-wider">Name</span>
                        <span className="font-bold text-[11px] tracking-wide truncate block">{userProfile.full_name?.split(' ')[0] || 'TRAVELER'}</span>
                    </div>
                    <div>
                        <span className="block text-[8px] text-primary/40 uppercase tracking-wider">Status</span>
                        <span className="font-bold text-[10px] text-secondary">MOVA CITIZEN</span>
                    </div>
                </div>
            </div>

            {/* Level / XP Section */}
            <div className="mt-auto mb-2 z-10">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[9px] font-bold text-primary uppercase">Lvl {userProfile.level}</span>
                    <span className="text-[9px] font-mono text-secondary">{userProfile.xp}/{userProfile.next_threshold} XP</span>
                </div>
                <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden border border-secondary/20">
                    <div
                        className="h-full bg-secondary shadow-[0_0_8px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* MRZ - Compact */}
            <div className="font-mono text-[8px] leading-tight tracking-[0.1em] text-gray-500/80 break-all border-t border-dashed border-gray-300 pt-2 mt-1">
                P&lt;MOV{mrzName}
                <br />
                1308213M9213&lt;&lt;&lt;02
            </div>
        </div>
    )
}

export function VisasPage({ badges, isMobile = false }: VisasPageProps) {
    if (isMobile) {
        return (
            <div className="w-full h-full p-6 relative bg-[#fdfbf7] overflow-hidden">
                {/* Security Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, #b91c1c 2px, transparent 2.5px)",
                        backgroundSize: "20px 20px"
                    }}
                />

                <h3 className="text-center text-sm font-serif font-bold text-red-900/60 uppercase tracking-[0.25em] mb-4 border-b-2 border-red-900/10 pb-3">
                    Ștampile
                </h3>

                {/* Grid of Stamps - Larger for mobile */}
                <div className="grid grid-cols-3 gap-3 content-start h-[calc(100%-60px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                    {badges.map((userBadge) => (
                        <div key={userBadge.id} className="flex justify-center items-center aspect-square border-2 border-dotted border-gray-300 rounded-lg bg-white/50 p-2">
                            <Stamp
                                name={userBadge.badge?.name || "Unknown"}
                                date={userBadge.earned_at}
                                iconUrl={userBadge.badge?.icon_url}
                                variant={userBadge.visual_state}
                                isNew={false}
                            />
                        </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, 6 - badges.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center opacity-40">
                            <MapPin className="w-6 h-6 text-gray-400" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Desktop version (original)
    return (
        <div className="w-full h-full p-4 relative bg-[#fdfbf7] overflow-hidden">
            {/* Security Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle, #b91c1c 1.5px, transparent 2px)",
                    backgroundSize: "15px 15px"
                }}
            />

            <h3 className="text-center text-[9px] font-serif font-bold text-red-900/40 uppercase tracking-[0.2em] mb-3 border-b border-red-900/10 pb-2">
                Stamps
            </h3>

            {/* Grid of Stamps - Compact */}
            <div className="grid grid-cols-2 gap-2 content-start h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                {badges.map((userBadge) => (
                    <div key={userBadge.id} className="flex justify-center items-center aspect-square border border-dotted border-gray-300 rounded-md bg-white/50 p-1">
                        <Stamp
                            name={userBadge.badge?.name || "Unknown"}
                            date={userBadge.earned_at}
                            iconUrl={userBadge.badge?.icon_url}
                            variant={userBadge.visual_state}
                            isNew={false}
                        />
                    </div>
                ))}

                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, 4 - badges.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border border-dashed border-gray-200 rounded-md flex items-center justify-center opacity-30">
                        <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Keep generic export for fallback if used elsewhere
export function PassportPages({ userProfile, badges }: PassportPagesProps) {
    return (
        <div className="flex w-full h-full">
            <div className="w-1/2 h-full border-r border-gray-200">
                <IdentityPage userProfile={userProfile} />
            </div>
            <div className="w-1/2 h-full">
                <VisasPage badges={badges} />
            </div>
        </div>
    )
}

