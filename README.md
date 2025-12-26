# TravelPWA - Mobile-First Travel Platform

A premium, responsive Progressive Web App (PWA) built with Next.js 14+, designed for seamless travel planning and booking experiences across all devices.

## 🚀 Features

### Responsive Design
- **Mobile-First Approach**: Optimized for mobile devices with touch-friendly interactions
- **Desktop Adaptation**: Gracefully scales to desktop screens with centered content (max-width: 1280px)
- **Hybrid Navigation**: 
  - Bottom navigation bar on mobile devices
  - Top navigation bar integrated in header on desktop
  
### Premium UI/UX
- **Glassmorphism Effects**: Modern backdrop-blur effects on navigation components
- **Smooth Animations**: Framer Motion powered transitions and active state indicators
- **Typography**: Inter font family with antialiased rendering
- **iOS Optimization**: Prevents rubber-banding scroll behavior

### Architecture
- **Clean Folder Structure**: Modular organization for scalability
- **Type Safety**: Full TypeScript with strict mode
- **Shadcn/UI**: Beautiful, accessible Radix UI primitives
- **Tailwind CSS**: Utility-first styling with custom design system

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (Radix primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL) - Ready to integrate
- **State Management**: Zustand - Ready to integrate
- **Maps**: MapLibre GL JS + react-map-gl - Ready to integrate
- **Forms**: React Hook Form + Zod - Ready to integrate

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

3. **Open Your Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
/app                 # Next.js App Router (Routes only)
  /explore           # Explore destinations page
  /plan              # Trip planner page
  /bookings          # Bookings management page
  /profile           # User profile page
  layout.tsx         # Root layout with navigation
  page.tsx           # Home page
  globals.css        # Global styles and utilities

/components
  /ui                # Atomic Shadcn components
    button.tsx
    avatar.tsx
  /shared            # Reusable global components
    header.tsx       # Hybrid header (mobile/desktop)
    bottom-nav.tsx   # Mobile-only bottom navigation

/lib
  utils.ts           # Helper functions (cn utility)

/services            # Database interaction logic (to be added)
/types               # TypeScript types and interfaces (to be added)
/store               # Zustand stores (to be added)
/hooks               # Custom React hooks (to be added)
```

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

## 🔧 Configuration

### Font Configuration
Inter font is configured in `app/layout.tsx` with optimal loading strategy.

### Tailwind Utilities
Custom utilities available:
- `.no-scrollbar` - Hides scrollbars
- `.glass` - Glassmorphism effect
- `.glass-dark` - Dark variant of glassmorphism

### iOS Optimization
`overscroll-behavior-y: none` prevents rubber-banding on iOS Safari.

## 🚧 Next Steps

### Immediate Integrations Needed
1. **Supabase Setup**: Configure database connection and types
2. **Authentication**: Implement user auth flow
3. **Real Data**: Replace placeholder content with Supabase queries
4. **Business Logic**: Add service layers for data operations
5. **State Management**: Implement Zustand stores
6. **Forms**: Add React Hook Form + Zod validation
7. **Maps Integration**: Implement MapLibre for location features

### Feature Development
- Search and filtering functionality
- Trip planning and itinerary builder
- Booking flow and payment integration
- User profile management
- Reviews and ratings system
- Real-time updates and notifications

## 📱 PWA Features (To Be Added)

- Service Worker for offline support
- App manifest configuration
- Push notifications
- Install prompts
- Offline data caching

## 🎯 Design Principles

1. **Mobile-First**: Every feature starts mobile, then adapts to desktop
2. **No Mock Data**: All data comes from Supabase (ready for integration)
3. **Type Safety**: No `any` types, full TypeScript coverage
4. **Production Ready**: No placeholders, complete implementations
5. **Performance**: Optimized loading and rendering strategies

## 📄 License

Private Project

## 🤝 Contributing

This is a private project. Contribution guidelines to be defined.

---

**Built with ❤️ for travelers worldwide**



A premium, responsive Progressive Web App (PWA) built with Next.js 14+, designed for seamless travel planning and booking experiences across all devices.

## 🚀 Features

### Responsive Design
- **Mobile-First Approach**: Optimized for mobile devices with touch-friendly interactions
- **Desktop Adaptation**: Gracefully scales to desktop screens with centered content (max-width: 1280px)
- **Hybrid Navigation**: 
  - Bottom navigation bar on mobile devices
  - Top navigation bar integrated in header on desktop
  
### Premium UI/UX
- **Glassmorphism Effects**: Modern backdrop-blur effects on navigation components
- **Smooth Animations**: Framer Motion powered transitions and active state indicators
- **Typography**: Inter font family with antialiased rendering
- **iOS Optimization**: Prevents rubber-banding scroll behavior

### Architecture
- **Clean Folder Structure**: Modular organization for scalability
- **Type Safety**: Full TypeScript with strict mode
- **Shadcn/UI**: Beautiful, accessible Radix UI primitives
- **Tailwind CSS**: Utility-first styling with custom design system

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (Radix primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL) - Ready to integrate
- **State Management**: Zustand - Ready to integrate
- **Maps**: MapLibre GL JS + react-map-gl - Ready to integrate
- **Forms**: React Hook Form + Zod - Ready to integrate

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

3. **Open Your Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
/app                 # Next.js App Router (Routes only)
  /explore           # Explore destinations page
  /plan              # Trip planner page
  /bookings          # Bookings management page
  /profile           # User profile page
  layout.tsx         # Root layout with navigation
  page.tsx           # Home page
  globals.css        # Global styles and utilities

/components
  /ui                # Atomic Shadcn components
    button.tsx
    avatar.tsx
  /shared            # Reusable global components
    header.tsx       # Hybrid header (mobile/desktop)
    bottom-nav.tsx   # Mobile-only bottom navigation

/lib
  utils.ts           # Helper functions (cn utility)

/services            # Database interaction logic (to be added)
/types               # TypeScript types and interfaces (to be added)
/store               # Zustand stores (to be added)
/hooks               # Custom React hooks (to be added)
```

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

## 🔧 Configuration

### Font Configuration
Inter font is configured in `app/layout.tsx` with optimal loading strategy.

### Tailwind Utilities
Custom utilities available:
- `.no-scrollbar` - Hides scrollbars
- `.glass` - Glassmorphism effect
- `.glass-dark` - Dark variant of glassmorphism

### iOS Optimization
`overscroll-behavior-y: none` prevents rubber-banding on iOS Safari.

## 🚧 Next Steps

### Immediate Integrations Needed
1. **Supabase Setup**: Configure database connection and types
2. **Authentication**: Implement user auth flow
3. **Real Data**: Replace placeholder content with Supabase queries
4. **Business Logic**: Add service layers for data operations
5. **State Management**: Implement Zustand stores
6. **Forms**: Add React Hook Form + Zod validation
7. **Maps Integration**: Implement MapLibre for location features

### Feature Development
- Search and filtering functionality
- Trip planning and itinerary builder
- Booking flow and payment integration
- User profile management
- Reviews and ratings system
- Real-time updates and notifications

## 📱 PWA Features (To Be Added)

- Service Worker for offline support
- App manifest configuration
- Push notifications
- Install prompts
- Offline data caching

## 🎯 Design Principles

1. **Mobile-First**: Every feature starts mobile, then adapts to desktop
2. **No Mock Data**: All data comes from Supabase (ready for integration)
3. **Type Safety**: No `any` types, full TypeScript coverage
4. **Production Ready**: No placeholders, complete implementations
5. **Performance**: Optimized loading and rendering strategies

## 📄 License

Private Project

## 🤝 Contributing

This is a private project. Contribution guidelines to be defined.

---

**Built with ❤️ for travelers worldwide**

