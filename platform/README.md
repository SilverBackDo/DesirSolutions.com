# OCI Mini Cloud Platform

This bundle provisions and deploys the requested Oracle Cloud Infrastructure hosting platform:

- Free Tier ARM VM on `VM.Standard.A1.Flex`
- Traefik reverse proxy with automatic Let's Encrypt certificates
- Three Docker-served websites on one host
- GitHub-based deployment workflow
- Idempotent bootstrap and redeploy scripts

## Layout

- `compose.yaml` - Traefik plus three website containers
- `scripts/bootstrap-host.sh` - installs Docker, opens host firewall ports, creates `/srv/platform`
- `scripts/deploy-platform.sh` - syncs site content and starts or updates containers
- `scripts/generate-dashboard-users.sh` - creates the Traefik basic-auth value
- `sites/consultant-profile/` - generated consultant profile website for `alcines.com`
- `terraform/` - OCI network and compute provisioning

## Expected Host Directories

The bootstrap script creates and maintains:

- `/srv/platform`
- `/srv/platform/traefik`
- `/srv/platform/bellahburger`
- `/srv/platform/desirsolutions`
- `/srv/platform/Alcines`

Each website gets a `repo/` checkout and a `current/` publish directory under its platform path.

## Required Inputs

1. Create `/srv/platform/.env` from `platform/.env.example`.
2. Set:
   - `LETSENCRYPT_EMAIL`
   - `TRAEFIK_DASHBOARD_HOST`
   - `TRAEFIK_DASHBOARD_USERS`
   - `BELLAHBURGER_REPO_URL`
   - `BELLAHBURGER_DOMAIN`
   - `DESIRSOLUTIONS_DOMAIN`
   - `ALCINES_DOMAIN`
3. If your GitHub repos are private, install a deploy key for the VM so `git clone` and `git pull` work non-interactively.

`DESIRSOLUTIONS_REPO_URL` defaults to the current repository remote:

- `https://github.com/SilverBackDo/DesirSolutions.com.git`

## Traefik Dashboard Auth

Generate the `TRAEFIK_DASHBOARD_USERS` value with:

```bash
./platform/scripts/generate-dashboard-users.sh admin 'replace-with-strong-password'
```

Put the output directly into `/srv/platform/.env`.

## Manual Host Bootstrap

On the OCI VM:

```bash
cd /opt/consulting-mini-cloud
bash platform/scripts/bootstrap-host.sh
bash platform/scripts/deploy-platform.sh
```

The scripts are safe to re-run.

## Terraform Flow

1. Copy `platform/terraform/terraform.tfvars.example` to a local `terraform.tfvars`.
2. Fill OCI auth values, SSH public key, and repo and domain settings.
3. Run:

```bash
terraform -chdir=platform/terraform init
terraform -chdir=platform/terraform apply
```

The module:

- reuses matching VCN, subnet, internet gateway, route table, security list, and instance when they already exist by display name or supplied OCID
- creates missing resources with the requested CIDRs and instance shape
- injects cloud-init to bootstrap Docker and deploy the platform automatically

## GitHub Deployment

Workflow:

- `.github/workflows/deploy-platform.yml`

Required secrets:

- `OCI_VM_HOST`
- `OCI_VM_USER`
- `OCI_VM_SSH_KEY`

The workflow pulls the repo on the VM and re-runs `platform/scripts/deploy-platform.sh`.

## Verification Commands

On the VM:

```bash
docker ps
docker logs reverse-proxy --tail 100
curl -I https://bellahburger.com
curl -I https://desirsolutions.com
curl -I https://alcines.com
```
