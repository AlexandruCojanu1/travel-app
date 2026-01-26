"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { createDemoBill, RestaurantBill } from "@/actions/restaurant-pay"
import { SplitBillView } from "@/components/features/pay/split-bill-view"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { nanoid } from "nanoid"

export default function ScanSplitDemoPage() {
    const [bill, setBill] = useState<RestaurantBill | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function init() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
                // In a real app we'd parse bill ID from URL/QR
                // Here we create one for demo
                const newBill = await createDemoBill(nanoid())
                if (newBill) {
                    setBill(newBill as unknown as RestaurantBill)
                }
            }
            setLoading(false)
        }
        init()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
                    <h1 className="text-xl font-bold mb-2">Autentificare Necesară</h1>
                    <p className="text-gray-500 mb-6">Trebuie să fii autentificat pentru a plăti nota.</p>
                    <Link href="/auth/login?next=/pay/demo" className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                        Loghează-te
                    </Link>
                </div>
            </div>
        )
    }

    if (!bill) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <p className="text-gray-500">Eroare la generarea demo-ului.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4">
            <div className="max-w-md mx-auto mb-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Înapoi la Dashboard
                </Link>
            </div>

            <div className="max-w-md mx-auto mb-8 text-center">
                <h1 className="text-2xl font-black text-slate-900">Scan & Split Demo 🍔</h1>
                <p className="text-slate-500">Simulare experiență restaurant</p>
            </div>

            <SplitBillView
                billId={bill.id}
                initialBillData={bill}
                currentUserId={userId}
            />

            <p className="text-center text-xs text-gray-400 mt-8 max-w-md mx-auto">
                MOVA Pay &copy; {new Date().getFullYear()}. Plăți securizate prin Stripe (Demo Mode).
            </p>
        </div>
    )
}
