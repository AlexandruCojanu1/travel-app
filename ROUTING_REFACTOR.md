# Routing Infrastructure Refactor Guide

This document explains the new routing infrastructure using Docker-hosted OpenTripPlanner and OSRM.

## Architecture Overview

### Old System
- **Transit**: Manual GTFS parsing (`gtfs.service.ts`) - inaccurate, missing schedules
- **Driving**: Public OSRM demo server - unreliable, no traffic simulation

### New System
- **Transit**: OpenTripPlanner v2 - industry standard, handles Walk->Transit->Walk automatically
- **Driving/Walking**: Local OSRM with custom speed profiles - realistic city traffic simulation

## Setup Steps

### Step 1: Install Docker
Ensure Docker and Docker Compose are installed:
```bash
docker --version
docker-compose --version
```

### Step 2: Download Data Files

#### OSM Data (for OSRM)
```bash
mkdir -p data
cd data
wget https://download.geofabrik.de/europe/romania-latest.osm.pbf -O brasov-latest.osm.pbf
```

**Note**: For a smaller file, extract just Brașov region using Osmium:
```bash
# Install Osmium: https://osmcode.org/osmium-tool/
osmium extract -b 25.5,45.6,25.7,45.7 romania-latest.osm.pbf -o brasov-latest.osm.pbf
```

#### GTFS Data (for OTP)
1. Check Brașov public transport authority website
2. Or search on [TransitFeeds](https://transitfeeds.com/search?q=brasov)
3. Download GTFS zip file and place in `data/` directory

### Step 3: Start Docker Containers
```bash
docker-compose up -d
```

**First build takes 10-15 minutes** - OTP needs to process GTFS and build routing graph.

Monitor progress:
```bash
docker-compose logs -f otp
```

Wait for: `Grizzly server running`

### Step 4: Verify Services

**OTP**:
```bash
curl http://localhost:8080/otp/routers/default
```

**OSRM**:
```bash
curl http://localhost:5000/route/v1/driving/25.6,45.6;25.7,45.7
```

### Step 5: Update Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

The defaults should work if running locally.

## Migration Guide

### Frontend Changes

#### Old Transit Routing
```typescript
import { calculateTransitRoute } from './transit-routing.service'
```

#### New Transit Routing
```typescript
import { planTransitRoute } from './otp.service'

const itinerary = await planTransitRoute(
  { lat: 45.6, lon: 25.6, name: 'Start' },
  { lat: 45.7, lon: 25.7, name: 'Destination' },
  {
    date: new Date(),
    arriveBy: false,
    maxWalkDistance: 2000,
  }
)
```

#### Old OSRM Routing
```typescript
import { calculateRealRoute } from './osrm-routing.service'
```

#### New OSRM Routing
```typescript
import { calculateOSRMRoute } from './osrm-local.service'

const route = await calculateOSRMRoute(
  [
    { lat: 45.6, lon: 25.6 },
    { lat: 45.7, lon: 25.7 },
  ],
  'driving' // or 'walking', 'cycling'
)
```

### Response Format

Both services return GeoJSON-compatible geometry:
```typescript
{
  geometry: {
    type: 'LineString',
    coordinates: [[lng, lat], [lng, lat], ...]
  }
}
```

This can be directly used with MapLibre GL:
```typescript
<Source type="geojson" data={{
  type: 'Feature',
  geometry: route.geometry
}}>
  <Layer type="line" paint={{ 'line-color': '#3b82f6' }} />
</Source>
```

## Customization

### OSRM Speed Profiles
Edit `osrm-profiles/car.lua` to adjust speeds for different road types.

Current speeds (km/h):
- Residential: 30
- Secondary: 40
- Primary: 50
- Motorway: 80

### OTP Configuration
OTP uses default settings. To customize, create `otp-config.json` in `data/` directory.

## Troubleshooting

### OTP not starting
- Check logs: `docker-compose logs otp`
- Ensure GTFS zip file is in `data/` directory
- Verify Java memory: Increase `JAVA_OPTS` in docker-compose.yml if needed

### OSRM not starting
- Check logs: `docker-compose logs osrm`
- Ensure `.osm.pbf` file exists and is named correctly
- First build takes time - wait for "Running MLD algorithm" message

### Routes not found
- Verify coordinates are within map bounds
- Check OTP has loaded GTFS data (check logs)
- Ensure OSRM has built graph (check logs)

## Performance

- **OTP**: First request after startup may take 2-5 seconds (building routing graph)
- **OSRM**: Typically < 100ms per request
- **Memory**: OTP needs ~2GB RAM, OSRM needs ~500MB RAM

## Next Steps

1. Update `transport-costs.service.ts` to use new services
2. Deprecate old `gtfs.service.ts` and `transit-routing.service.ts`
3. Update frontend components to use new service interfaces
4. Test with real Brașov data

