# OCI Terraform Stack

Lean OCI deployment stack for the Desir Solutions website.

## Structure

```text
infrastructure/terraform/
  modules/
    website_host/
  environments/
    dev/
    prod/
```

## What it provisions

- VCN
- public subnet
- internet gateway and route table
- NSG with HTTP/HTTPS open and SSH restricted to an IP allowlist
- Oracle Linux 9 VM on `VM.Standard.A1.Flex`
- cloud-init bootstrap for Docker, git, and website deployment

## Deployment model

The VM clones the repository defined in `repo_url`, checks out `repo_ref`, validates the Docker Compose configuration in `website/`, and brings the website container up on the configured host port.

## Apply sequence

1. Copy `terraform.tfvars.example` to `terraform.tfvars` in the target environment folder.
2. Fill in OCI OCIDs, API key path, SSH public keys, and admin CIDR allowlist.
3. Run:

```bash
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

## Security stance

- SSH is never open to `0.0.0.0/0`.
- Use a single office IP or VPN egress IP in `ssh_allowed_cidrs`.
- If you later adopt OCI Bastion, remove direct SSH ingress and replace the allowlist path.
- Public ingress is limited to `80` and `443`.

## Pre-apply checklist

- confirm the tenancy, user, and compartment OCIDs
- confirm the public SSH key is current
- confirm `ssh_allowed_cidrs` matches the founder VPN or office egress IP
- confirm `repo_url` and `repo_ref` match the launch repo and branch
- confirm `website_host_port = 80` for the VM bootstrap path

## Post-apply checklist

- verify the `public_ip`, `healthcheck_url`, and `ssh_command` outputs
- SSH to the instance and confirm `docker compose ps` shows the website as healthy
- validate `curl http://PUBLIC_IP/healthz`
- point DNS only after the instance passes the health check

## Production cutover checklist

- add `A` records for `@` and `www`
- verify both hostnames resolve to the OCI public IP
- issue the Let's Encrypt certificate
- switch the website to `docker-compose.prod.yml`
- validate `http -> https` redirect and `www -> root` redirect

## Destroy safeguards

- do not run `terraform destroy` until backups, DNS changes, and rollback options are confirmed
- remove public DNS records before destroying the VM
- archive the final VM public IP, Terraform outputs, and deploy commit SHA in operating notes
