# Desir Solutions Security Overview

This document summarizes the current security and operational-control posture of Desir Solutions as implemented in this repository.

It is a practical overview, not a certification statement.

## Scope

The current platform includes:

- public marketing website and contact intake
- CRM backend and operator UI
- supervised AI workflows for lead qualification and proposal drafting
- OCI-hosted deployment with Docker Compose

## Security Principles

- least privilege for human operators through named roles
- separation between bearer-token human access and automation API access
- human approval before protected CRM write-back in AI workflows
- deny-by-default handling for higher-risk actions such as outbound communication, contracts, invoices, and payments

## Access Control

Current internal roles:

- `admin`
- `sales`
- `finance`
- `approver`
- `viewer`

Current control model:

- CRM users authenticate with bearer tokens
- service automation uses a separate API key
- AI approvals require a named bearer-token user
- finance routes are restricted to `admin` or `finance`

## Infrastructure and Hosting

- primary deployment model: Oracle Cloud Infrastructure virtual machine
- application runtime: Docker Compose
- reverse proxy: nginx
- database: PostgreSQL
- queue: Redis Streams
- telemetry: OpenTelemetry collector with file-backed trace export

## Data Handling Summary

The platform currently processes:

- public contact-form submissions
- CRM lead and opportunity data
- operator account data
- AI workflow inputs and outputs
- operational metadata such as IP address, user agent, and alerting events

Website inquiries are routed into CRM leads for follow-up.

## Security Controls in Place

- distinct secrets for JWT signing and automation API access
- named-user role separation
- approval gating for AI write-back
- queue durability through Redis Streams
- backup generation with checksum and restore drill support
- webhook-based operational alerting for AI incidents, backup failures, restore-drill failures, and unhandled backend exceptions
- deployment gating through staging, health checks, evals, and readiness scripts

## Backup and Recovery

- scheduled logical PostgreSQL backups
- SHA-256 checksum generation for backup artifacts
- restore helper with primary-database safety guard
- recurring restore-drill support through a scratch database workflow
- optional off-host backup sync through a configured shell command

## Incident Handling

- operational incidents are recorded in the AI control plane where applicable
- alert webhooks can notify Slack, Teams, or another incident endpoint
- backup and restore failures can also trigger alerts
- incident-notification commitments for customers are described in `docs/security/INCIDENT_NOTIFICATION_POLICY.md`

## AI Workflow Safeguards

Current production-grade workflows are limited to:

- lead qualification with human approval before CRM write-back
- proposal drafting with human approval before proposal-stage CRM updates

The following remain intentionally human-controlled:

- legal and contract execution
- invoice mutation
- payment activity
- outbound customer messaging
- contractor placement or release

## Current Limitations

Desir Solutions does not currently claim:

- SOC 2 compliance
- ISO 27001 certification
- automated legal review or contract release
- customer-facing SSO or SCIM

## Security Contact

- security and privacy contact: `privacy@desirsolutions.com`
- legal contact: `legal@desirsolutions.com`

Security reports should include:

- affected system or URL
- reproduction steps
- date and time observed
- potential customer impact
