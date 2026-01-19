import { NextRequest, NextResponse } from 'next/server'

// OSRM public API profiles
type OSRMProfile = 'driving' | 'walking' | 'cycling'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const coordinates = searchParams.get('coordinates') // format: "lon1,lat1;lon2,lat2;..."
    const profile = (searchParams.get('profile') || 'driving') as OSRMProfile

    if (!coordinates) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
    }

    // Validate profile
    const validProfiles: OSRMProfile[] = ['driving', 'walking', 'cycling']
    const osrmProfile = validProfiles.includes(profile) ? profile : 'driving'

    // Map to OSRM API profile names
    const apiProfile = osrmProfile === 'walking' ? 'foot' : osrmProfile === 'cycling' ? 'bike' : 'car'

    try {
        // Use OSRM public demo server (for production, use your own instance)
        const url = `https://router.project-osrm.org/route/v1/${apiProfile}/${coordinates}?overview=full&geometries=geojson&steps=false`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'TravelApp/1.0'
            }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error('OSRM API error:', response.status, await response.text())
            return NextResponse.json({
                error: 'Routing API error',
                fallback: true
            }, { status: response.status })
        }

        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            return NextResponse.json({
                error: 'No route found',
                fallback: true
            }, { status: 404 })
        }

        // Return simplified response
        const route = data.routes[0]
        return NextResponse.json({
            distance: route.distance, // meters
            duration: route.duration, // seconds
            geometry: route.geometry.coordinates, // [[lon, lat], ...]
        })
    } catch (error) {
        console.error('Route API error:', error)
        return NextResponse.json({
            error: 'Failed to calculate route',
            fallback: true
        }, { status: 500 })
    }
}
