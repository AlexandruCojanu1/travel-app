"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateLastVisitedCity(cityId: string) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ last_visited_city_id: cityId })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating last visited city:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}


