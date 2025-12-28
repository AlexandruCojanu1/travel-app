# TravelPWA - Mobile-First Travel Platform

A premium, responsive Progressive Web App (PWA) built with Next.js 14+, designed for seamless travel planning and booking experiences across all devices.

## 🚀 Features

### Core Functionality
- **Authentication & Onboarding**: Complete user registration, login, and onboarding flow
- **Business Portal**: Full-featured business management dashboard with polymorphic onboarding
- **Travel Planning**: Interactive trip planner with itinerary builder
- **Booking System**: Complete booking flow with Stripe payment integration
- **Map Integration**: Interactive maps with business locations and public transport (GTFS)
- **Feed System**: City-based content feed with posts, promotions, and featured businesses

### Responsive Design
- **Mobile-First Approach**: Optimized for mobile devices with touch-friendly interactions
- **Desktop Adaptation**: Gracefully scales to desktop screens with centered content
- **Hybrid Navigation**: 
  - Bottom navigation bar on mobile devices
  - Top navigation bar integrated in header on desktop

### Premium UI/UX
- **Glassmorphism Effects**: Modern backdrop-blur effects on navigation components
- **Smooth Animations**: Framer Motion powered transitions
- **Typography**: Inter font family with antialiased rendering
- **iOS Optimization**: Prevents rubber-banding scroll behavior

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Mobile-First)
- **Components**: Shadcn/UI (Radix primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Maps**: MapLibre GL JS + react-map-gl
- **Forms**: React Hook Form + Zod
- **Payments**: Stripe
- **Charts**: Recharts

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone and Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

3. **Database Setup**
Run the SQL scripts in `database/` folder in your Supabase SQL Editor:
- `romanian-cities.sql` - Populate cities table
- `extend-business-schema.sql` - Business schema extensions
- `add-promotion-fields.sql` - Promotions table updates

4. **Update Import Paths** ⚠️
After cloning, run the import update script:
```bash
bash scripts/update-imports.sh
```

5. **Run Development Server**
```bash
npm run dev
```

6. **Open Your Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
/app                      # Next.js App Router (routes only)
  /(tabs)                 # Main navigation tabs
  /admin                  # Admin dashboard
  /auth                   # Authentication pages
  /business               # Public business pages
  /business-portal        # Business owner portal
  /bookings               # Booking details
  /checkout               # Payment checkout
  /explore                # Explore map & businesses
  /home                   # Home feed
  /onboarding             # User onboarding
  /plan                   # Trip planner
  /profile                # User profile

/components
  /features               # Feature-based components
    /auth                 # Authentication & profile
    /business             # Business components
      /portal            # Business owner dashboard
      /public             # Public business view
    /booking              # Booking & checkout
      /checkout           # Checkout flow
    /trip                 # Trip planning
    /feed                 # Feed & content
    /map                  # Map & exploration
      /explore            # Explore page
      /search             # Search components
  /shared                 # Shared global components
    /ui                   # Shadcn/UI atomic components

/actions                  # Next.js Server Actions (by domain)
  auth.ts                 # Authentication actions
  business-portal.ts     # Business portal actions
  create-booking.ts       # Booking creation
  create-payment-intent.ts # Payment processing
  profile.ts             # Profile actions
  user.ts                # User actions

/services                 # Business logic layer (by domain)
  /auth                  # Auth-related services
    profile.service.ts   # Profile operations
    city.service.ts      # City operations
  /business              # Business services
    business.service.ts  # Business CRUD
  /booking               # Booking services
    booking.service.ts   # Booking operations
  /trip                  # Trip services
    trip.service.ts      # Trip CRUD
  /feed                  # Feed services
    feed.service.ts      # Feed aggregation
  /map                   # Map services
    gtfs.service.ts      # Public transport data

/store                    # Zustand state management
  app-store.ts           # Global app state
  search-store.ts        # Search state
  trip-store.ts          # Trip state

/lib
  /supabase              # Supabase clients
    client.ts            # Browser client
    server.ts            # Server client
    middleware.ts        # Session middleware
  /validations           # Zod schemas
    auth.ts              # Auth validation
    business.ts          # Business validation
  utils.ts               # Utility functions
  stripe.ts              # Stripe configuration

/types
  database.types.ts       # Supabase generated types

/database                 # SQL scripts
  /scripts               # Utility scripts
    /test                # Test/debug scripts
  *.sql                  # Schema & migration scripts

/public
  /gtfs                  # GTFS public transport data
  /icons                 # App icons
  manifest.json          # PWA manifest
```

## 🏗️ Architecture

This project follows a **feature-based architecture** with clear separation of concerns:

- **Features**: Self-contained modules (auth, business, booking, trip, feed, map)
- **Shared**: Reusable components and utilities
- **Core**: Configuration, types, and infrastructure

See `ARCHITECTURE.md` for detailed architecture documentation.

## 🎨 Design System

### Breakpoints
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Max Width**: 1280px (xl)

### Colors
- **Primary**: Blue-600 to Purple-600 gradient
- **Background**: Slate-50 (light gray)
- **Glass Effects**: White/85 opacity with backdrop blur

### Navigation Behavior
- **Mobile**: Sticky bottom navigation bar (5 tabs)
- **Desktop**: Top navigation links in header, bottom nav hidden
- **Touch Targets**: Minimum 44px height for accessibility

## 🔧 Key Features

### Authentication
- Email/password authentication via Supabase Auth
- Two-step onboarding (city selection + role selection)
- Protected routes with middleware
- Session management

### Business Portal
- Polymorphic onboarding wizard (adapts to business type)
- Inventory management (rooms, menus, services, trails)
- Operational dashboard with Kanban board
- Availability calendar with price adjustments
- Promotion packages (Silver, Gold, Platinum)
- Reviews & reputation management

### Travel Features
- Interactive map with business markers
- Public transport integration (GTFS)
- Trip planning with itinerary builder
- Booking system with Stripe payments
- City-based content feed

## 🗄️ Database Schema

Main tables:
- `profiles` - User profiles
- `cities` - City data
- `businesses` - Business listings
- `business_resources` - Business resources (rooms, menu items, etc.)
- `bookings` - Booking records
- `trips` - User trip plans
- `city_posts` - City content feed
- `promotions` - Business promotions
- `reviews` - Business reviews

See `database/*.sql` files for complete schema definitions.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ is available
- Set all environment variables
- Run `npm run build` and `npm start`

## 🐛 Troubleshooting

### Common Issues

**Cities not loading:**
- Run `database/romanian-cities.sql` in Supabase
- Check RLS policies on `cities` table

**Authentication errors:**
- Verify Supabase environment variables
- Check RLS policies on `profiles` table
- See `database/scripts/test/fix-profile-rls-simple.sql`

**Business dashboard not accessible:**
- Ensure `owner_user_id` is set on businesses
- Check business portal RLS policies

**Map not displaying:**
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- Check browser console for errors

**Import errors after reorganization:**
- Run `bash scripts/update-imports.sh`
- Or manually update imports (see `REFACTORING.md`)

## 📚 Documentation

- **ARCHITECTURE.md** - Detailed architecture overview
- **REFACTORING.md** - Import path migration guide
- **database/README.md** - Database scripts documentation
- **docs/archive/** - Legacy documentation (archived)

## 🎯 Design Principles

1. **Mobile-First**: Every feature starts mobile, then adapts to desktop
2. **No Mock Data**: All data comes from Supabase
3. **Type Safety**: No `any` types, full TypeScript coverage
4. **Production Ready**: Complete implementations, no placeholders
5. **Performance**: Optimized loading and rendering strategies
6. **Feature-Based**: Organized by domain for scalability

## 📄 License

Private Project

---

**Built with ❤️ for travelers worldwide**
