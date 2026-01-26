# Travel App - Monorepo

A full-stack travel planning application with separate backend and frontend.

## Structure

```
TRAVEL-APP/
├── BACKEND/          # Express.js API Server (Port 4000)
├── FRONTEND/         # Next.js Web Application (Port 3000)
├── package.json      # Root workspace configuration
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install root dependencies (including concurrently)
npm install

# Install all workspace dependencies
npm run install:all

# Or install individually
cd BACKEND && npm install
cd ../FRONTEND && npm install
```

### Environment Setup

1. **Backend** - Copy `BACKEND/.env.example` to `BACKEND/.env` and fill in your values
2. **Frontend** - Copy `FRONTEND/.env.local.example` to `FRONTEND/.env.local` and fill in your values

### Running Development

```bash
# Run both backend and frontend simultaneously
npm run dev

# Or run them separately:
npm run dev:backend   # Backend on http://localhost:4000
npm run dev:frontend  # Frontend on http://localhost:3000
```

### Building for Production

```bash
# Build both
npm run build

# Or individually
npm run build:backend
npm run build:frontend
```

## Backend (BACKEND/)

Express.js REST API server with:

- **Authentication**: JWT-based with Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe integration
- **Rate Limiting**: Express rate limiter

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Authentication |
| `/api/bookings/*` | Hotel bookings |
| `/api/businesses/*` | Business listings |
| `/api/payments/*` | Payment processing |
| `/api/trips/*` | Trip planning |
| `/api/reviews/*` | Business reviews |
| `/api/weather/*` | Weather forecasts |
| `/api/gamification/*` | XP, achievements, quests |
| `/api/admin/*` | Admin operations |
| `/api/webhooks/*` | Stripe webhooks |

### Backend Tech Stack

- Express.js
- TypeScript
- Supabase Client
- Stripe SDK
- Zod (validation)

## Frontend (FRONTEND/)

Next.js 14 application with:

- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Maps**: MapLibre GL JS
- **3D**: Three.js + React Three Fiber

### Frontend Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand

## Development

### Adding Dependencies

```bash
# Add to backend
npm install <package> -w BACKEND

# Add to frontend
npm install <package> -w FRONTEND

# Add to root (dev tools)
npm install <package> -D
```

### Code Structure

**Backend:**
```
BACKEND/src/
├── controllers/    # Request handlers
├── middleware/     # Auth, validation, error handling
├── routes/         # API route definitions
├── services/       # Business logic
├── lib/            # Supabase, Stripe clients
└── types/          # TypeScript types
```

**Frontend:**
```
FRONTEND/
├── app/            # Next.js pages
├── components/     # React components
├── store/          # Zustand stores
├── hooks/          # Custom React hooks
├── lib/            # API client, utilities
└── types/          # TypeScript types
```

## Deployment

### Backend
Deploy as a Node.js application on:
- Railway
- Render
- Fly.io
- AWS/GCP/Azure

### Frontend
Deploy on Vercel (recommended) or any Next.js-compatible host.

### Environment Variables

**Production Backend:**
- Set `FRONTEND_URL` to your production frontend URL
- Use production Supabase and Stripe keys

**Production Frontend:**
- Set `NEXT_PUBLIC_API_URL` to your production backend URL

## License

Private - All rights reserved
