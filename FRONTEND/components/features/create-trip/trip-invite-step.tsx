"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Share2, Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { toast } from 'sonner'

interface TripInviteStepProps {
    travelers: number
    isGeneratingLink: boolean
    inviteToken: string | null
    onClose: () => void
}

export function TripInviteStep({
    travelers,
    isGeneratingLink,
    inviteToken,
    onClose
}: TripInviteStepProps) {
    return (
        <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 p-8 space-y-8 flex flex-col bg-white items-center justify-center text-center"
        >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-10 w-10 text-green-600" />
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Călătorie Creată!</h2>
                <p className="text-gray-500 text-lg max-w-xs mx-auto">
                    Deoarece călătorești cu încă {travelers - 1} persoane, invită-le acum să planificați împreună.
                </p>
            </div>

            <div className="w-full max-w-sm bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                {isGeneratingLink ? (
                    <div className="flex flex-col items-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-gray-400">Se generează link-ul...</span>
                    </div>
                ) : inviteToken ? (
                    <>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Link de invitație
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                            <code className="flex-1 text-sm text-gray-600 truncate py-2 px-1">
                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteToken}`}
                            </code>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`)
                                    toast.success("Link copiat!")
                                }}
                                className="h-9 w-9"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Invitatie Călătorie',
                                            text: 'Hai să planificăm vacanța împreună!',
                                            url: `${window.location.origin}/join/${inviteToken}`
                                        }).catch((err) => {
                                            if (err.name !== 'AbortError') {
                                                toast.error("Nu am putut partaja link-ul")
                                            }
                                        })
                                    } else {
                                        navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`)
                                        toast.success("Link copiat!")
                                    }
                                }}
                                className="h-9 w-9 text-blue-600"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Trimite acest link prietenilor tăi. Ei se vor putea alătura imediat.
                        </p>
                    </>
                ) : (
                    <p className="text-red-500 text-sm">Eroare la generarea link-ului.</p>
                )}
            </div>

            <Button
                onClick={onClose}
                className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-full text-lg font-bold shadow-xl"
            >
                Gata, am trimis!
            </Button>
        </motion.div>
    )
}
