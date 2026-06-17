#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  FitQuest Installer  (esprit tteck / Proxmox Helper Scripts)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ===== Configuration =========================================
GITHUB_REPO="https://github.com/RaphPi/fitquest.git"
INSTALL_DIR="/opt/fitquest"
BRANCH="main"
# =============================================================

# ----- Couleurs ----------------------------------------------
RD=$'\033[01;31m'; GN=$'\033[1;92m'; YW=$'\033[33m'
BL=$'\033[1;34m'; CL=$'\033[m'; BOLD=$'\033[1m'
msg_info()  { echo -e " ${YW}➜${CL} $1"; }
msg_ok()    { echo -e " ${GN}✔${CL} $1"; }
msg_err()   { echo -e " ${RD}✘${CL} $1"; }
die()       { msg_err "$1"; exit 1; }

header() {
clear
echo -e "${BL}${BOLD}"
cat <<'EOF'
   ______ _ _    ____                  _
  |  ____(_) |  / __ \                | |
  | |__   _| |_| |  | |_   _  ___  ___| |_
  |  __| | | __| |  | | | | |/ _ \/ __| __|
  | |    | | |_| |__| | |_| |  __/\__ \ |_
  |_|    |_|\__|\___\_\\__,_|\___||___/\__|
EOF
echo -e "${CL}"
echo -e "       ${BOLD}FitQuest Installer${CL} — LEVEL UP !\n"
}

# ----- Garde-fous --------------------------------------------
[[ $EUID -eq 0 ]] || die "Ce script doit être lancé en root (sudo)."

header

# ----- 1. Docker ---------------------------------------------
if command -v docker >/dev/null 2>&1; then
  msg_ok "Docker déjà installé ($(docker --version | awk '{print $3}' | tr -d ','))"
else
  msg_info "Docker absent — installation via le script officiel…"
  curl -fsSL https://get.docker.com | sh >/dev/null 2>&1 || die "Échec de l'installation de Docker."
  systemctl enable --now docker >/dev/null 2>&1 || true
  msg_ok "Docker installé"
fi

if docker compose version >/dev/null 2>&1; then
  msg_ok "Docker Compose v2 disponible"
else
  die "Le plugin 'docker compose' v2 est requis."
fi

# ----- 2. Clone / mise à jour du dépôt -----------------------
if [[ -d "$INSTALL_DIR/.git" ]]; then
  msg_info "Dépôt déjà présent dans $INSTALL_DIR — git pull…"
  git -C "$INSTALL_DIR" pull origin "$BRANCH" >/dev/null 2>&1 || die "git pull a échoué."
else
  msg_info "Clonage de $GITHUB_REPO → $INSTALL_DIR…"
  git clone --branch "$BRANCH" "$GITHUB_REPO" "$INSTALL_DIR" >/dev/null 2>&1 \
    || die "Clonage impossible. Vérifie GITHUB_REPO en haut du script."
fi
cd "$INSTALL_DIR"
msg_ok "Dépôt prêt dans $INSTALL_DIR"

# ----- 3. Génération du .env ---------------------------------
gen_secret() { openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c48; }

if [[ -f .env ]]; then
  msg_ok ".env existant conservé"
else
  msg_info "Configuration (.env)"
  # Interactif uniquement si TTY (sinon : valeurs d'env ou défauts — ex. lancé via `pct exec`).
  if [[ -t 0 ]]; then
    read -rp "   Port public de l'application [${APP_PORT:-80}] : " _port
    APP_PORT="${_port:-${APP_PORT:-80}}"
    read -rsp "   Mot de passe PostgreSQL (vide = aléatoire) : " _dbpass; echo
    [[ -n "${_dbpass}" ]] && DB_PASS="${_dbpass}"
  fi
  APP_PORT="${APP_PORT:-80}"
  DB_PASS="${DB_PASS:-$(gen_secret)}"
  JWT_SECRET="${JWT_SECRET:-$(gen_secret)}"

  cat > .env <<EOF
APP_PORT=${APP_PORT}
PORT=3001
NODE_ENV=production

POSTGRES_USER=fitquest
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=fitquest
DATABASE_URL=postgresql://fitquest:${DB_PASS}@db:5432/fitquest

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

AI_PROVIDER=none
CLAUDE_API_KEY=
OLLAMA_URL=
LMSTUDIO_URL=

FREESMS_TOKEN=
HOME_ASSISTANT_URL=
HOME_ASSISTANT_TOKEN=
WEBHOOK_URL=

PUPPETEER_SKIP_DOWNLOAD=true
EOF
  chmod 600 .env
  msg_ok ".env généré (JWT_SECRET et mot de passe BDD sécurisés)"
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

# ----- 4. Build & démarrage ----------------------------------
msg_info "Build et démarrage des conteneurs (peut prendre quelques minutes)…"
docker compose -f docker-compose.prod.yml up -d --build || die "docker compose up a échoué."
msg_ok "Conteneurs démarrés"

# ----- 5. Attente de la base (max 60s) -----------------------
msg_info "Attente de PostgreSQL…"
for i in $(seq 1 60); do
  if docker compose -f docker-compose.prod.yml exec -T db pg_isready -U fitquest >/dev/null 2>&1; then
    msg_ok "Base de données prête (${i}s)"; DB_READY=1; break
  fi
  sleep 1
done
[[ "${DB_READY:-0}" == "1" ]] || die "La base n'est pas prête après 60s."

# ----- 6. Attente du backend (schema + API, max 90s) ---------
DC="docker compose -f docker-compose.prod.yml"
msg_info "Attente du backend (prisma db push + démarrage API)…"
BACKEND_OK=0
for i in $(seq 1 45); do
  if $DC exec -T backend wget -q -O /dev/null http://localhost:3001/api/v1/health >/dev/null 2>&1; then
    msg_ok "Backend opérationnel (${i}0s)"; BACKEND_OK=1; break
  fi
  sleep 2
done
if [[ "${BACKEND_OK:-0}" != "1" ]]; then
  msg_err "Backend non confirmé après 90s — vérifiez avec :"
  echo "   docker compose -f docker-compose.prod.yml logs backend"
  die "Arrêt de l'installation — corrigez l'erreur backend avant de relancer."
fi

# ----- 7. Seed des données -----------------------------------
msg_info "Seed des données (exercices + programmes)…"
$DC exec -T backend npx prisma db seed \
  || msg_err "Le seed a échoué (non bloquant) — relancer : ${DC} exec -T backend npx prisma db seed"
msg_ok "Base initialisée"

# ----- 8. SSH ------------------------------------------------
msg_info "Installation et configuration de SSH…"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openssh-server >/dev/null 2>&1 \
  || die "Échec installation openssh-server."

# Autorise login root par mot de passe
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl enable ssh >/dev/null 2>&1 || true
systemctl restart ssh >/dev/null 2>&1 || true   # recharge sshd_config

# Mot de passe root aléatoire si non défini (sera affiché à la fin)
if [[ -t 0 ]]; then
  read -rsp "   Mot de passe root SSH (vide = aléatoire) : " _rootpw; echo
  ROOT_PW="${_rootpw:-$(openssl rand -base64 12)}"
else
  ROOT_PW="${ROOT_PW:-$(openssl rand -base64 12)}"
fi
echo "root:${ROOT_PW}" | chpasswd
msg_ok "SSH prêt — login : root / mot de passe ci-dessous"

# ----- 8. Commande de mise à jour ----------------------------
printf '#!/bin/bash\nexec /bin/bash %s/scripts/update.sh "$@"\n' "${INSTALL_DIR}" > /usr/bin/update
chmod +x /usr/bin/update
msg_ok "Commande 'update' installée (/usr/bin/update)"

# ----- 9. Final ----------------------------------------------
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
PORT_DISPLAY=$([[ "${APP_PORT}" == "80" ]] && echo "" || echo ":${APP_PORT}")
echo
echo -e "${GN}${BOLD}════════════════════════════════════════════${CL}"
echo -e "  ${GN}${BOLD}FitQuest est en ligne !${CL}"
echo -e "  ${BOLD}URL         :${CL} ${GN}http://${IP}${PORT_DISPLAY}${CL}"
echo -e "  ${BOLD}SSH         :${CL} root @ ${IP}  /  mdp : ${YW}${ROOT_PW}${CL}"
echo -e "  ${BOLD}Mise à jour :${CL} tape ${YW}update${CL}  (depuis SSH ou pct enter)"
echo -e "${GN}${BOLD}════════════════════════════════════════════${CL}"
