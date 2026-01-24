import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCityFeed, getHomeContext } from "@/services/feed/feed.service"
import { HomeClient } from "./home-client"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Get basic home context (server-side)
  // We pass the server client to reuse the session
  const context = await getHomeContext(user.id, supabase)

  // 2. Fetch initial feed if we have a home city
  let initialFeed = null
  if (context.homeCityId) {
    initialFeed = await getCityFeed(context.homeCityId, undefined, supabase)
  }

  return (
    <HomeClient
      initialContext={context}
      initialFeed={initialFeed}
    />
  )
}
