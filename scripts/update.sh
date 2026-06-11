#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  FitQuest Updater
# ─────────────────────────────────────────────────────────────
set -euo pipefail

INSTALL_DIR="/opt/fitquest"
BRANCH="main"

GN=$'\033[1;92m'; YW=$'\033[33m'; RD=$'\033[01;31m'; CL=$'\033[m'; BOLD=$'\033[1m'
msg_info() { echo -e " ${YW}➜${CL} $1"; }
msg_ok()   { echo -e " ${GN}✔${CL} $1"; }
die()      { echo -e " ${RD}✘${CL} $1"; exit 1; }

cd "$INSTALL_DIR" || die "Dossier $INSTALL_DIR introuvable."

# 1. Pull
msg_info "Récupération des dernières modifications…"
git pull origin "$BRANCH" || die "git pull a échoué."
msg_ok "Dépôt à jour"

# shellcheck disable=SC1091
set -a; [[ -f .env ]] && source .env; set +a

# 2-3. Redéploiement
msg_info "Arrêt des conteneurs…"
docker compose -f docker-compose.prod.yml down
msg_info "Reconstruction et redémarrage…"
docker compose -f docker-compose.prod.yml up -d --build || die "Redéploiement échoué."
msg_ok "Conteneurs redéployés"

# 4. Migrations (si présentes)
if [[ -n "$(find prisma/migrations backend/prisma/migrations -maxdepth 1 -mindepth 1 -type d 2>/dev/null)" ]]; then
  msg_info "Attente de la base puis migrations…"
  for i in $(seq 1 60); do
    docker compose -f docker-compose.prod.yml exec -T db pg_isready -U fitquest >/dev/null 2>&1 && break
    sleep 1
  done
  docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy \
    || die "prisma migrate deploy a échoué."
  msg_ok "Migrations appliquées"
else
  msg_info "Aucune migration à appliquer"
fi

# 5. Confirmation
echo
msg_ok "${BOLD}Mise à jour terminée.${CL}"
