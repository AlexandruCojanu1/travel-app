#!/bin/bash

set -e

echo "🚀 Setup Routing Infrastructure pentru Mova"
echo "=============================================="
echo ""

# Step 1: Create data directory
echo "📁 Creare director data..."
mkdir -p data
echo "✅ Director creat"
echo ""

# Step 2: Download OSM data
echo "📥 Descărcare OSM data pentru România..."
if [ ! -f data/brasov-latest.osm.pbf ]; then
    echo "⚠️  Aceasta poate dura câteva minute (fișier mare ~500MB)"
    wget --progress=bar:force https://download.geofabrik.de/europe/romania-latest.osm.pbf -O data/brasov-latest.osm.pbf
    echo "✅ OSM data descărcată!"
else
    echo "✅ OSM file deja există"
fi
echo ""

# Step 3: Create .env.local
echo "📝 Creare .env.local..."
cat > .env.local << 'EOF'
# OpenTripPlanner URL
NEXT_PUBLIC_OTP_URL=http://localhost:8080

# OSRM Backend URL
NEXT_PUBLIC_OSRM_URL=http://localhost:5000
EOF
echo "✅ .env.local creat"
echo ""

# Step 4: Check Docker
echo "🐳 Verificare Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nu este instalat!"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nu este instalat!"
    exit 1
fi
echo "✅ Docker instalat"
echo ""

# Step 5: Start Docker containers
echo "🚀 Pornire Docker containers..."
docker-compose up -d
echo "✅ Containers pornite"
echo ""

# Step 6: Wait a bit for initialization
echo "⏳ Așteptare inițializare (5 secunde)..."
sleep 5
echo ""

# Step 7: Show status
echo "📊 Status containers:"
docker-compose ps
echo ""

# Step 8: Show logs info
echo "📋 Informații importante:"
echo ""
echo "1. OTP (OpenTripPlanner):"
echo "   - URL: http://localhost:8080"
echo "   - Prima build durează 10-15 minute"
echo "   - Monitorizează: docker-compose logs -f otp"
echo "   - Așteaptă mesajul: 'Grizzly server running'"
echo ""
echo "2. OSRM Backend:"
echo "   - URL: http://localhost:5000"
echo "   - Build durează 2-5 minute"
echo "   - Monitorizează: docker-compose logs -f osrm"
echo ""
echo "3. GTFS Data:"
echo "   - Plasează fișierul .zip în directorul data/"
echo "   - OTP va detecta automat orice .zip file"
echo ""
echo "4. Verificare servicii:"
echo "   - OSRM: curl http://localhost:5000/route/v1/driving/25.6,45.6;25.7,45.7"
echo "   - OTP: curl http://localhost:8080/otp/routers/default"
echo ""
echo "✅ Setup complet! Așteaptă build-ul containers și apoi testează aplicația."

