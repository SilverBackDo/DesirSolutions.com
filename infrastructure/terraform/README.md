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
- NSG with HTTP open and SSH restricted to an IP allowlist
- Oracle Linux 9 VM on `VM.Standard.A1.Flex`
- cloud-init bootstrap for Docker, git, and website deployment

## Deployment model

The VM clones the repository defined in `repo_url`, checks out `repo_ref`, builds the Docker image from the `website/` folder, and runs the container on port `80`.

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
