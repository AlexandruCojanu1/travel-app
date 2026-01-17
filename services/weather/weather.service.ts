/**
 * Open-Meteo Weather Service
 * Free weather API - no API key required
 * Provides 16-day forecast
 */

export interface WeatherDay {
    date: string
    temperatureMax: number
    temperatureMin: number
    weatherCode: number
    weatherDescription: string
    weatherIcon: string
    precipitationProbability: number
    windSpeed: number
}

export interface WeatherForecast {
    city: string
    days: WeatherDay[]
}

// WMO Weather interpretation codes
const WMO_CODES: Record<number, { description: string; icon: string }> = {
    0: { description: 'Senin', icon: '☀️' },
    1: { description: 'Predominant senin', icon: '🌤️' },
    2: { description: 'Parțial înnorat', icon: '⛅' },
    3: { description: 'Înnorat', icon: '☁️' },
    45: { description: 'Ceață', icon: '🌫️' },
    48: { description: 'Ceață cu chiciură', icon: '🌫️' },
    51: { description: 'Burniță ușoară', icon: '🌧️' },
    53: { description: 'Burniță moderată', icon: '🌧️' },
    55: { description: 'Burniță densă', icon: '🌧️' },
    56: { description: 'Burniță înghețată', icon: '🌨️' },
    57: { description: 'Burniță înghețată densă', icon: '🌨️' },
    61: { description: 'Ploaie ușoară', icon: '🌦️' },
    63: { description: 'Ploaie moderată', icon: '🌧️' },
    65: { description: 'Ploaie puternică', icon: '🌧️' },
    66: { description: 'Ploaie înghețată', icon: '🌨️' },
    67: { description: 'Ploaie înghețată puternică', icon: '🌨️' },
    71: { description: 'Ninsoare ușoară', icon: '🌨️' },
    73: { description: 'Ninsoare moderată', icon: '❄️' },
    75: { description: 'Ninsoare puternică', icon: '❄️' },
    77: { description: 'Grăunți de zăpadă', icon: '🌨️' },
    80: { description: 'Aversă ușoară', icon: '🌦️' },
    81: { description: 'Aversă moderată', icon: '🌧️' },
    82: { description: 'Aversă violentă', icon: '⛈️' },
    85: { description: 'Ninsoare ușoară', icon: '🌨️' },
    86: { description: 'Ninsoare puternică', icon: '❄️' },
    95: { description: 'Furtună', icon: '⛈️' },
    96: { description: 'Furtună cu grindină', icon: '⛈️' },
    99: { description: 'Furtună puternică', icon: '⛈️' },
}

function getWeatherInfo(code: number): { description: string; icon: string } {
    return WMO_CODES[code] || { description: 'Necunoscut', icon: '❓' }
}

/**
 * Fetch weather forecast from Open-Meteo API
 * @param latitude City latitude
 * @param longitude City longitude
 * @param cityName City name for display
 * @returns Weather forecast for next 14 days
 */
export async function getWeatherForecast(
    latitude: number,
    longitude: number,
    cityName: string
): Promise<WeatherForecast | null> {
    try {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.append('latitude', latitude.toString())
        url.searchParams.append('longitude', longitude.toString())
        url.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max')
        url.searchParams.append('timezone', 'auto')
        url.searchParams.append('forecast_days', '14')

        const response = await fetch(url.toString())

        if (!response.ok) {
            console.error('Open-Meteo API error:', response.status)
            return null
        }

        const data = await response.json()

        if (!data.daily) {
            return null
        }

        const days: WeatherDay[] = data.daily.time.map((date: string, index: number) => {
            const weatherCode = data.daily.weathercode[index]
            const weatherInfo = getWeatherInfo(weatherCode)

            return {
                date,
                temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
                temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
                weatherCode,
                weatherDescription: weatherInfo.description,
                weatherIcon: weatherInfo.icon,
                precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
                windSpeed: Math.round(data.daily.windspeed_10m_max[index] || 0),
            }
        })

        return {
            city: cityName,
            days,
        }
    } catch (error) {
        console.error('Error fetching weather:', error)
        return null
    }
}

/**
 * Filter forecast to only include days within vacation period
 * Returns empty array if vacation starts more than 14 days from now
 */
export function filterForecastForVacation(
    forecast: WeatherForecast | null,
    vacationStartDate: Date,
    vacationEndDate: Date
): WeatherDay[] {
    if (!forecast) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const vacationStart = new Date(vacationStartDate)
    vacationStart.setHours(0, 0, 0, 0)

    const vacationEnd = new Date(vacationEndDate)
    vacationEnd.setHours(0, 0, 0, 0)

    // Calculate days until vacation starts
    const daysUntilVacation = Math.floor((vacationStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // If vacation starts more than 14 days from now, no forecast available
    if (daysUntilVacation > 14) {
        return []
    }

    // Filter forecast days that fall within the vacation period
    return forecast.days.filter(day => {
        const forecastDate = new Date(day.date)
        forecastDate.setHours(0, 0, 0, 0)

        return forecastDate >= vacationStart && forecastDate <= vacationEnd
    })
}
