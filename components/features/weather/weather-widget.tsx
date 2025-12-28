"use client"

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WeatherWidgetProps {
  cityId: string
  tripId?: string
}

export function WeatherWidget({ cityId, tripId }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    loadWeather()
    if (tripId) {
      loadAlerts()
    }
  }, [cityId, tripId])

  async function loadWeather() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/weather/get?city_id=${cityId}`)
      const result = await response.json()

      if (result.success) {
        setWeather(result.weather)
      }
    } catch (error) {
      console.error('Error loading weather:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadAlerts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !tripId) return

    const { data } = await supabase
      .from('weather_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('trip_id', tripId)
      .eq('is_sent', false)

    if (data) {
      setAlerts(data)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <p className="text-sm">Loading weather...</p>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        return CloudRain
      case 'snow':
        return CloudRain // Snow icon not available, using CloudRain as fallback
      case 'clouds':
        return Cloud
      default:
        return Sun
    }
  }

  const Icon = getWeatherIcon(weather.weather?.[0]?.main || 'clear')

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">Weather</h3>
            <p className="text-sm opacity-90">{weather.name}</p>
          </div>
          <Icon className="h-10 w-10" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <Thermometer className="h-5 w-5" />
            <span className="text-2xl font-bold">
              {Math.round(weather.main?.temp || 0)}°
            </span>
          </div>
          <div className="text-sm opacity-90">
            {weather.weather?.[0]?.description}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1">
            <Wind className="h-4 w-4" />
            <span>{weather.wind?.speed || 0} m/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-4 w-4" />
            <span>{weather.main?.humidity || 0}%</span>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <h4 className="font-semibold text-yellow-900 mb-1">Weather Alerts</h4>
          {alerts.map((alert) => (
            <p key={alert.id} className="text-sm text-yellow-800">
              {alert.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

