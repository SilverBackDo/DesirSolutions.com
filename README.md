# Desir Solutions

Public repository for the Desir Solutions marketing site, trust materials, and OCI deployment assets.

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
- `infrastructure/terraform/` - OCI VM deployment stack
- `ansible/`, `n8n/`, and `docs/n8n/` - n8n automation pack for the existing Docker + Traefik platform
- `n8n/workflows/` - CRM-linked workflow imports for lead qualification dispatch and sales digests
- `docs/` - architecture, security, operations, contract-summary, and archived reference docs
- `.github/workflows/validate.yml` - website and Terraform validation
- `.github/workflows/deploy.yml` - website deployment workflow

## Repository posture

- `website/` is the day-one public site
- `infrastructure/terraform/` is the day-one OCI host path
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

- OCI Ampere A1 VM
- Docker-based website runtime
- NGINX serving the built React app
- SSH restricted to approved admin CIDRs only
- HTTPS cutover handled after DNS and certificate issuance

## Contact intake

The React site posts to `VITE_CONTACT_ENDPOINT`, defaulting to `/api/contact`.

For launch, either:

- reverse proxy `/api/contact` to the CRM backend
- set `VITE_CONTACT_ENDPOINT` to a live intake endpoint before build
- accept direct email fallback as the temporary intake path
