#!/bin/bash

set -e

echo "🚀 Setup Complet - Routing Infrastructure"
echo "==========================================="
echo ""

# Step 1: Create GTFS zip from existing data
echo "📁 1. Creare GTFS zip pentru Brașov..."
cd /Users/macbook/Desktop/travel-app
mkdir -p data

if [ -d "public/gtfs/mdb-2143-202512160153" ]; then
    cd public/gtfs/mdb-2143-202512160153
    zip -q -r ../../../data/brasov-gtfs.zip *.txt
    cd ../../../
    echo "✅ GTFS Brașov creat: data/brasov-gtfs.zip ($(du -h data/brasov-gtfs.zip | cut -f1))"
else
    echo "⚠️  Folder GTFS Brașov nu există"
fi
echo ""

# Step 2: Create .env.local
echo "📝 2. Creare .env.local..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_OTP_URL=http://localhost:8080
NEXT_PUBLIC_OSRM_URL=http://localhost:5000
EOF
echo "✅ .env.local creat"
cat .env.local
echo ""

# Step 3: Download OSM data (if not exists)
echo "📥 3. Verificare OSM data..."
cd data
if [ ! -f brasov-latest.osm.pbf ]; then
    echo "   Descărcare OSM data (poate dura 5-10 minute)..."
    curl -L --progress-bar https://download.geofabrik.de/europe/romania-latest.osm.pbf -o brasov-latest.osm.pbf
    echo "✅ OSM descărcat: $(du -h brasov-latest.osm.pbf | cut -f1)"
else
    echo "✅ OSM file deja există: $(du -h brasov-latest.osm.pbf | cut -f1)"
fi
cd ..
echo ""

# Step 4: Detect Docker Compose command
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose nu este instalat!"
    echo "   Instalează Docker Desktop pentru macOS: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Step 4.5: Check if Docker daemon is running
echo "🔍 Verificare Docker daemon..."
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon nu rulează!"
    echo ""
    echo "📋 Soluție:"
    echo "   1. Pornește Docker Desktop din Applications"
    echo "   2. Așteaptă până când Docker Desktop este complet pornit"
    echo "   3. Rulează din nou: ./setup-complete.sh"
    echo ""
    echo "   Sau verifică manual:"
    echo "   docker info"
    exit 1
fi
echo "✅ Docker daemon rulează"
echo ""

# Step 5: Start Docker
echo "🐳 4. Pornire Docker containers..."
$DOCKER_COMPOSE up -d
echo "✅ Containers pornite"
echo ""

# Step 6: Wait a bit
echo "⏳ 5. Așteptare inițializare (5 secunde)..."
sleep 5
echo ""

# Step 7: Show status
echo "📊 6. Status containers:"
$DOCKER_COMPOSE ps
echo ""

# Step 8: Show logs
echo "📋 7. Logs OTP (ultimele 20 linii):"
$DOCKER_COMPOSE logs --tail=20 otp 2>&1 | tail -15
echo ""

echo "📋 Logs OSRM (ultimele 20 linii):"
$DOCKER_COMPOSE logs --tail=20 osrm 2>&1 | tail -15
echo ""

# Step 9: Final summary
echo "✅ SETUP COMPLET!"
echo ""
echo "📁 Fișiere în data/:"
ls -lh data/ 2>/dev/null | tail -n +2 | awk '{print "   -", $9, "(" $5 ")"}'
echo ""
echo "🐳 Containers:"
$DOCKER_COMPOSE ps --format "   {{.Name}}: {{.Status}}"
echo ""
echo "🌐 Servicii:"
echo "   - OTP: http://localhost:8080"
echo "   - OSRM: http://localhost:5000"
echo ""
echo "📊 Monitorizare build:"
echo "   $DOCKER_COMPOSE logs -f otp"
echo "   $DOCKER_COMPOSE logs -f osrm"
echo ""
echo "⏳ OTP va dura 10-15 minute pentru build prima dată"
echo "⏳ OSRM va dura 2-5 minute pentru build prima dată"
echo ""
echo "✅ Gata! Așteaptă build-ul și apoi testează aplicația."

