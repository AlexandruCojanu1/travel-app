"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getMySplits } from "@/actions/payment"
import { ArrowLeft, CreditCard, Check, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { Loader2 } from "lucide-react"

export default function WalletPage() {
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Link href="/plan" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la Plan
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Portofelul Meu 💳</h1>
                    <p className="text-gray-500">Istoricul plăților și datoriilor de grup.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">De Plată</p>
                        <p className="text-2xl font-black text-red-500">
                            {splits.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0)} RON
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Cheltuit Total</p>
                        <p className="text-2xl font-black text-gray-900">
                            {splits.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0)} RON
                        </p>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Tranzacții</h2>

                    {splits.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-400">Nicio tranzacție găsită.</p>
                        </div>
                    ) : (
                        splits.map((split) => (
                            <div key={split.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center
                                        ${split.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
                                    `}>
                                        {split.status === 'paid' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {split.bill_id ? "Notă Restaurant" : "Rezervare Hotel"}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(split.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">
                                        {split.amount} <span className="text-xs text-gray-400">RON</span>
                                    </p>
                                    {split.status === 'pending' && (
                                        <button className="mt-1 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold shadow-sm hover:bg-indigo-700">
                                            Plătește
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
