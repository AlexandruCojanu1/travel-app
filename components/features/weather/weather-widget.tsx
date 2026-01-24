"use client"

import { useEffect, useState } from 'react'
import { Cloud, Droplets, Wind } from 'lucide-react'
import { getWeatherForecast, filterForecastForVacation, type WeatherDay, type WeatherForecast } from '@/services/weather/weather.service'

interface WeatherWidgetProps {
  latitude: number
  longitude: number
  cityName: string
  vacationStartDate: Date
  vacationEndDate: Date
}

export function WeatherWidget({
  latitude,
  longitude,
  cityName,
  vacationStartDate,
  vacationEndDate
}: WeatherWidgetProps) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [filteredDays, setFilteredDays] = useState<WeatherDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if vacation is too far in future to fetch weather (14 days max for Open-Meteo)
  // We do this check synchronously to avoid initial loading skeleton flash
  const daysUntilStart = Math.ceil((new Date(vacationStartDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const isTooFar = daysUntilStart > 14

  useEffect(() => {
    if (isTooFar) {
      setIsLoading(false)
      return
    }

    async function loadWeather() {
      setIsLoading(true)
      setError(null)

      try {
        const weatherData = await getWeatherForecast(latitude, longitude, cityName)
        setForecast(weatherData)

        if (weatherData) {
          const filtered = filterForecastForVacation(weatherData, vacationStartDate, vacationEndDate)
          setFilteredDays(filtered)
        }
      } catch (err) {
        console.error('Error loading weather:', err)
        setError('Nu am putut încărca vremea')
      } finally {
        setIsLoading(false)
      }
    }

    loadWeather()
  }, [latitude, longitude, cityName, vacationStartDate, vacationEndDate, isTooFar])

  // If vacation is more than 14 days away, don't show anything
  if (isTooFar) {
    return null
  }

  // If loading finished but no days (e.g. error or old date), don't show
  if (!isLoading && filteredDays.length === 0) {
    return null
  }

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="h-5 w-5 text-primary" />
          <span className="font-semibold text-slate-700">Prognoza meteo</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-20 h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return null
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="h-5 w-5 text-primary" />
        <span className="font-semibold text-slate-700">Prognoza meteo pentru {cityName}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {filteredDays.map((day) => {
          const date = new Date(day.date)
          const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' })
          const dayNumber = date.getDate()
          const month = date.toLocaleDateString('ro-RO', { month: 'short' })

          return (
            <div
              key={day.date}
              className="flex-shrink-0 w-24 bg-gradient-to-b from-blue-50 to-white rounded-xl p-3 border border-blue-100 text-center"
            >
              <div className="text-xs font-medium text-slate-500 capitalize">{dayName}</div>
              <div className="text-xs text-slate-400">{dayNumber} {month}</div>
              <div className="text-3xl my-2">{day.weatherIcon}</div>
              <div className="text-sm font-bold text-slate-800">
                {day.temperatureMax}° / {day.temperatureMin}°
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate" title={day.weatherDescription}>
                {day.weatherDescription}
              </div>
              {day.precipitationProbability > 20 && (
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-blue-500">
                  <Droplets className="h-3 w-3" />
                  {day.precipitationProbability}%
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 mt-2 text-center">
        Sursa: Open-Meteo • Prognoza disponibilă pentru următoarele 14 zile
      </p>
    </div>
  )
}
