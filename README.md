# Desir Solutions

Public-facing repository for the Desir Solutions website, trust materials, and deployment assets.

Desir Solutions LLC is a Washington-based, founder-led consulting business focused on:

- infrastructure modernization
- Linux / RHEL and VMware cleanup
- Terraform / Ansible automation
- hybrid cloud and OCI hosting
- scoped implementation sprints and fractional advisory work

The commercial entry point is the `Infrastructure Stability & Automation Assessment`, a fixed-fee 10-business-day offer that converts into a modernization sprint or monthly advisory engagement when appropriate.

## What This Repo Contains

- public marketing site under the repo root
- trust and procurement support materials
- deployment workflows and OCI hosting assets
- internal CRM application code that powers contact intake and internal sales operations

This repo is the canonical technical face of Desir Solutions. Internal business operations, finance, legal records, and private sales assets should remain in private repositories or secure company records.

## Key Files

- `index.html` - homepage
- `services.html` - service overview
- `assessment.html` - flagship paid offer
- `contact.html` - inbound lead flow
- `trust.html` - public trust center
- `terms-privacy.html` - website terms and privacy notice
- `.github/workflows/deploy.yml` - deployment workflow
- `platform/terraform/` - OCI provisioning assets
- `crm-project-Desir-Tech/backend/` - FastAPI backend
- `crm-project-Desir-Tech/frontend/` - internal CRM frontend

## Commercial Posture

- legal entity: `Desir Solutions LLC`
- operating posture: `Washington`
- public location language: `Maple Valley, Washington`
- public positioning: `founder-led consulting first, contract support second`

## Local Run

1. Copy `.env.example` to `.env`.
2. Set the required secrets and database values.
3. Start the stack:
   - `docker compose up -d --build`
4. Apply the schema:
   - `./scripts/apply-db-schema.sh`
5. Open:
   - `https://localhost`
   - `https://localhost/crm/`

## Deployment

- OCI VM hosting with Docker and reverse proxy
- GitHub Actions deployment over SSH
- production access should keep SSH restricted to approved admin access paths

## Trust Notes

- the public site and trust package align to a Washington commercial posture
- customer-facing commitments belong in executed agreements, not in README copy
- internal automation remains supervised; client-facing approvals stay human-controlled
