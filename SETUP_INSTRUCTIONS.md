# Setup Instructions - Routing Infrastructure

## Pași de Setup

### 1. Descărcare Date OSM

```bash
cd /Users/macbook/Desktop/travel-app
mkdir -p data
cd data
wget https://download.geofabrik.de/europe/romania-latest.osm.pbf -O brasov-latest.osm.pbf
```

**Notă**: Fișierul este mare (~500MB), descărcarea poate dura câteva minute.

### 2. Descărcare Date GTFS

Plasează fișierul GTFS `.zip` pentru Brașov în directorul `data/`:

```bash
# Exemplu:
cp /path/to/brasov-gtfs.zip data/
```

**Unde găsești GTFS pentru Brașov:**
- [TransitFeeds](https://transitfeeds.com/search?q=brasov)
- Autoritatea de transport public din Brașov
- [GTFS Data Exchange](https://www.gtfs-data-exchange.com/)

### 3. Creare .env.local

```bash
cd /Users/macbook/Desktop/travel-app
cat > .env.local << 'EOF'
NEXT_PUBLIC_OTP_URL=http://localhost:8080
NEXT_PUBLIC_OSRM_URL=http://localhost:5000
EOF
```

### 4. Pornire Docker Containers

```bash
cd /Users/macbook/Desktop/travel-app
docker-compose up -d
```

### 5. Monitorizare Build

**OTP (OpenTripPlanner)** - prima build durează 10-15 minute:
```bash
docker-compose logs -f otp
```
Așteaptă mesajul: `Grizzly server running`

**OSRM** - build durează 2-5 minute:
```bash
docker-compose logs -f osrm
```

### 6. Verificare Servicii

**OSRM:**
```bash
curl http://localhost:5000/route/v1/driving/25.6,45.6;25.7,45.7
```

**OTP:**
```bash
curl http://localhost:8080/otp/routers/default
```

## Script Automatizat

Poți rula scriptul de setup:

```bash
chmod +x setup-routing.sh
./setup-routing.sh
```

## Troubleshooting

### OTP nu pornește
- Verifică logs: `docker-compose logs otp`
- Asigură-te că există fișier `.zip` în `data/`
- Verifică memorie: OTP necesită ~2GB RAM

### OSRM nu pornește
- Verifică logs: `docker-compose logs osrm`
- Asigură-te că există `brasov-latest.osm.pbf` în `data/`
- Verifică că numele fișierului este corect

### Porturi ocupate
- Schimbă porturile în `docker-compose.yml` dacă 8080 sau 5000 sunt ocupate

## Status Containers

```bash
docker-compose ps
```

## Oprire Containers

```bash
docker-compose down
```

## Repornire Containers

```bash
docker-compose restart
```

