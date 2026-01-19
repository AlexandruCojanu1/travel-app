"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Receipt, Users, Check, CreditCard, RefreshCw } from "lucide-react"
import { BillItem, toggleItemClaim } from "@/actions/restaurant-pay"
import { toast } from "sonner"
import { Button } from "@/components/shared/ui/button"
import { createClient } from "@/lib/supabase/client"

interface SplitBillViewProps {
    billId: string
    initialBillData: any
    currentUserId: string
}

export function SplitBillView({ billId, initialBillData, currentUserId }: SplitBillViewProps) {
    const [bill, setBill] = useState(initialBillData)
    const [mode, setMode] = useState<'itemized' | 'equal'>('itemized')
    const [isUpdating, setIsUpdating] = useState(false)

    // Real-time subscription
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`bill:${billId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'restaurant_bills',
                filter: `id=eq.${billId}`
            }, (payload) => {
                setBill(payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [billId])

    const items = (bill.items as BillItem[]) || []

    // Calculations
    const myItems = items.filter(i => i.assignedTo.includes(currentUserId))

    // Complex logic: If item shared by N people, I pay Price / N
    const myTotal = myItems.reduce((acc, item) => {
        const shareCount = item.assignedTo.length
        return acc + (item.price / shareCount)
    }, 0)

    const handleItemClick = async (itemId: string) => {
        // Optimistic UI update could go here, but kept simple for now
        try {
            await toggleItemClaim(billId, itemId)
        } catch (e) {
            toast.error("Network error")
        }
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header / Receipt Top */}
            <div className="bg-slate-900 text-white p-6 relative">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold">{bill.restaurant_name}</h2>
                        <p className="text-slate-400 text-sm">Masa 4 &bull; {new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Receipt className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-800 rounded-xl">
                    <button
                        onClick={() => setMode('itemized')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'itemized' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pe Produse
                    </button>
                    <button
                        onClick={() => setMode('equal')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'equal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Split Egal
                    </button>
                </div>
            </div>

            {/* Bill Body */}
            <div className="p-6 min-h-[400px] bg-slate-50 relative">
                {/* Paper jagged edge effect top */}
                <div className="absolute top-0 left-0 w-full h-4 bg-slate-50 -mt-2" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                {mode === 'itemized' ? (
                    <div className="space-y-3 pt-2">
                        <p className="text-sm text-gray-500 font-medium mb-4 text-center">
                            Atinge produsele pe care le-ai consumat
                        </p>

                        {items.map((item) => {
                            const isMine = item.assignedTo.includes(currentUserId)
                            const shareCount = item.assignedTo.length
                            const mySharePrice = item.price / (shareCount || 1)

                            return (
                                <motion.div
                                    key={item.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`
                                        relative group cursor-pointer p-4 rounded-xl border-2 transition-all flex justify-between items-center
                                        ${isMine
                                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                            : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                                            ${isMine ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-100 border-gray-200'}
                                        `}>
                                            {isMine && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isMine ? 'text-emerald-900' : 'text-gray-900'}`}>{item.name}</p>
                                            {shareCount > 1 && (
                                                <p className="text-xs text-gray-500">
                                                    Partajat cu {shareCount - 1} alții
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${isMine ? 'text-emerald-700' : 'text-gray-900'}`}>
                                            {item.price} RON
                                        </p>
                                        {shareCount > 1 && isMine && (
                                            <p className="text-xs text-emerald-600 font-medium">
                                                Partea ta: {mySharePrice.toFixed(0)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Avatars of others (Mock) */}
                                    {item.assignedTo.length > 0 && !isMine && (
                                        <div className="absolute -top-2 -right-2 flex -space-x-1">
                                            {/* Just show count dot for simplicity in MVP */}
                                            <div className="w-5 h-5 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center border border-white">
                                                {item.assignedTo.length}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-500">
                        <Users className="w-12 h-12 mb-4 text-gray-300" />
                        <p>Split Egal (Coming Soon)</p>
                        <p className="text-xs">Momentan testează "Pe Produse"</p>
                    </div>
                )}
            </div>

            {/* Footer / Pay Action */}
            <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 relative">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-500 text-sm font-medium">Totalul Tău</span>
                    <span className="text-3xl font-black text-slate-900">{myTotal.toFixed(2)} <span className="text-lg text-slate-500 font-bold">RON</span></span>
                </div>

                <Button
                    className={`w-full h-14 text-lg font-bold gap-2 ${myTotal > 0 ? 'bg-slate-900 hover:bg-slate-800' : 'bg-gray-200 text-gray-400 hover:bg-gray-200'}`}
                    disabled={myTotal === 0}
                    onClick={() => toast.success(`Ai plătit ${myTotal.toFixed(2)} RON! 💸`)}
                >
                    <CreditCard className="w-5 h-5" />
                    {myTotal > 0 ? "Plătește Partea Mea" : "Selectează produse"}
                </Button>
            </div>
        </div>
    )
}
