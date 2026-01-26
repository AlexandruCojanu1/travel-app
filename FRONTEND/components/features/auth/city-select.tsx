"use client"

import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown, Loader2 } from 'lucide-react'
import { getCities } from '@/actions/cities'
import { cn } from '@/lib/utils'

interface City {
  id: string
  name: string
  country: string
  state_province: string | null
  latitude?: number
  longitude?: number
}

interface CitySelectProps {
  value: string
  onChange: (cityId: string) => void
  onCityChange?: (city: City | null) => void  // Optional callback for full city data
  error?: string
  className?: string
}

export function CitySelect({ value, onChange, onCityChange, error, className }: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities()
        setCities(data as City[])
      } catch (err) {
        console.error('Error loading cities:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadCities()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedCity = cities.find(c => c.id === value)
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCitySelect = (city: City) => {
    onChange(city.id)
    if (onCityChange) {
      onCityChange(city)
    }
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className={cn(
          "relative w-full px-4 py-3 rounded-xl border-2 bg-white cursor-pointer transition-all",
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200"
            : "border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200",
          isOpen && "border-blue-500 ring-2 ring-blue-200"
        )}
        onClick={() => {
          setIsOpen(!isOpen)
          inputRef.current?.focus()
        }}
      >
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Caută un oraș..."
            className="flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
            readOnly={!isOpen}
          />
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
          ) : (
            <ChevronDown
              className={cn(
                "h-5 w-5 text-slate-400 transition-transform flex-shrink-0",
                isOpen && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">Se încarcă orașele...</p>
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <p className="text-sm">Nu s-au găsit orașe</p>
            </div>
          ) : (
            <ul className="py-2">
              {filteredCities.map((city) => (
                <li
                  key={city.id}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors z-[70]",
                    value === city.id && "bg-blue-100 font-semibold"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCitySelect(city)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{city.name}</p>
                      <p className="text-xs text-slate-500">{city.country}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

