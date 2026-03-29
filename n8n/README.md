# Desir Solutions n8n Pack

This directory contains the source-of-truth n8n deployment assets and the first workflow set for Desir Solutions business operations.

## What Lives Here

- `docker-compose.yml` - dedicated n8n + PostgreSQL stack for the existing OCI VM
- `.env.example` - runtime env template rendered into the live n8n stack
- `systemd/` - host startup unit template reference
- `workflows/` - importable workflow assets for CRM orchestration and sales operations

## Required Runtime Variables

These values are rendered into the n8n container environment:

- `DESIR_CRM_BASE_URL` - CRM API base URL, defaulting to `https://desirsolutions.com`
- `DESIR_CRM_API_KEY` - existing CRM automation key from the backend stack
- `DESIR_APPROVAL_DIGEST_TO` - mailbox that receives automation digests

## Workflow Credential Standard

Create one SMTP credential inside n8n named `Desir Solutions SMTP`.

The workflow exports in `workflows/` assume:

- n8n SMTP is already configured for password reset and outbound notifications
- CRM automation uses `X-API-Key` with `DESIR_CRM_API_KEY`
- contact notifications from the CRM backend are sent to the n8n webhook path `crm/contact-notification`

## Import Order

1. Import `workflows/crm-contact-notification-lead-qualification.json`
2. Import `workflows/crm-awaiting-approval-digest.json`
3. Import `workflows/crm-proposal-follow-up-digest.json`
4. Bind the `Desir Solutions SMTP` credential to the two digest workflows
5. Activate the webhook workflow
6. Point CRM `CONTACT_NOTIFICATION_WEBHOOK_URL` at the production webhook URL
