# 🏗️ TravelPWA Architecture Documentation

## Responsive Shell Architecture

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (Sticky)                      │
│  [Logo]  [Nav Links - Desktop Only]       [Avatar]     │
│  • Glassmorphism backdrop blur                          │
│  • Always visible on all screen sizes                   │
│  • Height: 64px (h-16)                                  │
└─────────────────────────────────────────────────────────┘
│
│  ┌───────────────────────────────────────────────────┐
│  │                                                   │
│  │              MAIN CONTENT AREA                    │
│  │                                                   │
│  │  • Max width: 1280px (centered on large screens) │
│  │  • Padding top: 16px (pt-4)                      │
│  │  • Padding bottom: 96px mobile / 40px desktop    │
│  │  • Padding horizontal: 16px (px-4)               │
│  │  • Background: bg-slate-50                       │
│  │                                                   │
│  │  [Page-specific content renders here]            │
│  │                                                   │
│  └───────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
│                 BOTTOM NAV (Mobile Only)                │
│  [Home] [Explore] [Plan] [Bookings] [Profile]         │
│  • Hidden on desktop (md:hidden)                        │
│  • Glassmorphism backdrop blur                          │
│  • Animated active indicator (Framer Motion)            │
└─────────────────────────────────────────────────────────┘
```

---

## Breakpoint Behavior

### Mobile (< 768px)
```
┌─────────────────┐
│ [Logo]  [Avatar]│  ← Header (simplified)
├─────────────────┤
│                 │
│                 │
│   Page Content  │
│                 │
│                 │
├─────────────────┤
│ [5-Tab Bottom]  │  ← Bottom Navigation
│    Navigation   │
└─────────────────┘
```

### Desktop (>= 768px)
```
┌───────────────────────────────────────────┐
│ [Logo] [Home|Explore|Plan|...] [Avatar]  │  ← Header with nav
├───────────────────────────────────────────┤
│                                           │
│        ┌─────────────────────┐           │
│        │                     │           │
│        │   Page Content      │           │  ← Centered
│        │   (max-width)       │           │
│        │                     │           │
│        └─────────────────────┘           │
│                                           │
└───────────────────────────────────────────┘
  (No bottom navigation)
```

---

## Component Hierarchy

```
RootLayout
├── <html>
│   ├── <body className="antialiased">
│   │   └── <div className="mx-auto w-full max-w-screen-xl">
│   │       │
│   │       ├── <Header />
│   │       │   ├── Logo (always visible)
│   │       │   ├── Desktop Nav Links (hidden md:flex)
│   │       │   └── Avatar (always visible)
│   │       │
│   │       ├── <main className="flex-1 pt-4 pb-24 md:pb-10">
│   │       │   └── {children} → Page Content
│   │       │
│   │       └── <BottomNav />
│   │           └── (block md:hidden)
```

---

## Navigation State Management

### Active State Logic

**Bottom Navigation:**
```typescript
const pathname = usePathname()
const isActive = pathname === item.href

// Visual Indicators:
- Animated gradient background (Framer Motion layoutId)
- Blue icon color (text-blue-600)
- Increased icon stroke width (2.5 vs 2)
- Blue label color
```

**Desktop Navigation:**
```typescript
const pathname = usePathname()
const isActive = pathname === link.href

// Visual Indicators:
- Blue text color
- Blue background (bg-blue-50)
- Bottom border accent (gradient bar)
```

---

## Glassmorphism Implementation

### Header
```css
backdrop-blur-md bg-white/75 border-b border-slate-200/50
```
- Medium blur for subtle effect
- 75% opacity white background
- Subtle border

### Bottom Navigation
```css
backdrop-blur-xl bg-white/85 border-t border-slate-200/50
```
- Extra large blur for premium feel
- 85% opacity white background
- Top border only

---

## Spacing System

### Content Padding

**Mobile:**
- Top: `pt-4` (16px) - Space below header
- Bottom: `pb-24` (96px) - Clear bottom nav
- Horizontal: `px-4` (16px) - Edge margins

**Desktop:**
- Top: `pt-4` (16px) - Consistent
- Bottom: `md:pb-10` (40px) - No bottom nav to clear
- Horizontal: `md:px-6` (24px) - More breathing room

### Touch Targets
- Minimum height: 44px (iOS guideline)
- Bottom nav items: 56px height (min-h-[56px])
- Button height: 48px (h-12)

---

## Animation Strategy

### Framer Motion Usage

**Bottom Navigation Active Indicator:**
```typescript
<motion.div
  layoutId="bottomNavIndicator"
  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10"
  initial={false}
  transition={{
    type: "spring",
    stiffness: 380,
    damping: 30,
  }}
/>
```

**Key Features:**
- `layoutId`: Enables smooth morphing between positions
- `initial={false}`: Prevents animation on first render
- Spring physics: Natural, bouncy feel
- Gradient background: Premium look

### Hover Transitions
```css
transition-colors duration-200
transition-shadow
transition-transform
```
- All transitions: 200ms for snappy feel
- No delays for immediate feedback

---

## Page Architecture

### Route Structure
```
/                    → Home (page.tsx)
/explore            → Explore (explore/page.tsx)
/plan               → Trip Planner (plan/page.tsx)
/bookings           → Bookings (bookings/page.tsx)
/profile            → Profile (profile/page.tsx)
```

### Page Component Pattern
```typescript
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Hero/Header Section */}
      <section>...</section>
      
      {/* Main Content */}
      <section>...</section>
      
      {/* Secondary Content */}
      <section>...</section>
    </div>
  )
}
```

**Spacing:**
- `space-y-6` (24px) between sections
- `space-y-4` (16px) within sections
- Consistent grid gaps: `gap-4`

---

## Color System

### Primary Palette
```typescript
// Gradients (Brand)
from-blue-600 to-purple-600

// Backgrounds
bg-slate-50        // Page background
bg-white           // Card backgrounds
bg-slate-100       // Subtle accents

// Text
text-slate-900     // Headings
text-slate-600     // Body text
text-slate-400     // Muted text

// Interactive
text-blue-600      // Active/links
hover:text-blue-700
```

### State Colors
```typescript
// Success
bg-green-100 text-green-700

// Warning
bg-orange-100 text-orange-600

// Error
bg-red-50 text-red-600

// Info
bg-blue-100 text-blue-700
```

---

## Typography Scale

### Headings
```css
h1: text-3xl md:text-4xl font-bold (48px desktop, 30px mobile)
h2: text-2xl font-bold (24px)
h3: text-lg font-semibold (18px)
```

### Body Text
```css
base: text-base (16px)
small: text-sm (14px)
extra-small: text-xs (12px)
```

### Font Weights
```css
font-bold: 700
font-semibold: 600
font-medium: 500
(default): 400
```

---

## Layout Constraints

### Max Width Strategy
```typescript
// Root container
max-w-screen-xl  // 1280px

// Nested constraints (when needed)
max-w-2xl        // 672px for forms/text-heavy content
max-w-4xl        // 896px for card grids
```

### Responsive Grid Patterns
```css
/* Cards/Items */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Stats/Features */
grid grid-cols-2 md:grid-cols-4

/* Full width on mobile, split on desktop */
grid grid-cols-1 md:grid-cols-2
```

---

## Scroll Behavior

### iOS Optimization
```css
html {
  overscroll-behavior-y: none;
}
```
Prevents rubber-banding (pull-to-refresh) on iOS Safari.

### Scrollbar Hiding
```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```
Used for horizontal scrolling containers (category filters).

---

## Performance Optimizations

### Next.js Features Used
- **App Router**: Server Components by default
- **Font Optimization**: `next/font/google` for Inter
- **Image Optimization**: Ready for `next/image`

### Rendering Strategy
```typescript
// Default: Server Components (all pages currently)
export default function Page() { ... }

// Client Components (navigation)
"use client"
export function BottomNav() { ... }
```

**When to use "use client":**
- Hooks (useState, useEffect, usePathname)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries (Framer Motion)

---

## Accessibility Features

### Semantic HTML
```html
<header>  → Header component
<nav>     → Navigation components
<main>    → Content area
```

### ARIA Patterns
- Touch targets: Minimum 44px
- Focus states: Visible ring on focus
- Color contrast: WCAG AA compliant

### Keyboard Navigation
- Tab order: Logical flow
- Skip links: Can be added for screen readers
- Focus indicators: Built into Tailwind defaults

---

## File Size Estimates

### JavaScript Bundle (Production)
- Next.js Runtime: ~85KB gzipped
- React + React DOM: ~45KB gzipped
- Framer Motion: ~25KB gzipped
- App Code: ~15KB gzipped
- **Total: ~170KB** (estimated)

### CSS Bundle
- Tailwind CSS (purged): ~10KB gzipped

### Initial Load Time (Good 3G)
- First Contentful Paint: < 2s
- Time to Interactive: < 3s

---

## Environment Variables Schema

```env
# Required for Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required for Maps
NEXT_PUBLIC_MAPBOX_TOKEN=

# Required for Production
NEXT_PUBLIC_APP_URL=

# Optional
STRIPE_SECRET_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## Build & Deployment

### Build Command
```bash
npm run build
```

### Output
```
Route (app)              Size     First Load JS
├ ○ /                    142 B  87.2 KB
├ ○ /bookings            142 B  87.2 KB
├ ○ /explore             142 B  87.2 KB
├ ○ /plan                142 B  87.2 KB
└ ○ /profile             142 B  87.2 KB

○  (Static)  prerendered as static content
```

### Hosting Recommendations
- **Vercel**: Zero-config deployment
- **Netlify**: Easy setup with Next.js plugin
- **AWS Amplify**: Full-stack integration
- **Railway/Render**: Container-based

---

## Testing Strategy (To Implement)

### Unit Tests
- Component rendering
- Utility functions
- Navigation logic

### Integration Tests
- User flows (navigation)
- Form submissions
- API interactions

### E2E Tests
- Critical user journeys
- Cross-browser testing
- Mobile device testing

---

## Monitoring & Analytics (To Add)

### Performance
- Web Vitals (CLS, FID, LCP)
- Bundle size tracking
- API response times

### User Analytics
- Page views
- User flows
- Conversion tracking

### Error Tracking
- Sentry/Bugsnag integration
- Console error logging
- Failed API calls

---

**📐 This architecture provides a solid, scalable foundation for your travel PWA.**



## Responsive Shell Architecture

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (Sticky)                      │
│  [Logo]  [Nav Links - Desktop Only]       [Avatar]     │
│  • Glassmorphism backdrop blur                          │
│  • Always visible on all screen sizes                   │
│  • Height: 64px (h-16)                                  │
└─────────────────────────────────────────────────────────┘
│
│  ┌───────────────────────────────────────────────────┐
│  │                                                   │
│  │              MAIN CONTENT AREA                    │
│  │                                                   │
│  │  • Max width: 1280px (centered on large screens) │
│  │  • Padding top: 16px (pt-4)                      │
│  │  • Padding bottom: 96px mobile / 40px desktop    │
│  │  • Padding horizontal: 16px (px-4)               │
│  │  • Background: bg-slate-50                       │
│  │                                                   │
│  │  [Page-specific content renders here]            │
│  │                                                   │
│  └───────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
│                 BOTTOM NAV (Mobile Only)                │
│  [Home] [Explore] [Plan] [Bookings] [Profile]         │
│  • Hidden on desktop (md:hidden)                        │
│  • Glassmorphism backdrop blur                          │
│  • Animated active indicator (Framer Motion)            │
└─────────────────────────────────────────────────────────┘
```

---

## Breakpoint Behavior

### Mobile (< 768px)
```
┌─────────────────┐
│ [Logo]  [Avatar]│  ← Header (simplified)
├─────────────────┤
│                 │
│                 │
│   Page Content  │
│                 │
│                 │
├─────────────────┤
│ [5-Tab Bottom]  │  ← Bottom Navigation
│    Navigation   │
└─────────────────┘
```

### Desktop (>= 768px)
```
┌───────────────────────────────────────────┐
│ [Logo] [Home|Explore|Plan|...] [Avatar]  │  ← Header with nav
├───────────────────────────────────────────┤
│                                           │
│        ┌─────────────────────┐           │
│        │                     │           │
│        │   Page Content      │           │  ← Centered
│        │   (max-width)       │           │
│        │                     │           │
│        └─────────────────────┘           │
│                                           │
└───────────────────────────────────────────┘
  (No bottom navigation)
```

---

## Component Hierarchy

```
RootLayout
├── <html>
│   ├── <body className="antialiased">
│   │   └── <div className="mx-auto w-full max-w-screen-xl">
│   │       │
│   │       ├── <Header />
│   │       │   ├── Logo (always visible)
│   │       │   ├── Desktop Nav Links (hidden md:flex)
│   │       │   └── Avatar (always visible)
│   │       │
│   │       ├── <main className="flex-1 pt-4 pb-24 md:pb-10">
│   │       │   └── {children} → Page Content
│   │       │
│   │       └── <BottomNav />
│   │           └── (block md:hidden)
```

---

## Navigation State Management

### Active State Logic

**Bottom Navigation:**
```typescript
const pathname = usePathname()
const isActive = pathname === item.href

// Visual Indicators:
- Animated gradient background (Framer Motion layoutId)
- Blue icon color (text-blue-600)
- Increased icon stroke width (2.5 vs 2)
- Blue label color
```

**Desktop Navigation:**
```typescript
const pathname = usePathname()
const isActive = pathname === link.href

// Visual Indicators:
- Blue text color
- Blue background (bg-blue-50)
- Bottom border accent (gradient bar)
```

---

## Glassmorphism Implementation

### Header
```css
backdrop-blur-md bg-white/75 border-b border-slate-200/50
```
- Medium blur for subtle effect
- 75% opacity white background
- Subtle border

### Bottom Navigation
```css
backdrop-blur-xl bg-white/85 border-t border-slate-200/50
```
- Extra large blur for premium feel
- 85% opacity white background
- Top border only

---

## Spacing System

### Content Padding

**Mobile:**
- Top: `pt-4` (16px) - Space below header
- Bottom: `pb-24` (96px) - Clear bottom nav
- Horizontal: `px-4` (16px) - Edge margins

**Desktop:**
- Top: `pt-4` (16px) - Consistent
- Bottom: `md:pb-10` (40px) - No bottom nav to clear
- Horizontal: `md:px-6` (24px) - More breathing room

### Touch Targets
- Minimum height: 44px (iOS guideline)
- Bottom nav items: 56px height (min-h-[56px])
- Button height: 48px (h-12)

---

## Animation Strategy

### Framer Motion Usage

**Bottom Navigation Active Indicator:**
```typescript
<motion.div
  layoutId="bottomNavIndicator"
  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10"
  initial={false}
  transition={{
    type: "spring",
    stiffness: 380,
    damping: 30,
  }}
/>
```

**Key Features:**
- `layoutId`: Enables smooth morphing between positions
- `initial={false}`: Prevents animation on first render
- Spring physics: Natural, bouncy feel
- Gradient background: Premium look

### Hover Transitions
```css
transition-colors duration-200
transition-shadow
transition-transform
```
- All transitions: 200ms for snappy feel
- No delays for immediate feedback

---

## Page Architecture

### Route Structure
```
/                    → Home (page.tsx)
/explore            → Explore (explore/page.tsx)
/plan               → Trip Planner (plan/page.tsx)
/bookings           → Bookings (bookings/page.tsx)
/profile            → Profile (profile/page.tsx)
```

### Page Component Pattern
```typescript
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Hero/Header Section */}
      <section>...</section>
      
      {/* Main Content */}
      <section>...</section>
      
      {/* Secondary Content */}
      <section>...</section>
    </div>
  )
}
```

**Spacing:**
- `space-y-6` (24px) between sections
- `space-y-4` (16px) within sections
- Consistent grid gaps: `gap-4`

---

## Color System

### Primary Palette
```typescript
// Gradients (Brand)
from-blue-600 to-purple-600

// Backgrounds
bg-slate-50        // Page background
bg-white           // Card backgrounds
bg-slate-100       // Subtle accents

// Text
text-slate-900     // Headings
text-slate-600     // Body text
text-slate-400     // Muted text

// Interactive
text-blue-600      // Active/links
hover:text-blue-700
```

### State Colors
```typescript
// Success
bg-green-100 text-green-700

// Warning
bg-orange-100 text-orange-600

// Error
bg-red-50 text-red-600

// Info
bg-blue-100 text-blue-700
```

---

## Typography Scale

### Headings
```css
h1: text-3xl md:text-4xl font-bold (48px desktop, 30px mobile)
h2: text-2xl font-bold (24px)
h3: text-lg font-semibold (18px)
```

### Body Text
```css
base: text-base (16px)
small: text-sm (14px)
extra-small: text-xs (12px)
```

### Font Weights
```css
font-bold: 700
font-semibold: 600
font-medium: 500
(default): 400
```

---

## Layout Constraints

### Max Width Strategy
```typescript
// Root container
max-w-screen-xl  // 1280px

// Nested constraints (when needed)
max-w-2xl        // 672px for forms/text-heavy content
max-w-4xl        // 896px for card grids
```

### Responsive Grid Patterns
```css
/* Cards/Items */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Stats/Features */
grid grid-cols-2 md:grid-cols-4

/* Full width on mobile, split on desktop */
grid grid-cols-1 md:grid-cols-2
```

---

## Scroll Behavior

### iOS Optimization
```css
html {
  overscroll-behavior-y: none;
}
```
Prevents rubber-banding (pull-to-refresh) on iOS Safari.

### Scrollbar Hiding
```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```
Used for horizontal scrolling containers (category filters).

---

## Performance Optimizations

### Next.js Features Used
- **App Router**: Server Components by default
- **Font Optimization**: `next/font/google` for Inter
- **Image Optimization**: Ready for `next/image`

### Rendering Strategy
```typescript
// Default: Server Components (all pages currently)
export default function Page() { ... }

// Client Components (navigation)
"use client"
export function BottomNav() { ... }
```

**When to use "use client":**
- Hooks (useState, useEffect, usePathname)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries (Framer Motion)

---

## Accessibility Features

### Semantic HTML
```html
<header>  → Header component
<nav>     → Navigation components
<main>    → Content area
```

### ARIA Patterns
- Touch targets: Minimum 44px
- Focus states: Visible ring on focus
- Color contrast: WCAG AA compliant

### Keyboard Navigation
- Tab order: Logical flow
- Skip links: Can be added for screen readers
- Focus indicators: Built into Tailwind defaults

---

## File Size Estimates

### JavaScript Bundle (Production)
- Next.js Runtime: ~85KB gzipped
- React + React DOM: ~45KB gzipped
- Framer Motion: ~25KB gzipped
- App Code: ~15KB gzipped
- **Total: ~170KB** (estimated)

### CSS Bundle
- Tailwind CSS (purged): ~10KB gzipped

### Initial Load Time (Good 3G)
- First Contentful Paint: < 2s
- Time to Interactive: < 3s

---

## Environment Variables Schema

```env
# Required for Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required for Maps
NEXT_PUBLIC_MAPBOX_TOKEN=

# Required for Production
NEXT_PUBLIC_APP_URL=

# Optional
STRIPE_SECRET_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## Build & Deployment

### Build Command
```bash
npm run build
```

### Output
```
Route (app)              Size     First Load JS
├ ○ /                    142 B  87.2 KB
├ ○ /bookings            142 B  87.2 KB
├ ○ /explore             142 B  87.2 KB
├ ○ /plan                142 B  87.2 KB
└ ○ /profile             142 B  87.2 KB

○  (Static)  prerendered as static content
```

### Hosting Recommendations
- **Vercel**: Zero-config deployment
- **Netlify**: Easy setup with Next.js plugin
- **AWS Amplify**: Full-stack integration
- **Railway/Render**: Container-based

---

## Testing Strategy (To Implement)

### Unit Tests
- Component rendering
- Utility functions
- Navigation logic

### Integration Tests
- User flows (navigation)
- Form submissions
- API interactions

### E2E Tests
- Critical user journeys
- Cross-browser testing
- Mobile device testing

---

## Monitoring & Analytics (To Add)

### Performance
- Web Vitals (CLS, FID, LCP)
- Bundle size tracking
- API response times

### User Analytics
- Page views
- User flows
- Conversion tracking

### Error Tracking
- Sentry/Bugsnag integration
- Console error logging
- Failed API calls

---

**📐 This architecture provides a solid, scalable foundation for your travel PWA.**

