# Desir Solutions Website Deployment Guide

Current deployment source of truth:

- `website/`
- `website/nginx/default.conf`
- `website/nginx/default.ssl.conf`
- `infrastructure/terraform/`

This guide is for the current launch system only: React marketing site, OCI VM, Docker runtime, and NGINX TLS termination.

## 1. Local validation

From `website/`:

```bash
npm ci
npm run lint
npm run build
docker compose config
docker compose up --build -d
curl -i http://localhost:8080/healthz
curl -I http://localhost:8080
docker compose ps
```

Expected results:

- build completes without errors
- `docker compose config` exits `0`
- `/healthz` returns `HTTP/1.1 200 OK`
- `docker compose ps` shows the container as `healthy`
- `docker compose -f docker-compose.deploy.yml config` exits `0`
- `docker compose -f docker-compose.prod.yml config` exits `0`

Stop the local runtime:

```bash
docker compose down
```

## 2. OCI infrastructure

From `infrastructure/terraform/environments/prod`:

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

This provisions:

- VCN
- public subnet
- internet gateway
- NSG with `80/443` public and `22` restricted to approved CIDRs
- Oracle Linux 9 VM on the configured production shape

## 3. Image publishing and first HTTP bootstrap on the VM

The production VM does not build the website locally. GitHub Actions builds and publishes the website image to GHCR. The founder then deploys that image from an allowlisted admin IP over SSH.

Run the `Publish Desir Solutions website image` workflow after the target commit lands on `main`.

After `terraform apply`, connect with the Terraform output:

```bash
ssh opc@PUBLIC_IP
```

The intended bootstrap path pulls the published website image and runs the HTTP compose file on port `80`.

Validate:

```bash
curl -i http://127.0.0.1/healthz
sudo docker ps
sudo docker logs desirsolutions-website --tail 50
```

## 4. DNS plan

Create these records at the registrar or DNS provider:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `PUBLIC_IP` |
| `A` | `www` | `PUBLIC_IP` |

Verify:

```bash
dig +short desirsolutions.com
dig +short www.desirsolutions.com
```

## 5. TLS issuance

Issue the certificate:

```bash
cd /opt/desir/DesirSolutions.com/website
sudo dnf install -y certbot
sudo certbot certonly --webroot \
  -w /opt/desir/DesirSolutions.com/website/certbot/www \
  -d desirsolutions.com \
  -d www.desirsolutions.com \
  -m contact@desirsolutions.com \
  --agree-tos \
  --non-interactive
```

## 6. HTTPS cutover

From `website/` on the VM:

```bash
cd /opt/desir/DesirSolutions.com/website
docker compose -f docker-compose.prod.yml up -d --build
```

This mounts:

- `website/nginx/default.ssl.conf`
- `/etc/letsencrypt`
- `/var/www/certbot`

Validate:

```bash
curl -I http://desirsolutions.com
curl -I https://desirsolutions.com
curl -I https://www.desirsolutions.com
curl -i https://desirsolutions.com/healthz
```

Expected results:

- `http://desirsolutions.com` returns `301` to `https://desirsolutions.com`
- `https://www.desirsolutions.com` returns `301` to `https://desirsolutions.com`
- `https://desirsolutions.com` returns `200`
- `/healthz` returns `200`

## 7. Contact intake

The website uses `VITE_CONTACT_ENDPOINT`.

Launch requires one of these:

- reverse proxy `/api/contact` to the CRM backend
- set `VITE_CONTACT_ENDPOINT` to a live intake endpoint before building
- accept the direct-email fallback temporarily

Do not launch the public form while assuming `/api/contact` exists if it is not actually routed.

## 8. GitHub Actions

GitHub-hosted runners cannot SSH into the OCI VM while SSH remains correctly restricted to your fixed admin CIDR. The automated workflow therefore publishes the website image only. Deploy the image from your allowlisted operator IP with the following runbook:

```bash
ssh opc@OCI_PUBLIC_IP
cd /opt/desir/DesirSolutions.com || git clone https://github.com/SilverBackDo/DesirSolutions.com.git /opt/desir/DesirSolutions.com
cd /opt/desir/DesirSolutions.com
git fetch --all --prune
git checkout main
git reset --hard origin/main
cd website
export DESIR_WEBSITE_IMAGE=ghcr.io/silverbackdo/desirsolutions-website:latest
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
docker inspect -f '{{.State.Health.Status}}' desirsolutions-website
```

## 9. Rollback

On the VM:

```bash
cd /opt/desir/DesirSolutions.com
git log --oneline -5
git checkout PREVIOUS_COMMIT
cd website
export DESIR_WEBSITE_IMAGE=ghcr.io/silverbackdo/desirsolutions-website:PREVIOUS_IMAGE_TAG
docker compose -f docker-compose.deploy.yml up -d
```

Then re-run:

```bash
curl -I https://desirsolutions.com
curl -i https://desirsolutions.com/healthz
```
