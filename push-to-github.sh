#!/bin/bash

cd /Users/macbook/Desktop/travel-app

echo "📋 Verificare status Git..."
git status --short | head -10

echo ""
echo "📦 Adăugare modificări..."
git add .

echo ""
echo "💾 Creare commit..."
git commit -m "Update: Fix routing, Supabase config, UI translations, error components

- Fixed routing infrastructure (removed Docker, using local Haversine)
- Added Supabase configuration
- Updated UI translations to Romanian
- Fixed error components and middleware
- Improved transport costs calculation
- Added nature reserves and recreation areas to map
- Fixed duplicate activity prevention in trip planner" 2>&1

echo ""
echo "🔍 Verificare remote..."
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE" ]; then
    echo "❌ Nu există remote origin configurat."
    echo "   Te rog să adaugi remote-ul GitHub:"
    echo "   git remote add origin https://github.com/USER/REPO.git"
    exit 1
fi

echo "✅ Remote: $REMOTE"

echo ""
echo "🌿 Verificare branch..."
BRANCH=$(git branch --show-current)
echo "✅ Branch: $BRANCH"

echo ""
echo "🚀 Push pe GitHub..."
REPO=$(echo "$REMOTE" | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
git push origin ${BRANCH} 2>&1

echo ""
echo "✅ Push complet!"

