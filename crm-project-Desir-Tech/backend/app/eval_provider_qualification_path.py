"""
Integration-style evals for the provider-backed lead qualification path.
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
import json
from typing import Iterator
from uuid import uuid4

from sqlalchemy import text

from app.ai_factory_runtime import (
    apply_approval_decision,
    build_run_input_payload,
    ensure_run_scaffolding,
    ensure_workflow,
)
from app.ai_providers import ProviderExecutionResult, ProviderUsage
from app.database import SessionLocal
from app.models import AIFactoryApproval, AIFactoryIncident, AIFactoryRun, AIFactoryTask, Lead
from app.config import settings
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


def _cleanup_run_artifacts(run_id: int, lead_id: int) -> None:
    db = SessionLocal()
    try:
        run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
        opportunity_id = run.opportunity_id if run else None
        db.execute(text("delete from ai_cost_ledger where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_incidents where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_approvals where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_tasks where run_id = :run_id"), {"run_id": run_id})
        db.execute(text("delete from ai_runs where id = :run_id"), {"run_id": run_id})
        if opportunity_id is not None:
            db.execute(text("delete from opportunities where id = :opportunity_id"), {"opportunity_id": opportunity_id})
        db.execute(text("delete from leads where id = :lead_id"), {"lead_id": lead_id})
        db.commit()
    finally:
        db.close()


def _create_eval_run(*, company_name: str) -> tuple[int, int]:
    db = SessionLocal()
    try:
        workflow = ensure_workflow(db)
        unique_suffix = uuid4().hex[:10]
        lead = Lead(
            source="referral",
            contact_name=f"Eval Contact {unique_suffix}",
            contact_email=f"eval-{unique_suffix}@example.com",
            contact_phone="555-0199",
            company_name=company_name,
            title="VP Operations",
            estimated_deal_value=Decimal("125000"),
            notes=(
                "Synthetic provider-path eval lead. Validate qualification, approval, "
                "cost estimation, and controlled CRM write-back."
            ),
        )
        db.add(lead)
        db.flush()

        run = AIFactoryRun(
            workflow_id=workflow.id,
            lead_id=lead.id,
            status="queued",
            approval_status="pending",
            requested_by="eval_suite",
            provider="openai",
            model=settings.ai_openai_model,
            execution_mode="queued_provider",
            requires_human_approval=True,
            risk_summary="queued for provider-path eval",
            input_payload=build_run_input_payload(lead),
            output_payload={"queue": {"status": "eval"}},
        )
        db.add(run)
        db.flush()
        ensure_run_scaffolding(db, run)
        db.commit()
        return int(lead.id), int(run.id)
    finally:
        db.close()


def _fetch_run_snapshot(run_id: int) -> dict[str, object]:
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
                select estimated_cost_usd, total_tokens, metadata
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
        return {
            "status": run.status if run else None,
            "approval_status": run.approval_status if run else None,
            "execution_mode": run.execution_mode if run else None,
            "provider": run.provider if run else None,
            "model": run.model if run else None,
            "opportunity_id": run.opportunity_id if run else None,
            "approval_id": approval.id if approval else None,
            "incidents": [incident_type for (incident_type,) in incidents],
            "ledger_rows": [
                {
                    "estimated_cost_usd": Decimal(str(row["estimated_cost_usd"] or 0)),
                    "total_tokens": int(row["total_tokens"] or 0),
                    "metadata": row["metadata"] or {},
                }
                for row in ledger_rows
            ],
            "tasks": [(int(sequence_no), str(status)) for sequence_no, status in tasks],
        }
    finally:
        db.close()


def _approve_run(run_id: int, approval_id: int) -> dict[str, object]:
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
            decision_notes="provider-path eval approval",
        )
        db.commit()
        db.refresh(run)
        return {
            "status": run.status,
            "approval_status": run.approval_status,
            "opportunity_id": run.opportunity_id,
        }
    finally:
        db.close()


def _provider_success_case() -> tuple[bool, str]:
    lead_id, run_id = _create_eval_run(company_name="Provider Success Systems")
    original_execute = worker_module.execute_provider_qualification
    original_alternates = worker_module.alternate_provider_targets
    try:
        def fake_execute_provider_qualification(provider: str, model: str, lead_snapshot: dict[str, object]) -> ProviderExecutionResult:
            return ProviderExecutionResult(
                qualification={
                    "score": 88,
                    "tier": "high",
                    "recommended_stage": "qualified",
                    "reasons": [
                        "Budget and delivery urgency are both explicit.",
                        "Qualified buyer context is present.",
                        "Discovery package includes clear next steps.",
                    ],
                },
                recommended_actions=[
                    "Create a qualified opportunity for sales review.",
                    "Schedule discovery with a named supervisor.",
                ],
                risk_summary=f"low-risk run: provider-backed qualification for {lead_snapshot.get('company_name')}.",
                raw_text='{"qualification":{"score":88,"tier":"high","recommended_stage":"qualified","reasons":["Budget and delivery urgency are both explicit.","Qualified buyer context is present.","Discovery package includes clear next steps."]},"recommended_actions":["Create a qualified opportunity for sales review.","Schedule discovery with a named supervisor."],"risk_summary":"low-risk run: provider-backed qualification."}',
                usage=ProviderUsage(prompt_tokens=1000, completion_tokens=500, total_tokens=1500),
                metadata={"provider_request_id": "eval-provider-success", "response_id": "eval-success-1"},
            )

        worker_module.execute_provider_qualification = fake_execute_provider_qualification
        worker_module.alternate_provider_targets = lambda primary_provider: []

        with _temporary_settings(
            ai_model_pricing_json=json.dumps(
                {
                    settings.ai_openai_model: {
                        "input_per_1m_tokens_usd": "5.00",
                        "output_per_1m_tokens_usd": "15.00",
                    }
                }
            ),
            ai_cost_alert_per_run_usd=Decimal("0.010000"),
            ai_cost_alert_daily_usd=Decimal("0.010000"),
        ):
            worker_module.execute_ai_factory_run(run_id)

        snapshot = _fetch_run_snapshot(run_id)
        if snapshot["status"] != "awaiting_approval":
            return False, f"FAIL provider_success_path: expected awaiting_approval got {snapshot['status']}"
        if snapshot["execution_mode"] != "queued_provider":
            return False, f"FAIL provider_success_path: expected queued_provider got {snapshot['execution_mode']}"
        if not snapshot["approval_id"]:
            return False, "FAIL provider_success_path: approval request missing"
        if not snapshot["ledger_rows"]:
            return False, "FAIL provider_success_path: cost ledger missing"
        ledger_row = snapshot["ledger_rows"][0]
        if ledger_row["estimated_cost_usd"] <= Decimal("0"):
            return False, "FAIL provider_success_path: expected estimated cost > 0"
        if "cost_run_threshold_exceeded" not in snapshot["incidents"]:
            return False, "FAIL provider_success_path: per-run cost alert incident missing"
        if "cost_daily_threshold_exceeded" not in snapshot["incidents"]:
            return False, "FAIL provider_success_path: daily cost alert incident missing"

        approval_result = _approve_run(run_id, int(snapshot["approval_id"]))
        if approval_result["status"] != "approved" or not approval_result["opportunity_id"]:
            return False, "FAIL provider_success_path: approval did not create/link opportunity"

        return (
            True,
            (
                "PASS provider_success_path: "
                f"estimated_cost_usd={ledger_row['estimated_cost_usd']} "
                f"tokens={ledger_row['total_tokens']} "
                f"opportunity_id={approval_result['opportunity_id']}"
            ),
        )
    finally:
        worker_module.execute_provider_qualification = original_execute
        worker_module.alternate_provider_targets = original_alternates
        _cleanup_run_artifacts(run_id, lead_id)


def _provider_fallback_case() -> tuple[bool, str]:
    lead_id, run_id = _create_eval_run(company_name="Provider Fallback Systems")
    original_execute = worker_module.execute_provider_qualification
    original_alternates = worker_module.alternate_provider_targets
    try:
        def failing_execute_provider_qualification(provider: str, model: str, lead_snapshot: dict[str, object]) -> ProviderExecutionResult:
            raise RuntimeError("simulated provider timeout during eval")

        worker_module.execute_provider_qualification = failing_execute_provider_qualification
        worker_module.alternate_provider_targets = lambda primary_provider: []

        with _temporary_settings(
            ai_model_pricing_json="{}",
            ai_cost_alert_per_run_usd=Decimal("0"),
            ai_cost_alert_daily_usd=Decimal("0"),
        ):
            worker_module.execute_ai_factory_run(run_id)

        snapshot = _fetch_run_snapshot(run_id)
        if snapshot["status"] != "awaiting_approval":
            return False, f"FAIL provider_fallback_path: expected awaiting_approval got {snapshot['status']}"
        if snapshot["execution_mode"] != "queued_deterministic":
            return False, f"FAIL provider_fallback_path: expected queued_deterministic got {snapshot['execution_mode']}"
        if snapshot["provider"] != "deterministic":
            return False, f"FAIL provider_fallback_path: expected deterministic provider got {snapshot['provider']}"
        if "provider_execution_failed" not in snapshot["incidents"]:
            return False, "FAIL provider_fallback_path: provider failure incident missing"
        if "deterministic_fallback_used" not in snapshot["incidents"]:
            return False, "FAIL provider_fallback_path: deterministic fallback incident missing"

        return (
            True,
            (
                "PASS provider_fallback_path: "
                f"execution_mode={snapshot['execution_mode']} "
                f"incidents={','.join(snapshot['incidents'])}"
            ),
        )
    finally:
        worker_module.execute_provider_qualification = original_execute
        worker_module.alternate_provider_targets = original_alternates
        _cleanup_run_artifacts(run_id, lead_id)


def main() -> int:
    cases = [
        _provider_success_case,
        _provider_fallback_case,
    ]
    passed = 0
    failed = 0
    started_at = datetime.utcnow().isoformat() + "Z"
    print(f"provider-path eval started_at={started_at}")
    for case_fn in cases:
        ok, message = case_fn()
        print(message)
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"summary: passed={passed} failed={failed} cases={len(cases)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
