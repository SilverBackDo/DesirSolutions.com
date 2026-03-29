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

CERT_DIR="$APP_DIR/certbot/conf/live/${DOMAIN}"
FULLCHAIN_PATH="$CERT_DIR/fullchain.pem"
PRIVKEY_PATH="$CERT_DIR/privkey.pem"

echo "[1/13] Verify Oracle Linux"
if [ ! -f /etc/oracle-release ] && ! grep -qi oracle /etc/os-release 2>/dev/null; then
  echo "WARNING: This does not appear to be Oracle Linux."
  echo "The script is designed for Oracle Linux 8/9 on OCI."
  read -rp "Continue anyway? (y/N) " yn
  [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

echo "[2/13] System update and base packages"
sudo dnf -y update
sudo dnf -y install ca-certificates curl git dnf-plugins-core tar openssl

echo "[3/13] Docker install"
# Oracle Linux uses the CentOS/RHEL Docker repo, not Fedora
OL_VERSION=$(rpm -E %{rhel})
sudo dnf config-manager --add-repo "https://download.docker.com/linux/centos/docker-ce.repo" || true
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

echo "[4/13] Open OCI iptables rules"
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

echo "[5/13] Firewalld setup"
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

echo "[6/13] App directory"
sudo mkdir -p /opt/desir
sudo chown -R "$USER":"$USER" /opt/desir
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR" && git pull
fi

echo "[7/13] Create .env file (if not present)"
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 48)
  JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 48)
  API_KEY=$(openssl rand -base64 32 | tr -d '/+=' | head -c 48)
  PGADMIN_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  CRM_ADMIN_USER="${CRM_ADMIN_USER:-admin}"
  CRM_ADMIN_PASS="${CRM_ADMIN_PASS:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)}"
  cat > "$APP_DIR/.env" <<ENVEOF
DB_HOST=db
DB_PORT=5432
DB_NAME=desir
DB_USER=desiruser
DB_PASSWORD=${DB_PASS}
SECRET_KEY=${SECRET}
AUTH_JWT_SECRET=${JWT_SECRET}
AUTOMATION_API_KEY=${API_KEY}
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
AUTH_JWT_ALGORITHM=HS256
AUTH_ACCESS_TOKEN_EXP_MINUTES=480
CRM_ADMIN_USERNAME=${CRM_ADMIN_USER}
CRM_ADMIN_PASSWORD=${CRM_ADMIN_PASS}
ENV=production
DEBUG=false
AI_FACTORY_PRIMARY_PROVIDER=openai
AI_FACTORY_REQUIRE_HUMAN_APPROVAL=true
AI_FACTORY_QUEUE_NAME=ai_factory
AI_FACTORY_REDIS_URL=redis://redis:6379/0
AI_FACTORY_QUEUE_RECLAIM_IDLE_MS=300000
AI_OPENAI_MODEL=gpt-5.4-mini
AI_ANTHROPIC_MODEL=claude-sonnet-4-6
AI_MODEL_PRICING_JSON={"gpt-5.4-mini":{"input_per_1m_tokens_usd":"0.75","output_per_1m_tokens_usd":"4.50"},"claude-sonnet-4-6":{"input_per_1m_tokens_usd":"3.00","output_per_1m_tokens_usd":"15.00"}}
AI_COST_ALERT_PER_RUN_USD=0.02
AI_COST_ALERT_DAILY_USD=0.50
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CONTACT_NOTIFICATION_WEBHOOK_URL=
CONTACT_SUBMISSION_RATE_LIMIT_WINDOW_MINUTES=15
CONTACT_SUBMISSION_RATE_LIMIT_MAX=5
OPERATIONS_ALERT_WEBHOOK_URL=
OPERATIONS_ALERT_MIN_SEVERITY=high
OPERATIONS_ALERT_TIMEOUT_SECONDS=5
OPERATIONS_ALERT_ENABLED_ENVIRONMENTS=production,staging
OPERATIONS_ALERT_NOTIFY_UNHANDLED_EXCEPTIONS=true
OTEL_ENABLED=true
OTEL_SERVICE_NAME=desirtech-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318/v1/traces
BACKUP_DIR=/home/opc/backups
BACKUP_KEEP_DAYS=14
BACKUP_OFFSITE_SYNC_COMMAND=
PGADMIN_DEFAULT_EMAIL=admin@${DOMAIN}
PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASS}
ENVEOF
  chmod 600 "$APP_DIR/.env"
  echo "  .env created with generated credentials (chmod 600)"
  echo "  CRM admin username: ${CRM_ADMIN_USER}"
  echo "  CRM admin password: ${CRM_ADMIN_PASS}"
else
  echo "  .env already exists, skipping"
fi

echo "[8/13] Create certbot directories"
mkdir -p "$APP_DIR/certbot/conf" "$APP_DIR/certbot/www"
mkdir -p /home/"$USER"/backups

echo "[9/13] Create staging helper directories"
mkdir -p "$APP_DIR/certbot-staging/conf" "$APP_DIR/certbot-staging/www" "$APP_DIR/telemetry/staging-output"

echo "[10/13] Deploy containers"
cd "$APP_DIR"
if [ -f "$APP_DIR/scripts/deploy-stack.sh" ]; then
  chmod +x \
    "$APP_DIR/scripts/deploy-stack.sh" \
    "$APP_DIR/scripts/apply-db-schema.sh" \
    "$APP_DIR/scripts/launch-readiness.sh" \
    "$APP_DIR/scripts/run-lead-qualification-evals.sh" \
    "$APP_DIR/scripts/backup-db.sh" \
    "$APP_DIR/scripts/restore-db.sh" \
    "$APP_DIR/scripts/backup-restore-drill.sh" \
    "$APP_DIR/scripts/send-operational-alert.sh"
  STACK_ENV_FILE=.env \
  STACK_COMPOSE_FILES="docker-compose.yml" \
  STACK_DB_CONTAINER=desir-db \
  STACK_TLS_DOMAIN="$DOMAIN" \
  STACK_CERTBOT_ROOT=certbot/conf \
  STACK_ACME_WEBROOT=certbot/www \
  STACK_TELEMETRY_DIR=telemetry/output \
  STACK_READINESS_PUBLIC_BASE_URL=https://127.0.0.1 \
  STACK_READINESS_BACKEND_BASE_URL=http://127.0.0.1:8000 \
  STACK_CURL_INSECURE=true \
  STACK_RUN_EVALS=true \
  STACK_RUN_READINESS=false \
  STACK_READINESS_DECISION=reject \
  "$APP_DIR/scripts/deploy-stack.sh"
elif [ -f "$APP_DIR/scripts/apply-db-schema.sh" ]; then
  docker compose up -d --build --remove-orphans
  echo "[11/13] Apply database schema and dashboard views"
  chmod +x "$APP_DIR/scripts/apply-db-schema.sh"
  "$APP_DIR/scripts/apply-db-schema.sh"
else
  echo "  WARNING: deploy helper scripts not found; falling back to docker compose only"
  docker compose up -d --build --remove-orphans
fi

echo "[12/13] Wait for application health"
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null && curl -kfsS https://127.0.0.1/api/health >/dev/null; then
    echo "  application health checks passed"
    break
  fi
  if [ "$attempt" -eq 20 ]; then
    docker compose ps
    docker compose logs --tail=100 frontend backend ai-worker otel-collector
    echo "  ERROR: application health checks failed" >&2
    exit 1
  fi
  sleep 5
done

echo "[13/13] SSL certificate setup"
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
echo "3. Once DNS propagates, issue real certificates (replaces temporary cert):"
echo "   cd $APP_DIR"
echo "   docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} -d www.${DOMAIN} -m ${EMAIL} --agree-tos --non-interactive"
echo ""
echo "4. Restart nginx to load real certs:"
echo "   docker compose restart frontend"
echo ""
echo "Bootstrap complete."
