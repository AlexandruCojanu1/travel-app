#!/bin/bash

echo "📊 Verificare Status - Routing Infrastructure"
echo "=============================================="
echo ""

# Check Docker Compose command
if docker compose version &> /dev/null; then
    DC="docker compose"
elif docker-compose version &> /dev/null; then
    DC="docker-compose"
else
    echo "❌ Docker Compose nu este disponibil"
    exit 1
fi

# Check containers
echo "🐳 Containers:"
$DC ps --format "   {{.Name}}: {{.Status}}"
echo ""

# Check OTP
echo "🔍 OTP (OpenTripPlanner):"
OTP_STATUS=$($DC ps --format "{{.Status}}" --filter "name=mova-otp" 2>/dev/null | head -1)
if echo "$OTP_STATUS" | grep -q "Up"; then
    echo "   ✅ Container rulează"
    if curl -s -f http://localhost:8080/otp/routers/default > /dev/null 2>&1; then
        echo "   ✅ Serviciu răspunde (GATA!)"
    else
        echo "   ⏳ Serviciu încă se construiește (10-15 min prima dată)"
        echo "   📋 Logs: $DC logs --tail=10 otp"
    fi
else
    echo "   ❌ Container nu rulează"
fi
echo ""

# Check OSRM
echo "🔍 OSRM:"
OSRM_STATUS=$($DC ps --format "{{.Status}}" --filter "name=mova-osrm" 2>/dev/null | head -1)
if echo "$OSRM_STATUS" | grep -q "Up"; then
    echo "   ✅ Container rulează"
    if curl -s -f "http://localhost:5001/route/v1/driving/25.6,45.6;25.7,45.7" > /dev/null 2>&1; then
        echo "   ✅ Serviciu răspunde (GATA!)"
    else
        echo "   ⏳ Serviciu încă se construiește (2-5 min prima dată)"
        echo "   📋 Logs: $DC logs --tail=10 osrm"
    fi
else
    echo "   ❌ Container nu rulează"
fi
echo ""

# Check data files
echo "📁 Fișiere date:"
if [ -f data/brasov-gtfs.zip ]; then
    echo "   ✅ GTFS: $(du -h data/brasov-gtfs.zip | cut -f1)"
else
    echo "   ❌ GTFS lipsește"
fi

if [ -f data/brasov-latest.osm.pbf ]; then
    echo "   ✅ OSM: $(du -h data/brasov-latest.osm.pbf | cut -f1)"
else
    echo "   ❌ OSM lipsește"
fi
echo ""

# Final summary
echo "📊 REZUMAT:"
OTP_READY=$(curl -s -f http://localhost:8080/otp/routers/default > /dev/null 2>&1 && echo "yes" || echo "no")
OSRM_READY=$(curl -s -f "http://localhost:5001/route/v1/driving/25.6,45.6;25.7,45.7" > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$OTP_READY" = "yes" ] && [ "$OSRM_READY" = "yes" ]; then
    echo "   ✅ TOTUL ESTE GATA! 🎉"
    echo "   Poți testa aplicația acum!"
elif [ "$OTP_READY" = "yes" ] || [ "$OSRM_READY" = "yes" ]; then
    echo "   ⏳ Parțial gata - unul dintre servicii încă se construiește"
else
    echo "   ⏳ Serviciile încă se construiesc (normal la prima pornire)"
    echo "   OTP: 10-15 minute"
    echo "   OSRM: 2-5 minute"
fi
echo ""
echo "📋 Monitorizare:"
echo "   $DC logs -f otp"
echo "   $DC logs -f osrm"

