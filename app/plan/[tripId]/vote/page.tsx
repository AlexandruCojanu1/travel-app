import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getBusinessesForMap } from "@/services/business/business.service"
import { GroupSwipeMode } from "@/components/features/trip/group-swipe-mode"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface VotePageProps {
    params: {
        tripId: string
    }
}

export default async function VotePage({ params }: VotePageProps) {
    const { tripId } = params
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/auth/login?next=/plan/${tripId}/vote`)
    }

    // 2. Get Trip Details (City + Access Check)
    const { data: trip } = await supabase
        .from("trips")
        .select("destination_city_id, title, user_id")
        .eq("id", tripId)
        .single()

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-xl font-bold">Călătoria nu a fost găsită</h1>
                <Button asChild variant="link">
                    <Link href="/home">Înapoi</Link>
                </Button>
            </div>
        )
    }

    // Check access (Owner or Collaborator)
    let hasAccess = trip.user_id === user.id
    if (!hasAccess) {
        const { data: collaborator } = await supabase
            .from("trip_collaborators")
            .select("id")
            .eq("trip_id", tripId)
            .eq("user_id", user.id)
            .single()

        hasAccess = !!collaborator
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-xl font-bold text-red-600">Acces interzis</h1>
                <p>Nu ești membru al acestui grup.</p>
                <Button asChild variant="link">
                    <Link href="/home">Înapoi</Link>
                </Button>
            </div>
        )
    }

    // 3. Fetch all businesses in destination
    // Note: getBusinessesForMap returns "MapBusiness[]" which is suitable for SwipeStack
    const allBusinesses = await getBusinessesForMap(trip.destination_city_id)

    // 4. Fetch exclusion list (Already in Plan OR Already Voted by User)

    // a) Already in plan
    const { data: existingItems } = await supabase
        .from("trip_items")
        .select("business_id")
        .eq("trip_id", tripId)

    const plannedIds = new Set(existingItems?.map(i => i.business_id) || [])

    // b) Already voted by ME
    const { data: myVotes } = await supabase
        .from("trip_votes")
        .select("business_id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)

    const votedIds = new Set(myVotes?.map(v => v.business_id) || [])

    // 5. Filter
    const availableBusinesses = allBusinesses.filter(b =>
        !plannedIds.has(b.id) && !votedIds.has(b.id)
    )

    return (
        <div className="min-h-screen bg-background relative">
            <div className="absolute top-4 left-4 z-10">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href={`/plan?tripId=${tripId}`}>
                        <ArrowLeft className="h-4 w-4" />
                        Înapoi la Plan
                    </Link>
                </Button>
            </div>

            <GroupSwipeMode
                businesses={availableBusinesses}
                tripId={tripId}
                tripTitle={trip.title}
            />
        </div>
    )
}
