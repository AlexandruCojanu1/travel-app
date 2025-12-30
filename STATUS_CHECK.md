# Status Check - Routing Infrastructure

## Verificare Rapidă

```bash
# Status containers
docker compose ps

# Logs OTP
docker compose logs --tail=20 otp

# Logs OSRM
docker compose logs --tail=20 osrm

# Test OTP
curl http://localhost:8080/otp/routers/default

# Test OSRM
curl "http://localhost:5001/route/v1/driving/25.6,45.6;25.7,45.7"
```

## Status Normal

### OTP (OpenTripPlanner)
- **Prima build**: 10-15 minute
- **Status gata**: Caută `Grizzly server running` în logs
- **Test**: `curl http://localhost:8080/otp/routers/default` returnează JSON

### OSRM
- **Prima build**: 2-5 minute
- **Status gata**: Caută `listening on port 5000` în logs (în container)
- **Test**: `curl "http://localhost:5001/route/v1/driving/25.6,45.6;25.7,45.7"` returnează JSON

## Când e Gata

Ambele servicii sunt gata când:
1. Containers au status `Up` (nu `Starting` sau `Restarting`)
2. Test-urile curl returnează JSON valid
3. Logs nu mai arată erori

## Monitorizare Continuă

```bash
# OTP
docker compose logs -f otp

# OSRM
docker compose logs -f osrm

# Ambele
docker compose logs -f
```

