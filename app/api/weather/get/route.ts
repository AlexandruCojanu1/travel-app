import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!cityId) {
      return NextResponse.json(
        { success: false, error: 'city_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check cache first
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('weather_data, expires_at')
      .eq('city_id', cityId)
      .eq('date', date)
      .single()

    if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({
        success: true,
        weather: cached.weather_data,
        cached: true,
      })
    }

    // Get city coordinates
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('latitude, longitude, name')
      .eq('id', cityId)
      .single()

    if (cityError || !city || !city.latitude || !city.longitude) {
      return NextResponse.json(
        { success: false, error: 'City not found or missing coordinates' },
        { status: 404 }
      )
    }

    // Fetch from weather API (using OpenWeatherMap as example)
    // In production, replace with your preferred weather API
    const weatherApiKey = process.env.WEATHER_API_KEY
    if (!weatherApiKey) {
      return NextResponse.json(
        { success: false, error: 'Weather API not configured' },
        { status: 500 }
      )
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${city.latitude}&lon=${city.longitude}&appid=${weatherApiKey}&units=metric`
    
    try {
      const weatherResponse = await fetch(weatherUrl)
      const weatherData = await weatherResponse.json()

      if (!weatherResponse.ok) {
        throw new Error('Weather API error')
      }

      // Cache the result (expires in 1 hour)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      await supabase
        .from('weather_cache')
        .upsert({
          city_id: cityId,
          date,
          weather_data: weatherData,
          expires_at: expiresAt.toISOString(),
        })

      return NextResponse.json({
        success: true,
        weather: weatherData,
        cached: false,
      })
    } catch (apiError) {
      console.error('Weather API error:', apiError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in get weather API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get weather' },
      { status: 500 }
    )
  }
}

