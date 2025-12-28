# Feature Components

Components organized by feature domain for better maintainability and scalability.

## Structure

- `auth/` - Authentication & user profile components
- `business/` - Business-related components
  - `portal/` - Business owner dashboard components
  - `public/` - Public business view components
- `booking/` - Booking & checkout components
  - `checkout/` - Checkout flow components
- `trip/` - Trip planning components
- `feed/` - Feed & content components
- `map/` - Map & exploration components
  - `explore/` - Explore page components
  - `search/` - Search components

## Usage

Import from feature directories:
```tsx
import { AuthForm } from '@/components/features/auth/auth-form'
import { BusinessDashboard } from '@/components/features/business/portal/dashboard-overview'
```

