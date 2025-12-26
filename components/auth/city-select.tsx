"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Search, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface City {
  id: string
  name: string
  country: string
  state_province: string | null
}

interface CitySelectProps {
  value: string
  onChange: (cityId: string) => void
  error?: string
}

export function CitySelect({ value, onChange, error }: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  useEffect(() => {
    async function fetchCities() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, country, state_province")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching cities:", error)
      } else {
        setCities(data || [])
        setFilteredCities(data || [])
      }
      setIsLoading(false)
    }

    fetchCities()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query)
      )
      setFilteredCities(filtered)
    } else {
      setFilteredCities(cities)
    }
  }, [searchQuery, cities])

  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find((c) => c.id === value)
      setSelectedCity(city || null)
    }
  }, [value, cities])

  const handleSelect = (city: City) => {
    setSelectedCity(city)
    onChange(city.id)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Select Your City
      </label>

      {/* Selected City / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-4 rounded-xl border-2 bg-white text-left transition-colors flex items-center justify-between",
          error
            ? "border-red-500 bg-red-50/50"
            : isOpen
            ? "border-blue-500"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <div className="flex items-center gap-3">
          <MapPin
            className={cn(
              "h-5 w-5",
              error ? "text-red-500" : selectedCity ? "text-blue-600" : "text-slate-400"
            )}
          />
          <span
            className={cn(
              "text-base",
              selectedCity ? "text-slate-900 font-medium" : "text-slate-500"
            )}
          >
            {selectedCity
              ? `${selectedCity.name}, ${selectedCity.country}`
              : "Choose your city..."}
          </span>
        </div>
        <motion.svg
          className="h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0",
                      selectedCity?.id === city.id && "bg-blue-50"
                    )}
                  >
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {city.state_province
                          ? `${city.state_province}, ${city.country}`
                          : city.country}
                      </div>
                    </div>
                    {selectedCity?.id === city.id && (
                      <svg
                        className="h-5 w-5 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No cities found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-600 text-sm font-medium mt-1.5 px-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}



import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Search, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface City {
  id: string
  name: string
  country: string
  state_province: string | null
}

interface CitySelectProps {
  value: string
  onChange: (cityId: string) => void
  error?: string
}

export function CitySelect({ value, onChange, error }: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  useEffect(() => {
    async function fetchCities() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, country, state_province")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching cities:", error)
      } else {
        setCities(data || [])
        setFilteredCities(data || [])
      }
      setIsLoading(false)
    }

    fetchCities()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query)
      )
      setFilteredCities(filtered)
    } else {
      setFilteredCities(cities)
    }
  }, [searchQuery, cities])

  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find((c) => c.id === value)
      setSelectedCity(city || null)
    }
  }, [value, cities])

  const handleSelect = (city: City) => {
    setSelectedCity(city)
    onChange(city.id)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Select Your City
      </label>

      {/* Selected City / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-4 rounded-xl border-2 bg-white text-left transition-colors flex items-center justify-between",
          error
            ? "border-red-500 bg-red-50/50"
            : isOpen
            ? "border-blue-500"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <div className="flex items-center gap-3">
          <MapPin
            className={cn(
              "h-5 w-5",
              error ? "text-red-500" : selectedCity ? "text-blue-600" : "text-slate-400"
            )}
          />
          <span
            className={cn(
              "text-base",
              selectedCity ? "text-slate-900 font-medium" : "text-slate-500"
            )}
          >
            {selectedCity
              ? `${selectedCity.name}, ${selectedCity.country}`
              : "Choose your city..."}
          </span>
        </div>
        <motion.svg
          className="h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0",
                      selectedCity?.id === city.id && "bg-blue-50"
                    )}
                  >
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {city.state_province
                          ? `${city.state_province}, ${city.country}`
                          : city.country}
                      </div>
                    </div>
                    {selectedCity?.id === city.id && (
                      <svg
                        className="h-5 w-5 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No cities found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-600 text-sm font-medium mt-1.5 px-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

