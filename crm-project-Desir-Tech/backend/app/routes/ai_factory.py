"""
AI Factory control-plane endpoints.

Phase 2 scope:
- workflow metadata stored in the database
- auditable queued run/task/approval records
- queue-backed execution with provider adapters for OpenAI and Anthropic
- human approval before any CRM write-back
"""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ai_factory_queue import enqueue_ai_factory_run
from app.ai_factory_runtime import (
    LEAD_QUALIFICATION_WORKFLOW_KEY,
    PROPOSAL_DRAFT_WORKFLOW_KEY,
    apply_approval_decision,
    assert_ai_factory_ready,
    build_run_input_payload,
    build_proposal_run_input_payload,
    ensure_run_scaffolding,
    ensure_workflow,
    ensure_workflows,
    provider_and_model,
    record_incident,
)
from app.auth import (
    AuthContext,
    require_internal_access,
    require_internal_roles,
    require_user_roles,
)
from app.config import settings
from app.database import get_db
from app.models import (
    AIFactoryApproval,
    AIFactoryCostLedger,
    AIFactoryIncident,
    AIFactoryRun,
    AIFactoryTask,
    AIFactoryWorkflow,
    Lead,
    Opportunity,
)
from app.schemas import (
    AIFactoryApprovalDecisionRequest,
    AIFactoryApprovalResponse,
    AIFactoryCostProviderSummaryResponse,
    AIFactoryCostSummaryResponse,
    AIFactoryIncidentResponse,
    AIFactoryProposalRunCreate,
    AIFactoryRunCreate,
    AIFactoryRunResponse,
    AIFactoryTaskResponse,
    AIFactoryWorkflowResponse,
)

router = APIRouter()


def _serialize_workflow(workflow: AIFactoryWorkflow) -> AIFactoryWorkflowResponse:
    return AIFactoryWorkflowResponse.model_validate(workflow)


def _serialize_run(db: Session, run: AIFactoryRun) -> AIFactoryRunResponse:
    tasks = (
        db.query(AIFactoryTask)
        .filter(AIFactoryTask.run_id == run.id)
        .order_by(AIFactoryTask.sequence_no.asc(), AIFactoryTask.id.asc())
        .all()
    )
    approvals = (
        db.query(AIFactoryApproval)
        .filter(AIFactoryApproval.run_id == run.id)
        .order_by(AIFactoryApproval.id.asc())
        .all()
    )
    payload = {
        "id": run.id,
        "workflow_id": run.workflow_id,
        "lead_id": run.lead_id,
        "opportunity_id": run.opportunity_id,
        "status": run.status,
        "approval_status": run.approval_status,
        "requested_by": run.requested_by,
        "provider": run.provider,
        "model": run.model,
        "execution_mode": run.execution_mode,
        "requires_human_approval": run.requires_human_approval,
        "risk_summary": run.risk_summary,
        "input_payload": run.input_payload,
        "output_payload": run.output_payload,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "created_at": run.created_at,
        "updated_at": run.updated_at,
        "tasks": [AIFactoryTaskResponse.model_validate(task) for task in tasks],
        "approvals": [
            AIFactoryApprovalResponse.model_validate(approval)
            for approval in approvals
        ],
    }
    return AIFactoryRunResponse.model_validate(payload)


def _decimal_to_float(value: object) -> float:
    return float(value or 0)


def _enqueue_run_or_fail(db: Session, run: AIFactoryRun) -> None:
    try:
        queued_run = enqueue_ai_factory_run(run.id)
        output_payload = dict(run.output_payload or {})
        output_payload["queue"] = {
            "status": "enqueued",
            "job_id": queued_run.job_id,
            "message_id": queued_run.message_id,
            "backend": "redis_stream",
        }
        run.output_payload = output_payload
    except Exception as exc:
        run.status = "failed"
        run.approval_status = "blocked"
        run.output_payload = {
            "queue": {
                "status": "failed",
                "error": str(exc),
            }
        }
        run.risk_summary = "high-risk run: queue submission failed before execution."
        record_incident(
            db,
            run.id,
            "high",
            "queue_enqueue_failure",
            f"AI Factory run could not be enqueued: {exc}",
        )


@router.get(
    "/workflows",
    response_model=list[AIFactoryWorkflowResponse],
    dependencies=[Depends(require_internal_roles("admin", "sales", "finance", "approver", "viewer", allow_api_key=True))],
)
async def list_workflows(db: Session = Depends(get_db)):
    assert_ai_factory_ready(db)
    ensure_workflows(db)
    workflows = db.query(AIFactoryWorkflow).order_by(AIFactoryWorkflow.workflow_key.asc()).all()
    return [_serialize_workflow(workflow) for workflow in workflows]


@router.get(
    "/runs",
    response_model=list[AIFactoryRunResponse],
    dependencies=[Depends(require_internal_roles("admin", "sales", "finance", "approver", "viewer", allow_api_key=True))],
)
async def list_runs(
    workflow_key: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    assert_ai_factory_ready(db)
    query = db.query(AIFactoryRun)
    if workflow_key:
        workflow = (
            db.query(AIFactoryWorkflow)
            .filter(AIFactoryWorkflow.workflow_key == workflow_key)
            .first()
        )
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        query = query.filter(AIFactoryRun.workflow_id == workflow.id)
    if status_filter:
        query = query.filter(AIFactoryRun.status == status_filter)
    runs = query.order_by(AIFactoryRun.created_at.desc()).limit(limit).all()
    return [_serialize_run(db, run) for run in runs]


@router.get(
    "/runs/{run_id}",
    response_model=AIFactoryRunResponse,
    dependencies=[Depends(require_internal_roles("admin", "sales", "finance", "approver", "viewer", allow_api_key=True))],
)
async def get_run(run_id: int, db: Session = Depends(get_db)):
    assert_ai_factory_ready(db)
    run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="AI Factory run not found")
    return _serialize_run(db, run)


@router.get(
    "/incidents",
    response_model=list[AIFactoryIncidentResponse],
    dependencies=[Depends(require_internal_roles("admin", "sales", "finance", "approver", "viewer", allow_api_key=True))],
)
async def list_incidents(
    status_filter: str | None = Query(None, alias="status"),
    severity: str | None = Query(None),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    assert_ai_factory_ready(db)
    query = db.query(AIFactoryIncident)
    if status_filter:
        query = query.filter(AIFactoryIncident.status == status_filter)
    if severity:
        query = query.filter(AIFactoryIncident.severity == severity)
    incidents = (
        query.order_by(AIFactoryIncident.created_at.desc(), AIFactoryIncident.id.desc())
        .limit(limit)
        .all()
    )
    return [AIFactoryIncidentResponse.model_validate(incident) for incident in incidents]


@router.get(
    "/costs/summary",
    response_model=AIFactoryCostSummaryResponse,
    dependencies=[Depends(require_user_roles("admin", "finance", "approver"))],
)
async def get_cost_summary(db: Session = Depends(get_db)):
    assert_ai_factory_ready(db)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    last_7d_start = datetime.utcnow() - timedelta(days=7)

    total_estimated_cost = db.query(
        func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0)
    ).scalar()
    today_estimated_cost = db.query(
        func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0)
    ).filter(AIFactoryCostLedger.created_at >= today_start).scalar()
    last_7d_estimated_cost = db.query(
        func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0)
    ).filter(AIFactoryCostLedger.created_at >= last_7d_start).scalar()
    open_incident_count = db.query(func.count(AIFactoryIncident.id)).filter(
        AIFactoryIncident.status == "open"
    ).scalar()

    grouped_costs = (
        db.query(
            AIFactoryCostLedger.provider,
            AIFactoryCostLedger.model,
            func.count(AIFactoryCostLedger.id),
            func.coalesce(func.sum(AIFactoryCostLedger.total_tokens), 0),
            func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0),
        )
        .group_by(AIFactoryCostLedger.provider, AIFactoryCostLedger.model)
        .order_by(func.coalesce(func.sum(AIFactoryCostLedger.estimated_cost_usd), 0).desc())
        .all()
    )

    return AIFactoryCostSummaryResponse(
        total_estimated_cost_usd=_decimal_to_float(total_estimated_cost),
        today_estimated_cost_usd=_decimal_to_float(today_estimated_cost),
        last_7d_estimated_cost_usd=_decimal_to_float(last_7d_estimated_cost),
        run_alert_threshold_usd=float(settings.ai_cost_alert_per_run_usd),
        daily_alert_threshold_usd=float(settings.ai_cost_alert_daily_usd),
        open_incident_count=int(open_incident_count or 0),
        pricing_configured_models=sorted(settings.ai_model_pricing.keys()),
        by_provider_model=[
            AIFactoryCostProviderSummaryResponse(
                provider=str(provider),
                model=str(model) if model is not None else None,
                run_count=int(run_count or 0),
                total_tokens=int(total_tokens or 0),
                estimated_cost_usd=_decimal_to_float(estimated_cost),
            )
            for provider, model, run_count, total_tokens, estimated_cost in grouped_costs
        ],
    )


@router.post(
    "/workflows/lead-qualification/runs",
    response_model=AIFactoryRunResponse,
    status_code=201,
    dependencies=[Depends(require_internal_roles("admin", "sales", "approver", allow_api_key=True))],
)
async def create_lead_qualification_run(
    payload: AIFactoryRunCreate,
    auth: AuthContext = Depends(require_internal_access),
    db: Session = Depends(get_db),
):
    assert_ai_factory_ready(db)
    workflow = ensure_workflow(db, LEAD_QUALIFICATION_WORKFLOW_KEY)
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    provider, model, execution_mode = provider_and_model(
        payload.preferred_provider,
        payload.preferred_model,
    )

    run = AIFactoryRun(
        workflow_id=workflow.id,
        lead_id=lead.id,
        status="queued",
        approval_status="pending",
        requested_by=auth.principal,
        provider=provider,
        model=model,
        execution_mode=execution_mode,
        requires_human_approval=workflow.requires_human_approval,
        risk_summary="queued for AI qualification",
        input_payload=build_run_input_payload(lead),
        output_payload={"queue": {"status": "pending"}},
    )
    db.add(run)
    db.flush()
    ensure_run_scaffolding(db, run, workflow.workflow_key)
    db.commit()
    db.refresh(run)

    _enqueue_run_or_fail(db, run)

    db.commit()
    db.refresh(run)
    return _serialize_run(db, run)


@router.post(
    "/workflows/proposal-draft/runs",
    response_model=AIFactoryRunResponse,
    status_code=201,
    dependencies=[Depends(require_internal_roles("admin", "sales", "approver", allow_api_key=True))],
)
async def create_proposal_draft_run(
    payload: AIFactoryProposalRunCreate,
    auth: AuthContext = Depends(require_internal_access),
    db: Session = Depends(get_db),
):
    assert_ai_factory_ready(db)
    workflow = ensure_workflow(db, PROPOSAL_DRAFT_WORKFLOW_KEY)
    opportunity = (
        db.query(Opportunity)
        .filter(Opportunity.id == payload.opportunity_id)
        .first()
    )
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    lead = (
        db.query(Lead).filter(Lead.id == opportunity.lead_id).first()
        if opportunity.lead_id
        else None
    )

    provider, model, execution_mode = provider_and_model(
        payload.preferred_provider,
        payload.preferred_model,
    )

    run = AIFactoryRun(
        workflow_id=workflow.id,
        lead_id=opportunity.lead_id,
        opportunity_id=opportunity.id,
        status="queued",
        approval_status="pending",
        requested_by=auth.principal,
        provider=provider,
        model=model,
        execution_mode=execution_mode,
        requires_human_approval=workflow.requires_human_approval,
        risk_summary="queued for AI proposal drafting",
        input_payload=build_proposal_run_input_payload(opportunity, lead),
        output_payload={"queue": {"status": "pending"}},
    )
    db.add(run)
    db.flush()
    ensure_run_scaffolding(db, run, workflow.workflow_key)
    db.commit()
    db.refresh(run)

    _enqueue_run_or_fail(db, run)

    db.commit()
    db.refresh(run)
    return _serialize_run(db, run)


@router.post(
    "/runs/{run_id}/approvals/{approval_id}",
    response_model=AIFactoryRunResponse,
    dependencies=[Depends(require_user_roles("admin", "approver"))],
)
async def decide_run_approval(
    run_id: int,
    approval_id: int,
    payload: AIFactoryApprovalDecisionRequest,
    auth: AuthContext = Depends(require_user_roles("admin", "approver")),
    db: Session = Depends(get_db),
):
    assert_ai_factory_ready(db)
    run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="AI Factory run not found")
    if run.status != "awaiting_approval":
        raise HTTPException(
            status_code=409,
            detail="Run is not ready for approval yet",
        )

    approval = (
        db.query(AIFactoryApproval)
        .filter(AIFactoryApproval.id == approval_id, AIFactoryApproval.run_id == run_id)
        .first()
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail="Approval request already decided")

    apply_approval_decision(
        db,
        run,
        approval,
        decision=payload.decision,
        decided_by=auth.principal,
        decision_notes=payload.decision_notes,
    )
    db.commit()
    db.refresh(run)
    return _serialize_run(db, run)
