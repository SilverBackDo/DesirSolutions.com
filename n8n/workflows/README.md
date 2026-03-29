# n8n Workflow Assets

These workflow exports are designed for the current Desir Solutions stack and current CRM backend.

## Workflows

- `crm-contact-notification-lead-qualification.json`
  - receives CRM contact notifications
  - launches an AI Factory lead qualification run by lead id
- `crm-awaiting-approval-digest.json`
  - sends a weekday morning digest of qualification runs waiting for human approval
- `crm-proposal-follow-up-digest.json`
  - sends a weekday sales follow-up digest for proposal-stage opportunities older than three days

## Expected Environment Variables

- `DESIR_CRM_BASE_URL`
- `DESIR_CRM_API_KEY`
- `DESIR_APPROVAL_DIGEST_TO`

## Expected Credential

- SMTP credential name: `Desir Solutions SMTP`

## CRM Webhook Wiring

Set the CRM backend environment variable:

```env
CONTACT_NOTIFICATION_WEBHOOK_URL=https://n8n.desirsolutions.com/webhook/crm/contact-notification
```

That causes website contact submissions already routed into CRM to immediately trigger n8n automation.
