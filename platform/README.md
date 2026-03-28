# OCI Platform Notes

This directory contains OCI infrastructure assets related to the broader Desir Solutions hosting model.

## Launch Position

For the first 30-day launch window, the recommended production path is the simpler root `Desirtech` website and CRM deployment model, not a multi-site platform rollout.

Use this directory when you need OCI infrastructure-as-code support, but keep the day-one business deployment focused on:

- one Desir Solutions site
- one protected admin path
- one documented deploy workflow

## Terraform Security Change

`platform/terraform/` no longer opens SSH to `0.0.0.0/0`.

You must now explicitly set:

- `ssh_allowed_cidrs`

If you prefer a stronger pattern, keep `ssh_allowed_cidrs = []` and use OCI Bastion or another approved administrative access method.

## Practical Day-One Guidance

- keep HTTP and HTTPS public only for the website
- restrict SSH to approved admin IP ranges or Bastion
- keep internal tools off the public edge where possible
- prefer a single production website stack before adding multi-site complexity
