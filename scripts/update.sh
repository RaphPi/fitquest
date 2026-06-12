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

# 4. Schéma à jour (migrations si présentes, sinon db push)
DC="docker compose -f docker-compose.prod.yml"
msg_info "Attente de la base…"
for i in $(seq 1 60); do
  $DC exec -T db pg_isready -U fitquest >/dev/null 2>&1 && break
  sleep 1
done
if $DC exec -T backend sh -c '[ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]'; then
  msg_info "Application des migrations…"
  $DC exec -T backend npx prisma migrate deploy || die "prisma migrate deploy a échoué."
else
  msg_info "Synchronisation du schéma (prisma db push)…"
  $DC exec -T backend npx prisma db push --accept-data-loss || die "prisma db push a échoué."
fi
msg_ok "Schéma à jour"

# 5. Auto-réparation : s'assure que les commandes utilitaires sont en place
if [[ ! -x /usr/bin/update ]]; then
  cat > /usr/bin/update <<'HEREDOC'
#!/usr/bin/env bash
exec bash /opt/fitquest/scripts/update.sh "$@"
HEREDOC
  chmod +x /usr/bin/update
  msg_ok "Commande 'update' réparée dans /usr/bin/update"
fi

if ! command -v sshd >/dev/null 2>&1; then
  msg_info "Installation de SSH (absent)…"
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openssh-server >/dev/null 2>&1 && \
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && \
  systemctl enable --now ssh >/dev/null 2>&1 && \
  msg_ok "SSH installé — définis un mot de passe root : passwd root"
fi

# 6. Confirmation
echo
msg_ok "${BOLD}Mise à jour terminée.${CL}"
