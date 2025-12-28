import { createClient } from "@/lib/supabase/client"

export async function getCityById(cityId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", cityId)
    .single()

  if (error) {
    console.error("Error fetching city:", error)
    return null
  }

  return data
}

export async function getCities() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching cities:", error)
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    console.log(`Loaded ${data?.length || 0} cities from database`)
    return data || []
  } catch (err) {
    console.error("Unexpected error fetching cities:", err)
    return []
  }
}

export async function getActiveCities() {
  return getCities()
}

