"use client"

import { Wallet, ChevronRight, AlertCircle } from "lucide-react"
import Link from "next/link"

import { useEffect, useState } from "react"
import { getMySplits } from "@/actions/payment"
import { Loader2 } from "lucide-react"

export function GroupWalletCard() {
    const [splits, setSplits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getMySplits()
                setSplits(data || [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const pendingSplits = splits.filter(s => s.status === 'pending')
    const hasPending = pendingSplits.length > 0
    const totalPending = pendingSplits.reduce((acc, s) => acc + s.amount, 0)
    const activeSplit = pendingSplits[0] // Show the first one logic

    if (loading) {
        return (
            <div className="bg-white rounded-airbnb border border-gray-200 p-5 shadow-sm h-[200px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
        )
    }

    return (
        <div className="bg-white rounded-airbnb border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Portofel Grup</h3>
                        <p className="text-xs text-gray-500">Cheltuieli comune</p>
                    </div>
                </div>
                {hasPending && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {/* Status Bar */}
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className={`h-full transition-all duration-500 ${hasPending ? 'w-3/4 bg-green-500' : 'w-full bg-green-500'}`} />
                    {hasPending && <div className="w-1/4 bg-red-500 h-full animate-pulse" />}
                </div>

                {hasPending ? (
                    <div className="bg-red-50 rounded-xl p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-900">Plată în așteptare</p>
                            <p className="text-xs text-red-700 mt-0.5 leading-snug">
                                {activeSplit.bookings?.business_id ? "Notă Restaurant" : "Cazare Hotel"}: <span className="font-bold">{activeSplit.amount} RON</span>.
                                <br />
                                Necesar pentru confirmare.
                            </p>
                            <Link href="/dashboard/wallet" className="mt-2 inline-block text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-red-700 transition-colors">
                                Plătește Acum
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 py-2">
                        Toate datoriile sunt achitate! 🎉
                    </div>
                )}

                <Link
                    href="/dashboard/wallet"
                    className="flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors pt-2 border-t border-gray-50 group"
                >
                    <span>Vezi Istoric Complet</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    )
}
