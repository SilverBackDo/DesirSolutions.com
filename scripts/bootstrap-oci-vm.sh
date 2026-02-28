#!/usr/bin/env bash
set -euo pipefail

# Desir Solutions - OCI VM bootstrap (Oracle Linux 8/9)
# Run as the opc user on a fresh Oracle Cloud Always Free ARM VM.
#
# Before running, set these variables or pass them as environment variables:
#   REPO_URL - Your git repository URL
#   DOMAIN   - Your domain (e.g., desirsolutions.com)
#   EMAIL    - Email for SSL certificate notifications
#
# Usage:
#   REPO_URL=https://github.com/SilverBackDo/DesirSolutions.com.git bash bootstrap-oci-vm.sh

APP_DIR="/opt/desir/Desirtech"
REPO_URL="${REPO_URL:?Set REPO_URL before running this script}"
DOMAIN="${DOMAIN:-desirsolutions.com}"
EMAIL="${EMAIL:-contact@desirsolutions.com}"

echo "[1/10] Verify Oracle Linux"
if [ ! -f /etc/oracle-release ] && ! grep -qi oracle /etc/os-release 2>/dev/null; then
  echo "WARNING: This does not appear to be Oracle Linux."
  echo "The script is designed for Oracle Linux 8/9 on OCI."
  read -rp "Continue anyway? (y/N) " yn
  [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

echo "[2/10] System update and base packages"
sudo dnf -y update
sudo dnf -y install ca-certificates curl git dnf-plugins-core tar openssl

echo "[3/10] Docker install"
# Oracle Linux uses the CentOS/RHEL Docker repo, not Fedora
OL_VERSION=$(rpm -E %{rhel})
sudo dnf config-manager --add-repo "https://download.docker.com/linux/centos/docker-ce.repo" || true
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

echo "[4/10] Open OCI iptables rules"
# Oracle Cloud images ship with iptables rules that block ports 80/443.
# These must be opened IN ADDITION to any OCI Security List / NSG rules.
if sudo iptables -L INPUT -n 2>/dev/null | grep -q "DROP"; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
  sudo netfilter-persistent save 2>/dev/null || sudo /sbin/service iptables save 2>/dev/null || true
  echo "  iptables rules added for ports 80 and 443"
else
  echo "  No restrictive iptables rules detected, skipping"
fi

echo "[5/10] Firewalld setup"
if command -v firewall-cmd >/dev/null 2>&1; then
  sudo systemctl enable --now firewalld
  sudo firewall-cmd --permanent --add-service=ssh
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
  echo "  firewalld configured"
else
  echo "  firewalld not found, relying on iptables + OCI Security Lists"
fi

echo "[6/10] App directory"
sudo mkdir -p /opt/desir
sudo chown -R "$USER":"$USER" /opt/desir
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR" && git pull
fi

echo "[7/10] Create .env file (if not present)"
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 48)
  cat > "$APP_DIR/.env" <<ENVEOF
DB_HOST=db
DB_PORT=5432
DB_NAME=desir
DB_USER=desiruser
DB_PASSWORD=${DB_PASS}
SECRET_KEY=${SECRET}
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
ENV=production
DEBUG=false
ENVEOF
  chmod 600 "$APP_DIR/.env"
  echo "  .env created with generated credentials (chmod 600)"
else
  echo "  .env already exists, skipping"
fi

echo "[8/10] Create certbot directories"
mkdir -p "$APP_DIR/certbot/conf" "$APP_DIR/certbot/www"

echo "[9/10] Deploy containers"
cd "$APP_DIR"
docker compose down || true
docker compose up -d --build

echo "[10/10] SSL certificate setup"
echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. In OCI Console, make sure your Security List / NSG allows"
echo "   ingress on TCP ports 80 and 443 from 0.0.0.0/0"
echo ""
echo "2. Point DNS A records to this VM's public IP:"
echo "   ${DOMAIN}       -> $(curl -s ifconfig.me || echo '<public-ip>')"
echo "   www.${DOMAIN}   -> $(curl -s ifconfig.me || echo '<public-ip>')"
echo ""
echo "3. Once DNS propagates, get SSL certificates:"
echo "   cd $APP_DIR"
echo "   docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} -d www.${DOMAIN} -m ${EMAIL} --agree-tos --non-interactive"
echo ""
echo "4. Restart nginx to load certs:"
echo "   docker compose restart frontend"
echo ""
echo "Bootstrap complete."
