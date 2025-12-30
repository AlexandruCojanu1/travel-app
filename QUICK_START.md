# Quick Start - Routing Infrastructure

## ✅ Ce am făcut pentru tine:

1. ✅ Creat `docker-compose.yml` cu OTP și OSRM
2. ✅ Creat `osrm-profiles/car.lua` cu viteze realiste
3. ✅ Creat `services/map/otp.service.ts` - client OTP
4. ✅ Creat `services/map/osrm-local.service.ts` - client OSRM
5. ✅ Actualizat `transport-costs.service.ts` - folosește OTP/OSRM
6. ✅ Actualizat `route-map-view.tsx` - folosește OTP/OSRM
7. ✅ Creat `setup-routing.sh` - script automatizat
8. ✅ Creat `SETUP_INSTRUCTIONS.md` - ghid detaliat

## 🚀 Pași finali (rulează manual):

### Opțiunea 1: Script automatizat
```bash
chmod +x setup-routing.sh
./setup-routing.sh
```

### Opțiunea 2: Pași manuali

**1. Descarcă OSM data:**
```bash
cd /Users/macbook/Desktop/travel-app
mkdir -p data
cd data
wget https://download.geofabrik.de/europe/romania-latest.osm.pbf -O brasov-latest.osm.pbf
```
⏱️ Durată: ~5-10 minute (fișier ~500MB)

**2. Plasează GTFS data:**
- Descarcă GTFS pentru Brașov de pe [TransitFeeds](https://transitfeeds.com/search?q=brasov)
- Plasează fișierul `.zip` în `data/`

**3. Pornește Docker:**
```bash
cd /Users/macbook/Desktop/travel-app
docker-compose up -d
```

**4. Monitorizează build:**
```bash
# OTP (10-15 min prima dată)
docker-compose logs -f otp

# OSRM (2-5 min prima dată)
docker-compose logs -f osrm
```

**5. Verifică servicii:**
```bash
# OSRM
curl http://localhost:5000/route/v1/driving/25.6,45.6;25.7,45.7

# OTP (după build)
curl http://localhost:8080/otp/routers/default
```

## 📊 Status

După ce rulezi comenzile de mai sus, verifică:
```bash
docker-compose ps
```

Ar trebui să vezi:
- `mova-otp` - Running
- `mova-osrm` - Running

## 🎯 Testare în aplicație

1. Pornește Next.js: `npm run dev`
2. Mergi la pagina "Plan"
3. Adaugă 2+ locații
4. Selectează modul de transport
5. Ar trebui să vezi rutele reale calculate!

## ⚠️ Note importante

- **Prima build**: OTP durează 10-15 minute, OSRM 2-5 minute
- **Memorie**: OTP necesită ~2GB RAM disponibil
- **GTFS**: Dacă nu ai GTFS, OTP va funcționa doar pentru walking
- **Porturi**: Asigură-te că 8080 și 5000 sunt libere

## 🐛 Troubleshooting

Vezi `SETUP_INSTRUCTIONS.md` pentru detalii complete.

