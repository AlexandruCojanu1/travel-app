# MOVA - Mobile-First Travel Platform

A premium, responsive Progressive Web App (PWA) built with Next.js 14+, designed for seamless travel planning and booking experiences across all devices.

## 🚀 Features

### Core Functionality
- **Authentication & Onboarding**: Complete user registration, login, and onboarding flow
- **Business Portal**: Full-featured business management dashboard with polymorphic onboarding
- **Travel Planning**: Interactive trip planner with itinerary builder
- **Booking System**: Complete booking flow with Stripe payment integration
- **Map Integration**: Interactive maps with business locations and public transport (GTFS)
- **Feed System**: City-based content feed with posts, promotions, and featured businesses

### Design System
- **MOVA Brand Design**: Clean, modern UI with vibrant blue primary color (#3B82F6) from logo gradient
- **Mobile-First**: Optimized for mobile devices with touch-friendly interactions
- **Responsive**: Gracefully scales to desktop screens
- **Hybrid Navigation**: Bottom nav on mobile, top nav on desktop

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Mobile-First) with Airbnb design tokens
- **Components**: Shadcn/UI (Radix primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Maps**: MapLibre GL JS + react-map-gl (free, open-source with CartoDB Voyager style)
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
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**Note:** The map uses **MapLibre GL JS** (free, open-source) with **CartoDB Voyager** style (free). No Mapbox token is required.

3. **Database Setup**
Run the SQL scripts in `database/` folder in your Supabase SQL Editor:
- `romanian-cities.sql` - Populate cities table
- `extend-business-schema.sql` - Business schema extensions
- `add-promotion-fields.sql` - Promotions table updates

4. **Run Development Server**
```bash
npm run dev
```

5. **Open Your Browser**
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
  /features               # Feature-based components (auth, business, booking, trip, feed, map, etc.)
  /shared                 # Shared global components & UI primitives

/actions                  # Next.js Server Actions (by domain)
/services                 # Business logic layer (by domain)
/store                    # Zustand state management
/lib                      # Core libraries & utilities
/types                    # TypeScript types
/database                 # SQL scripts
```

## 🎨 Design System

### Colors (MOVA Brand)
- **Primary Blue**: `#3B82F6` (mova-blue) - Vibrant blue from logo
- **Teal**: `#14B8A6` (mova-teal) - Teal from logo gradient
- **Green**: `#10B981` (mova-green) - Green from logo gradient
- **Orange**: `#F97316` (mova-orange) - Orange from logo gradient
- **Dark Text**: `#1E293B` (mova-dark)
- **Gray Text**: `#64748B` (mova-gray)
- **Light Background**: `#F1F5F9` (mova-light-gray)

### Border Radius
- **Default**: `12px` (rounded-airbnb)
- **Large**: `16px` (rounded-airbnb-lg)

### Shadows
- **Default**: `shadow-airbnb` - Subtle shadow for cards
- **Hover**: `shadow-airbnb-hover` - Enhanced shadow on hover
- **Medium**: `shadow-airbnb-md` - Medium shadow
- **Large**: `shadow-airbnb-lg` - Large shadow

### Utilities
- `.airbnb-card` - Card styling with rounded corners and shadow
- `.airbnb-button` - Primary button with Airbnb red background

## 🏗️ Architecture

Feature-based architecture with clear separation:
- **Features**: Self-contained modules (auth, business, booking, trip, feed, map)
- **Shared**: Reusable components and utilities
- **Core**: Configuration, types, and infrastructure

See `ARCHITECTURE.md` for detailed architecture documentation.

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

**Cities not loading:**
- Run `database/romanian-cities.sql` in Supabase
- Check RLS policies on `cities` table

**Authentication errors:**
- Verify Supabase environment variables
- Check RLS policies on `profiles` table

**Business dashboard not accessible:**
- Ensure `owner_user_id` is set on businesses
- Check business portal RLS policies

**Map not displaying:**
- Check browser console for errors
- Verify network connectivity (map tiles are loaded from CartoDB CDN)
- Map uses free MapLibre GL JS - no token required

## 📚 Additional Documentation

- **ARCHITECTURE.md** - Detailed architecture overview
- **database/README.md** - Database scripts documentation
- **services/README.md** - Services documentation

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
