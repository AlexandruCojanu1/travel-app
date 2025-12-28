# Refactoring Guide

## ⚠️ Important: Import Path Updates Required

After the reorganization, **all import paths need to be updated** throughout the codebase.

## Migration Checklist

### Components
- [ ] Update imports from `@/components/auth/*` → `@/components/features/auth/*`
- [ ] Update imports from `@/components/business/*` → `@/components/features/business/public/*`
- [ ] Update imports from `@/components/business-portal/*` → `@/components/features/business/portal/*`
- [ ] Update imports from `@/components/bookings/*` → `@/components/features/booking/*`
- [ ] Update imports from `@/components/checkout/*` → `@/components/features/booking/checkout/*`
- [ ] Update imports from `@/components/plan/*` → `@/components/features/trip/*`
- [ ] Update imports from `@/components/feed/*` → `@/components/features/feed/*`
- [ ] Update imports from `@/components/maps/*` → `@/components/features/map/*`
- [ ] Update imports from `@/components/explore/*` → `@/components/features/map/explore/*`
- [ ] Update imports from `@/components/search/*` → `@/components/features/map/search/*`
- [ ] Update imports from `@/components/profile/*` → `@/components/features/auth/*`

### Services
- [ ] Update imports from `@/services/profile.service` → `@/services/auth/profile.service`
- [ ] Update imports from `@/services/city.service` → `@/services/auth/city.service`
- [ ] Update imports from `@/services/business.service` → `@/services/business/business.service`
- [ ] Update imports from `@/services/booking.service` → `@/services/booking/booking.service`
- [ ] Update imports from `@/services/trip.service` → `@/services/trip/trip.service`
- [ ] Update imports from `@/services/feed.service` → `@/services/feed/feed.service`
- [ ] Update imports from `@/services/gtfs.service` → `@/services/map/gtfs.service`

## Quick Find & Replace

Use your IDE's find & replace with regex:

### Components
```
Find: @/components/(auth|business|bookings|checkout|plan|feed|maps|explore|search|profile)/
Replace: @/components/features/$1/
```

### Services
```
Find: @/services/(profile|city|business|booking|trip|feed|gtfs)\.service
Replace: @/services/[domain]/$1.service
```

## Automated Script (Optional)

You can create a script to automate this, but **test thoroughly** before running:

```bash
# Example (use with caution)
find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/components/auth/|@/components/features/auth/|g'
```

## Testing

After updating imports:
1. Run `npm run build` to check for TypeScript errors
2. Test each feature manually
3. Check browser console for runtime errors

## Rollback

If something breaks, you can rollback by:
1. Reverting the folder structure changes
2. Restoring original import paths
3. All files are still in Git history

