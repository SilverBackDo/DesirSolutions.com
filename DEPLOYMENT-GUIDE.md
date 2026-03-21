# Desir Solutions Oracle Cloud Deployment Guide

**Project:** Desir Solutions Website + CRM Backend
**Source of Truth:** `Desirtech` root (infrastructure + deployment)
**Target:** Oracle Cloud Infrastructure (OCI) Always Free Tier
**OS:** Oracle Linux 8 or 9 (ARM / Ampere A1)
**Stack:** nginx + FastAPI + PostgreSQL 16 + Docker Compose + Let's Encrypt SSL

**DB Initialization:** `scripts/apply-db-schema.sh` applies canonical schema, seed data, and operational views.

---

## Prerequisites

- Oracle Cloud account (Always Free tier is sufficient)
- Domain name pointed to your control (desirsolutions.com)
- Git repository containing the Desirtech project
- SSH client on your local machine

---

## Phase 1 — Create the VM

1. Log in to the OCI Console at cloud.oracle.com
2. Navigate to **Compute → Instances → Create Instance**
3. Configure:

| Setting     | Value                               |
| ----------- | ----------------------------------- |
| Name        | desir-web                           |
| Image       | Oracle Linux 8 (or 9)               |
| Shape       | VM.Standard.A1.Flex (ARM)           |
| OCPUs       | 4 (Always Free allows up to 4)      |
| Memory      | 24 GB (Always Free allows up to 24) |
| Boot Volume | 200 GB (Always Free max)            |
| SSH Key     | Upload or paste your public key     |

4. Click **Create** and wait for the instance to reach RUNNING state
5. Copy the **Public IP Address** from the instance details page

---

## Phase 2 — Open Network Ports

OCI blocks all ingress traffic by default. You must open ports at two levels.

### 2a. Security List (VCN Level)

1. Go to **Networking → Virtual Cloud Networks**
2. Click your VCN → click your **Public Subnet** → click the **Security List**
3. Add two **Ingress Rules**:

| Source CIDR | Protocol | Dest Port | Description |
| ----------- | -------- | --------- | ----------- |
| 0.0.0.0/0   | TCP      | 80        | HTTP        |
| 0.0.0.0/0   | TCP      | 443       | HTTPS       |

4. SSH (port 22) should already be open by default

### 2b. OS-Level Firewall

The bootstrap script handles this automatically (iptables + firewalld). No manual action needed here.

---

## Phase 3 — SSH Into the VM

```bash
ssh opc@<your-vm-public-ip>
```

The default user on Oracle Linux OCI images is `opc` with sudo privileges.

---

## Phase 4 — Run the Bootstrap Script

Transfer the script to the VM or clone the repo first, then run:

```bash
REPO_URL=https://github.com/SilverBackDo/DesirSolutions.com.git \
DOMAIN=desirsolutions.com \
EMAIL=contact@desirsolutions.com \
bash bootstrap-oci-vm.sh
```

### What the script does (12 steps):

| Step  | Action                                                                  |
| ----- | ----------------------------------------------------------------------- |
| 1/12  | Verifies Oracle Linux                                                   |
| 2/12  | System update, installs base packages (git, curl, openssl)             |
| 3/12  | Installs Docker CE from the CentOS/RHEL repository                     |
| 4/12  | Opens ports 80 and 443 in OCI's default iptables rules                 |
| 5/12  | Configures firewalld for SSH, HTTP, HTTPS                              |
| 6/12  | Clones the repo to /opt/desir/Desirtech                                |
| 7/12  | Generates `.env` with DB/app/admin credentials (`chmod 600`)           |
| 8/12  | Creates certbot directories for SSL certificates                        |
| 9/12  | Ensures temporary TLS files exist for first boot                        |
| 10/12 | Builds and starts all Docker containers                                 |
| 11/12 | Applies canonical DB schema + views (`01_full_schema`, seeds, views)   |
| 12/12 | Prints DNS and SSL next steps                                           |

### Environment variables:

| Variable | Required | Default                    | Description                   |
| -------- | -------- | -------------------------- | ----------------------------- |
| REPO_URL | Yes      | —                         | Git repository URL            |
| DOMAIN   | No       | desirsolutions.com         | Primary domain                |
| EMAIL    | No       | contact@desirsolutions.com | SSL certificate notifications |
| CRM_ADMIN_USER | No | admin | Initial CRM admin username written to `.env` |
| CRM_ADMIN_PASS | No | random | Initial CRM admin password written to `.env` |

### Rotate CRM Admin Password After Bootstrap

On the VM, generate a new strong password:

```bash
cd /opt/desir/Desirtech
docker compose exec -T backend python -c 'import secrets, string; chars = string.ascii_letters + string.digits + "-_"; print("CRM_ADMIN_PASSWORD=" + "".join(secrets.choice(chars) for _ in range(32)))'
```

Update `/opt/desir/Desirtech/.env` with the new `CRM_ADMIN_PASSWORD`, then apply:

```bash
cd /opt/desir/Desirtech
docker compose up -d backend
```

Note: keep using `CRM_ADMIN_PASSWORD` for now. `CRM_ADMIN_PASSWORD_HASH` is available in config but depends on compatible `passlib`/`bcrypt` versions for reliable verification.

---

## Phase 5 — Configure DNS

At your domain registrar, create A records pointing to the VM's public IP:

| Record Type | Host | Value            |
| ----------- | ---- | ---------------- |
| A           | @    | \<VM Public IP\> |
| A           | www  | \<VM Public IP\> |

DNS propagation typically takes 5–30 minutes. Verify with:

```bash
dig desirsolutions.com +short
dig www.desirsolutions.com +short
```

Both should return your VM's public IP.

---

## Phase 6 — SSL Certificate

Once DNS is resolving, run on the VM:

```bash
cd /opt/desir/Desirtech

docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d desirsolutions.com \
  -d www.desirsolutions.com \
  -m contact@desirsolutions.com \
  --agree-tos --non-interactive
```

Then reload nginx to pick up the certificates:

```bash
docker compose restart frontend
```

SSL certificates auto-renew via the certbot container (checks every 12 hours).

---

## Architecture

```
                  Internet
                     │
                     ▼
            ┌────────────────┐
            │   OCI VM       │
            │   (Oracle Linux)│
            │                │
            │  ┌───────────┐ │
            │  │  nginx    │ │  ← ports 80/443
            │  │ (frontend)│ │  ← SSL termination
            │  └─────┬─────┘ │  ← static HTML + reverse proxy
            │        │       │
            │  ┌─────▼─────┐ │
            │  │  FastAPI   │ │  ← port 8000 (internal)
            │  │ (backend)  │ │  ← /api/* routes
            │  └─────┬─────┘ │
            │        │       │
            │  ┌─────▼─────┐ │
            │  │ PostgreSQL │ │  ← port 5432 (internal)
            │  │    16      │ │  ← persistent volume
            │  └───────────┘ │
            └────────────────┘
```

### Docker Services

| Service  | Image                     | Ports           | Purpose                           |
| -------- | ------------------------- | --------------- | --------------------------------- |
| frontend | nginx:alpine (custom)     | 80, 443         | Static site + reverse proxy + SSL |
| backend  | python:3.11-slim (custom) | 8000 (internal) | FastAPI CRM API                   |
| db       | postgres:16-alpine        | 5432 (internal) | PostgreSQL database               |
| certbot  | certbot/certbot           | —              | SSL certificate renewal           |

---

## File Locations on the VM

| Path                               | Contents                                |
| ---------------------------------- | --------------------------------------- |
| /opt/desir/Desirtech/              | Project root                            |
| /opt/desir/Desirtech/.env          | Credentials (auto-generated, chmod 600) |
| /opt/desir/Desirtech/certbot/conf/ | SSL certificates                        |
| /opt/desir/Desirtech/certbot/www/  | ACME challenge files                    |

---

## Common Operations

### View running containers

```bash
cd /opt/desir/Desirtech
docker compose ps
```

### View logs

```bash
docker compose logs frontend    # nginx
docker compose logs backend     # FastAPI
docker compose logs db          # PostgreSQL
docker compose logs -f          # all services, follow
```

### Restart after code changes

```bash
cd /opt/desir/Desirtech
git pull
docker compose down
docker compose up -d --build
```

### Check database

```bash
docker compose exec db psql -U desiruser -d desir
```

### Manual SSL renewal

```bash
docker compose run --rm certbot renew
docker compose restart frontend
```

### Check disk usage

```bash
df -h
docker system df
```

---

## Troubleshooting

| Problem                                | Cause                                   | Fix                                                                                                 |
| -------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Site unreachable from browser          | OCI Security List missing ingress rules | Add TCP 80/443 ingress rules in VCN Security List                                                   |
| Site unreachable despite Security List | OS iptables blocking                    | Re-run:`sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT` (same for 443) |
| SSL cert fails to issue                | DNS not pointing to VM                  | Verify with `dig desirsolutions.com` — must return VM's public IP                                |
| SSL cert fails (rate limit)            | Too many requests to Let's Encrypt      | Wait 1 hour, retry. Add `--staging` flag to test first                                            |
| Backend API returns 502                | Backend container not running           | Check `docker compose logs backend`                                                               |
| Database connection refused            | DB not healthy yet                      | Check `docker compose ps` — db should show "healthy"                                             |
| Cannot SSH                             | Security List or iptables               | Verify port 22 is open in Security List                                                             |

---

## Database Backups

### Setup automated daily backups

Copy the backup script to the VM and configure cron:

```bash
mkdir -p ~/scripts ~/backups
cp /opt/desir/Desirtech/scripts/backup-db.sh ~/scripts/
chmod +x ~/scripts/backup-db.sh
```

Add to crontab (runs daily at 2:00 AM):

```bash
crontab -e
```

Add this line:

```
0 2 * * * /home/opc/scripts/backup-db.sh >> /home/opc/backups/backup.log 2>&1
```

### What the backup script does

1. Verifies the `desir-db` container is running
2. Runs `pg_dump` to export the database
3. Verifies the dump file is not empty
4. Compresses with gzip
5. Deletes backups older than 7 days

### Manual backup

```bash
~/scripts/backup-db.sh
```

### Restore from backup

```bash
gunzip -k ~/backups/desir_backup_2026-02-28_0200.sql.gz
docker exec -i desir-db psql -U desiruser -d desir < ~/backups/desir_backup_2026-02-28_0200.sql
```

---

## Resource Limits

All containers are memory and CPU limited to prevent any single service from exhausting the VM:

| Service           | Memory Limit    | CPU Limit |
| ----------------- | --------------- | --------- |
| frontend (nginx)  | 512 MB          | 0.50      |
| backend (FastAPI) | 2 GB            | 1.50      |
| db (PostgreSQL)   | 4 GB            | 1.50      |
| certbot           | 128 MB          | 0.25      |
| OS + Docker       | ~17 GB headroom | 0.25      |

### Monitor resource usage

```bash
docker stats --no-stream
```

### Check if a container was killed (OOM)

```bash
docker inspect desir-backend --format='{{.State.OOMKilled}}'
```

---

## Log Management

All containers use the `json-file` log driver with rotation to prevent disk fill:

| Service  | Max Log Size | Max Files | Total Cap |
| -------- | ------------ | --------- | --------- |
| frontend | 10 MB        | 3         | 30 MB     |
| backend  | 25 MB        | 5         | 125 MB    |
| db       | 25 MB        | 5         | 125 MB    |
| certbot  | 5 MB         | 2         | 10 MB     |

### View recent logs

```bash
docker compose logs --tail=100 backend    # last 100 lines
docker compose logs --since=1h backend    # last hour
docker compose logs -f                    # follow all
```

### Check disk usage

```bash
df -h                  # filesystem
docker system df       # Docker-specific
du -sh ~/backups       # backup directory
```

### Clean up Docker disk space

```bash
docker system prune -f          # remove stopped containers, unused networks
docker image prune -f           # remove dangling images
docker builder prune -f         # remove build cache
```

---

## Health Checks

All services have health checks configured. Docker will automatically restart unhealthy containers.

| Service  | Health Endpoint                     | Interval | Timeout |
| -------- | ----------------------------------- | -------- | ------- |
| frontend | wget https://127.0.0.1/             | 30s      | 5s      |
| backend  | python urllib localhost:8000/health | 30s      | 10s     |
| db       | pg_isready                          | 10s      | 5s      |

For `docker-compose.local.yml`, frontend health check uses `http://127.0.0.1/`.

### Check health status

```bash
docker compose ps    # STATUS column shows health
```

### API health endpoints

```bash
# Through nginx reverse proxy
curl https://desirsolutions.com/api/health
curl https://desirsolutions.com/api/health/db

# Direct backend container port (local/dev)
curl http://localhost:8000/health
curl http://localhost:8000/health/db
```

### Dashboard readiness

- Dashboard routes are fail-closed by design.
- If financial views are missing, `/api/dashboard/*` returns `503` with code `FIN_DASHBOARD_NOT_INITIALIZED`.
- Reapply schema/views:

```bash
cd /opt/desir/Desirtech
./scripts/apply-db-schema.sh
```

---

## Security Hardening Summary

### Infrastructure

- `.env` file created with `chmod 600` — only the deploying user can read it
- `.env` excluded from git via `.gitignore`
- `.dockerignore` files prevent secrets from entering Docker images
- Database and backend ports (5432, 8000) are internal only — not exposed to the internet
- Backend runs as non-root user (`appuser`) inside the container
- Backend Dockerfile uses multi-stage build (no compiler in production image)
- Container resources are capped to prevent resource exhaustion
- Log rotation prevents disk fill

### Nginx

- `server_tokens off` — hides nginx version from responses
- HTTP automatically redirected to HTTPS
- SSL protocols limited to TLS 1.2 and 1.3
- SSL session caching enabled for performance
- Rate limiting: 10 req/s for pages, 5 req/s for API (with burst buffers)
- `client_max_body_size 1m` — prevents oversized uploads
- Gzip compression for text, CSS, JS, JSON, SVG, fonts
- Custom error pages for 429, 502, 503 (no server information leaked)

### Security Headers

| Header                    | Value                                                |
| ------------------------- | ---------------------------------------------------- |
| Strict-Transport-Security | max-age=31536000; includeSubDomains                  |
| Content-Security-Policy   | default-src 'self'; restricted directives            |
| X-Frame-Options           | SAMEORIGIN                                           |
| X-Content-Type-Options    | nosniff                                              |
| X-XSS-Protection          | 1; mode=block                                        |
| Referrer-Policy           | strict-origin-when-cross-origin                      |
| Permissions-Policy        | camera=(), microphone=(), geolocation=(), payment=() |

### Application

- No insecure defaults — `db_password`, `secret_key`, and CRM admin credentials must be set via environment
- Production auth path uses `CRM_ADMIN_PASSWORD` from `.env` (`chmod 600` file permissions)
- Debug mode defaults to `false` in production
- Swagger/ReDoc API docs disabled in production (only available when `DEBUG=true`)
- CORS restricted to specific origins, methods, and headers
- CRM protected endpoints support JWT bearer auth for users (API key kept for automation fallback)
- All input fields have `max_length` validation (prevents memory exhaustion)
- Pagination capped at 100 results per request
- Global exception handler returns generic errors (no stack traces to clients)
- Health endpoint returns HTTP 503 when database is unreachable
- All dependencies pinned to exact versions

### Database

- Connection pool: 10 connections, 5 overflow, 30s timeout, 30-minute recycle
- `pool_pre_ping` enabled to validate connections before use
- Daily automated backups with 7-day retention
- Backup script validates container state and dump integrity

---

## OCI Always Free Tier Limits

| Resource      | Limit       | This Deployment         |
| ------------- | ----------- | ----------------------- |
| ARM OCPUs     | 4 total     | 4 (full allocation)     |
| ARM Memory    | 24 GB total | 24 GB (full allocation) |
| Boot Volume   | 200 GB      | 200 GB                  |
| Outbound Data | 10 TB/month | Well within limit       |
| Public IPs    | 2           | 1 used                  |

No charges will be incurred as long as you stay within Always Free limits and select Always Free eligible shapes.

---

**END OF DEPLOYMENT GUIDE**
