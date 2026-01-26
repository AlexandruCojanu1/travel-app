# Services Layer

Business logic and data access organized by domain.

## Structure

- `auth/` - Authentication & user services
  - `profile.service.ts` - Profile operations
  - `city.service.ts` - City operations
- `business/` - Business services
  - `business.service.ts` - Business CRUD
- `booking/` - Booking services
  - `booking.service.ts` - Booking operations
- `trip/` - Trip services
  - `trip.service.ts` - Trip CRUD
- `feed/` - Feed services
  - `feed.service.ts` - Feed aggregation
- `map/` - Map services
  - `gtfs.service.ts` - Public transport data

## Usage

```ts
import { getProfile } from '@/services/auth/profile.service'
import { getBusiness } from '@/services/business/business.service'
```

