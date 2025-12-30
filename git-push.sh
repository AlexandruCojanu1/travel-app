#!/bin/bash
cd /Users/macbook/Desktop/travel-app

echo "=== Adăugare modificări ==="
git add .

echo ""
echo "=== Creare commit ==="
git commit -m "Update: Fix routing, Supabase config, UI translations" 2>&1

echo ""
echo "=== Verificare remote ==="
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE" ]; then
    echo "❌ Nu există remote. Te rog să adaugi:"
    echo "   git remote add origin https://github.com/USER/REPO.git"
    exit 1
fi

echo "Remote: $REMOTE"
REPO=$(echo "$REMOTE" | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

echo ""
echo "=== Push pe GitHub ==="
echo "Repository: $REPO"
echo "Branch: $BRANCH"
git push origin ${BRANCH} 2>&1

echo ""
echo "✅ Gata!"

