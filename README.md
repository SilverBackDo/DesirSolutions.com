# Desir Solutions

Public repository for the Desir Solutions marketing site, trust materials, and deployment assets.

Desir Solutions LLC is a Washington-based, founder-led consulting business focused on:

- infrastructure assessments
- Terraform, Ansible, and CI/CD implementation
- Linux / RHEL, VMware, and hybrid-cloud modernization
- fractional infrastructure leadership for lean IT teams

The current launch path is the fixed-fee `Infrastructure Stability & Automation Assessment`.

## Current launch source of truth

Use these paths for the active launch system:

- `website/` - React + Vite production site
- `website/nginx/` - container runtime and TLS configs
- `ansible/`, `n8n/`, and `docs/n8n/` - n8n automation pack for the Docker + Traefik platform
- `n8n/workflows/` - CRM-linked workflow imports for lead qualification dispatch and sales digests
- `docs/` - architecture, security, operations, contract-summary, and archived reference docs
- `.github/workflows/validate.yml` - website validation
- `.github/workflows/deploy.yml` - website image publish and deploy workflow

## Repository posture

- `website/` is the day-one public site
- root-level static HTML and older platform assets are legacy material and are not the primary launch deployment source
- internal business operations, finance, contracts, and sales records belong in the private business repository

## Commercial identity

- legal entity: `Desir Solutions LLC`
- legal posture: `Washington limited liability company`
- public location language: `Maple Valley, Washington`
- sales model: `founder-led consulting first, implementation second, advisory third`

## Local validation

```bash
cd website
npm ci
npm run lint
npm run build
docker compose config
```

## Deployment model

- Proxmox LXC container (`proxy-ds01`, CT 114) runs the site
- website image published to GHCR by GitHub Actions and pulled on the host
- NGINX serves the built React app
- Cloudflare fronts the public domain for TLS and edge delivery

## Contact intake

The React site posts to `VITE_CONTACT_ENDPOINT`, defaulting to `/api/contact`.

For launch, either:

- reverse proxy `/api/contact` to the CRM backend
- set `VITE_CONTACT_ENDPOINT` to a live intake endpoint before build
- accept direct email fallback as the temporary intake path
