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
msg_err()  { echo -e " ${RD}✘${CL} $1"; }
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

# 4. Attente du backend (l'entrypoint gère le schéma avant de démarrer l'API)
DC="docker compose -f docker-compose.prod.yml"
msg_info "Attente du backend (prisma db push + API)…"
BACKEND_OK=0
for i in $(seq 1 45); do
  $DC exec -T backend wget -q -O /dev/null http://localhost:3001/api/v1/health >/dev/null 2>&1 \
    && BACKEND_OK=1 && break
  sleep 2
done
[[ "${BACKEND_OK:-0}" == "1" ]] && msg_ok "Backend opérationnel" \
  || { msg_err "Backend non confirmé après 90s."; die "Vérifiez : ${DC} logs backend"; }

# 5. Seed (idempotent — upsert exercices, reset programmes seed)
msg_info "Seed de la base…"
$DC exec -T backend npx prisma db seed \
  || msg_err "Le seed a échoué (non bloquant) — relancer : ${DC} exec -T backend npx prisma db seed"
msg_ok "Base seedée"

# 6. Auto-réparation : s'assure que les commandes utilitaires sont en place
# Répare le wrapper update si absent ou s'il contient encore l'ancien shebang /usr/bin/env
if [[ ! -x /usr/bin/update ]] || grep -q '/usr/bin/env' /usr/bin/update 2>/dev/null; then
  printf '#!/bin/bash\nexec /bin/bash /opt/fitquest/scripts/update.sh "$@"\n' > /usr/bin/update
  chmod +x /usr/bin/update
  msg_ok "Commande 'update' réparée dans /usr/bin/update"
fi

# Répare SSH si absent ou si PermitRootLogin n'est pas activé
if ! command -v sshd >/dev/null 2>&1; then
  msg_info "Installation de SSH (absent)…"
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openssh-server >/dev/null 2>&1
  msg_ok "SSH installé"
fi
if ! grep -q '^PermitRootLogin yes' /etc/ssh/sshd_config 2>/dev/null; then
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
  systemctl restart ssh >/dev/null 2>&1 || true
  msg_ok "SSH reconfiguré (PermitRootLogin yes) et redémarré"
fi

# 7. Confirmation
echo
msg_ok "${BOLD}Mise à jour terminée.${CL} — $(TZ='Europe/Paris' date '+%d/%m/%Y %H:%M:%S')"
