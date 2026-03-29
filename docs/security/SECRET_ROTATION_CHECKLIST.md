# Secret Rotation Checklist

Rotate these before production go-live and after any exposure event.

## Secrets In Scope

- `SECRET_KEY`
- `AUTH_JWT_SECRET`
- `AUTOMATION_API_KEY`
- `CRM_ADMIN_PASSWORD`
- `CRM_AUTH_USERS` embedded passwords or password hashes
- `DB_PASSWORD`
- `PGADMIN_DEFAULT_PASSWORD`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- GitHub Actions secret `OCI_VM_SSH_KEY`

## Rotation Steps

1. Generate new values for staging first.
2. Apply them to `.env.staging` and confirm:
   - `./scripts/run-lead-qualification-evals.sh`
   - `./scripts/launch-readiness.sh .env.staging`
3. Apply the same process to production `.env`.
4. Restart affected services:
   ```bash
   docker compose up -d backend ai-worker db pgadmin
   ```
5. Re-authenticate CRM users because JWT tokens signed with the old secret should no longer be trusted.
6. Re-run the readiness smoke against the environment you changed.

## Generation Guidance

- Use unique values per environment.
- Keep JWT signing and automation API keys separate.
- Prefer shell-safe passwords for `.env` files when using `source`.
- If using `CRM_AUTH_USERS`, prefer password hashes once bcrypt/passlib compatibility is pinned and verified.

## Post-Rotation Validation

- Login works with the expected named operator account.
- API-key access still works for lead creation and AI run launch.
- API-key approval is still blocked.
- New traces continue to appear in the OTEL output file.

## Trust Package Follow-Up

- If rotation changes a provider, hosting platform, or alerting destination, update `docs/security/SUBPROCESSORS.md` and `docs/security/SECURITY_OVERVIEW.md`.
- If incident contacts or notification routing change, review `docs/security/INCIDENT_NOTIFICATION_POLICY.md`.
