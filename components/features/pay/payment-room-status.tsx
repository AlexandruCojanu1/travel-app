"use client"

import { motion } from "framer-motion"
import { Check, Clock, AlertCircle } from "lucide-react"

interface PaymentParticipant {
    userId: string
    name: string
    avatar?: string
    status: 'paid' | 'pending' | 'failed'
    amount: number
    isMe: boolean
}

interface PaymentRoomStatusProps {
    totalAmount: number
    paidAmount: number
    participants: PaymentParticipant[]
    expiresAt: string
}

export function PaymentRoomStatus({
    totalAmount,
    paidAmount,
    participants,
    expiresAt
}: PaymentRoomStatusProps) {
    const percentage = Math.min(100, (paidAmount / totalAmount) * 100)
    const pendingCount = participants.filter(p => p.status === 'pending').length

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">

                {/* Progress Circle Visual */}
                <div className="relative w-40 h-40 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="#f3f4f6"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={percentage === 100 ? "#10b981" : "#4f46e5"}
                            strokeWidth="12"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * percentage) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">{Math.round(percentage)}%</span>
                        <span className="text-xs text-gray-500 uppercase font-semibold">Achitat</span>
                    </div>
                </div>

                {/* Status List */}
                <div className="flex-1 w-full space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {percentage === 100 ? "Plată Completă! 🎉" : "Se așteaptă plata de grup"}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            {percentage < 100 && (
                                <>
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    Expira în: <span className="font-mono text-orange-600">23h:59m</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {participants.map((person) => (
                            <div key={person.userId} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border-2 border-white shadow-sm">
                                            {person.avatar ? (
                                                <img src={person.avatar} className="w-full h-full rounded-full" />
                                            ) : (
                                                person.name.charAt(0)
                                            )}
                                        </div>
                                        {person.status === 'paid' && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {person.isMe ? "Tu" : person.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {person.amount.toFixed(0)} RON
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    {person.status === 'paid' ? (
                                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                                            Plătit
                                        </span>
                                    ) : (
                                        person.isMe ? (
                                            <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-md shadow-indigo-100 transition-transform active:scale-95">
                                                Plătește Acum
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-100 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Așteptăm
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
