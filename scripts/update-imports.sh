#!/bin/bash

# Script to update import paths after reorganization
# Run with: bash scripts/update-imports.sh

echo "Updating import paths..."

# Update component imports (old paths to new paths)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "./node_modules/*" ! -path "./.next/*" -exec sed -i '' \
  -e 's|@/components/auth/|@/components/features/auth/|g' \
  -e 's|@/components/business-portal/|@/components/features/business/portal/|g' \
  -e 's|@/components/business/|@/components/features/business/public/|g' \
  -e 's|@/components/bookings/|@/components/features/booking/|g' \
  -e 's|@/components/checkout/|@/components/features/booking/checkout/|g' \
  -e 's|@/components/plan/|@/components/features/trip/|g' \
  -e 's|@/components/feed/|@/components/features/feed/|g' \
  -e 's|@/components/maps/|@/components/features/map/|g' \
  -e 's|@/components/explore/|@/components/features/map/explore/|g' \
  -e 's|@/components/search/|@/components/features/map/search/|g' \
  -e 's|@/components/profile/|@/components/features/auth/|g' \
  -e 's|@/components/ui/|@/components/shared/ui/|g' \
  {} \;

# Update service imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "./node_modules/*" ! -path "./.next/*" -exec sed -i '' \
  -e 's|@/services/profile\.service|@/services/auth/profile.service|g' \
  -e 's|@/services/city\.service|@/services/auth/city.service|g' \
  -e 's|@/services/business\.service|@/services/business/business.service|g' \
  -e 's|@/services/booking\.service|@/services/booking/booking.service|g' \
  -e 's|@/services/trip\.service|@/services/trip/trip.service|g' \
  -e 's|@/services/feed\.service|@/services/feed/feed.service|g' \
  -e 's|@/services/gtfs\.service|@/services/map/gtfs.service|g' \
  {} \;

echo "Import paths updated!"
echo "Please run 'npm run build' to check for errors."
