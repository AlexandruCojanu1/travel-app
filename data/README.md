# Data Directory

Place your map and transit data files here for Docker containers to use.

## Required Files

### 1. OpenStreetMap Data (.osm.pbf)
- **File**: `brasov-latest.osm.pbf`
- **Source**: Download from [Geofabrik](https://download.geofabrik.de/europe/romania.html)
- **Direct link**: https://download.geofabrik.de/europe/romania-latest.osm.pbf
- **Note**: For Brașov specifically, you can extract a smaller region using [Osmium](https://osmcode.org/osmium-tool/) or use the full Romania file

### 2. GTFS Data (.zip)
- **File**: `brasov-gtfs.zip` (or any name ending in .zip)
- **Source**: 
  - Check with Brașov public transport authority
  - Or use [TransitFeeds](https://transitfeeds.com/search?q=brasov)
  - Or download from [GTFS Data Exchange](https://www.gtfs-data-exchange.com/)

## File Structure

```
data/
├── brasov-latest.osm.pbf    # OpenStreetMap data for Brașov
├── brasov-gtfs.zip          # GTFS feed for Brașov transit
└── README.md                # This file
```

## Setup Instructions

1. **Download OSM data**:
   ```bash
   cd data
   wget https://download.geofabrik.de/europe/romania-latest.osm.pbf -O brasov-latest.osm.pbf
   ```

2. **Download GTFS data**:
   ```bash
   # Place your GTFS zip file in the data directory
   # Example: brasov-gtfs.zip
   ```

3. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

4. **Wait for OTP to build** (first time takes 5-15 minutes):
   ```bash
   docker-compose logs -f otp
   # Wait for "Grizzly server running" message
   ```

5. **Verify OSRM is ready**:
   ```bash
   curl http://localhost:5000/route/v1/driving/25.6,45.6;25.7,45.7
   ```

## Notes

- OTP will automatically detect any .zip files in the data directory
- OSRM needs the .osm.pbf file to be named `brasov-latest.osm.pbf` (or update docker-compose.yml)
- First build takes time - OTP needs to process GTFS and build routing graph
- Subsequent starts are faster (uses cached graph)

