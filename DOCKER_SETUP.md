# Docker Setup pentru macOS

## Problemă: `docker-compose: command not found`

Pe macOS, Docker Compose poate fi disponibil în două moduri:

### Opțiunea 1: Docker Desktop (Recomandat)

Docker Desktop pentru macOS include atât `docker` cât și `docker compose` (fără cratimă).

**Instalare:**
1. Descarcă Docker Desktop: https://www.docker.com/products/docker-desktop
2. Instalează și pornește Docker Desktop
3. Verifică instalarea:
   ```bash
   docker --version
   docker compose version
   ```

### Opțiunea 2: Docker Compose Standalone

Dacă ai Docker dar nu ai Docker Compose:

```bash
# Instalează cu Homebrew
brew install docker-compose

# Sau descarcă direct
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Verificare

După instalare, verifică:

```bash
# Verifică Docker
docker --version

# Verifică Docker Compose (nou)
docker compose version

# Sau Docker Compose (vechi)
docker-compose version
```

## Script Actualizat

Am actualizat `setup-complete.sh` să detecteze automat comanda corectă:
- `docker compose` (nou, fără cratimă)
- `docker-compose` (vechi, cu cratimă)

## Pornire Manuală

Dacă ai Docker instalat, poți porni manual:

```bash
cd /Users/macbook/Desktop/travel-app

# Detectează comanda corectă
if docker compose version &> /dev/null; then
    DC="docker compose"
elif docker-compose version &> /dev/null; then
    DC="docker-compose"
else
    echo "Docker Compose nu este instalat!"
    exit 1
fi

# Pornește containers
$DC up -d

# Monitorizează
$DC logs -f otp
```

## Troubleshooting

### Docker nu pornește
- Verifică că Docker Desktop rulează
- Verifică în Applications că Docker Desktop este pornit

### Porturi ocupate
- Verifică: `lsof -i :8080` și `lsof -i :5000`
- Oprește procesele care ocupă porturile

### Permisiuni
- Asigură-te că ai permisiuni pentru Docker
- Poate fi necesar să rulezi cu `sudo` (nu recomandat)

