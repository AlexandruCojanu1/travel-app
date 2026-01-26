import { Router } from 'express'
import { createError } from '../middleware/error.middleware.js'
import { logger } from '../lib/logger.js'

export const weatherRouter = Router()

// Weather cache
const weatherCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// Weather code to description/emoji mapping
const weatherDescriptions: Record<number, { description: string; icon: string }> = {
  0: { description: 'Senin', icon: '☀️' },
  1: { description: 'Predominant senin', icon: '🌤️' },
  2: { description: 'Parțial noros', icon: '⛅' },
  3: { description: 'Noros', icon: '☁️' },
  45: { description: 'Ceață', icon: '🌫️' },
  48: { description: 'Ceață cu chiciură', icon: '🌫️' },
  51: { description: 'Burniță ușoară', icon: '🌦️' },
  53: { description: 'Burniță moderată', icon: '🌦️' },
  55: { description: 'Burniță densă', icon: '🌧️' },
  61: { description: 'Ploaie ușoară', icon: '🌧️' },
  63: { description: 'Ploaie moderată', icon: '🌧️' },
  65: { description: 'Ploaie puternică', icon: '🌧️' },
  71: { description: 'Ninsoare ușoară', icon: '🌨️' },
  73: { description: 'Ninsoare moderată', icon: '🌨️' },
  75: { description: 'Ninsoare puternică', icon: '❄️' },
  77: { description: 'Grăunți de zăpadă', icon: '🌨️' },
  80: { description: 'Averse ușoare', icon: '🌦️' },
  81: { description: 'Averse moderate', icon: '🌧️' },
  82: { description: 'Averse violente', icon: '⛈️' },
  85: { description: 'Ninsori ușoare', icon: '🌨️' },
  86: { description: 'Ninsori puternice', icon: '❄️' },
  95: { description: 'Furtună', icon: '⛈️' },
  96: { description: 'Furtună cu grindină mică', icon: '⛈️' },
  99: { description: 'Furtună cu grindină mare', icon: '⛈️' },
}

// Get weather forecast
weatherRouter.get('/', async (req, res, next) => {
  try {
    const { lat, lng, city } = req.query

    if (!lat || !lng) {
      throw createError('Latitude and longitude are required', 400)
    }

    const cacheKey = `${lat},${lng}`
    const cached = weatherCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data)
    }

    // Fetch from Open-Meteo API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=14`

    const response = await fetch(url)

    if (!response.ok) {
      throw createError('Failed to fetch weather data', 502)
    }

    interface OpenMeteoResponse {
      timezone: string
      daily: {
        time: string[]
        weathercode: number[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_probability_max: number[]
        precipitation_sum: number[]
      }
    }

    const data = await response.json() as OpenMeteoResponse

    // Transform data
    const forecast = {
      cityName: city || 'Unknown',
      latitude: Number(lat),
      longitude: Number(lng),
      timezone: data.timezone,
      days: data.daily.time.map((date: string, index: number) => {
        const weatherCode = data.daily.weathercode[index]
        const weatherInfo = weatherDescriptions[weatherCode] || { description: 'Necunoscut', icon: '❓' }

        return {
          date,
          temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
          temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
          precipitationSum: data.daily.precipitation_sum[index] || 0,
          weatherCode,
          weatherDescription: weatherInfo.description,
          weatherIcon: weatherInfo.icon,
        }
      }),
    }

    // Cache the result
    weatherCache.set(cacheKey, { data: forecast, timestamp: Date.now() })

    res.json(forecast)
  } catch (error) {
    logger.error('Weather API error', error)
    next(error)
  }
})
