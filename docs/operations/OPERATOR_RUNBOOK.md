# Operator Runbook

This runbook is the minimum operating procedure for Desir Consultant before production launch.

## Environments

- Production uses `docker-compose.yml` with root `.env`.
- Staging uses `docker-compose.staging.yml` with `.env.staging`.
- Keep production and staging credentials, databases, Redis state, and provider keys separate.

## Staging Deploy

1. Copy [.env.staging.example](/c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/.env.staging.example) to `.env.staging` and fill distinct staging secrets.
2. Start staging side by side with production:
   ```bash
   STACK_ENV_FILE=.env.staging \
   STACK_PROJECT_NAME=desir-staging \
   STACK_COMPOSE_FILES="docker-compose.staging.yml" \
   STACK_DB_CONTAINER=desir-staging-db \
   STACK_TLS_DOMAIN=staging.desirsolutions.com \
   STACK_CERTBOT_ROOT=certbot-staging/conf \
   STACK_ACME_WEBROOT=certbot-staging/www \
   STACK_TELEMETRY_DIR=telemetry/staging-output \
   STACK_READINESS_PUBLIC_BASE_URL=https://127.0.0.1:8443 \
   STACK_READINESS_BACKEND_BASE_URL=http://127.0.0.1:18000 \
   STACK_CURL_INSECURE=true \
   STACK_RUN_EVALS=true \
   STACK_RUN_READINESS=true \
   STACK_READINESS_DECISION=reject \
   ./scripts/deploy-stack.sh
   ```
3. Apply schema once per staging database:
   ```bash
   APP_ENV_FILE=.env.staging DB_CONTAINER=desir-staging-db ./scripts/apply-db-schema.sh
   ```
4. Verify service health:
   - `https://localhost:8443/api/health`
   - `http://127.0.0.1:18000/health`

## Launch Readiness Gate

Run these before production cutover and after any material AI workflow change:

1. Deterministic eval regression:
   ```bash
   COMPOSE_ENV_FILE=.env.staging \
   COMPOSE_PROJECT_NAME_OVERRIDE=desir-staging \
   COMPOSE_FILE_OVERRIDE="docker-compose.staging.yml" \
   ./scripts/run-lead-qualification-evals.sh
   ```
   This suite now includes provider-path integration checks in addition to deterministic scoring cases.
2. End-to-end readiness smoke:
   ```bash
   READINESS_PUBLIC_BASE_URL=https://localhost:8443 \
   READINESS_BACKEND_BASE_URL=http://127.0.0.1:18000 \
   READINESS_CURL_INSECURE=true \
   ./scripts/launch-readiness.sh .env.staging
   ```
3. Confirm the result reached `awaiting_approval`, API-key approval was blocked, and a named human user completed the final decision.
4. Confirm OTEL traces were written to `telemetry/staging-output/traces.jsonl` or the production output path.
5. Keep launch-readiness off in production deploys unless you intentionally override the safety guard for a controlled maintenance test.

## Daily Operations

- Review the latest AI runs in the CRM before approving write-back.
- Check for open incidents and provider failures in `ai_incidents`.
- Review `GET /api/ai-factory/costs/summary` for non-zero estimated spend once pricing is configured.
- If pricing was added after earlier runs, execute `./scripts/backfill-ai-costs.sh` once to recalculate historical `ai_cost_ledger` rows.
- Confirm Redis, backend, ai-worker, and otel-collector are healthy with `docker compose ps`.
- Check provider billing weekly. If quota is depleted, the workflow will fall back to deterministic scoring.
- Review new website contact submissions and confirm they were routed into CRM leads.
- If `CONTACT_NOTIFICATION_WEBHOOK_URL` is configured, verify webhook delivery during launch week.
- Confirm the daily database backup completed and that offsite sync succeeded if `BACKUP_OFFSITE_SYNC_COMMAND` is configured.
- Confirm webhook-based operational alerts are still delivering to the intended Slack, Teams, or incident endpoint.

## Operations Alerting

- `OPERATIONS_ALERT_WEBHOOK_URL` is the shared alert path for AI incidents, unhandled backend exceptions, backup failures, and restore-drill failures.
- `OPERATIONS_ALERT_MIN_SEVERITY` should stay at `high` in production unless the team is actively tuning alert volume.
- Treat a missing alert delivery path as an operational risk, not a cosmetic issue.
- Test the webhook after credential rotation or endpoint changes before approving new traffic.

## Trust Package Maintenance

- Keep `TRUST_PACKAGE.md`, `docs/security/SECURITY_OVERVIEW.md`, `docs/security/SUBPROCESSORS.md`, and `docs/security/INCIDENT_NOTIFICATION_POLICY.md` aligned with the real operating environment.
- Update the trust package before adding a new AI provider, hosting vendor, backup destination, or customer-data workflow.
- If legal or commercial templates change, review `docs/contracts/DATA_PROCESSING_ADDENDUM_TEMPLATE.md`, `docs/contracts/MASTER_SERVICES_AGREEMENT_TEMPLATE.md`, and `docs/contracts/STATEMENT_OF_WORK_TEMPLATE.md` together.
- Treat drift between the public website notice and the Markdown trust package as a business-risk issue that must be resolved before enterprise outreach.

## Backup and Recovery

- Run `./scripts/backup-db.sh` for an on-demand backup. It now writes a compressed dump, a SHA-256 checksum, and a manifest file.
- Run `./scripts/restore-db.sh <backup.sql.gz> <scratch_db_name>` when validating a recovery path or restoring a non-production copy.
- `restore-db.sh` refuses to restore into the primary database unless `ALLOW_RESTORE_TO_PRIMARY=true` is explicitly set.
- Run `./scripts/backup-restore-drill.sh` at least monthly and after any major schema or migration change.
- Keep at least one copy of backups off the VM. Use `BACKUP_OFFSITE_SYNC_COMMAND` to push artifacts to object storage, rclone, or another secured destination.
- Treat a failed backup, failed checksum, or failed restore drill as a launch-blocking operational incident.

## Access Roles

- `admin`: full CRM and AI Factory control, including approvals and finance routes.
- `sales`: lead, client, opportunity, and workflow-launch access.
- `approver`: AI workflow review and decision authority without finance access.
- `finance`: invoices, payments, dashboard, and AI cost summary access.
- `viewer`: read-only internal visibility into pipeline and AI run history.
- Do not share user accounts. Configure named operators with `CRM_AUTH_USERS` and rotate passwords when staff access changes.

## Cost Guardrails

- Set `AI_MODEL_PRICING_JSON` in `.env.staging` and production `.env` with current verified input/output USD-per-1M token rates for each active model. The repo templates now start with `gpt-5.4-mini` and `claude-sonnet-4-6`.
- Set `AI_COST_ALERT_PER_RUN_USD` and `AI_COST_ALERT_DAILY_USD` so expensive runs and day-level spend create `ai_incidents`. The repo starting values are `0.02` per run and `0.50` per day.
- Investigate any `cost_run_threshold_exceeded` or `cost_daily_threshold_exceeded` incident before expanding automation scope.

## Approval Policy

- API keys can launch runs and create leads.
- Only bearer-token CRM users may approve or reject CRM write-back.
- Reject by default if the qualification package is incomplete, low-confidence, or based on fallback execution you would not ship to a client.

## Website Intake Policy

- Public website contact submissions are stored in `contact_submissions` and converted into CRM leads with source `website`.
- Intake abuse is constrained by the honeypot field plus the configured submission rate limit window.
- Treat any missing lead conversion or repeated rate-limit spikes as an intake incident and investigate before increasing traffic.

## Rollback Trigger

Pause production approvals and roll back to the previous release if any of the following occur:

- launch-readiness smoke fails
- new runs stay pending or fail to reach `awaiting_approval`
- provider error rate spikes or traces disappear
- approval history shows missing or incorrect operator identity
