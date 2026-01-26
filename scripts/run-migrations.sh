#!/bin/bash

# Script to run Supabase migrations
# Usage: ./scripts/run-migrations.sh

echo "🚀 Running Supabase migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Run migrations
supabase db push

echo "✅ Migrations completed!"
