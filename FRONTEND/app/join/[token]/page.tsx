import { joinTrip } from "@/actions/trip/collaboration"
import { redirect } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"

interface JoinPageProps {
    params: {
        token: string
    }
}

export default async function JoinPage({ params }: JoinPageProps) {
    const { token } = params

    // Server-side join attempt
    const result = await joinTrip(token)

    if (result.success && result.tripId) {
        redirect(`/plan?tripId=${result.tripId}`)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            {result.error ? (
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Nu am putut accesa călătoria</h1>
                    <p className="text-gray-600 mb-6">
                        {result.error === "Must be logged in to join" ?
                            "Trebuie să fii autentificat pentru a te alătura unui grup." :
                            "Link-ul de invitație este invalid sau a expirat."}
                    </p>

                    {result.error === "Must be logged in to join" ? (
                        <Button asChild className="w-full">
                            <Link href={`/auth/login?next=/join/${token}`}>Autentificare</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/home">Înapoi la Acasă</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-lg text-gray-700">Te alăturăm grupului...</p>
                </div>
            )}
        </div>
    )
}
