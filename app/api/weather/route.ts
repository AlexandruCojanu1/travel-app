import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')

    if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
    }

    try {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.append('latitude', latitude)
        url.searchParams.append('longitude', longitude)
        url.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max')
        url.searchParams.append('timezone', 'auto')
        url.searchParams.append('forecast_days', '14')

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'TravelApp-Education/1.0'
            }
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Weather API error' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Weather API error:', error)
        return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
    }
}
