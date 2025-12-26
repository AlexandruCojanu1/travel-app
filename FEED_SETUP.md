# 🏠 Home Feed & Discovery UI

## Complete Implementation Guide

Your TravelPWA now has a **premium, data-driven Home Feed** with engaging UI components and real-time data from Supabase.

---

## 📋 Features Implemented

### ✅ Data Layer (Services)
- **Feed Service** (`services/feed.service.ts`)
  - `getHomeContext()` - Fetches user's home city
  - `getCityFeed()` - Fetches posts, businesses, and promotions
  - `getBusinessById()` - Fetches single business details
  - Full TypeScript type safety

### ✅ Premium UI Components
1. **QuickFilters** - Horizontal scrolling category pills
2. **FeaturedCarousel** - Horizontal scroll with CSS snap and gradient overlays
3. **NewsCard** - Clean card layout for city posts
4. **FeedSkeleton** - Loading state placeholder

### ✅ Home Page Features
- Dynamic greeting based on time of day
- Current date and city name header
- Filterable content by category
- Empty state handling
- Error state with retry
- Loading states with skeletons
- Responsive design (mobile-first)

---

## 🗄️ Database Schema

### Tables Created

#### 1. `businesses`
Stores places, hotels, restaurants, activities.

```sql
{
  id: UUID
  city_id: UUID (FK → cities)
  name: string
  description: string | null
  category: string (Hotels, Food, Nature, Activities)
  address: string | null
  latitude: decimal | null
  longitude: decimal | null
  image_url: string | null
  rating: decimal(2,1) | null (0-5)
  is_verified: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes:**
- `city_id` - Fast city filtering
- `category` - Category filtering
- `rating DESC` - Top-rated sorting
- `is_verified` - Verified businesses

#### 2. `city_posts`
Stores news, events, and blog posts.

```sql
{
  id: UUID
  city_id: UUID (FK → cities)
  author_id: UUID (FK → auth.users)
  title: string
  content: string
  excerpt: string | null
  image_url: string | null
  category: string | null
  is_published: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes:**
- `city_id` - Fast city filtering
- `author_id` - Author's posts
- `is_published` - Published filter
- `created_at DESC` - Chronological sorting
- `category` - Category filtering

#### 3. `promotions`
Stores active deals and promotions.

```sql
{
  id: UUID
  business_id: UUID (FK → businesses)
  title: string
  description: string | null
  discount_percentage: integer (1-100)
  is_active: boolean
  valid_from: timestamp
  valid_until: timestamp
  created_at: timestamp
}
```

**Indexes:**
- `business_id` - Business promotions
- `is_active` - Active promotions
- `valid_from, valid_until` - Date range queries

---

## 🚀 Setup Instructions

### Step 1: Create Database Tables

Run the SQL schema in Supabase SQL Editor:

```bash
# File location
/database/feed-schema.sql
```

**What it does:**
1. Creates `businesses`, `city_posts`, and `promotions` tables
2. Sets up indexes for performance
3. Creates Row Level Security (RLS) policies
4. Inserts sample data for testing
5. Creates triggers for `updated_at` columns

**To execute:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `feed-schema.sql`
4. Click "Run"
5. Verify tables are created in Table Editor

### Step 2: Verify Sample Data

Check that sample data was inserted:

```sql
-- Check businesses
SELECT COUNT(*) FROM businesses;

-- Check city posts
SELECT COUNT(*) FROM city_posts;

-- Check promotions
SELECT COUNT(*) FROM promotions;
```

You should see:
- **Businesses**: 10+ entries
- **City Posts**: 4+ entries
- **Promotions**: 2+ entries

### Step 3: Test the Feed

1. **Start dev server:**
```bash
npm run dev
```

2. **Login with your account** (must have completed onboarding)

3. **Navigate to Home** (`/home`)

4. **You should see:**
   - Current date and city name
   - "Good Morning/Afternoon/Evening" greeting
   - Quick filter pills
   - Featured carousel with businesses
   - News/events list
   - Promotions (if active)

---

## 🎨 UI Component Details

### 1. QuickFilters Component

**Location**: `components/feed/quick-filters.tsx`

**Features:**
- Horizontal scrolling with CSS snap
- Active state with animated indicator (Framer Motion)
- Categories: All, Hotels, Food, Nature, Activities
- Dark active state (`bg-slate-900`)
- Light inactive state (`bg-slate-100`)

**Usage:**
```tsx
<QuickFilters
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>
```

**Visual Design:**
```
┌──────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│  All │ │  Hotels │ │  Food  │ │ Nature │ │ Activities │
└──────┘ └─────────┘ └────────┘ └────────┘ └────────────┘
  ↑ Active (dark bg with icon)
```

---

### 2. FeaturedCarousel Component

**Location**: `components/feed/featured-carousel.tsx`

**Features:**
- **Horizontal scroll**: CSS `snap-x snap-mandatory`
- **Large cards**: 85vw on mobile, 400px on desktop
- **Height**: 280px mobile, 320px desktop
- **Gradient overlay**: `from-black/80 via-black/20 to-transparent`
- **Content readability**: White text with drop shadow
- **Verified badge**: Blue badge for verified businesses
- **Featured badge**: Gold badge for first item
- **Hover effects**: Image scales 105%, ring appears

**Critical CSS (Gradient Overlay):**
```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
```

This ensures text is always readable over any background image!

**Card Layout:**
```
┌─────────────────────────────────────┐
│                                     │ ← Image (object-cover)
│                                     │
│         🏆 Featured     ✓ Verified  │ ← Badges (top)
│                                     │
│                                     │ ← Gradient starts here
│  ┌─────────┐                       │
│  │ Category │                      │
│  └─────────┘                       │
│  Business Name                      │
│  ⭐ 4.8  📍 Address                 │ ← White text on gradient
│  Description...                     │
└─────────────────────────────────────┘
```

---

### 3. NewsCard Component

**Location**: `components/feed/news-card.tsx`

**Features:**
- Horizontal layout: Image left, content right
- Square image: 96px × 96px
- Category badge
- Title (2-line clamp)
- Excerpt (2-line clamp)
- Time ago (using `date-fns`)
- Hover effects: Shadow elevation, title color change

**Layout:**
```
┌────────────────────────────────────┐
│ ┌──────┐  ┌──────────┐            │
│ │      │  │ Category │            │
│ │ IMG  │  ├──────────┤            │
│ │      │  │ Title Text Here...    │
│ │      │  │ Excerpt text here...  │
│ └──────┘  │ 📅 2 hours ago        │
│           └──────────────────────-─┘
└────────────────────────────────────┘
```

---

### 4. FeedSkeleton Component

**Location**: `components/feed/feed-skeleton.tsx`

**Purpose:** Loading placeholder while data fetches

**What it shows:**
- 5 filter pill skeletons
- 3 carousel card skeletons
- 4 news card skeletons

**Usage:**
```tsx
{isLoading ? (
  <FeedSkeleton />
) : (
  <ActualContent />
)}
```

---

## 📊 Data Flow Architecture

### Component Hierarchy

```
HomePage (Client Component)
├── useEffect → Fetch data on mount
├── Loading State → FeedSkeleton
├── Error State → Error message + Retry
└── Success State
    ├── Header (Date + City Name)
    ├── Hero Section (Greeting)
    ├── QuickFilters
    ├── Featured Section
    │   └── FeaturedCarousel
    ├── News Section
    │   └── NewsCard (multiple)
    └── Promotions Section (if available)
```

### Data Fetching Flow

```
1. User loads /home
   ↓
2. useEffect runs
   ↓
3. Check auth (redirect if not logged in)
   ↓
4. getHomeContext(userId)
   • Fetch profile.home_city_id
   • Fetch city details
   ↓
5. Check if onboarding complete
   • If no home_city_id → redirect to /onboarding
   ↓
6. getCityFeed(cityId, filter)
   • Fetch city_posts (news/events)
   • Fetch businesses (top rated)
   • Fetch promotions (active)
   ↓
7. Render UI with data
```

### Service Layer (Separation of Concerns)

```typescript
// services/feed.service.ts

getHomeContext(userId)
  → Returns: { userId, homeCity, homeCityId }

getCityFeed(cityId, categoryFilter?)
  → Returns: { cityPosts[], featuredBusinesses[], promotions[] }

getBusinessById(businessId)
  → Returns: Business | null
```

**Why separate services?**
- ✅ Reusable across components
- ✅ Testable in isolation
- ✅ Centralized data fetching logic
- ✅ Type-safe with database types

---

## 🎯 Filter Logic

### How Filtering Works

1. **User clicks filter pill** (e.g., "Hotels")
2. **State updates:** `setActiveFilter("Hotels")`
3. **useEffect triggers** (depends on `activeFilter`)
4. **Service refetches:** `getCityFeed(cityId, "Hotels")`
5. **UI updates** with filtered results

### Filter Options

| Filter | Matches |
|--------|---------|
| All | All categories |
| Hotels | `category = "Hotels"` |
| Food | `category = "Food"` |
| Nature | `category = "Nature"` |
| Activities | `category = "Activities"` |

**Database Query Example:**
```typescript
// Without filter (All)
.from('businesses')
.eq('city_id', cityId)

// With filter (Hotels)
.from('businesses')
.eq('city_id', cityId)
.eq('category', 'Hotels')
```

---

## 🎨 CSS Techniques Used

### 1. Horizontal Scroll with Snap

```css
.container {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.card {
  flex: none;
  scroll-snap-align: center;
}
```

**Result:** Cards snap into place as you scroll!

### 2. Hide Scrollbar (`.no-scrollbar`)

```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Result:** Clean UI without visible scrollbars

### 3. Gradient Overlay for Text Readability

```css
.image-container {
  position: relative;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8),
    rgba(0, 0, 0, 0.2),
    transparent
  );
}

.text-content {
  position: absolute;
  bottom: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

**Result:** Text is always readable over any image!

### 4. Object Cover for Images

```tsx
<Image
  src={imageUrl}
  fill
  className="object-cover"
/>
```

**Result:** Images fill container without distortion

---

## 🚦 State Management

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(true)

// Show skeleton
{isLoading && <FeedSkeleton />}
```

### Error States

```typescript
const [error, setError] = useState<string | null>(null)

// Show error message + retry button
{error && (
  <ErrorMessage 
    message={error}
    onRetry={() => window.location.reload()}
  />
)}
```

### Empty States

```typescript
{feedData.cityPosts.length === 0 && (
  <EmptyState
    icon={Calendar}
    title="No news yet"
    description="Be the first to share"
    action="Create Post"
  />
)}
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Full-width carousel cards (85vw)
- Vertical stacking
- Touch-friendly scroll
- Bottom navigation visible

### Desktop (≥ 768px)
- Fixed-width carousel cards (400px)
- Horizontal layouts
- Mouse wheel scroll
- Top navigation visible

### Breakpoint Strategy

```tsx
// Mobile-first approach
className="w-[85vw] md:w-[400px]"
           ↑ mobile   ↑ desktop

// Hide on mobile, show on desktop
className="hidden md:block"

// Show on mobile, hide on desktop
className="block md:hidden"
```

---

## 🔍 Sample Data Included

### New York City
**Businesses:**
- The Plaza Hotel (Hotels, 4.7⭐, Verified)
- Central Park (Nature, 4.9⭐, Verified)
- Katz's Delicatessen (Food, 4.5⭐, Verified)
- MoMA (Activities, 4.8⭐, Verified)
- Brooklyn Bridge Park (Nature, 4.6⭐)

**Posts:**
- Summer Street Festivals
- Restaurant Week Deals
- Free Concert Series

**Promotions:**
- The Plaza Hotel: 20% off (30 days)
- Katz's Deli: 15% off lunch (60 days)

### Los Angeles
**Businesses:**
- Griffith Observatory (4.8⭐)
- Santa Monica Pier (4.5⭐)
- Beverly Hills Hotel (4.6⭐)

**Posts:**
- Beach Clean-Up Day

### London
**Businesses:**
- The Shard (4.7⭐)
- Borough Market (4.6⭐)

**Posts:**
- British Museum Exhibition

---

## 🐛 Troubleshooting

### Issue: No data appearing

**Possible causes:**
1. User hasn't selected home city (onboarding incomplete)
2. No data in database for that city
3. RLS policies blocking access

**Solution:**
```sql
-- Check if user has home_city_id
SELECT home_city_id FROM profiles WHERE id = 'user-id';

-- Check if businesses exist for city
SELECT * FROM businesses WHERE city_id = 'city-id';

-- Check RLS policies
SELECT * FROM businesses; -- Should work if logged in
```

### Issue: Images not loading

**Possible causes:**
1. Invalid image URLs
2. CORS issues
3. Image URLs are null

**Solution:**
```typescript
// Fallback gradient if no image
{business.image_url ? (
  <Image src={business.image_url} />
) : (
  <div className="bg-gradient-to-br from-blue-500 to-purple-600" />
)}
```

### Issue: Filter not working

**Check:**
1. `activeFilter` state updating correctly
2. `useEffect` dependency array includes `activeFilter`
3. Service passing filter parameter to Supabase

**Debug:**
```typescript
useEffect(() => {
  console.log('Filter changed:', activeFilter)
  // ... fetch logic
}, [activeFilter]) // ← Must include dependency
```

### Issue: Skeleton showing forever

**Possible causes:**
1. API call failing silently
2. `setIsLoading(false)` not called
3. Network error

**Solution:**
```typescript
try {
  // ... fetch logic
} catch (error) {
  console.error('Feed error:', error)
  setError(error.message)
} finally {
  setIsLoading(false) // ← Always called
}
```

---

## 📈 Performance Optimizations

### 1. Limit Query Results
```typescript
.limit(10) // Only fetch what's needed
```

### 2. Index Usage
All queries use indexed columns:
- `city_id` (indexed)
- `is_published` (indexed)
- `rating DESC` (indexed)

### 3. Image Optimization
```tsx
<Image
  src={imageUrl}
  fill
  sizes="(max-width: 768px) 85vw, 400px"
  // ↑ Loads appropriate image size
/>
```

### 4. Skeleton Loading
Users see content structure immediately, reducing perceived load time.

---

## 🎯 Next Steps

### Immediate Enhancements
- [ ] Add infinite scroll for news
- [ ] Implement "View All" pages
- [ ] Add like/save functionality
- [ ] Enable post creation
- [ ] Add image upload for businesses

### User Experience
- [ ] Pull-to-refresh on mobile
- [ ] Optimistic UI updates
- [ ] Offline support (PWA)
- [ ] Share functionality

### Analytics
- [ ] Track which businesses get clicked
- [ ] Monitor filter usage
- [ ] Measure scroll depth
- [ ] A/B test carousel vs grid

---

## 📚 File Structure

```
services/
└── feed.service.ts           # Data fetching logic

components/
└── feed/
    ├── quick-filters.tsx     # Category filter pills
    ├── featured-carousel.tsx # Horizontal business cards
    ├── news-card.tsx         # City post cards
    └── feed-skeleton.tsx     # Loading placeholder

app/
└── home/
    └── page.tsx              # Main feed page

database/
└── feed-schema.sql           # Database setup

types/
└── database.types.ts         # TypeScript types (extended)
```

---

**🎉 Your Home Feed is production-ready!**

Users can now discover businesses, read news, and find promotions in their city with a beautiful, performant UI.



## Complete Implementation Guide

Your TravelPWA now has a **premium, data-driven Home Feed** with engaging UI components and real-time data from Supabase.

---

## 📋 Features Implemented

### ✅ Data Layer (Services)
- **Feed Service** (`services/feed.service.ts`)
  - `getHomeContext()` - Fetches user's home city
  - `getCityFeed()` - Fetches posts, businesses, and promotions
  - `getBusinessById()` - Fetches single business details
  - Full TypeScript type safety

### ✅ Premium UI Components
1. **QuickFilters** - Horizontal scrolling category pills
2. **FeaturedCarousel** - Horizontal scroll with CSS snap and gradient overlays
3. **NewsCard** - Clean card layout for city posts
4. **FeedSkeleton** - Loading state placeholder

### ✅ Home Page Features
- Dynamic greeting based on time of day
- Current date and city name header
- Filterable content by category
- Empty state handling
- Error state with retry
- Loading states with skeletons
- Responsive design (mobile-first)

---

## 🗄️ Database Schema

### Tables Created

#### 1. `businesses`
Stores places, hotels, restaurants, activities.

```sql
{
  id: UUID
  city_id: UUID (FK → cities)
  name: string
  description: string | null
  category: string (Hotels, Food, Nature, Activities)
  address: string | null
  latitude: decimal | null
  longitude: decimal | null
  image_url: string | null
  rating: decimal(2,1) | null (0-5)
  is_verified: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes:**
- `city_id` - Fast city filtering
- `category` - Category filtering
- `rating DESC` - Top-rated sorting
- `is_verified` - Verified businesses

#### 2. `city_posts`
Stores news, events, and blog posts.

```sql
{
  id: UUID
  city_id: UUID (FK → cities)
  author_id: UUID (FK → auth.users)
  title: string
  content: string
  excerpt: string | null
  image_url: string | null
  category: string | null
  is_published: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes:**
- `city_id` - Fast city filtering
- `author_id` - Author's posts
- `is_published` - Published filter
- `created_at DESC` - Chronological sorting
- `category` - Category filtering

#### 3. `promotions`
Stores active deals and promotions.

```sql
{
  id: UUID
  business_id: UUID (FK → businesses)
  title: string
  description: string | null
  discount_percentage: integer (1-100)
  is_active: boolean
  valid_from: timestamp
  valid_until: timestamp
  created_at: timestamp
}
```

**Indexes:**
- `business_id` - Business promotions
- `is_active` - Active promotions
- `valid_from, valid_until` - Date range queries

---

## 🚀 Setup Instructions

### Step 1: Create Database Tables

Run the SQL schema in Supabase SQL Editor:

```bash
# File location
/database/feed-schema.sql
```

**What it does:**
1. Creates `businesses`, `city_posts`, and `promotions` tables
2. Sets up indexes for performance
3. Creates Row Level Security (RLS) policies
4. Inserts sample data for testing
5. Creates triggers for `updated_at` columns

**To execute:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `feed-schema.sql`
4. Click "Run"
5. Verify tables are created in Table Editor

### Step 2: Verify Sample Data

Check that sample data was inserted:

```sql
-- Check businesses
SELECT COUNT(*) FROM businesses;

-- Check city posts
SELECT COUNT(*) FROM city_posts;

-- Check promotions
SELECT COUNT(*) FROM promotions;
```

You should see:
- **Businesses**: 10+ entries
- **City Posts**: 4+ entries
- **Promotions**: 2+ entries

### Step 3: Test the Feed

1. **Start dev server:**
```bash
npm run dev
```

2. **Login with your account** (must have completed onboarding)

3. **Navigate to Home** (`/home`)

4. **You should see:**
   - Current date and city name
   - "Good Morning/Afternoon/Evening" greeting
   - Quick filter pills
   - Featured carousel with businesses
   - News/events list
   - Promotions (if active)

---

## 🎨 UI Component Details

### 1. QuickFilters Component

**Location**: `components/feed/quick-filters.tsx`

**Features:**
- Horizontal scrolling with CSS snap
- Active state with animated indicator (Framer Motion)
- Categories: All, Hotels, Food, Nature, Activities
- Dark active state (`bg-slate-900`)
- Light inactive state (`bg-slate-100`)

**Usage:**
```tsx
<QuickFilters
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>
```

**Visual Design:**
```
┌──────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│  All │ │  Hotels │ │  Food  │ │ Nature │ │ Activities │
└──────┘ └─────────┘ └────────┘ └────────┘ └────────────┘
  ↑ Active (dark bg with icon)
```

---

### 2. FeaturedCarousel Component

**Location**: `components/feed/featured-carousel.tsx`

**Features:**
- **Horizontal scroll**: CSS `snap-x snap-mandatory`
- **Large cards**: 85vw on mobile, 400px on desktop
- **Height**: 280px mobile, 320px desktop
- **Gradient overlay**: `from-black/80 via-black/20 to-transparent`
- **Content readability**: White text with drop shadow
- **Verified badge**: Blue badge for verified businesses
- **Featured badge**: Gold badge for first item
- **Hover effects**: Image scales 105%, ring appears

**Critical CSS (Gradient Overlay):**
```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
```

This ensures text is always readable over any background image!

**Card Layout:**
```
┌─────────────────────────────────────┐
│                                     │ ← Image (object-cover)
│                                     │
│         🏆 Featured     ✓ Verified  │ ← Badges (top)
│                                     │
│                                     │ ← Gradient starts here
│  ┌─────────┐                       │
│  │ Category │                      │
│  └─────────┘                       │
│  Business Name                      │
│  ⭐ 4.8  📍 Address                 │ ← White text on gradient
│  Description...                     │
└─────────────────────────────────────┘
```

---

### 3. NewsCard Component

**Location**: `components/feed/news-card.tsx`

**Features:**
- Horizontal layout: Image left, content right
- Square image: 96px × 96px
- Category badge
- Title (2-line clamp)
- Excerpt (2-line clamp)
- Time ago (using `date-fns`)
- Hover effects: Shadow elevation, title color change

**Layout:**
```
┌────────────────────────────────────┐
│ ┌──────┐  ┌──────────┐            │
│ │      │  │ Category │            │
│ │ IMG  │  ├──────────┤            │
│ │      │  │ Title Text Here...    │
│ │      │  │ Excerpt text here...  │
│ └──────┘  │ 📅 2 hours ago        │
│           └──────────────────────-─┘
└────────────────────────────────────┘
```

---

### 4. FeedSkeleton Component

**Location**: `components/feed/feed-skeleton.tsx`

**Purpose:** Loading placeholder while data fetches

**What it shows:**
- 5 filter pill skeletons
- 3 carousel card skeletons
- 4 news card skeletons

**Usage:**
```tsx
{isLoading ? (
  <FeedSkeleton />
) : (
  <ActualContent />
)}
```

---

## 📊 Data Flow Architecture

### Component Hierarchy

```
HomePage (Client Component)
├── useEffect → Fetch data on mount
├── Loading State → FeedSkeleton
├── Error State → Error message + Retry
└── Success State
    ├── Header (Date + City Name)
    ├── Hero Section (Greeting)
    ├── QuickFilters
    ├── Featured Section
    │   └── FeaturedCarousel
    ├── News Section
    │   └── NewsCard (multiple)
    └── Promotions Section (if available)
```

### Data Fetching Flow

```
1. User loads /home
   ↓
2. useEffect runs
   ↓
3. Check auth (redirect if not logged in)
   ↓
4. getHomeContext(userId)
   • Fetch profile.home_city_id
   • Fetch city details
   ↓
5. Check if onboarding complete
   • If no home_city_id → redirect to /onboarding
   ↓
6. getCityFeed(cityId, filter)
   • Fetch city_posts (news/events)
   • Fetch businesses (top rated)
   • Fetch promotions (active)
   ↓
7. Render UI with data
```

### Service Layer (Separation of Concerns)

```typescript
// services/feed.service.ts

getHomeContext(userId)
  → Returns: { userId, homeCity, homeCityId }

getCityFeed(cityId, categoryFilter?)
  → Returns: { cityPosts[], featuredBusinesses[], promotions[] }

getBusinessById(businessId)
  → Returns: Business | null
```

**Why separate services?**
- ✅ Reusable across components
- ✅ Testable in isolation
- ✅ Centralized data fetching logic
- ✅ Type-safe with database types

---

## 🎯 Filter Logic

### How Filtering Works

1. **User clicks filter pill** (e.g., "Hotels")
2. **State updates:** `setActiveFilter("Hotels")`
3. **useEffect triggers** (depends on `activeFilter`)
4. **Service refetches:** `getCityFeed(cityId, "Hotels")`
5. **UI updates** with filtered results

### Filter Options

| Filter | Matches |
|--------|---------|
| All | All categories |
| Hotels | `category = "Hotels"` |
| Food | `category = "Food"` |
| Nature | `category = "Nature"` |
| Activities | `category = "Activities"` |

**Database Query Example:**
```typescript
// Without filter (All)
.from('businesses')
.eq('city_id', cityId)

// With filter (Hotels)
.from('businesses')
.eq('city_id', cityId)
.eq('category', 'Hotels')
```

---

## 🎨 CSS Techniques Used

### 1. Horizontal Scroll with Snap

```css
.container {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.card {
  flex: none;
  scroll-snap-align: center;
}
```

**Result:** Cards snap into place as you scroll!

### 2. Hide Scrollbar (`.no-scrollbar`)

```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Result:** Clean UI without visible scrollbars

### 3. Gradient Overlay for Text Readability

```css
.image-container {
  position: relative;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8),
    rgba(0, 0, 0, 0.2),
    transparent
  );
}

.text-content {
  position: absolute;
  bottom: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

**Result:** Text is always readable over any image!

### 4. Object Cover for Images

```tsx
<Image
  src={imageUrl}
  fill
  className="object-cover"
/>
```

**Result:** Images fill container without distortion

---

## 🚦 State Management

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(true)

// Show skeleton
{isLoading && <FeedSkeleton />}
```

### Error States

```typescript
const [error, setError] = useState<string | null>(null)

// Show error message + retry button
{error && (
  <ErrorMessage 
    message={error}
    onRetry={() => window.location.reload()}
  />
)}
```

### Empty States

```typescript
{feedData.cityPosts.length === 0 && (
  <EmptyState
    icon={Calendar}
    title="No news yet"
    description="Be the first to share"
    action="Create Post"
  />
)}
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Full-width carousel cards (85vw)
- Vertical stacking
- Touch-friendly scroll
- Bottom navigation visible

### Desktop (≥ 768px)
- Fixed-width carousel cards (400px)
- Horizontal layouts
- Mouse wheel scroll
- Top navigation visible

### Breakpoint Strategy

```tsx
// Mobile-first approach
className="w-[85vw] md:w-[400px]"
           ↑ mobile   ↑ desktop

// Hide on mobile, show on desktop
className="hidden md:block"

// Show on mobile, hide on desktop
className="block md:hidden"
```

---

## 🔍 Sample Data Included

### New York City
**Businesses:**
- The Plaza Hotel (Hotels, 4.7⭐, Verified)
- Central Park (Nature, 4.9⭐, Verified)
- Katz's Delicatessen (Food, 4.5⭐, Verified)
- MoMA (Activities, 4.8⭐, Verified)
- Brooklyn Bridge Park (Nature, 4.6⭐)

**Posts:**
- Summer Street Festivals
- Restaurant Week Deals
- Free Concert Series

**Promotions:**
- The Plaza Hotel: 20% off (30 days)
- Katz's Deli: 15% off lunch (60 days)

### Los Angeles
**Businesses:**
- Griffith Observatory (4.8⭐)
- Santa Monica Pier (4.5⭐)
- Beverly Hills Hotel (4.6⭐)

**Posts:**
- Beach Clean-Up Day

### London
**Businesses:**
- The Shard (4.7⭐)
- Borough Market (4.6⭐)

**Posts:**
- British Museum Exhibition

---

## 🐛 Troubleshooting

### Issue: No data appearing

**Possible causes:**
1. User hasn't selected home city (onboarding incomplete)
2. No data in database for that city
3. RLS policies blocking access

**Solution:**
```sql
-- Check if user has home_city_id
SELECT home_city_id FROM profiles WHERE id = 'user-id';

-- Check if businesses exist for city
SELECT * FROM businesses WHERE city_id = 'city-id';

-- Check RLS policies
SELECT * FROM businesses; -- Should work if logged in
```

### Issue: Images not loading

**Possible causes:**
1. Invalid image URLs
2. CORS issues
3. Image URLs are null

**Solution:**
```typescript
// Fallback gradient if no image
{business.image_url ? (
  <Image src={business.image_url} />
) : (
  <div className="bg-gradient-to-br from-blue-500 to-purple-600" />
)}
```

### Issue: Filter not working

**Check:**
1. `activeFilter` state updating correctly
2. `useEffect` dependency array includes `activeFilter`
3. Service passing filter parameter to Supabase

**Debug:**
```typescript
useEffect(() => {
  console.log('Filter changed:', activeFilter)
  // ... fetch logic
}, [activeFilter]) // ← Must include dependency
```

### Issue: Skeleton showing forever

**Possible causes:**
1. API call failing silently
2. `setIsLoading(false)` not called
3. Network error

**Solution:**
```typescript
try {
  // ... fetch logic
} catch (error) {
  console.error('Feed error:', error)
  setError(error.message)
} finally {
  setIsLoading(false) // ← Always called
}
```

---

## 📈 Performance Optimizations

### 1. Limit Query Results
```typescript
.limit(10) // Only fetch what's needed
```

### 2. Index Usage
All queries use indexed columns:
- `city_id` (indexed)
- `is_published` (indexed)
- `rating DESC` (indexed)

### 3. Image Optimization
```tsx
<Image
  src={imageUrl}
  fill
  sizes="(max-width: 768px) 85vw, 400px"
  // ↑ Loads appropriate image size
/>
```

### 4. Skeleton Loading
Users see content structure immediately, reducing perceived load time.

---

## 🎯 Next Steps

### Immediate Enhancements
- [ ] Add infinite scroll for news
- [ ] Implement "View All" pages
- [ ] Add like/save functionality
- [ ] Enable post creation
- [ ] Add image upload for businesses

### User Experience
- [ ] Pull-to-refresh on mobile
- [ ] Optimistic UI updates
- [ ] Offline support (PWA)
- [ ] Share functionality

### Analytics
- [ ] Track which businesses get clicked
- [ ] Monitor filter usage
- [ ] Measure scroll depth
- [ ] A/B test carousel vs grid

---

## 📚 File Structure

```
services/
└── feed.service.ts           # Data fetching logic

components/
└── feed/
    ├── quick-filters.tsx     # Category filter pills
    ├── featured-carousel.tsx # Horizontal business cards
    ├── news-card.tsx         # City post cards
    └── feed-skeleton.tsx     # Loading placeholder

app/
└── home/
    └── page.tsx              # Main feed page

database/
└── feed-schema.sql           # Database setup

types/
└── database.types.ts         # TypeScript types (extended)
```

---

**🎉 Your Home Feed is production-ready!**

Users can now discover businesses, read news, and find promotions in their city with a beautiful, performant UI.

