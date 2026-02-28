# DesirTech CRM

CRM + Client Portal running on Oracle Free VM with Docker, Nginx, and GitHub Actions CI/CD.

## Architecture

```
Internet → Nginx (HTTPS) → Docker Network (crm_network)
                             ├── Frontend (React)        :3000
                             ├── Backend  (FastAPI)       :8000
                             └── PostgreSQL (internal)    :5432
```

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend dev)
- Python 3.11+ (for backend dev)

### Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd crm-project

# Copy env file
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start everything
docker-compose up -d

# Check status
docker-compose ps
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## First Deploy Checklist (Oracle Free VM)

### Step 0 — Provision VM
- [ ] Sign up for Oracle Cloud Free Tier
- [ ] Launch Always Free VM (Ubuntu 22.04, ARM recommended)
- [ ] Add SSH public key
- [ ] Note public IP address

### Step 1 — Connect & Update
```bash
ssh ubuntu@YOUR_VM_IP
sudo apt update && sudo apt upgrade -y
```

### Step 2 — Install Essentials
```bash
# Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Nginx & Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 3 — Configure GitHub Secrets
Add in your repo → Settings → Secrets → Actions:
| Secret | Value |
|---|---|
| `SERVER_IP` | Oracle VM public IP |
| `SERVER_USER` | `ubuntu` |
| `SSH_KEY` | Private SSH key |
| `DB_PASSWORD` | Strong PostgreSQL password |
| `SECRET_KEY` | Random app secret key |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` |

### Step 4 — Setup Nginx on Server
```bash
# Copy nginx/crm.conf to server
sudo cp crm.conf /etc/nginx/sites-available/crm
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5 — Deploy
```bash
git push origin main
# GitHub Actions deploys automatically
```

### Step 6 — SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

### Step 7 — Verify
- [ ] Frontend loads at https://yourdomain.com
- [ ] API responds at https://yourdomain.com/api/clients/
- [ ] Health check at https://yourdomain.com/health

---

## Daily Operations

| Task | Command |
|---|---|
| Check containers | `docker ps` |
| View backend logs | `docker logs -f crm_backend` |
| View frontend logs | `docker logs -f crm_frontend` |
| DB backup | `docker exec crm_db pg_dump -U crmuser crm > backup_$(date +%F).sql` |
| Disk usage | `df -h` |
| Firewall status | `sudo ufw status` |
| SSL renewal test | `sudo certbot renew --dry-run` |

### Automated Backup (Cron)
```bash
# Add to crontab: crontab -e
0 2 * * * docker exec crm_db pg_dump -U crmuser crm > /home/ubuntu/backups/backup_$(date +\%F).sql
```

---

## Project Structure

```
crm-project/
├── backend/
│   ├── Dockerfile
│   ├── .env / .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # FastAPI entry point
│       ├── config.py         # Settings from env
│       ├── database.py       # SQLAlchemy engine
│       ├── models.py         # DB models
│       ├── schemas.py        # Pydantic schemas
│       └── routes/
│           ├── health.py     # Health check endpoints
│           └── clients.py    # Client CRUD
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf            # Container Nginx config
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js            # Main React app
│       ├── App.css
│       ├── index.js
│       └── index.css
├── nginx/
│   └── crm.conf              # Server Nginx reverse proxy config
├── docker-compose.yml
├── .gitignore
├── .github/
│   └── workflows/
│       ├── backend.yml       # Backend CI/CD
│       └── frontend.yml      # Frontend CI/CD
└── README.md
```

---

## Key Security Notes

- PostgreSQL is **internal only** — never exposed publicly
- All containers share `crm_network` — isolated Docker bridge
- Nginx handles HTTPS termination — backend communicates over plain HTTP internally
- Secrets stored in GitHub Actions Secrets — never committed to repo
- Firewall allows only ports 22, 80, 443

## Cost

**$0** — Oracle Free Tier VM + GitHub Actions + Let's Encrypt
