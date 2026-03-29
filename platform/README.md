# OCI Platform Notes

This directory now represents the founder-operable production path for Desir Solutions on OCI.

## Runtime Model

The platform is intentionally narrow:

- one Oracle Linux VM
- one public domain: `desirsolutions.com`
- one reverse proxy: Traefik
- one public website container pulled from `ghcr.io/silverbackdo/desirsolutions-website`

There are no secondary sites, no public Traefik dashboard, and no dependency on unpublished repositories.

## What Terraform Does

`platform/terraform/` provisions or manages:

- VCN, subnet, route table, security list
- one OCI compute instance
- locked-down SSH via `ssh_allowed_cidrs`
- first-boot clone of this repository
- host bootstrap plus one-site deployment

## Day-One Operating Rules

- keep only `80` and `443` public
- restrict `22` to your approved admin CIDR or use OCI Bastion
- publish the website image through GitHub Actions before deployment
- point DNS for `@` and `www` to the OCI public IP before expecting ACME to succeed

## Deployment Flow

1. Push changes to `main` in `SilverBackDo/DesirSolutions.com`.
2. Let GitHub Actions publish `ghcr.io/silverbackdo/desirsolutions-website:latest`.
3. Run Terraform from `platform/terraform`.
4. Verify `docker ps` and `curl -I --resolve desirsolutions.com:443:PUBLIC_IP https://desirsolutions.com`.
