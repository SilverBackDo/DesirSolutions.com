# CRM Integration SOP For n8n

This SOP wires the existing CRM backend to the n8n automation layer already defined in this repository.

## Integration Goal

Use n8n for the first production-safe automation layer without moving CRM ownership out of the FastAPI backend.

Day 1 scope:

- dispatch AI Factory lead-qualification runs from inbound website contact submissions
- send weekday digests for runs awaiting approval
- send weekday follow-up digests for proposal-stage opportunities that need action

## Existing CRM API Surface

Use these current routes:

- `POST /api/contact`
- `GET /api/leads`
- `GET /api/opportunities`
- `GET /api/ai-factory/workflows`
- `GET /api/ai-factory/runs`
- `POST /api/ai-factory/workflows/lead-qualification/runs`

Automation authentication uses the existing backend header:

```http
X-API-Key: <AUTOMATION_API_KEY>
```

## Required Configuration

### n8n Runtime

Set these in the n8n stack env:

```env
DESIR_CRM_BASE_URL=https://desirsolutions.com
DESIR_CRM_API_KEY=<existing CRM automation API key>
DESIR_APPROVAL_DIGEST_TO=contact@desirsolutions.com
```

### CRM Backend

Set this in the root backend env so CRM contact submissions notify n8n:

```env
CONTACT_NOTIFICATION_WEBHOOK_URL=https://n8n.desirsolutions.com/webhook/crm/contact-notification
```

## Import Procedure

1. Open the n8n UI.
2. Create an SMTP credential named `Desir Solutions SMTP`.
3. Import the three workflow files from `n8n/workflows/`.
4. Bind `Desir Solutions SMTP` to the two digest workflows.
5. Activate `CRM Contact Notification -> Lead Qualification Dispatch`.
6. Update the backend `CONTACT_NOTIFICATION_WEBHOOK_URL`.
7. Submit one website contact form and verify the run appears in CRM AI Factory.

## Post-Import Verification

1. Trigger a website contact form submission.
2. Confirm n8n webhook execution succeeds.
3. Confirm CRM contains the new lead.
4. Confirm `POST /api/ai-factory/workflows/lead-qualification/runs` created a queued run.
5. Confirm the run is visible in the CRM AI Factory page.
6. Confirm the approval digest workflow can send a test email.

Optional operator smoke check:

```bash
CRM_AUTOMATION_BASE_URL=https://desirsolutions.com \
CRM_AUTOMATION_API_KEY=<existing CRM automation API key> \
bash scripts/smoke-crm-automation.sh
```

## Failure Domains

- If the webhook succeeds but the CRM run creation fails, inspect n8n execution history first.
- If CRM rejects requests with `401`, rotate or correct `DESIR_CRM_API_KEY`.
- If CRM contact submissions do not reach n8n, verify `CONTACT_NOTIFICATION_WEBHOOK_URL`.
- If digest emails fail, rebind or fix the `Desir Solutions SMTP` credential.
