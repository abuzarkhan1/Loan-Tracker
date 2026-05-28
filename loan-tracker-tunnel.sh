#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]  $1${NC}"; }
success() { echo -e "${GREEN}[OK]    $1${NC}"; }
warn()    { echo -e "${YELLOW}[WARN]  $1${NC}"; }
error()   { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

# ─── Root check ───────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Please run as root: sudo bash loan-tracker-tunnel.sh"
fi

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(eval echo "~$REAL_USER")
CF_DIR="$REAL_HOME/.cloudflared"

# ─── Loan Tracker API config ──────────────────────────────────
API_DOMAIN="api.marenax.site"   # <-- change karo agar alag subdomain chahiye
API_HOST="localhost"             # API same machine pe hai (host network mode)
API_PORT=5050

API_SERVICE="http://${API_HOST}:${API_PORT}"

log "Adding $API_DOMAIN → $API_SERVICE to existing oldarena tunnel..."

# ─── Config file check ────────────────────────────────────────
CONFIG_FILE="$CF_DIR/config.yml"
if [ ! -f "$CONFIG_FILE" ]; then
  error "Config not found at $CONFIG_FILE — check path manually."
fi

# ─── Duplicate check ──────────────────────────────────────────
if grep -q "$API_DOMAIN" "$CONFIG_FILE"; then
  warn "$API_DOMAIN already exists in config — skipping inject."
else
  log "Injecting ingress rule into config..."
  sed -i "/- service: http_status:404/i\\  - hostname: $API_DOMAIN\n    service: $API_SERVICE" "$CONFIG_FILE"
  success "Ingress rule added."
fi

# ─── Sync to /etc/cloudflared/ ───────────────────────────────
log "Syncing config to /etc/cloudflared/config.yml ..."
cp "$CONFIG_FILE" /etc/cloudflared/config.yml
success "Config synced."

# ─── DNS route ────────────────────────────────────────────────
log "Adding DNS CNAME for $API_DOMAIN ..."
sudo -u "$REAL_USER" cloudflared tunnel route dns oldarena "$API_DOMAIN" 2>/dev/null \
  && success "DNS route added: $API_DOMAIN" \
  || warn "$API_DOMAIN DNS already exists — skipping."

# ─── Restart cloudflared ─────────────────────────────────────
log "Restarting cloudflared service..."
systemctl restart cloudflared
sleep 2

if systemctl is-active --quiet cloudflared; then
  success "cloudflared restarted successfully."
else
  error "cloudflared failed to restart. Check: sudo systemctl status cloudflared"
fi

# ─── Health check ─────────────────────────────────────────────
log "Verifying API health endpoint..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_DOMAIN/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  success "Health check passed — API is responding."
elif [ "$HTTP_STATUS" = "000" ]; then
  warn "Could not reach https://$API_DOMAIN/health — DNS may still be propagating (wait ~1 min)."
else
  warn "Health check returned HTTP $HTTP_STATUS — verify manually."
fi

# ─── Final output ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ Done! Loan Tracker API is now live at: https://$API_DOMAIN${NC}"
echo ""
echo "Use this base URL in your React Native app:"
echo -e "  ${YELLOW}https://$API_DOMAIN${NC}"
echo ""
echo "Test endpoints:"
echo "  curl https://$API_DOMAIN/health"
echo "  curl https://$API_DOMAIN/api/..."
echo ""
echo "Useful commands:"
echo "  sudo systemctl status cloudflared"
echo "  sudo cat $CF_DIR/config.yml"
echo "  docker ps | grep loan-tracker"