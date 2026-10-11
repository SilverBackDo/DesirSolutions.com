# Desir Solutions Website Deployment Guide

Current deployment source of truth:

- `website/`
- `website/nginx/default.conf`
- `website/nginx/default.ssl.conf`

This guide covers the current launch system: React marketing site built to a
container image, published to GHCR by GitHub Actions, and served from a Proxmox
LXC container (`proxy-ds01`, CT 114) behind Cloudflare for TLS and edge delivery.

> The previous Oracle Cloud (OCI) VM and its Terraform stack are decommissioned
> and have been removed from this repository.

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

Stop the local runtime:

```bash
docker compose down
```

## 2. Image publishing

The production host does not build the website locally. GitHub Actions builds
and publishes the website image to GHCR.

Run the `Publish and deploy Desir Solutions website image` workflow
(`.github/workflows/deploy.yml`) after the target commit lands on `main`, or let
it trigger automatically on changes under `website/`.

The published image is `ghcr.io/silverbackdo/desirsolutions-website:latest`
(plus the commit-SHA tag).

## 3. Deploy to the Proxmox host (CT 114 / proxy-ds01)

The site runs in CT 114 on the Proxmox estate (`10.225.1.114`). Deployment pulls
the published image and restarts the website container from
`website/docker-compose.deploy.yml`:

```bash
export DESIR_WEBSITE_IMAGE=ghcr.io/silverbackdo/desirsolutions-website:latest
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
docker inspect -f '{{.State.Health.Status}}' desirsolutions-website
```

## 4. DNS and TLS

DNS for `desirsolutions.com` and `www.desirsolutions.com` is managed in
Cloudflare, which also terminates TLS and fronts the origin. No on-host certbot
step is required; the origin container serves plain HTTP behind Cloudflare.

Verify DNS:

```bash
dig +short desirsolutions.com
dig +short www.desirsolutions.com
```

## 5. Validation

```bash
curl -I http://desirsolutions.com
curl -I https://desirsolutions.com
curl -I https://www.desirsolutions.com
curl -i https://desirsolutions.com/healthz
```

Expected results:

- `http://desirsolutions.com` returns `301` to `https://desirsolutions.com`
- `https://www.desirsolutions.com` returns `200`
- `https://desirsolutions.com` returns `200`
- `/healthz` returns `200`

## 6. Contact intake

The website uses `VITE_CONTACT_ENDPOINT`.

Launch requires one of these:

- reverse proxy `/api/contact` to the CRM backend
- set `VITE_CONTACT_ENDPOINT` to a live intake endpoint before building
- accept the direct-email fallback temporarily

Do not launch the public form while assuming `/api/contact` exists if it is not
actually routed.

## 7. Rollback

Redeploy a previous image tag on the host:

```bash
export DESIR_WEBSITE_IMAGE=ghcr.io/silverbackdo/desirsolutions-website:PREVIOUS_IMAGE_TAG
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
```

Then re-run:

```bash
curl -I https://desirsolutions.com
curl -i https://desirsolutions.com/healthz
```
