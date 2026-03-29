"""
Integration-style evals for the provider-backed proposal draft workflow.
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import date
from decimal import Decimal
import json
from typing import Iterator
from uuid import uuid4

from sqlalchemy import text

from app.ai_factory_runtime import (
    PROPOSAL_DRAFT_WORKFLOW_KEY,
    apply_approval_decision,
    build_proposal_run_input_payload,
    ensure_run_scaffolding,
    ensure_workflow,
)
from app.ai_providers import ProposalExecutionResult, ProviderUsage
from app.config import settings
from app.database import SessionLocal
from app.models import (
    AIFactoryApproval,
    AIFactoryIncident,
    AIFactoryRun,
    AIFactoryTask,
    Lead,
    Opportunity,
)
import app.worker as worker_module


@contextmanager
def _temporary_settings(**overrides: object) -> Iterator[None]:
    original_values = {key: getattr(settings, key) for key in overrides}
    try:
        for key, value in overrides.items():
            setattr(settings, key, value)
        yield
    finally:
        for key, value in original_values.items():
            setattr(settings, key, value)


def _cleanup_run_artifacts(run_id: int, opportunity_id: int, lead_id: int) -> None:
    db = SessionLocal()
    try:
        db.execute(text("delete from ai_cost_ledger where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_incidents where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_approvals where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_tasks where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_runs where id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from opportunity_activities where opportunity_id = :opportunity_id"), {"opportunity_id": opportunity_id})
        db.execute(text("delete from opportunities where id = :opportunity_id"), {"opportunity_id": opportunity_id})
        db.execute(text("delete from leads where id = :lead_id"), {"lead_id": lead_id})
        db.commit()
    finally:
        db.close()


def _create_eval_run(*, company_name: str) -> tuple[int, int, int]:
    db = SessionLocal()
    try:
        workflow = ensure_workflow(db, PROPOSAL_DRAFT_WORKFLOW_KEY)
        unique_suffix = uuid4().hex[:10]
        lead = Lead(
            source="referral",
            contact_name=f"Proposal Eval {unique_suffix}",
            contact_email=f"proposal-eval-{unique_suffix}@example.com",
            contact_phone="555-0109",
            company_name=company_name,
            title="Director of Transformation",
            estimated_deal_value=Decimal("85000"),
            notes=(
                "Synthetic proposal workflow eval lead. Validate proposal drafting, "
                "approval, cost estimation, and controlled CRM write-back."
            ),
        )
        db.add(lead)
        db.flush()

        opportunity = Opportunity(
            lead_id=lead.id,
            name=f"{company_name} modernization proposal",
            stage="discovery",
            estimated_value=Decimal("85000"),
            probability_percent=Decimal("40"),
            expected_close_date=date(2026, 4, 30),
        )
        db.add(opportunity)
        db.flush()

        run = AIFactoryRun(
            workflow_id=workflow.id,
            lead_id=lead.id,
            opportunity_id=opportunity.id,
            status="queued",
            approval_status="pending",
            requested_by="eval_suite",
            provider="openai",
            model=settings.ai_openai_model,
            execution_mode="queued_provider",
            requires_human_approval=True,
            risk_summary="queued for proposal eval",
            input_payload=build_proposal_run_input_payload(opportunity, lead),
            output_payload={"queue": {"status": "eval"}},
        )
        db.add(run)
        db.flush()
        ensure_run_scaffolding(db, run, workflow.workflow_key)
        db.commit()
        return int(lead.id), int(opportunity.id), int(run.id)
    finally:
        db.close()


def _fetch_run_snapshot(run_id: int, opportunity_id: int) -> dict[str, object]:
    db = SessionLocal()
    try:
        run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
        approval = (
            db.query(AIFactoryApproval)
            .filter(AIFactoryApproval.run_id == run_id)
            .order_by(AIFactoryApproval.id.asc())
            .first()
        )
        incidents = (
            db.query(AIFactoryIncident.incident_type)
            .filter(AIFactoryIncident.run_id == run_id)
            .order_by(AIFactoryIncident.id.asc())
            .all()
        )
        ledger_rows = db.execute(
            text(
                """
                select estimated_cost_usd, total_tokens
                from ai_cost_ledger
                where run_id = :run_id
                order by id asc
                """
            ),
            {"run_id": run_id},
        ).mappings().all()
        tasks = (
            db.query(AIFactoryTask.sequence_no, AIFactoryTask.status)
            .filter(AIFactoryTask.run_id == run_id)
            .order_by(AIFactoryTask.sequence_no.asc())
            .all()
        )
        opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        activity_count = db.execute(
            text(
                """
                select count(*)
                from opportunity_activities
                where opportunity_id = :opportunity_id
                """
            ),
            {"opportunity_id": opportunity_id},
        ).scalar()
        return {
            "status": run.status if run else None,
            "approval_status": run.approval_status if run else None,
            "execution_mode": run.execution_mode if run else None,
            "approval_id": approval.id if approval else None,
            "incidents": [incident_type for (incident_type,) in incidents],
            "ledger_rows": [
                {
                    "estimated_cost_usd": Decimal(str(row["estimated_cost_usd"] or 0)),
                    "total_tokens": int(row["total_tokens"] or 0),
                }
                for row in ledger_rows
            ],
            "tasks": [(int(sequence_no), str(status)) for sequence_no, status in tasks],
            "proposal_package": (run.output_payload or {}).get("proposal_package") if run else None,
            "opportunity_stage": opportunity.stage if opportunity else None,
            "activity_count": int(activity_count or 0),
        }
    finally:
        db.close()


def _approve_run(run_id: int, approval_id: int) -> None:
    db = SessionLocal()
    try:
        run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
        approval = (
            db.query(AIFactoryApproval)
            .filter(AIFactoryApproval.id == approval_id, AIFactoryApproval.run_id == run_id)
            .first()
        )
        apply_approval_decision(
            db,
            run,
            approval,
            decision="approve",
            decided_by="eval.supervisor",
            decision_notes="proposal-path eval approval",
        )
        db.commit()
    finally:
        db.close()


def _provider_success_case() -> tuple[bool, str]:
    lead_id, opportunity_id, run_id = _create_eval_run(company_name="Proposal Success Systems")
    original_execute = worker_module.execute_provider_proposal_draft
    original_alternates = worker_module.alternate_provider_targets
    try:
        def fake_execute_provider_proposal_draft(provider: str, model: str, opportunity_snapshot: dict[str, object], lead_snapshot: dict[str, object] | None) -> ProposalExecutionResult:
            return ProposalExecutionResult(
                proposal_package={
                    "executive_summary": f"Proposal package for {opportunity_snapshot.get('name')}.",
                    "delivery_scope": [
                        "Assess current-state architecture and delivery blockers.",
                        "Design the modernization execution plan.",
                        "Stand up governance and milestone tracking.",
                    ],
                    "staffing_plan": [
                        {"role": "Engagement Lead", "allocation": "1.0 FTE", "focus": "Own delivery governance and buyer alignment."},
                        {"role": "Cloud Architect", "allocation": "0.5 FTE", "focus": "Shape solution design and implementation choices."},
                    ],
                    "timeline_weeks": 8,
                    "pricing_options": [
                        {"name": "Managed delivery package", "estimated_amount_usd": 85000, "rationale": "Matches opportunity size and scope."}
                    ],
                    "assumptions": [
                        "Buyer confirms priorities and stakeholders.",
                        "Scope remains within the modernization package.",
                    ],
                    "next_step": "Supervisor approves proposal-stage write-back and schedules proposal review.",
                },
                recommended_actions=[
                    "Approve proposal-stage write-back.",
                    "Review pricing posture with sales leadership.",
                ],
                risk_summary="low-risk run: proposal draft is complete enough for supervisor review.",
                raw_text='{"proposal_package":{"executive_summary":"Proposal package for eval opportunity.","delivery_scope":["Assess current-state architecture and delivery blockers.","Design the modernization execution plan.","Stand up governance and milestone tracking."],"staffing_plan":[{"role":"Engagement Lead","allocation":"1.0 FTE","focus":"Own delivery governance and buyer alignment."},{"role":"Cloud Architect","allocation":"0.5 FTE","focus":"Shape solution design and implementation choices."}],"timeline_weeks":8,"pricing_options":[{"name":"Managed delivery package","estimated_amount_usd":85000,"rationale":"Matches opportunity size and scope."}],"assumptions":["Buyer confirms priorities and stakeholders.","Scope remains within the modernization package."],"next_step":"Supervisor approves proposal-stage write-back and schedules proposal review."},"recommended_actions":["Approve proposal-stage write-back.","Review pricing posture with sales leadership."],"risk_summary":"low-risk run: proposal draft is complete enough for supervisor review."}',
                usage=ProviderUsage(prompt_tokens=900, completion_tokens=600, total_tokens=1500),
                metadata={"provider_request_id": "eval-proposal-success", "response_id": "eval-proposal-success-1"},
            )

        worker_module.execute_provider_proposal_draft = fake_execute_provider_proposal_draft
        worker_module.alternate_provider_targets = lambda primary_provider: []

        with _temporary_settings(
            ai_model_pricing_json=json.dumps(
                {
                    settings.ai_openai_model: {
                        "input_per_1m_tokens_usd": "0.75",
                        "output_per_1m_tokens_usd": "4.50",
                    }
                }
            ),
            ai_cost_alert_per_run_usd=Decimal("0.050000"),
            ai_cost_alert_daily_usd=Decimal("0.500000"),
        ):
            worker_module.execute_ai_factory_run(run_id)

        snapshot = _fetch_run_snapshot(run_id, opportunity_id)
        if snapshot["status"] != "awaiting_approval":
            return False, f"FAIL proposal_success_path: expected awaiting_approval got {snapshot['status']}"
        if not snapshot["proposal_package"]:
            return False, "FAIL proposal_success_path: proposal package missing"
        if not snapshot["ledger_rows"] or snapshot["ledger_rows"][0]["estimated_cost_usd"] <= Decimal("0"):
            return False, "FAIL proposal_success_path: expected estimated cost > 0"

        _approve_run(run_id, int(snapshot["approval_id"]))
        approved_snapshot = _fetch_run_snapshot(run_id, opportunity_id)
        if approved_snapshot["status"] != "approved":
            return False, f"FAIL proposal_success_path: expected approved got {approved_snapshot['status']}"
        if approved_snapshot["opportunity_stage"] != "proposal":
            return False, f"FAIL proposal_success_path: expected proposal stage got {approved_snapshot['opportunity_stage']}"
        if approved_snapshot["activity_count"] < 1:
            return False, "FAIL proposal_success_path: expected proposal activity write-back"

        return True, (
            "PASS proposal_success_path: "
            f"estimated_cost_usd={snapshot['ledger_rows'][0]['estimated_cost_usd']} "
            f"activity_count={approved_snapshot['activity_count']} "
            f"stage={approved_snapshot['opportunity_stage']}"
        )
    finally:
        worker_module.execute_provider_proposal_draft = original_execute
        worker_module.alternate_provider_targets = original_alternates
        _cleanup_run_artifacts(run_id, opportunity_id, lead_id)


def _provider_fallback_case() -> tuple[bool, str]:
    lead_id, opportunity_id, run_id = _create_eval_run(company_name="Proposal Fallback Systems")
    original_execute = worker_module.execute_provider_proposal_draft
    original_alternates = worker_module.alternate_provider_targets
    try:
        def failing_execute_provider_proposal_draft(provider: str, model: str, opportunity_snapshot: dict[str, object], lead_snapshot: dict[str, object] | None) -> ProposalExecutionResult:
            raise RuntimeError("provider quota exceeded during proposal eval")

        worker_module.execute_provider_proposal_draft = failing_execute_provider_proposal_draft
        worker_module.alternate_provider_targets = lambda primary_provider: []

        worker_module.execute_ai_factory_run(run_id)
        snapshot = _fetch_run_snapshot(run_id, opportunity_id)
        if snapshot["status"] != "awaiting_approval":
            return False, f"FAIL proposal_fallback_path: expected awaiting_approval got {snapshot['status']}"
        if snapshot["execution_mode"] != "queued_deterministic":
            return False, f"FAIL proposal_fallback_path: expected queued_deterministic got {snapshot['execution_mode']}"
        if "provider_execution_failed" not in snapshot["incidents"]:
            return False, "FAIL proposal_fallback_path: provider failure incident missing"
        if "deterministic_fallback_used" not in snapshot["incidents"]:
            return False, "FAIL proposal_fallback_path: deterministic fallback incident missing"
        if not snapshot["proposal_package"]:
            return False, "FAIL proposal_fallback_path: deterministic proposal package missing"

        return True, (
            "PASS proposal_fallback_path: "
            f"execution_mode={snapshot['execution_mode']} "
            f"incidents={','.join(snapshot['incidents'])}"
        )
    finally:
        worker_module.execute_provider_proposal_draft = original_execute
        worker_module.alternate_provider_targets = original_alternates
        _cleanup_run_artifacts(run_id, opportunity_id, lead_id)


def main() -> None:
    print(f"proposal-path eval started_at={datetime.utcnow().isoformat()}Z")
    cases = [
        _provider_success_case,
        _provider_fallback_case,
    ]
    passed = 0
    failed = 0
    for case in cases:
        ok, message = case()
        print(message)
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"summary: passed={passed} failed={failed} cases={len(cases)}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    from datetime import datetime

    main()
