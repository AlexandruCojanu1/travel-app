# Vercel Environment Variables Setup

This guide will help you configure the required environment variables in your Vercel project.

## Required Environment Variables

### 1. Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

### 2. Payment Processing (Stripe)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (for payment confirmations)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 3. Maps & Location Services
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Your Mapbox access token (or MapLibre compatible token)

### 4. Application Configuration
- `NEXT_PUBLIC_APP_URL` - Your application URL (e.g., `https://your-app.vercel.app`)

### 5. Optional Services
- `WEATHER_API_KEY` - OpenWeatherMap API key (optional, for weather features)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics measurement ID (optional)

## How to Add Environment Variables in Vercel

1. **Go to your Vercel project dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project

2. **Open Settings**
   - Click on the "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add each variable**
   - Click "Add New"
   - Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the variable value
   - Select the environments where it should be available:
     - Production
     - Preview
     - Development
   - Click "Save"

4. **Redeploy your application**
   - After adding all environment variables, go to the "Deployments" tab
   - Click the three dots (⋯) on your latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger a new deployment

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use as `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Getting Your Stripe Credentials

1. Go to your Stripe dashboard: https://dashboard.stripe.com
2. Go to Developers → API keys
3. Copy:
   - **Secret key** → Use as `STRIPE_SECRET_KEY`
   - **Publishable key** → Use as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. For webhook secret:
   - Go to Developers → Webhooks
   - Create a new webhook endpoint pointing to: `https://your-app.vercel.app/api/webhooks/stripe`
   - Copy the **Signing secret** → Use as `STRIPE_WEBHOOK_SECRET`

## Getting Your Mapbox Token

1. Go to Mapbox: https://account.mapbox.com
2. Go to Access tokens
3. Copy your default public token → Use as `NEXT_PUBLIC_MAPBOX_TOKEN`

## Verification

After adding all environment variables and redeploying, you should:
- ✅ Be able to log in without "Missing Supabase environment variables" error
- ✅ See businesses on the map
- ✅ Complete bookings and payments
- ✅ Access the business portal

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
- Make sure you've redeployed after adding the variables
- Check that variable names are exactly correct (case-sensitive)

### Error: "401 Unauthorized" on API routes
- Verify that `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that RLS policies are correctly configured in Supabase

### Error: "Stripe payment failed"
- Verify that `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set
- Check that webhook secret is configured if using webhooks

