# Desir Solutions Subprocessors

This list reflects the processors and infrastructure vendors currently reflected in the repository and operating model.

It should be reviewed whenever hosting, deployment, communications, or AI-provider routing changes.

## Current Subprocessors

| Vendor | Purpose | Data Categories | Notes |
| --- | --- | --- | --- |
| Oracle Cloud Infrastructure | Virtual machine hosting, storage, and networking | Application data, CRM data, operational logs, backups | Primary hosting platform in current deployment model |
| GitHub | Source control and deployment workflow execution | Source code, deployment metadata, secrets metadata | Used for repository management and Actions-based deploy flow |
| OpenAI | AI workflow execution when enabled | Prompt inputs, structured workflow context, model outputs | Used for lead qualification and proposal drafting when configured |
| Anthropic | AI workflow execution when enabled | Prompt inputs, structured workflow context, model outputs | Secondary or alternate AI provider when configured |
| Let's Encrypt | TLS certificate issuance and renewal | Domain-validation metadata | Used for certificate management in the current stack |

## Notable Operational Tools

The following may be customer-selected or environment-specific rather than default subprocessors:

- Slack or Microsoft Teams webhook endpoints for operational alerts
- rclone or object-storage destinations for off-host backups
- additional CRM or document systems if later integrated

## Review and Notification

- review this list before customer security review
- update this list before enabling a new external provider
- keep customer-facing privacy, DPA, and security documents aligned with this list
