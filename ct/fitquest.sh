#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  FitQuest — Créateur de LXC pour Proxmox VE
#  (esprit tteck / community-scripts/ProxmoxVE)
#
#  À lancer SUR L'HÔTE PVE, en root :
#    bash -c "$(curl -fsSL https://raw.githubusercontent.com/RaphPi/fitquest/main/ct/fitquest.sh)"
#
#  Variables surchargables (toutes optionnelles) :
#    CTID CT_HOSTNAME CORES RAM_MB DISK_GB BRIDGE STORAGE
#    TEMPLATE_STORAGE OS_TEMPLATE APP_PORT BRANCH
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ===== Paramètres ============================================
APP="FitQuest"
BRANCH="${BRANCH:-main}"
RAW_BASE="https://raw.githubusercontent.com/RaphPi/fitquest/${BRANCH}"

# NB : on n'utilise PAS la variable $HOSTNAME (déjà définie par bash = nom de l'hôte PVE).
CT_HOSTNAME="${CT_HOSTNAME:-fitquest}"
CORES="${CORES:-2}"
RAM_MB="${RAM_MB:-4096}"
DISK_GB="${DISK_GB:-12}"
BRIDGE="${BRIDGE:-vmbr0}"
STORAGE="${STORAGE:-local-lvm}"
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"
OS_TEMPLATE="${OS_TEMPLATE:-debian-12-standard}"
APP_PORT="${APP_PORT:-80}"
# =============================================================

# ----- Couleurs ----------------------------------------------
RD=$'\033[01;31m'; GN=$'\033[1;92m'; YW=$'\033[33m'
BL=$'\033[1;34m'; CL=$'\033[m'; BOLD=$'\033[1m'
msg_info() { echo -e " ${YW}➜${CL} $1"; }
msg_ok()   { echo -e " ${GN}✔${CL} $1"; }
msg_err()  { echo -e " ${RD}✘${CL} $1"; }
die()      { msg_err "$1"; exit 1; }

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
echo -e "       ${BOLD}FitQuest — LXC Proxmox${CL} — LEVEL UP !\n"
}

# ----- Garde-fous --------------------------------------------
[[ $EUID -eq 0 ]] || die "À lancer en root."
command -v pct  >/dev/null 2>&1 || die "'pct' introuvable — ce script tourne sur l'hôte Proxmox VE."
command -v pveam >/dev/null 2>&1 || die "'pveam' introuvable — Proxmox VE requis."

header

# ----- CTID (prochain libre si non fourni) -------------------
if [[ -z "${CTID:-}" ]]; then
  CTID="$(pvesh get /cluster/nextid 2>/dev/null || echo 100)"
fi
[[ -z "$(pct status "$CTID" 2>/dev/null)" ]] || die "La CT #${CTID} existe déjà — fournis un autre CTID."
msg_ok "ID de conteneur : ${CTID}"

# ----- 1. Template Debian ------------------------------------
msg_info "Recherche du template ${OS_TEMPLATE}…"
pveam update >/dev/null 2>&1 || true
TEMPLATE_FILE="$(pveam available --section system 2>/dev/null \
  | awk -v t="$OS_TEMPLATE" '$0 ~ t {print $NF}' | sort -V | tail -1)"
[[ -n "$TEMPLATE_FILE" ]] || die "Template '${OS_TEMPLATE}' introuvable via pveam."

if ! pveam list "$TEMPLATE_STORAGE" 2>/dev/null | grep -q "$TEMPLATE_FILE"; then
  msg_info "Téléchargement de ${TEMPLATE_FILE}…"
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE_FILE" >/dev/null \
    || die "Téléchargement du template échoué."
fi
msg_ok "Template prêt : ${TEMPLATE_FILE}"

# ----- 2. Création de la LXC ---------------------------------
# unprivileged + nesting/keyctl = nécessaire pour faire tourner Docker dans la CT.
msg_info "Création de la LXC #${CTID} (${CT_HOSTNAME} : ${CORES} vCPU, ${RAM_MB} Mo, ${DISK_GB} Go)…"
pct create "$CTID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE_FILE}" \
  --hostname "$CT_HOSTNAME" \
  --cores "$CORES" \
  --memory "$RAM_MB" \
  --swap 512 \
  --rootfs "${STORAGE}:${DISK_GB}" \
  --net0 "name=eth0,bridge=${BRIDGE},ip=dhcp" \
  --unprivileged 1 \
  --features "nesting=1,keyctl=1" \
  --onboot 1 >/dev/null \
  || die "pct create a échoué."
msg_ok "LXC créée"

msg_info "Démarrage…"
pct start "$CTID" >/dev/null || die "pct start a échoué."

# ----- 3. Attente du réseau dans la CT -----------------------
msg_info "Attente de la connectivité réseau…"
NET_OK=0
for _ in $(seq 1 30); do
  if pct exec "$CTID" -- getent hosts github.com >/dev/null 2>&1; then NET_OK=1; break; fi
  sleep 2
done
[[ "$NET_OK" == "1" ]] || die "Pas de réseau dans la LXC après 60s (vérifie le bridge/DHCP)."
msg_ok "Réseau opérationnel"

# ----- 4. Installation de FitQuest dans la CT ----------------
msg_info "Préparation (curl, git)…"
pct exec "$CTID" -- bash -c "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl git ca-certificates >/dev/null" \
  || die "Installation des prérequis échouée."

msg_info "Installation de Docker + FitQuest (peut prendre plusieurs minutes)…"
pct exec "$CTID" -- bash -c "curl -fsSL ${RAW_BASE}/scripts/install.sh | APP_PORT='${APP_PORT}' bash" \
  || die "L'installeur interne a échoué."

# ----- 5. Final ----------------------------------------------
IP="$(pct exec "$CTID" -- bash -c "hostname -I | awk '{print \$1}'" 2>/dev/null | tr -d '[:space:]')"
PORT_DISPLAY=$([[ "$APP_PORT" == "80" ]] && echo "" || echo ":${APP_PORT}")
echo
echo -e "${GN}${BOLD}════════════════════════════════════════════════${CL}"
echo -e "  ${GN}${BOLD}${APP} déployé dans la LXC #${CTID} !${CL}"
echo -e "  ${BOLD}URL        :${CL} ${GN}http://${IP}${PORT_DISPLAY}${CL}"
echo -e "  ${BOLD}Console    :${CL} pct enter ${CTID}"
echo -e "  ${BOLD}Mise à jour:${CL} ${YW}pct exec ${CTID} -- bash -c update${CL}"
echo -e "${GN}${BOLD}════════════════════════════════════════════════${CL}"
