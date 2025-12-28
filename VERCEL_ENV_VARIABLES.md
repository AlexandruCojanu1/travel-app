# 📋 Lista Completă - Variabile de Mediu Vercel

## ✅ OBLIGATORII (Required)

### 1. Supabase (CRITICAL - fără acestea aplicația nu funcționează)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 2. Stripe (CRITICAL - pentru plăți)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### 3. Maps (CRITICAL - pentru hartă)
```
NEXT_PUBLIC_MAPBOX_TOKEN
```

### 4. Application URL (CRITICAL - pentru redirects și webhooks)
```
NEXT_PUBLIC_APP_URL
```

---

## ⚠️ OPCȚIONALE (Optional - aplicația funcționează fără ele)

### 5. Weather API (opțional - pentru funcționalitatea de vreme)
```
WEATHER_API_KEY
```

### 6. Google Analytics (opțional - pentru analytics)
```
NEXT_PUBLIC_GA_MEASUREMENT_ID
```

---

## 📝 Instrucțiuni de Adăugare în Vercel

1. **Deschide Vercel Dashboard**
   - Mergi la: https://vercel.com/dashboard
   - Selectează proiectul tău

2. **Accesează Settings → Environment Variables**

3. **Adaugă fiecare variabilă:**
   - Click pe "Add New"
   - Introdu numele variabilei (exact ca mai sus)
   - Introdu valoarea
   - Selectează environment-urile: **Production**, **Preview**, **Development**
   - Click "Save"

4. **Redeploy după adăugarea tuturor variabilelor**

---

## 🔑 Unde să găsești valorile

### Supabase Credentials
1. Mergi la: https://app.supabase.com
2. Selectează proiectul
3. Settings → API
4. Copiază:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SECRET!

### Stripe Credentials
1. Mergi la: https://dashboard.stripe.com
2. Developers → API keys
3. Copiază:
   - **Secret key** → `STRIPE_SECRET_KEY` ⚠️ SECRET!
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Pentru Webhook Secret:
   - Developers → Webhooks
   - Creează endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Copiază **Signing secret** → `STRIPE_WEBHOOK_SECRET` ⚠️ SECRET!

### Mapbox Token
1. Mergi la: https://account.mapbox.com
2. Access tokens
3. Copiază **default public token** → `NEXT_PUBLIC_MAPBOX_TOKEN`

### Application URL
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```
(Înlocuiește `your-app-name` cu numele real al aplicației tale pe Vercel)

### Weather API Key (opțional)
1. Mergi la: https://openweathermap.org/api
2. Creează cont și obține API key
3. Adaugă → `WEATHER_API_KEY`

### Google Analytics (opțional)
1. Mergi la: https://analytics.google.com
2. Creează property și copiază Measurement ID
3. Adaugă → `NEXT_PUBLIC_GA_MEASUREMENT_ID`

---

## ✅ Checklist Final

După adăugarea tuturor variabilelor, verifică:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - adăugat
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - adăugat
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - adăugat
- [ ] `STRIPE_SECRET_KEY` - adăugat
- [ ] `STRIPE_WEBHOOK_SECRET` - adăugat
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - adăugat
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` - adăugat
- [ ] `NEXT_PUBLIC_APP_URL` - adăugat
- [ ] `WEATHER_API_KEY` - adăugat (opțional)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` - adăugat (opțional)

**Redeploy aplicația după adăugarea tuturor variabilelor!**

