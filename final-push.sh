#!/bin/bash
cd /Users/macbook/Desktop/travel-app

echo "=== 1. Adăugare modificări ==="
git add .

echo ""
echo "=== 2. Creare commit ==="
git commit -m "Update: Fix routing, Supabase config, UI translations, error components" 2>&1

echo ""
echo "=== 3. Configurare remote ==="
git remote set-url origin https://github.com/AlexandruCojanu1/travel-app.git 2>/dev/null || git remote add origin https://github.com/AlexandruCojanu1/travel-app.git

echo ""
echo "=== 4. Push pe GitHub ==="
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "Branch: $BRANCH"
git push origin ${BRANCH} 2>&1

echo ""
echo "✅ Gata!"

