# Architecture Overview

## Project Structure

Feature-based architecture with clear separation of concerns.

## Directory Structure

```
travel-app/
├── app/                    # Next.js App Router (routes only)
├── components/
│   ├── features/          # Feature-specific components
│   └── shared/            # Shared components & UI primitives
├── actions/               # Next.js Server Actions
├── services/              # Business logic layer
├── store/                 # Zustand state management
├── lib/                   # Core libraries & utilities
├── types/                 # TypeScript types
└── database/              # SQL scripts
```

## Feature Domains

1. **Authentication** (`auth`) - Login, signup, onboarding, profile
2. **Business** (`business`) - Business portal & public views
3. **Booking** (`booking`) - Booking flow & checkout
4. **Trip Planning** (`trip`) - Itinerary builder & budget
5. **Feed** (`feed`) - City-based content feed
6. **Map & Explore** (`map`) - Interactive maps & GTFS

## Design Principles

1. **Feature-Based**: Each feature is self-contained
2. **Separation of Concerns**: UI, business logic, and data access are separated
3. **Reusability**: Shared components in `components/shared/`
4. **Type Safety**: Full TypeScript coverage
5. **Scalability**: Easy to add new features

## Import Paths

Use TypeScript path aliases:
- `@/components/*` - All components
- `@/lib/*` - Libraries and utilities
- `@/services/*` - Service layer
- `@/actions/*` - Server actions
- `@/store/*` - State management
- `@/types/*` - Type definitions
