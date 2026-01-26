"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getBill, RestaurantBill } from "@/actions/restaurant-pay"
import { SplitBillView } from "@/components/features/pay/split-bill-view"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function BillPage() {
    const params = useParams()
    const billId = params.id as string

    const [bill, setBill] = useState<RestaurantBill | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function init() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    setUserId(user.id)
                    const fetchedBill = await getBill(billId)
                    if (fetchedBill) {
                        setBill(fetchedBill as unknown as RestaurantBill)
                    } else {
                        setError("Bill not found")
                    }
                }
            } catch (e) {
                setError("Error loading bill")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [billId])

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
                    <Link href={`/auth/login?next=/pay/bill/${billId}`} className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                        Loghează-te
                    </Link>
                </div>
            </div>
        )
    }

    if (error || !bill) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <p className="text-gray-500">{error || "Nota nu a fost găsită."}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4">
            <div className="max-w-md mx-auto mb-8 text-center">
                <h1 className="text-2xl font-black text-slate-900">Plata Notă 🧾</h1>
                <p className="text-slate-500">Scan & Split</p>
            </div>

            <SplitBillView
                billId={bill.id}
                initialBillData={bill}
                currentUserId={userId}
            />
        </div>
    )
}
