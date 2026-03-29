# Desir Solutions Website

Production-ready React + Vite marketing site for Desir Solutions LLC.

## Stack

- React 19
- Vite 8
- Tailwind CSS 4
- NGINX container for production serving

## Pages

- Home
- Assessment Offer
- Services
- About
- Trust
- Contact

## Local development

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

## Production build

```bash
npm run build
npm run lint
```

## Docker

```bash
docker compose up --build
```

Default container URL: `http://localhost:8080`

Validate the rendered container:

```bash
docker compose ps
curl -i http://localhost:8080/healthz
curl -I http://localhost:8080
```

Expected results:

- `docker compose ps` shows `healthy`
- `/healthz` returns `200 OK`
- `/` returns `200 OK`

## Production runtime

First HTTP bootstrap on the VM:

```bash
DESIR_WEBSITE_PORT=80 docker compose up -d --build
```

After DNS is resolving and certificates exist under `/etc/letsencrypt`, switch to HTTPS:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## TLS config

- `nginx/default.conf` is the HTTP and ACME bootstrap config.
- `nginx/default.ssl.conf` is the production TLS config for `desirsolutions.com` and `www.desirsolutions.com`.
- `certbot/www/` is the ACME challenge webroot used during certificate issuance.

## Contact endpoint

The contact form posts to `VITE_CONTACT_ENDPOINT`, defaulting to `/api/contact`.
Use `.env.example` as the local reference file.

For launch, one of these must be true:

- `/api/contact` is reverse proxied to the CRM backend
- `VITE_CONTACT_ENDPOINT` is set to a live intake endpoint at build time
- direct email fallback is accepted as the live intake path
