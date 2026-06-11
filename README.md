# FitQuest 🗡️

Web app de renforcement musculaire gamifiée (RPG). Self-hosted, déploiement Docker en une commande.

> **Sprint 1 — Setup & Infrastructure.** Ce dépôt contient la structure mono-repo,
> la stack Docker, le schéma Prisma et le seed des données (30 exercices + 3 programmes).

## Stack
- **Frontend** : React 18 + Vite + TypeScript (strict) · TailwindCSS + shadcn/ui · Zustand · React Router · react-i18next · Recharts
- **Backend** : Node/Express + TypeScript · PostgreSQL + Prisma · JWT + bcrypt
- **Infra** : Docker Compose · Nginx reverse proxy

## Démarrage rapide (développement)

```bash
cp .env.example .env          # adapter si besoin
docker compose up -d          # db + backend (nodemon) + frontend (vite)

# Première initialisation de la base
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npx prisma db seed
```

- Frontend : http://localhost:5173
- Backend  : http://localhost:3001/api/v1/health

### Sans Docker

```bash
# Backend
cd backend && npm install && npx prisma generate
npx prisma migrate dev --name init && npx prisma db seed
npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Production — Proxmox VE (LXC, esprit community-scripts)

### Création de la LXC complète (à lancer **sur l'hôte PVE**, en root)

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/RaphPi/fitquest/main/ct/fitquest.sh)"
```

Crée une LXC Debian 12 (unprivileged, `nesting=1`/`keyctl=1` pour Docker), installe
Docker + l'app, lance la stack `docker-compose.prod.yml`, migre et seed la base, puis
affiche l'URL. Paramètres surchargables par variables d'env :

```bash
CTID=120 CT_HOSTNAME=fitquest RAM_MB=4096 CORES=2 DISK_GB=12 APP_PORT=80 \
  bash -c "$(curl -fsSL https://raw.githubusercontent.com/RaphPi/fitquest/main/ct/fitquest.sh)"
```

### Itérer / mettre à jour

```bash
pct enter <CTID>   # entrer dans la LXC
update             # git pull + rebuild compose (+ migrations si présentes)
# ou, depuis l'hôte, sans entrer :  pct exec <CTID> -- update
```

### Installation dans un hôte existant (sans créer de LXC)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/RaphPi/fitquest/main/scripts/install.sh)
```

## Structure

```
fitquest/
├── docker-compose.yml          # dev
├── docker-compose.prod.yml     # production
├── nginx/nginx.conf            # reverse proxy
├── ct/fitquest.sh              # créateur de LXC Proxmox (community-scripts)
├── scripts/{install,update}.sh # install Docker + app / mise à jour
├── frontend/                   # React + Vite
└── backend/                    # Express + Prisma
```

Source de vérité du projet : [`FitQuest_ProjectPlan.md`](FitQuest_ProjectPlan.md).
