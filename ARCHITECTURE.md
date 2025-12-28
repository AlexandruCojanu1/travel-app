# Architecture Overview

## Project Structure

This project follows a **feature-based architecture** with clear separation of concerns.

## Directory Structure

```
travel-app/
├── app/                          # Next.js App Router (routes only)
│   ├── (tabs)/                   # Tab navigation group
│   ├── api/                      # API routes
│   ├── auth/                     # Auth pages
│   ├── business/                 # Public business pages
│   ├── business-portal/          # Business owner portal
│   └── ...
│
├── components/                   # React components (feature-based)
│   ├── features/                 # Feature-specific components
│   │   ├── auth/                 # Authentication components
│   │   ├── business/             # Business components
│   │   │   ├── portal/           # Business portal components
│   │   │   └── public/           # Public business view components
│   │   ├── booking/               # Booking & checkout components
│   │   ├── trip/                 # Trip planning components
│   │   ├── feed/                 # Feed components
│   │   └── map/                  # Map & explore components
│   └── shared/                   # Shared components
│       ├── ui/                   # Shadcn/UI components
│       └── ...                   # Global shared components
│
├── lib/                          # Core libraries & utilities
│   ├── supabase/                 # Supabase clients
│   ├── validations/              # Zod schemas
│   ├── utils.ts                  # Utility functions
│   └── stripe.ts                 # Stripe config
│
├── services/                     # Business logic layer
│   ├── auth/                     # Auth-related services
│   ├── business/                 # Business services
│   ├── booking/                  # Booking services
│   ├── trip/                     # Trip services
│   ├── feed/                     # Feed services
│   └── map/                      # Map & GTFS services
│
├── actions/                      # Next.js Server Actions
│   ├── auth.ts                   # Auth actions
│   ├── business.ts               # Business actions
│   ├── booking.ts                # Booking actions
│   └── ...
│
├── store/                        # Zustand state management
│   ├── app-store.ts              # Global app state
│   ├── auth-store.ts             # Auth state
│   ├── trip-store.ts             # Trip state
│   └── search-store.ts           # Search state
│
├── types/                        # TypeScript types
│   └── database.types.ts         # Supabase generated types
│
└── database/                     # SQL scripts
    ├── *.sql                     # Schema scripts
    └── scripts/                  # Utility scripts
```

## Feature Domains

### 1. Authentication (`auth`)
- **Components**: Login forms, city select, profile
- **Services**: Profile, city operations
- **Actions**: Login, signup, onboarding
- **Store**: Auth state management

### 2. Business (`business`)
- **Components**: 
  - `portal/` - Business owner dashboard components
  - `public/` - Public business view components
- **Services**: Business CRUD operations
- **Actions**: Business creation, updates

### 3. Booking (`booking`)
- **Components**: Booking flow, checkout
- **Services**: Booking operations, availability
- **Actions**: Create booking, payment intent

### 4. Trip Planning (`trip`)
- **Components**: Itinerary, timeline, budget
- **Services**: Trip CRUD operations
- **Store**: Trip state management

### 5. Feed (`feed`)
- **Components**: News cards, carousels, filters
- **Services**: Feed aggregation, posts

### 6. Map & Explore (`map`)
- **Components**: Map views, markers, transit layers
- **Services**: GTFS parsing, location services

## Design Principles

1. **Feature-Based Organization**: Each feature is self-contained
2. **Separation of Concerns**: UI, business logic, and data access are separated
3. **Reusability**: Shared components in `components/shared/`
4. **Type Safety**: Full TypeScript coverage
5. **Scalability**: Easy to add new features without affecting existing code

## Import Paths

Use TypeScript path aliases:
- `@/components/*` - All components
- `@/lib/*` - Libraries and utilities
- `@/services/*` - Service layer
- `@/actions/*` - Server actions
- `@/store/*` - State management
- `@/types/*` - Type definitions

