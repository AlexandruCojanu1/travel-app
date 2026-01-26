'use server'

import { 
  getWeatherForecast as getWeatherForecastService, 
  filterForecastForVacation as filterForecastForVacationService,
  type WeatherDay,
  type WeatherForecast
} from '@/services/weather/weather.service'

// Re-export types for client components
export type { WeatherDay, WeatherForecast }

/**
 * Get weather forecast for coordinates
 */
export async function getWeatherForecast(
  latitude: number, 
  longitude: number, 
  cityName: string
): Promise<WeatherForecast | null> {
  return await getWeatherForecastService(latitude, longitude, cityName)
}

/**
 * Filter forecast for vacation dates
 */
export async function filterForecastForVacation(
  forecast: WeatherForecast, 
  startDate: Date, 
  endDate: Date
): Promise<WeatherDay[]> {
  return filterForecastForVacationService(forecast, startDate, endDate)
}
