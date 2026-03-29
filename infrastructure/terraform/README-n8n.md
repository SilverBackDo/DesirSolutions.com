# n8n Terraform Notes

Use Terraform for n8n only when infrastructure state needs to change.

## Keep In Terraform

- OCI VM definition if the compute shape, subnet, or NSG changes
- optional OCI block volume for `/opt/desir/n8n-stack`
- optional DNS records if DNS moves into Terraform later

## Keep Out Of Terraform

- Docker packages
- compose files
- env files
- n8n secrets
- systemd units
- backup scripts
- PostgreSQL container lifecycle

## Day 1 Recommendation

Do not change OCI infrastructure just to launch n8n.

Deploy n8n through Ansible to the existing VM first.

Add Terraform changes later only if:

- storage pressure requires a dedicated volume
- NSG rules need to be codified for `n8n.desirsolutions.com`
- DNS is moved into infrastructure-as-code
