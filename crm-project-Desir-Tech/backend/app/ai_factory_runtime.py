"""
Reusable runtime helpers for AI Factory workflows.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.alerts import send_operations_alert
from app.config import settings
from app.models import (
    AIFactoryApproval,
    AIFactoryCostLedger,
    AIFactoryIncident,
    AIFactoryRun,
    AIFactoryTask,
    AIFactoryWorkflow,
    Lead,
    Opportunity,
    OpportunityActivity,
)

REQUIRED_AI_TABLES = (
    "ai_workflows",
    "ai_runs",
    "ai_tasks",
    "ai_approvals",
)
LEAD_QUALIFICATION_WORKFLOW_KEY = "lead_qualification"
PROPOSAL_DRAFT_WORKFLOW_KEY = "proposal_draft"
WORKFLOW_KEY = LEAD_QUALIFICATION_WORKFLOW_KEY
_USD_PRECISION = Decimal("0.000001")


def assert_ai_factory_ready(db: Session) -> None:
    rows = db.execute(
        text(
            """
            select table_name
            from information_schema.tables
            where table_schema = current_schema()
              and table_name in (
                'ai_workflows',
                'ai_runs',
                'ai_tasks',
                'ai_approvals'
              )
            """
        )
    ).mappings().all()
    existing = {str(row["table_name"]) for row in rows}
    missing = sorted(set(REQUIRED_AI_TABLES) - existing)
    if not missing:
        return
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "AI_FACTORY_NOT_INITIALIZED",
            "message": "AI Factory tables are not initialized.",
            "missing_tables": missing,
        },
    )


def _default_model() -> str:
    return (
        settings.ai_openai_model
        if settings.ai_factory_primary_provider == "openai"
        else settings.ai_anthropic_model
    )


def workflow_config(workflow_key: str) -> dict[str, Any]:
    shared_config = {
        "blocked_actions": [
            "external_email.send",
            "invoice.update",
            "payment.execute",
            "contract.release",
        ],
        "available_providers": settings.ai_provider_options,
        "queue_backend": "redis_stream",
        "telemetry_enabled": settings.otel_enabled,
    }
    if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
        return {
            **shared_config,
            "agents": [
                "intake_normalizer",
                "qualification_agent",
                "sales_supervisor_gate",
            ],
            "allowed_writes": ["opportunities.create_after_approval"],
            "approval_rules": [
                "All CRM write-back actions require human approval.",
                "Outbound actions remain blocked in phase 1.",
            ],
        }
    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        return {
            **shared_config,
            "agents": [
                "opportunity_context_builder",
                "proposal_agent",
                "sales_supervisor_gate",
            ],
            "allowed_writes": [
                "opportunities.activities.create_after_approval",
                "opportunities.stage.advance_to_proposal_after_approval",
            ],
            "approval_rules": [
                "Proposal drafts stay internal until a human supervisor approves CRM write-back.",
                "The workflow may update opportunity stage and log a proposal activity after approval.",
            ],
        }
    raise ValueError(f"Unsupported workflow key: {workflow_key}")


def workflow_definition(workflow_key: str) -> dict[str, Any]:
    if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
        return {
            "name": "Lead Qualification with Human Approval",
            "description": (
                "Normalize inbound lead data, produce a qualification assessment, "
                "and require a human supervisor before any CRM write-back."
            ),
            "objective": (
                "Turn inbound demand into a scored qualification package with a safe, "
                "auditable path to creating a CRM opportunity."
            ),
            "version": 3,
            "status": "active",
            "autonomy_level": "human_approved",
            "primary_provider": settings.ai_factory_primary_provider,
            "default_model": _default_model(),
            "requires_human_approval": True,
            "config": workflow_config(workflow_key),
        }
    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        return {
            "name": "Proposal Drafting with Human Approval",
            "description": (
                "Draft a consulting proposal package from an existing opportunity and "
                "require a human supervisor before any proposal-stage CRM update."
            ),
            "objective": (
                "Turn qualified opportunity context into a reviewable proposal package "
                "with scope, staffing, timeline, and pricing guidance."
            ),
            "version": 1,
            "status": "active",
            "autonomy_level": "human_approved",
            "primary_provider": settings.ai_factory_primary_provider,
            "default_model": _default_model(),
            "requires_human_approval": True,
            "config": workflow_config(workflow_key),
        }
    raise ValueError(f"Unsupported workflow key: {workflow_key}")


def ensure_workflow(
    db: Session,
    workflow_key: str = LEAD_QUALIFICATION_WORKFLOW_KEY,
) -> AIFactoryWorkflow:
    desired_workflow_state = workflow_definition(workflow_key)
    workflow = (
        db.query(AIFactoryWorkflow)
        .filter(AIFactoryWorkflow.workflow_key == workflow_key)
        .first()
    )
    if workflow:
        updated = False
        for field_name, field_value in desired_workflow_state.items():
            if getattr(workflow, field_name) != field_value:
                setattr(workflow, field_name, field_value)
                updated = True
        if updated:
            db.commit()
            db.refresh(workflow)
        return workflow

    workflow = AIFactoryWorkflow(
        workflow_key=workflow_key,
        **desired_workflow_state,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


def ensure_workflows(db: Session) -> list[AIFactoryWorkflow]:
    return [
        ensure_workflow(db, LEAD_QUALIFICATION_WORKFLOW_KEY),
        ensure_workflow(db, PROPOSAL_DRAFT_WORKFLOW_KEY),
    ]


def provider_and_model(
    preferred_provider: str | None,
    preferred_model: str | None,
) -> tuple[str, str, str]:
    provider = preferred_provider or settings.ai_factory_primary_provider
    if provider not in {"openai", "anthropic"}:
        raise HTTPException(status_code=400, detail="Unsupported AI provider")

    if provider == "openai":
        model = preferred_model or settings.ai_openai_model
        provider_ready = bool(settings.openai_api_key)
    else:
        model = preferred_model or settings.ai_anthropic_model
        provider_ready = bool(settings.anthropic_api_key)

    execution_mode = "queued_provider" if provider_ready else "queued_deterministic"
    return provider, model, execution_mode


def lead_snapshot(lead: Lead) -> dict[str, Any]:
    return {
        "lead_id": lead.id,
        "source": lead.source,
        "contact_name": lead.contact_name,
        "contact_email": lead.contact_email,
        "contact_phone": lead.contact_phone,
        "company_name": lead.company_name,
        "title": lead.title,
        "estimated_deal_value": float(lead.estimated_deal_value or 0),
        "notes": lead.notes,
    }


def opportunity_snapshot(opportunity: Opportunity) -> dict[str, Any]:
    return {
        "opportunity_id": opportunity.id,
        "lead_id": opportunity.lead_id,
        "client_id": opportunity.client_id,
        "name": opportunity.name,
        "stage": opportunity.stage,
        "estimated_value": float(opportunity.estimated_value or 0),
        "probability_percent": float(opportunity.probability_percent or 0),
        "expected_close_date": (
            opportunity.expected_close_date.isoformat()
            if opportunity.expected_close_date
            else None
        ),
        "owner_employee_id": opportunity.owner_employee_id,
        "is_won": bool(opportunity.is_won),
        "is_lost": bool(opportunity.is_lost),
        "lost_reason": opportunity.lost_reason,
    }


def build_run_input_payload(lead: Lead) -> dict[str, Any]:
    return {
        "lead_snapshot": lead_snapshot(lead),
        "control_policy": {
            "approval_required": True,
            "blocked_actions": [
                "external_email.send",
                "invoice.update",
                "payment.execute",
                "contract.release",
            ],
        },
    }


def build_proposal_run_input_payload(
    opportunity: Opportunity,
    lead: Lead | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "opportunity_snapshot": opportunity_snapshot(opportunity),
        "control_policy": {
            "approval_required": True,
            "blocked_actions": [
                "external_email.send",
                "invoice.update",
                "payment.execute",
                "contract.release",
            ],
        },
    }
    if lead:
        payload["lead_snapshot"] = lead_snapshot(lead)
    return payload


def approval_reason(workflow_key: str) -> str:
    if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
        return (
            "This workflow proposes CRM state changes. A human supervisor must approve "
            "before creating or updating pipeline records."
        )
    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        return (
            "This workflow drafts proposal-stage CRM updates. A human supervisor must "
            "approve before recording proposal activity or advancing the opportunity stage."
        )
    raise ValueError(f"Unsupported workflow key: {workflow_key}")


def _task_templates(workflow_key: str) -> list[tuple[int, str, str, str, str]]:
    if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
        return [
            (1, "intake_normalizer", "Intake Normalizer", "queued", "Lead queued for normalization."),
            (2, "qualification_agent", "Qualification Agent", "queued", "Lead queued for provider or deterministic scoring."),
            (3, "sales_supervisor_gate", "Sales Supervisor Gate", "queued", "Approval gate waits for qualification output."),
        ]
    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        return [
            (1, "opportunity_context_builder", "Opportunity Context Builder", "queued", "Opportunity queued for context normalization."),
            (2, "proposal_agent", "Proposal Agent", "queued", "Opportunity queued for provider or deterministic proposal drafting."),
            (3, "sales_supervisor_gate", "Sales Supervisor Gate", "queued", "Approval gate waits for proposal output."),
        ]
    raise ValueError(f"Unsupported workflow key: {workflow_key}")


def _approval_type_for_workflow(workflow_key: str) -> str:
    if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
        return "crm_writeback"
    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        return "proposal_release"
    raise ValueError(f"Unsupported workflow key: {workflow_key}")


def ensure_run_scaffolding(
    db: Session,
    run: AIFactoryRun,
    workflow_key: str | None = None,
) -> None:
    resolved_workflow_key = workflow_key
    if not resolved_workflow_key:
        resolved_workflow_key = (
            db.query(AIFactoryWorkflow.workflow_key)
            .filter(AIFactoryWorkflow.id == run.workflow_id)
            .scalar()
        ) or LEAD_QUALIFICATION_WORKFLOW_KEY

    existing = {
        task.sequence_no: task
        for task in db.query(AIFactoryTask).filter(AIFactoryTask.run_id == run.id).all()
    }
    for sequence_no, agent_key, agent_name, status_text, notes in _task_templates(resolved_workflow_key):
        if sequence_no in existing:
            continue
        db.add(
            AIFactoryTask(
                run_id=run.id,
                sequence_no=sequence_no,
                agent_key=agent_key,
                agent_name=agent_name,
                status=status_text,
                input_payload={"run_id": run.id},
                output_payload={},
                notes=notes,
            )
        )

    approval = (
        db.query(AIFactoryApproval)
        .filter(
            AIFactoryApproval.run_id == run.id,
            AIFactoryApproval.approval_type == _approval_type_for_workflow(resolved_workflow_key),
        )
        .first()
    )
    if not approval:
        db.add(
            AIFactoryApproval(
                run_id=run.id,
                approval_type=_approval_type_for_workflow(resolved_workflow_key),
                status="pending",
                requested_from="human_supervisor",
                requested_reason=approval_reason(resolved_workflow_key),
            )
        )


def set_task_state(
    db: Session,
    run_id: int,
    sequence_no: int,
    status_text: str,
    *,
    input_payload: dict[str, Any] | None = None,
    output_payload: dict[str, Any] | None = None,
    notes: str | None = None,
) -> None:
    task = (
        db.query(AIFactoryTask)
        .filter(AIFactoryTask.run_id == run_id, AIFactoryTask.sequence_no == sequence_no)
        .first()
    )
    if not task:
        return
    task.status = status_text
    if input_payload is not None:
        task.input_payload = input_payload
    if output_payload is not None:
        task.output_payload = output_payload
    if notes is not None:
        task.notes = notes


def _risk_level(score: int) -> str:
    if score >= 75:
        return "low"
    if score >= 50:
        return "medium"
    return "high"


def _recommend_stage(score: int) -> str:
    if score >= 75:
        return "qualified"
    if score >= 50:
        return "discovery"
    return "new"


def deterministic_qualification(lead: Lead) -> tuple[dict[str, Any], list[str], str]:
    score = 0
    reasons: list[str] = []
    estimated_value = float(lead.estimated_deal_value or 0)

    if lead.company_name:
        score += 15
        reasons.append("Company name present")
    else:
        reasons.append("No company name supplied")

    if lead.contact_email:
        score += 15
        reasons.append("Primary contact email present")
    else:
        reasons.append("Missing contact email")

    if lead.contact_phone:
        score += 5
        reasons.append("Primary contact phone present")

    if lead.title:
        score += 10
        reasons.append("Buyer title supplied")

    if lead.notes and len(lead.notes.strip()) >= 80:
        score += 10
        reasons.append("Lead notes contain delivery context")
    elif lead.notes:
        score += 5
        reasons.append("Lead notes present but sparse")
    else:
        reasons.append("No discovery notes yet")

    if estimated_value >= 100000:
        score += 25
        reasons.append("Estimated deal size is enterprise-tier")
    elif estimated_value >= 25000:
        score += 15
        reasons.append("Estimated deal size is commercially meaningful")
    elif estimated_value > 0:
        score += 5
        reasons.append("Estimated deal value supplied")
    else:
        reasons.append("No deal size estimate provided")

    if lead.source in {"referral", "partner", "linkedin"}:
        score += 10
        reasons.append(f"Lead source `{lead.source}` converts better than cold inbound")
    elif lead.source == "website":
        score += 5
        reasons.append("Website source requires enrichment but is valid")
    else:
        reasons.append(f"Lead source `{lead.source}` needs manual verification")

    tier = "high" if score >= 75 else "medium" if score >= 50 else "low"
    stage = _recommend_stage(score)
    actions = [
        "Human supervisor reviews qualification package before any CRM write-back.",
        "No outbound email or contractor outreach is permitted in phase 1.",
    ]
    if tier == "high":
        actions.insert(0, "Create a qualified opportunity and schedule discovery.")
    elif tier == "medium":
        actions.insert(0, "Create a discovery-stage opportunity and request account enrichment.")
    else:
        actions.insert(0, "Keep as lead and request additional qualification data.")

    company_or_contact = lead.company_name or lead.contact_name or "the buyer"
    risk_summary = f"{_risk_level(score)}-risk run: {tier} qualification for {company_or_contact}."
    return {
        "score": score,
        "tier": tier,
        "recommended_stage": stage,
        "reasons": reasons,
    }, actions, risk_summary


def deterministic_proposal_draft(
    opportunity: Opportunity,
    lead: Lead | None,
) -> tuple[dict[str, Any], list[str], str]:
    company_name = (
        lead.company_name
        if lead and lead.company_name
        else (lead.contact_name if lead and lead.contact_name else opportunity.name)
    )
    estimated_value = float(opportunity.estimated_value or 0)
    notes = (lead.notes.strip() if lead and lead.notes else "").strip()
    timeline_weeks = 4 if estimated_value < 50000 else 8 if estimated_value < 150000 else 12
    staffing_focus = "senior implementation lead" if estimated_value >= 100000 else "delivery lead"
    scope_items = [
        f"Discovery and solution alignment for {company_name}",
        "Execution plan with milestones, dependencies, and governance checkpoints",
        "Knowledge transfer and stakeholder communication cadence",
    ]
    if notes:
        scope_items.append("Incorporate lead discovery context and delivery constraints already captured in CRM")

    staffing_plan = [
        {
            "role": staffing_focus.title(),
            "allocation": "1.0 FTE",
            "focus": "Own delivery planning, client alignment, and execution oversight.",
        },
        {
            "role": "Solution Specialist",
            "allocation": "0.5 FTE",
            "focus": "Translate business requirements into a technical work plan.",
        },
    ]
    if estimated_value >= 100000:
        staffing_plan.append(
            {
                "role": "QA / Enablement Support",
                "allocation": "0.25 FTE",
                "focus": "Protect handoff quality and adoption during rollout.",
            }
        )

    pricing_options = [
        {
            "name": "Focused Delivery Sprint",
            "estimated_amount_usd": round(max(estimated_value * 0.85, 18000), 2),
            "rationale": "Lower-cost option for a tightly scoped engagement with defined milestones.",
        },
        {
            "name": "Managed Delivery Package",
            "estimated_amount_usd": round(max(estimated_value, 25000), 2),
            "rationale": "Balanced delivery package with governance, reporting, and risk management.",
        },
    ]
    if estimated_value >= 125000:
        pricing_options.append(
            {
                "name": "Extended Transformation Program",
                "estimated_amount_usd": round(max(estimated_value * 1.15, 150000), 2),
                "rationale": "Higher-touch option for larger programs with broader implementation support.",
            }
        )

    assumptions = [
        "Client confirms scope, budget guardrails, and decision-makers during proposal review.",
        "Desir Solutions controls staffing recommendations and delivery sequencing before final SOW issue.",
        "All external proposal delivery remains human-reviewed even after CRM stage updates.",
    ]
    if lead and lead.contact_email:
        assumptions.append("Primary buyer contact remains available for discovery follow-up and approval routing.")

    proposal_package = {
        "executive_summary": (
            f"Draft a {timeline_weeks}-week consulting engagement for {company_name} "
            f"based on the current {opportunity.stage} opportunity context."
        ),
        "delivery_scope": scope_items,
        "staffing_plan": staffing_plan,
        "timeline_weeks": timeline_weeks,
        "pricing_options": pricing_options,
        "assumptions": assumptions,
        "next_step": "Supervisor reviews the proposal package, confirms pricing posture, and approves CRM proposal-stage write-back.",
    }
    recommended_actions = [
        "Supervisor reviews the draft proposal package before any external sharing.",
        "Confirm commercial assumptions and update the opportunity stage to proposal only after approval.",
        "Schedule proposal review with the buyer once the human supervisor signs off.",
    ]
    completeness_score = 70
    if lead and lead.notes:
        completeness_score += 10
    if estimated_value >= 50000:
        completeness_score += 10
    risk_summary = (
        f"{_risk_level(completeness_score)}-risk run: proposal draft for {company_name} "
        f"from a {opportunity.stage} opportunity."
    )
    return proposal_package, recommended_actions, risk_summary


def build_qualification_run_output(
    qualification: dict[str, Any],
    recommended_actions: list[str],
    risk_summary: str,
    *,
    execution_mode: str,
    provider_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    tier = str(qualification.get("tier") or "low")
    return {
        "qualification": qualification,
        "recommended_actions": recommended_actions,
        "writeback_plan": {
            "target_entity": "opportunity" if tier in {"high", "medium"} else "lead_only",
            "requires_human_approval": True,
        },
        "risk_summary": risk_summary,
        "execution": {
            "mode": execution_mode,
            "provider_metadata": provider_metadata or {},
        },
    }


def build_proposal_run_output(
    proposal_package: dict[str, Any],
    recommended_actions: list[str],
    risk_summary: str,
    *,
    execution_mode: str,
    provider_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "proposal_package": proposal_package,
        "recommended_actions": recommended_actions,
        "writeback_plan": {
            "target_entity": "opportunity_activity",
            "requires_human_approval": True,
            "proposed_stage": "proposal",
        },
        "risk_summary": risk_summary,
        "execution": {
            "mode": execution_mode,
            "provider_metadata": provider_metadata or {},
        },
    }


def estimate_cost_usd(
    provider: str,
    model: str | None,
    *,
    prompt_tokens: int,
    completion_tokens: int,
) -> tuple[Decimal, dict[str, Any]]:
    pricing = settings.ai_pricing_for_model(model)
    if not pricing or (
        pricing.input_per_1m_tokens_usd == 0
        and pricing.output_per_1m_tokens_usd == 0
    ):
        return Decimal("0"), {
            "pricing_status": "pricing_not_configured",
            "provider": provider,
            "model": model,
        }

    prompt_cost = (
        Decimal(prompt_tokens) / Decimal(1_000_000)
    ) * pricing.input_per_1m_tokens_usd
    completion_cost = (
        Decimal(completion_tokens) / Decimal(1_000_000)
    ) * pricing.output_per_1m_tokens_usd
    total_cost = (prompt_cost + completion_cost).quantize(
        _USD_PRECISION,
        rounding=ROUND_HALF_UP,
    )
    return total_cost, {
        "pricing_status": "estimated",
        "provider": provider,
        "model": model,
        "input_per_1m_tokens_usd": str(pricing.input_per_1m_tokens_usd),
        "output_per_1m_tokens_usd": str(pricing.output_per_1m_tokens_usd),
        "prompt_cost_usd": str(
            prompt_cost.quantize(_USD_PRECISION, rounding=ROUND_HALF_UP)
        ),
        "completion_cost_usd": str(
            completion_cost.quantize(_USD_PRECISION, rounding=ROUND_HALF_UP)
        ),
    }


def _record_cost_threshold_incidents(
    db: Session,
    *,
    run_id: int,
    provider: str,
    model: str | None,
    estimated_cost_usd: Decimal,
) -> None:
    if (
        settings.ai_cost_alert_per_run_usd > 0
        and estimated_cost_usd >= settings.ai_cost_alert_per_run_usd
    ):
        existing_run_alert = (
            db.query(AIFactoryIncident.id)
            .filter(
                AIFactoryIncident.run_id == run_id,
                AIFactoryIncident.incident_type == "cost_run_threshold_exceeded",
            )
            .first()
        )
        if not existing_run_alert:
            record_incident(
                db,
                run_id,
                "medium",
                "cost_run_threshold_exceeded",
                (
                    f"Run {run_id} estimated AI cost ${estimated_cost_usd} exceeded "
                    f"the per-run threshold ${settings.ai_cost_alert_per_run_usd} "
                    f"for provider {provider} model {model or 'n/a'}."
                ),
            )

    if settings.ai_cost_alert_daily_usd <= 0:
        return

    day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_total = db.query(
        func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0)
    ).filter(AIFactoryCostLedger.created_at >= day_start).scalar()
    daily_total_decimal = Decimal(str(daily_total or 0)).quantize(
        _USD_PRECISION,
        rounding=ROUND_HALF_UP,
    )
    if daily_total_decimal < settings.ai_cost_alert_daily_usd:
        return

    existing_daily_alert = (
        db.query(AIFactoryIncident.id)
        .filter(
            AIFactoryIncident.incident_type == "cost_daily_threshold_exceeded",
            AIFactoryIncident.created_at >= day_start,
        )
        .first()
    )
    if existing_daily_alert:
        return

    record_incident(
        db,
        run_id,
        "medium",
        "cost_daily_threshold_exceeded",
        (
            f"Estimated AI cost for {day_start.date().isoformat()} reached "
            f"${daily_total_decimal}, exceeding the daily threshold "
            f"${settings.ai_cost_alert_daily_usd}."
        ),
    )


def record_cost_ledger(
    db: Session,
    run_id: int,
    provider: str,
    model: str | None,
    *,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    metadata: dict[str, Any] | None = None,
) -> AIFactoryCostLedger:
    estimated_cost_usd, pricing_metadata = estimate_cost_usd(
        provider,
        model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
    ledger = AIFactoryCostLedger(
        run_id=run_id,
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        estimated_cost_usd=estimated_cost_usd,
        cost_metadata={
            **(metadata or {}),
            **pricing_metadata,
        },
    )
    db.add(ledger)
    db.flush()
    _record_cost_threshold_incidents(
        db,
        run_id=run_id,
        provider=provider,
        model=model,
        estimated_cost_usd=estimated_cost_usd,
    )
    return ledger


def record_incident(
    db: Session,
    run_id: int,
    severity: str,
    incident_type: str,
    description: str,
) -> None:
    incident = AIFactoryIncident(
        run_id=run_id,
        severity=severity,
        incident_type=incident_type,
        description=description,
        status="open",
        owner="ai_factory",
    )
    db.add(incident)
    db.flush()
    send_operations_alert(
        severity,
        f"AI incident opened: {incident_type}",
        description,
        category="ai_incident",
        source="ai_factory",
        details={
            "incident_id": int(incident.id),
            "incident_type": incident_type,
            "run_id": int(run_id) if run_id is not None else None,
            "status": incident.status,
            "owner": incident.owner,
        },
    )


def append_writeback_task(
    db: Session,
    run_id: int,
    status_text: str,
    output_payload: dict[str, Any],
    notes: str,
    *,
    agent_key: str = "crm_writeback",
    agent_name: str = "CRM Write-back",
) -> None:
    latest_sequence = (
        db.query(AIFactoryTask.sequence_no)
        .filter(AIFactoryTask.run_id == run_id)
        .order_by(AIFactoryTask.sequence_no.desc())
        .first()
    )
    next_sequence = (latest_sequence[0] if latest_sequence else 0) + 1
    db.add(
        AIFactoryTask(
            run_id=run_id,
            sequence_no=next_sequence,
            agent_key=agent_key,
            agent_name=agent_name,
            status=status_text,
            input_payload={"run_id": run_id},
            output_payload=output_payload,
            notes=notes,
        )
    )


def _company_name_from_run(run: AIFactoryRun) -> str | None:
    if isinstance(run.input_payload, dict):
        lead_payload = run.input_payload.get("lead_snapshot")
        if isinstance(lead_payload, dict):
            return lead_payload.get("company_name") or lead_payload.get("contact_name")
        opportunity_payload = run.input_payload.get("opportunity_snapshot")
        if isinstance(opportunity_payload, dict):
            return opportunity_payload.get("name")
    return None


def _reject_approval(
    db: Session,
    run: AIFactoryRun,
    *,
    workflow_key: str,
    decided_by: str,
    decision_notes: str | None,
) -> None:
    run.status = "rejected"
    run.approval_status = "rejected"
    run.completed_at = datetime.utcnow()
    output_payload = dict(run.output_payload or {})
    output_payload["approval_outcome"] = {
        "decision": "rejected",
        "decided_by": decided_by,
        "decision_notes": decision_notes,
        "crm_writeback": "blocked",
    }
    run.output_payload = output_payload

    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        append_writeback_task(
            db,
            run.id,
            "rejected",
            {"decision": "rejected"},
            "Supervisor rejected proposal-stage CRM write-back.",
            agent_key="proposal_writeback",
            agent_name="Proposal Write-back",
        )
        return

    append_writeback_task(
        db,
        run.id,
        "rejected",
        {"decision": "rejected"},
        "Supervisor rejected CRM write-back.",
    )


def _approve_lead_qualification(
    db: Session,
    run: AIFactoryRun,
    *,
    decided_by: str,
    decision_notes: str | None,
) -> None:
    output_payload = dict(run.output_payload or {})
    qualification = dict(output_payload.get("qualification") or {})
    score = int(qualification.get("score") or 0)
    company_name = _company_name_from_run(run)

    run.status = "approved"
    run.approval_status = "approved"
    run.completed_at = datetime.utcnow()

    writeback_result: dict[str, Any]
    if run.lead_id and score >= 50:
        existing_opportunity = (
            db.query(Opportunity)
            .filter(Opportunity.lead_id == run.lead_id)
            .order_by(Opportunity.id.desc())
            .first()
        )
        if existing_opportunity:
            run.opportunity_id = existing_opportunity.id
            writeback_result = {
                "action": "linked_existing_opportunity",
                "opportunity_id": existing_opportunity.id,
                "stage": existing_opportunity.stage,
            }
        else:
            lead = db.query(Lead).filter(Lead.id == run.lead_id).first()
            recommended_stage = str(
                qualification.get("recommended_stage") or "qualified"
            )
            opportunity = Opportunity(
                lead_id=run.lead_id,
                client_id=lead.client_id if lead else None,
                name=f"{company_name or 'Lead'} engagement",
                stage=recommended_stage,
                estimated_value=float(lead.estimated_deal_value or 25000)
                if lead
                else 25000,
                probability_percent=40 if recommended_stage == "qualified" else 25,
                owner_employee_id=lead.owner_employee_id if lead else None,
            )
            db.add(opportunity)
            db.flush()
            run.opportunity_id = opportunity.id
            writeback_result = {
                "action": "created_opportunity",
                "opportunity_id": opportunity.id,
                "stage": recommended_stage,
            }
    else:
        writeback_result = {
            "action": "no_writeback",
            "reason": "qualification_score_below_threshold",
        }

    output_payload["approval_outcome"] = {
        "decision": "approved",
        "decided_by": decided_by,
        "decision_notes": decision_notes,
        "crm_writeback": writeback_result,
    }
    run.output_payload = output_payload
    append_writeback_task(
        db,
        run.id,
        "completed",
        writeback_result,
        "Supervisor approved CRM write-back.",
    )


def _approve_proposal_draft(
    db: Session,
    run: AIFactoryRun,
    *,
    decided_by: str,
    decision_notes: str | None,
) -> None:
    output_payload = dict(run.output_payload or {})
    proposal_package = dict(output_payload.get("proposal_package") or {})

    run.status = "approved"
    run.approval_status = "approved"
    run.completed_at = datetime.utcnow()

    opportunity = (
        db.query(Opportunity).filter(Opportunity.id == run.opportunity_id).first()
        if run.opportunity_id
        else None
    )
    if not opportunity:
        writeback_result = {
            "action": "no_writeback",
            "reason": "opportunity_missing",
        }
        record_incident(
            db,
            run.id,
            "high",
            "proposal_writeback_blocked",
            "Proposal approval could not write back because the linked opportunity no longer exists.",
        )
    else:
        previous_stage = opportunity.stage
        stage_changed = False
        if opportunity.stage in {"new", "qualified", "discovery"}:
            opportunity.stage = "proposal"
            stage_changed = True
        if float(opportunity.probability_percent or 0) < 60:
            opportunity.probability_percent = 60

        summary = str(
            proposal_package.get("executive_summary")
            or f"AI drafted a proposal package for {opportunity.name}."
        )
        activity = OpportunityActivity(
            opportunity_id=opportunity.id,
            activity_type="proposal_draft",
            summary=summary,
            next_step=str(proposal_package.get("next_step") or "").strip() or None,
            owner_employee_id=opportunity.owner_employee_id,
        )
        db.add(activity)
        db.flush()
        writeback_result = {
            "action": "logged_proposal_activity",
            "opportunity_id": opportunity.id,
            "activity_id": activity.id,
            "stage_before": previous_stage,
            "stage_after": opportunity.stage,
            "stage_changed": stage_changed,
            "probability_percent": float(opportunity.probability_percent or 0),
        }

    output_payload["approval_outcome"] = {
        "decision": "approved",
        "decided_by": decided_by,
        "decision_notes": decision_notes,
        "crm_writeback": writeback_result,
    }
    run.output_payload = output_payload
    append_writeback_task(
        db,
        run.id,
        "completed",
        writeback_result,
        "Supervisor approved proposal-stage CRM write-back.",
        agent_key="proposal_writeback",
        agent_name="Proposal Write-back",
    )


def apply_approval_decision(
    db: Session,
    run: AIFactoryRun,
    approval: AIFactoryApproval,
    *,
    decision: str,
    decided_by: str,
    decision_notes: str | None,
) -> None:
    workflow_key = (
        db.query(AIFactoryWorkflow.workflow_key)
        .filter(AIFactoryWorkflow.id == run.workflow_id)
        .scalar()
    ) or LEAD_QUALIFICATION_WORKFLOW_KEY

    approval.status = "approved" if decision == "approve" else "rejected"
    approval.decided_by = decided_by
    approval.decided_at = datetime.utcnow()
    approval.decision_notes = decision_notes

    if decision == "reject":
        _reject_approval(
            db,
            run,
            workflow_key=workflow_key,
            decided_by=decided_by,
            decision_notes=decision_notes,
        )
        return

    if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY:
        _approve_proposal_draft(
            db,
            run,
            decided_by=decided_by,
            decision_notes=decision_notes,
        )
        return

    _approve_lead_qualification(
        db,
        run,
        decided_by=decided_by,
        decision_notes=decision_notes,
    )
