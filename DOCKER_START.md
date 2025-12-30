# Pornire Docker Desktop

## Problemă: "Cannot connect to the Docker daemon"

Această eroare înseamnă că Docker Desktop nu rulează pe macOS.

## Soluție

### 1. Pornește Docker Desktop

**Opțiunea A: Din Applications**
- Deschide **Applications** (Finder → Applications)
- Găsește **Docker** sau **Docker Desktop**
- Dă dublu-click pentru a porni

**Opțiunea B: Din Terminal**
```bash
open -a Docker
```

### 2. Așteaptă inițializarea

Docker Desktop are nevoie de câteva secunde pentru a porni complet. Așteaptă până când:
- Iconița Docker apare în meniul de sus (partea dreaptă)
- Iconița nu mai "pulsează" (nu mai e animată)

### 3. Verifică că rulează

```bash
docker info
```

Ar trebui să vezi informații despre Docker, nu erori.

### 4. Rulează setup-ul din nou

```bash
cd /Users/macbook/Desktop/travel-app
./setup-complete.sh
```

## Verificare Rapidă

```bash
# Verifică dacă Docker rulează
docker info &> /dev/null && echo "✅ Docker rulează" || echo "❌ Docker NU rulează"

# Verifică versiunea
docker --version
docker compose version
```

## Troubleshooting

### Docker Desktop nu pornește
- Verifică că ai suficiente resurse (RAM, CPU)
- Restart Docker Desktop
- Verifică logs: `~/Library/Containers/com.docker.docker/Data/log/`

### Porturi ocupate
- Verifică: `lsof -i :8080` și `lsof -i :5000`
- Oprește procesele care ocupă porturile

### Permisiuni
- Asigură-te că ai permisiuni pentru Docker
- Poate fi necesar să dai permisiuni în System Preferences → Security & Privacy

