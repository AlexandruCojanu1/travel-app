#!/bin/bash

# Script to start Next.js dev server on port 3000
# Ensures only one instance runs

echo "🛑 Stopping all Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next start" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null

echo "🔓 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

sleep 2

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🚀 Starting Next.js dev server on port 3000..."
npm run dev
