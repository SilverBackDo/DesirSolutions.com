**Operating Model**
Treat AI Factory as a control plane on top of your current Desirtech stack, not as a single prompt page. Keep the existing OCI VM + FastAPI + Postgres + Docker Compose foundation in [docker-compose.yml](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/docker-compose.yml), but add a dedicated orchestration layer, job workers, audit trails, and approval gates. Do not let AI “run the entire company” without human approvals on money movement, contracts, outbound messaging, and staffing decisions.

**Action List**
1. Fix the security baseline first. Rotate the committed CRM password in [README.md](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/crm-project-Desir-Tech/README.md), split API-key auth from JWT signing, move all provider keys to GitHub/OCI secrets, and put branch protection plus required PR reviews on `main`.
2. Replace the static AI Factory blueprint in [agent_blueprints.py](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/crm-project-Desir-Tech/backend/app/routes/agent_blueprints.py) with versioned agent configs. Store agent definitions, prompts, tool policies, model routing, and approval rules in the database or versioned YAML, not hard-coded response payloads.
3. Add an `ai-control-plane` service to [docker-compose.yml](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/docker-compose.yml). Add `ai-worker`, `redis` or another queue, and an OpenTelemetry collector. Keep the existing `backend` as the business API and make the control plane call it through audited tools.
4. Extend the schema in [01_full_schema.sql](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/db/sql/01_full_schema.sql) with `ai_workspaces`, `ai_agents`, `ai_runs`, `ai_tasks`, `ai_tool_calls`, `ai_approvals`, `ai_memories`, `ai_eval_results`, `ai_cost_ledger`, and `ai_incidents`. Add `pgvector` for retrieval against resumes, proposals, SOWs, contracts, and delivery notes.
5. Build a provider abstraction layer. Use one internal interface for `plan()`, `act()`, `tool_call()`, `structured_output()`, and `stream()`, then implement OpenAI and Anthropic adapters behind it. Do not bake vendor-specific logic into CRM routes.
6. Start with one primary vendor in production. Use OpenAI first if you want the cleanest path to Responses API plus Agents SDK; add Anthropic as a second provider for benchmark, fallback, or specific workflows. Dual-vendor on day 1 increases failure modes and cost attribution complexity.
7. Define the first real agent topology around the business you already modeled in Postgres: Intake Agent, Research Agent, Sales Agent, Talent Matching Agent, Proposal Agent, Delivery Health Agent, Billing Agent, and Compliance Guardrail Agent. Give each one a strict tool allowlist and explicit handoff rules.
8. Wrap your existing CRM data as tools instead of letting models touch the database directly. Start with tools for lead intake, client lookup, contractor search, proposal assembly, project health summaries, invoice status, and timesheet variance. Every tool call should log actor, input, output, latency, and cost.
9. Add human approval gates before any external email, proposal send, contractor outreach, contract draft release, invoice change, payment action, or database write that changes money, staffing, or legal state.
10. Add full observability and FinOps. Track run IDs, traces, token usage, model choice, cache hits, tool failures, approval rates, business outcomes, and per-client cost. Feed that into dashboards and alerts before you scale usage.
11. Harden CI/CD in [deploy.yml](c:/Users/DevLion/OneDrive/Documents/DesirConsultant/Desir-Business%20Structure/Desirtech/.github/workflows/deploy.yml). Add staging and production environments, smoke tests for agent workflows, migration checks for new AI tables, secret validation, and canary rollout for prompt/config changes.
12. Use OCI Object Storage for large artifacts and keep only metadata plus embeddings in Postgres. Store resumes, PDFs, proposal drafts, transcripts, and knowledge bundles outside the VM filesystem.
13. Add evaluation before autonomy. Create regression suites for lead qualification, contractor ranking, proposal quality, hallucination rate, cost per run, and tool-call correctness. No workflow gets write access in production until it clears eval thresholds.
14. Roll out by business domain. Phase 1 should be read-only copilots. Phase 2 can create drafts. Phase 3 can take bounded actions with approval. Phase 4 can run scheduled workflows and exception queues.

**Model Plan**
Use OpenAI as the primary control-plane candidate with `gpt-5.4` for orchestration and hard reasoning, `gpt-5.4-mini` for worker agents, and `gpt-5.4-nano` for high-volume routing/classification. If you add Anthropic, use Claude Sonnet 4.6 as the main balanced worker/orchestrator and Claude Opus 4.6 only for the hardest proposal/compliance tasks. Keep a single routing policy service so you can benchmark or fail over vendors without rewriting business tools.

**Recommended Next Implementation Step**
Implement Phase 0 and Phase 1 in this branch:
- secure secrets and auth separation
- add AI control-plane tables
- add `ai-control-plane` + `ai-worker` services
- convert AI Factory from static blueprint to versioned config + run API
- ship one production-safe workflow first: lead intake -> qualification -> human approval

Sources:
- OpenAI models: https://developers.openai.com/api/docs/models
- OpenAI Agents SDK: https://openai.github.io/openai-agents-python/
- Anthropic feature overview: https://platform.claude.com/docs/en/build-with-claude/overview
- Anthropic models: https://platform.claude.com/docs/en/about-claude/models/overview
- Anthropic usage/cost API: https://platform.claude.com/docs/en/build-with-claude/usage-cost-api

If you want, I can take the next turn and implement Phase 0-1 directly in `ben-feature-branch`.