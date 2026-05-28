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
  error "Please run as root: sudo bash fix-tunnel.sh"
fi

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(eval echo "~$REAL_USER")
CF_DIR="$REAL_HOME/.cloudflared"
CONFIG_FILE="$CF_DIR/config.yml"

OLD_DOMAIN="api.marenax.site"
NEW_DOMAIN="tracker.marenax.site"
API_SERVICE="http://localhost:5050"

# ─── Config file check ────────────────────────────────────────
if [ ! -f "$CONFIG_FILE" ]; then
  error "Config not found at $CONFIG_FILE"
fi

log "Current config:"
cat "$CONFIG_FILE"
echo ""

# ─── Remove old api.marenax.site entry ───────────────────────
if grep -q "$OLD_DOMAIN" "$CONFIG_FILE"; then
  log "Removing $OLD_DOMAIN from config..."
  # Remove the two lines: hostname line and service line for api.marenax.site
  sed -i "/$OLD_DOMAIN/{N;d;}" "$CONFIG_FILE"
  success "Removed $OLD_DOMAIN entry."
else
  warn "$OLD_DOMAIN not found in config — nothing to remove."
fi

# ─── Add new tracker.marenax.site entry ──────────────────────
if grep -q "$NEW_DOMAIN" "$CONFIG_FILE"; then
  warn "$NEW_DOMAIN already exists in config — skipping inject."
else
  log "Injecting $NEW_DOMAIN → $API_SERVICE into config..."
  sed -i "/- service: http_status:404/i\\  - hostname: $NEW_DOMAIN\n    service: $API_SERVICE" "$CONFIG_FILE"
  success "Ingress rule added for $NEW_DOMAIN."
fi

# ─── Show updated config ──────────────────────────────────────
log "Updated config:"
cat "$CONFIG_FILE"
echo ""

# ─── Sync to /etc/cloudflared/ ───────────────────────────────
log "Syncing config to /etc/cloudflared/config.yml ..."
cp "$CONFIG_FILE" /etc/cloudflared/config.yml
success "Config synced."

# ─── Delete old DNS CNAME ─────────────────────────────────────
log "Removing DNS CNAME for $OLD_DOMAIN ..."
sudo -u "$REAL_USER" cloudflared tunnel route dns oldarena "$OLD_DOMAIN" --overwrite-dns 2>/dev/null \
  && warn "Note: cloudflared does not support DNS deletion via CLI. Delete $OLD_DOMAIN manually from Cloudflare Dashboard → DNS." \
  || warn "Could not auto-delete $OLD_DOMAIN DNS — delete manually from Cloudflare Dashboard → DNS."

# ─── Add new DNS CNAME ────────────────────────────────────────
log "Adding DNS CNAME for $NEW_DOMAIN ..."
sudo -u "$REAL_USER" cloudflared tunnel route dns oldarena "$NEW_DOMAIN" 2>/dev/null \
  && success "DNS route added: $NEW_DOMAIN" \
  || warn "$NEW_DOMAIN DNS already exists — skipping."

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
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$NEW_DOMAIN/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  success "Health check passed — API is live!"
elif [ "$HTTP_STATUS" = "000" ]; then
  warn "Could not reach https://$NEW_DOMAIN/health — DNS may still propagate (~1 min). Try again shortly."
else
  warn "Health check returned HTTP $HTTP_STATUS — DNS may still be propagating."
fi

# ─── Final output ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo -e "  OLD (removed): ${RED}https://$OLD_DOMAIN${NC}"
echo -e "  NEW (active):  ${GREEN}https://$NEW_DOMAIN${NC}"
echo ""
echo "⚠️  Also delete $OLD_DOMAIN from Cloudflare Dashboard → DNS manually."
echo ""
echo "Use this base URL in your React Native app:"
echo -e "  ${YELLOW}https://$NEW_DOMAIN${NC}"
echo ""
echo "Test:"
echo "  curl https://$NEW_DOMAIN/health"