# Architecture & Backend/Frontend Separation

## 📐 Overview

This document defines the clear separation between **Backend** and **Frontend** layers in the MOVA Travel Platform.

---

## 🎯 Architecture Layers

### 1. **Backend Layer** (Server-Side Only)

#### `/services/` - Business Logic & Data Access
- **Purpose:** Pure business logic and database operations
- **Usage:** Server Components, Server Actions, API Routes ONLY
- **Client Access:** ❌ NEVER import in Client Components
- **Database:** Uses `createClient()` from `lib/supabase/server.ts`

```
/services/
  /auth/          # Authentication services
  /business/      # Business CRUD operations
  /booking/       # Booking operations
  /trip/          # Trip management
  /payment/       # Payment processing
  /map/           # Map & routing services
  /weather/       # Weather API integration
```

**Example:**
```typescript
// ✅ CORRECT - Server Component
import { getBusiness } from '@/services/business/business.service'

export default async function BusinessPage() {
  const business = await getBusiness(id)
  return <BusinessView business={business} />
}

// ❌ WRONG - Client Component
"use client"
import { getBusiness } from '@/services/business/business.service' // ERROR!
```

#### `/actions/` - Server Actions
- **Purpose:** Server-side mutations (POST, PUT, DELETE)
- **Usage:** Can be called from Client Components via form actions or `useActionState`
- **Client Access:** ✅ Can be imported, but executed server-side

```
/actions/
  auth.ts              # Authentication actions
  business-portal.ts   # Business portal mutations
  payment.ts           # Payment actions
  trip/                # Trip collaboration actions
```

**Example:**
```typescript
// ✅ CORRECT - Client Component calling Server Action
"use client"
import { createTrip } from '@/actions/trip/collaboration'

export function CreateTripForm() {
  async function handleSubmit(formData: FormData) {
    await createTrip(formData) // Executes on server
  }
  return <form action={handleSubmit}>...</form>
}
```

#### `/app/api/` - REST API Routes
- **Purpose:** External API endpoints (webhooks, third-party integrations)
- **Usage:** HTTP requests from external services or client-side fetch
- **Client Access:** ✅ Via `fetch()` calls

```
/app/api/
  /webhooks/stripe/    # Stripe webhook handler
  /weather/            # Weather API proxy
  /admin/              # Admin API endpoints
```

**Example:**
```typescript
// ✅ CORRECT - Client Component fetching API
"use client"
const response = await fetch('/api/weather/get?city=Brasov')
const data = await response.json()
```

---

### 2. **Frontend Layer** (Client-Side)

#### `/components/` - React Components
- **Purpose:** UI components and user interactions
- **Usage:** Client Components (`"use client"`) or Server Components
- **Database Access:** ❌ NEVER direct database access

```
/components/
  /features/      # Feature-specific components
  /shared/       # Reusable UI components
  /ui/           # Shadcn UI primitives
```

**Client Component Pattern:**
```typescript
// ✅ CORRECT - Client Component using Supabase client
"use client"
import { createClient } from '@/lib/supabase/client'

export function BusinessList() {
  const supabase = createClient()
  // Direct Supabase queries for client-side data
}
```

#### `/app/` - Pages (Routes)
- **Purpose:** Next.js App Router pages
- **Default:** Server Components (can use Services directly)
- **Client Pages:** Use `"use client"` directive

```
/app/
  /home/              # Server Component (default)
  /home/home-client.tsx  # Client Component wrapper
  /explore/           # Server Component
  /profile/           # Server Component
```

**Pattern:**
```typescript
// ✅ CORRECT - Server Component page
import { getProfile } from '@/services/auth/profile.service'

export default async function ProfilePage() {
  const profile = await getProfile() // Server-side
  return <ProfileView profile={profile} />
}
```

#### `/store/` - Zustand State Management
- **Purpose:** Client-side state management
- **Usage:** Client Components ONLY
- **Database Access:** ❌ No direct database access

```
/store/
  trip-store.ts       # Trip state
  app-store.ts        # App-wide state
  vacation-store.ts   # Vacation state
```

---

## 🔒 Separation Rules

### ✅ DO

1. **Services in Server Components:**
   ```typescript
   import { getBusiness } from '@/services/business/business.service'
   ```

2. **Server Actions from Client Components:**
   ```typescript
   import { createTrip } from '@/actions/trip/collaboration'
   ```

3. **Supabase Client in Client Components:**
   ```typescript
   import { createClient } from '@/lib/supabase/client'
   ```

4. **API Routes via fetch:**
   ```typescript
   const res = await fetch('/api/weather/get')
   ```

### ❌ DON'T

1. **Services in Client Components:**
   ```typescript
   "use client"
   import { getBusiness } from '@/services/business/business.service' // ❌ ERROR
   ```

2. **Server Supabase Client in Client Components:**
   ```typescript
   "use client"
   import { createClient } from '@/lib/supabase/server' // ❌ ERROR
   ```

3. **Direct Database Queries in Components:**
   ```typescript
   // ❌ Don't mix database logic in components
   ```

---

## 📊 Data Flow

### Server-Side Data Flow
```
Server Component → Service → Supabase Server Client → Database
```

### Client-Side Data Flow
```
Client Component → Server Action → Service → Database
Client Component → Supabase Client → Database (for real-time)
Client Component → fetch() → API Route → Service → Database
```

---

## ✅ Separation Status

All Client Components have been updated to use Server Actions instead of importing Services directly.

### Server Actions Created

| Action File | Functions | Used By |
|-------------|-----------|---------|
| `actions/cities.ts` | `getActiveCities`, `getCities`, `getNearestCity` | City selectors |
| `actions/weather.ts` | `getWeatherForecast`, `filterForecastForVacation` | Weather widget |
| `actions/business.ts` | `getBusinessById`, `recordSwipe` | Swipe stack, business details |
| `actions/booking.ts` | `createBooking`, `calculateBookingPrice`, `confirmBooking`, `cancelBooking` | Booking components |
| `actions/rooms.ts` | `getRoomsByHotel`, `createRoom`, `updateRoom`, `deleteRoom` | Room manager |
| `actions/reviews.ts` | `getBusinessReviews`, `createReview` | Reviews list |
| `actions/trips.ts` | `addBusinessToTrip` | Trip planning |
| `actions/profile.ts` | `saveBusinessForUser`, `removeSavedBusiness` | Favorites |

### Types Exported

Types are now exported from Server Actions for use in Client Components:
- `City` from `@/actions/cities`
- `Business`, `MapBusiness` from `@/actions/business`
- `Booking`, `BookingStatus`, `BookingPriceCalculation` from `@/actions/booking`
- `HotelRoom` from `@/actions/rooms`
- `Review` from `@/actions/reviews`
- `WeatherDay`, `WeatherForecast` from `@/actions/weather`

---

## 📝 Usage Examples

### Importing Types in Client Components

```typescript
"use client"
import type { Business, MapBusiness } from '@/actions/business'
import type { HotelRoom } from '@/actions/rooms'
import type { City } from '@/actions/cities'
```

### Calling Server Actions from Client Components

```typescript
"use client"
import { getBusinessById } from '@/actions/business'
import { createBooking } from '@/actions/booking'

export function MyComponent() {
  useEffect(() => {
    getBusinessById(id).then(business => {
      // Handle result
    })
  }, [])

  async function handleBook() {
    const result = await createBooking(params)
    if (result.success) {
      // Handle success
    } else {
      // Handle error: result.error
    }
  }
}
```

---

## 🎯 Best Practices

1. **Server Components by Default:** Use Server Components for data fetching
2. **Client Components for Interactivity:** Only use `"use client"` when needed (forms, state, effects)
3. **Services = Server Only:** Never import Services in Client Components
4. **Server Actions for Mutations:** Use Server Actions for POST/PUT/DELETE from Client Components
5. **API Routes for External:** Use API Routes for webhooks and external integrations
6. **Type Safety:** Always use TypeScript types from `/types/`

---

## 📚 References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
