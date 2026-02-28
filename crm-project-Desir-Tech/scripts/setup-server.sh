#!/bin/bash
# ─── Oracle VM Initial Setup Script ───
# Run once after provisioning your Oracle Free VM
# Usage: chmod +x setup-server.sh && ./setup-server.sh
# ─────────────────────────────────────────

set -e

echo "=== DesirTech CRM Server Setup ==="
echo ""

# 1. Update system
echo "[1/6] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "[2/6] Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 3. Install Nginx
echo "[3/6] Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx

# 4. Install Certbot
echo "[4/6] Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 5. Configure Firewall
echo "[5/6] Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable

# 6. Create directories
echo "[6/6] Creating directories..."
mkdir -p ~/crm-project
mkdir -p ~/backups
mkdir -p ~/scripts

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Log out and back in (for Docker group to take effect)"
echo "  2. Copy nginx/crm.conf to /etc/nginx/sites-available/crm"
echo "  3. Enable Nginx site: sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/"
echo "  4. Push code to GitHub → GitHub Actions will deploy"
echo "  5. Run: sudo certbot --nginx -d yourdomain.com"
echo ""
