"use client"

import { useState, useEffect } from "react"
import { MapPin, Check, Loader2, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast as sonnerToast } from "sonner"
import { useAppStore } from "@/store/app-store"
import { getActiveCities } from "@/services/city.service"
import { updateLastVisitedCity } from "@/actions/user"
import { cn } from "@/lib/utils"

interface City {
  id: string
  name: string
  country: string
  state_province: string | null
  latitude: number
  longitude: number
  is_active: boolean
  created_at: string
}

export function CitySelector() {
  const { currentCity, isCitySelectorOpen, setCity, closeCitySelector } = useAppStore()
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering Dialog on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch cities when dialog opens
  useEffect(() => {
    if (isCitySelectorOpen && cities.length === 0) {
      loadCities()
    }
  }, [isCitySelectorOpen])

  async function loadCities() {
    setIsLoading(true)
    try {
      const data = await getActiveCities()
      setCities(data)
    } catch (error) {
      console.error("Error loading cities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCitySelect(city: City) {
    // Update global store
    setCity(city)
    
    // Close dialog
    closeCitySelector()

    // Show success toast
    setToast({
      message: `Welcome to ${city.name}! 🎉`,
      type: "success",
    })

    // Silently update user's last visited city (if logged in)
    try {
      await updateLastVisitedCity(city.id)
    } catch (error) {
      console.error("Error updating last visited city:", error)
    }
  }

  // Don't render Dialog during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <>
      <Dialog open={isCitySelectorOpen} onOpenChange={closeCitySelector}>
        <DialogContent className="p-0 max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Select Your City</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border-none">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Where to next?</h2>
                <p className="text-sm text-slate-600">Select a city to explore</p>
              </div>
            </div>

            <CommandInput 
              placeholder="Search cities..." 
              className="h-12"
            />

            <CommandList className="max-h-[400px]">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-slate-600">
                    No cities found.
                  </div>
                )}
              </CommandEmpty>

              {!isLoading && cities.length > 0 && (
                <>
                  {/* Currently Selected City */}
                  {currentCity && (
                    <CommandGroup heading="Current">
                      <CommandItem
                        value={currentCity.name}
                        onSelect={() => closeCitySelector()}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900">
                              {currentCity.name}
                            </div>
                            <div className="text-xs text-slate-600 truncate">
                              {currentCity.state_province
                                ? `${currentCity.state_province}, ${currentCity.country}`
                                : currentCity.country}
                            </div>
                          </div>
                          <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {/* Popular Cities */}
                  <CommandGroup heading="Popular Destinations">
                    {cities
                      .filter((city) => city.id !== currentCity?.id)
                      .slice(0, 6)
                      .map((city) => (
                        <CommandItem
                          key={city.id}
                          value={`${city.name} ${city.country}`}
                          onSelect={() => handleCitySelect(city)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900">
                                {city.name}
                              </div>
                              <div className="text-xs text-slate-600 truncate">
                                {city.state_province
                                  ? `${city.state_province}, ${city.country}`
                                  : city.country}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  {/* All Cities */}
                  {cities.length > 6 && (
                    <CommandGroup heading="All Cities">
                      {cities
                        .filter((city) => city.id !== currentCity?.id)
                        .slice(6)
                        .map((city) => (
                          <CommandItem
                            key={city.id}
                            value={`${city.name} ${city.country}`}
                            onSelect={() => handleCitySelect(city)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-5 w-5 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900">
                                  {city.name}
                                </div>
                                <div className="text-xs text-slate-600 truncate">
                                  {city.state_province
                                    ? `${city.state_province}, ${city.country}`
                                    : city.country}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                <span>Content will update based on your selected city</span>
              </p>
            </div>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`
            px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}
          `}>
            {toast.message}
          </div>
        </div>
      )}
    </>
  )
}
