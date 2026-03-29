"""
Redis-backed worker entrypoint and job execution for AI Factory.
"""

from __future__ import annotations

from datetime import datetime
import logging
import sys
import traceback
from typing import Any, Callable

from opentelemetry import trace

from app.ai_factory_queue import (
    ack_ai_factory_run,
    dequeue_ai_factory_run,
    worker_consumer_name,
)
from app.ai_factory_runtime import (
    LEAD_QUALIFICATION_WORKFLOW_KEY,
    PROPOSAL_DRAFT_WORKFLOW_KEY,
    assert_ai_factory_ready,
    build_proposal_run_output,
    build_qualification_run_output,
    deterministic_proposal_draft,
    deterministic_qualification,
    ensure_run_scaffolding,
    record_cost_ledger,
    record_incident,
    set_task_state,
)
from app.ai_providers import (
    alternate_provider_targets,
    classify_provider_failure,
    execute_provider_proposal_draft,
    execute_provider_qualification,
)
from app.config import settings
from app.database import SessionLocal
from app.models import AIFactoryRun, AIFactoryWorkflow, Lead, Opportunity
from app.telemetry import configure_observability

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("desirtech.ai_factory.worker")
tracer = trace.get_tracer("desirtech.ai_factory.worker")


def _provider_attempt_record(
    provider: str,
    model: str | None,
    *,
    status: str,
    error: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "provider": provider,
        "model": model,
        "status": status,
    }
    if error:
        payload["error"] = error
    return payload


def _fail_run(
    db: Any,
    run: AIFactoryRun,
    *,
    incident_type: str,
    description: str,
) -> None:
    run.status = "failed"
    run.approval_status = "blocked"
    run.completed_at = datetime.utcnow()
    run.output_payload = {"error": description}
    record_incident(
        db,
        run.id,
        "high",
        incident_type,
        description,
    )
    db.commit()


def _run_provider_execution(
    db: Any,
    run: AIFactoryRun,
    *,
    execute_provider: Callable[[str, str], Any],
    unpack_result: Callable[[Any], tuple[dict[str, Any], list[str], str]],
    execute_deterministic: Callable[[], tuple[dict[str, Any], list[str], str]],
) -> tuple[dict[str, Any], list[str], str, dict[str, object]]:
    requested_provider = run.provider
    requested_model = run.model
    attempt_history: list[dict[str, object]] = []

    def _record_success(
        provider: str,
        model: str | None,
        result: Any,
        *,
        fallback_used: bool,
        fallback_reason: str | None = None,
    ) -> tuple[dict[str, Any], list[str], str, dict[str, object]]:
        record_cost_ledger(
            db,
            run.id,
            provider,
            model,
            prompt_tokens=result.usage.prompt_tokens,
            completion_tokens=result.usage.completion_tokens,
            total_tokens=result.usage.total_tokens,
            metadata=result.metadata,
        )
        payload, recommended_actions, risk_summary = unpack_result(result)
        provider_metadata = {
            **result.metadata,
            "raw_output": result.raw_text,
            "requested_provider": requested_provider,
            "requested_model": requested_model,
            "actual_provider": provider,
            "actual_model": model,
            "attempt_history": attempt_history,
            "fallback_used": fallback_used,
        }
        if fallback_reason:
            provider_metadata["fallback_reason"] = fallback_reason
        return payload, recommended_actions, risk_summary, provider_metadata

    try:
        result = execute_provider(requested_provider, requested_model or "")
        attempt_history.append(
            _provider_attempt_record(
                requested_provider,
                requested_model,
                status="completed",
            )
        )
        return _record_success(
            requested_provider,
            requested_model,
            result,
            fallback_used=False,
        )
    except Exception as provider_exc:
        failure = classify_provider_failure(
            requested_provider,
            requested_model,
            provider_exc,
        )
        attempt_history.append(
            _provider_attempt_record(
                requested_provider,
                requested_model,
                status="failed",
                error=failure.message,
            )
        )
        record_incident(
            db,
            run.id,
            "medium",
            "provider_execution_failed",
            (
                f"Primary provider {requested_provider} failed for run {run.id}: "
                f"{failure.error_type} {failure.message}"
            ),
        )

        for candidate_provider, candidate_model in alternate_provider_targets(
            requested_provider
        ):
            try:
                fallback_result = execute_provider(candidate_provider, candidate_model)
                attempt_history.append(
                    _provider_attempt_record(
                        candidate_provider,
                        candidate_model,
                        status="completed",
                    )
                )
                record_incident(
                    db,
                    run.id,
                    "medium",
                    "provider_fallback_used",
                    (
                        f"Run {run.id} fell back from {requested_provider} "
                        f"to {candidate_provider} after provider failure."
                    ),
                )
                run.provider = candidate_provider
                run.model = candidate_model
                return _record_success(
                    candidate_provider,
                    candidate_model,
                    fallback_result,
                    fallback_used=True,
                    fallback_reason=failure.message,
                )
            except Exception as fallback_exc:
                fallback_failure = classify_provider_failure(
                    candidate_provider,
                    candidate_model,
                    fallback_exc,
                )
                attempt_history.append(
                    _provider_attempt_record(
                        candidate_provider,
                        candidate_model,
                        status="failed",
                        error=fallback_failure.message,
                    )
                )
                record_incident(
                    db,
                    run.id,
                    "medium",
                    "provider_fallback_failed",
                    (
                        f"Fallback provider {candidate_provider} failed for run {run.id}: "
                        f"{fallback_failure.error_type} {fallback_failure.message}"
                    ),
                )

        payload, recommended_actions, risk_summary = execute_deterministic()
        run.provider = "deterministic"
        run.model = None
        run.execution_mode = "queued_deterministic"
        provider_metadata = {
            "requested_provider": requested_provider,
            "requested_model": requested_model,
            "actual_provider": "deterministic",
            "actual_model": None,
            "attempt_history": attempt_history,
            "fallback_used": True,
            "fallback_reason": failure.message,
            "reason": "provider_execution_failed",
        }
        record_incident(
            db,
            run.id,
            "medium",
            "deterministic_fallback_used",
            f"Run {run.id} fell back to deterministic output after provider failures.",
        )
        record_cost_ledger(
            db,
            run.id,
            run.provider,
            run.model,
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            metadata=provider_metadata,
        )
        return payload, recommended_actions, risk_summary, provider_metadata


def execute_ai_factory_run(run_id: int) -> None:
    configure_observability()
    db = SessionLocal()
    try:
        with tracer.start_as_current_span("ai_factory.execute_run") as span:
            span.set_attribute("ai.run_id", run_id)
            assert_ai_factory_ready(db)
            run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
            if not run:
                logger.warning("AI Factory run %s no longer exists", run_id)
                return
            if run.status not in {"queued", "running"}:
                logger.info("Skipping AI Factory run %s in status %s", run_id, run.status)
                return

            workflow = (
                db.query(AIFactoryWorkflow)
                .filter(AIFactoryWorkflow.id == run.workflow_id)
                .first()
            )
            if not workflow:
                _fail_run(
                    db,
                    run,
                    incident_type="workflow_not_found",
                    description="Workflow was deleted before the AI worker executed the run.",
                )
                return

            workflow_key = workflow.workflow_key
            lead = db.query(Lead).filter(Lead.id == run.lead_id).first() if run.lead_id else None
            opportunity = (
                db.query(Opportunity).filter(Opportunity.id == run.opportunity_id).first()
                if run.opportunity_id
                else None
            )

            if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY and not lead:
                _fail_run(
                    db,
                    run,
                    incident_type="lead_not_found",
                    description="Lead was deleted before the AI Factory worker executed the run.",
                )
                return
            if workflow_key == PROPOSAL_DRAFT_WORKFLOW_KEY and not opportunity:
                _fail_run(
                    db,
                    run,
                    incident_type="opportunity_not_found",
                    description="Opportunity was deleted before the proposal draft workflow executed.",
                )
                return

            ensure_run_scaffolding(db, run, workflow_key)
            input_payload = dict(run.input_payload or {})
            lead_snapshot = dict(input_payload.get("lead_snapshot") or {})
            opportunity_snapshot = dict(input_payload.get("opportunity_snapshot") or {})

            task_one_input = (
                lead_snapshot
                if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY
                else opportunity_snapshot
            )
            task_one_started_note = (
                "Lead normalization started."
                if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY
                else "Opportunity context normalization started."
            )
            task_one_completed_note = (
                "Lead normalized into AI Factory run payload."
                if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY
                else "Opportunity context normalized into AI Factory run payload."
            )
            task_two_running_note = (
                "Qualification execution in progress."
                if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY
                else "Proposal drafting execution in progress."
            )
            task_three_note = (
                "Human approval required before any CRM write-back."
                if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY
                else "Human approval required before proposal-stage CRM write-back."
            )

            run.status = "running"
            run.started_at = run.started_at or datetime.utcnow()
            set_task_state(
                db,
                run.id,
                1,
                "running",
                input_payload=task_one_input,
                notes=task_one_started_note,
            )
            set_task_state(db, run.id, 2, "queued")
            set_task_state(db, run.id, 3, "queued")
            db.commit()

            set_task_state(
                db,
                run.id,
                1,
                "completed",
                input_payload=task_one_input,
                output_payload={"normalized": True},
                notes=task_one_completed_note,
            )
            set_task_state(
                db,
                run.id,
                2,
                "running",
                input_payload={
                    "lead_id": run.lead_id,
                    "opportunity_id": run.opportunity_id,
                    "provider": run.provider,
                    "model": run.model,
                },
                notes=task_two_running_note,
            )
            db.commit()

            if workflow_key == LEAD_QUALIFICATION_WORKFLOW_KEY:
                if run.execution_mode == "queued_provider":
                    qualification, recommended_actions, risk_summary, provider_metadata = _run_provider_execution(
                        db,
                        run,
                        execute_provider=lambda provider, model: execute_provider_qualification(
                            provider,
                            model,
                            lead_snapshot,
                        ),
                        unpack_result=lambda result: (
                            result.qualification,
                            result.recommended_actions,
                            result.risk_summary,
                        ),
                        execute_deterministic=lambda: deterministic_qualification(lead),
                    )
                else:
                    qualification, recommended_actions, risk_summary = deterministic_qualification(lead)
                    provider_metadata = {
                        "fallback": True,
                        "reason": "provider_credentials_not_configured",
                    }
                    record_cost_ledger(
                        db,
                        run.id,
                        run.provider,
                        run.model,
                        prompt_tokens=0,
                        completion_tokens=0,
                        total_tokens=0,
                        metadata=provider_metadata,
                    )

                run.output_payload = build_qualification_run_output(
                    qualification,
                    recommended_actions,
                    risk_summary,
                    execution_mode=run.execution_mode,
                    provider_metadata=provider_metadata,
                )
                task_two_output = qualification
                task_two_completed_note = f"Qualification generated via {run.execution_mode}."
                if provider_metadata.get("fallback_used"):
                    actual_provider = provider_metadata.get("actual_provider") or run.provider
                    task_two_completed_note = (
                        f"Qualification generated via fallback path using {actual_provider} "
                        f"({run.execution_mode})."
                    )
            else:
                if run.execution_mode == "queued_provider":
                    proposal_package, recommended_actions, risk_summary, provider_metadata = _run_provider_execution(
                        db,
                        run,
                        execute_provider=lambda provider, model: execute_provider_proposal_draft(
                            provider,
                            model,
                            opportunity_snapshot,
                            lead_snapshot or None,
                        ),
                        unpack_result=lambda result: (
                            result.proposal_package,
                            result.recommended_actions,
                            result.risk_summary,
                        ),
                        execute_deterministic=lambda: deterministic_proposal_draft(
                            opportunity,
                            lead,
                        ),
                    )
                else:
                    proposal_package, recommended_actions, risk_summary = deterministic_proposal_draft(
                        opportunity,
                        lead,
                    )
                    provider_metadata = {
                        "fallback": True,
                        "reason": "provider_credentials_not_configured",
                    }
                    record_cost_ledger(
                        db,
                        run.id,
                        run.provider,
                        run.model,
                        prompt_tokens=0,
                        completion_tokens=0,
                        total_tokens=0,
                        metadata=provider_metadata,
                    )

                run.output_payload = build_proposal_run_output(
                    proposal_package,
                    recommended_actions,
                    risk_summary,
                    execution_mode=run.execution_mode,
                    provider_metadata=provider_metadata,
                )
                task_two_output = proposal_package
                task_two_completed_note = f"Proposal draft generated via {run.execution_mode}."
                if provider_metadata.get("fallback_used"):
                    actual_provider = provider_metadata.get("actual_provider") or run.provider
                    task_two_completed_note = (
                        f"Proposal draft generated via fallback path using {actual_provider} "
                        f"({run.execution_mode})."
                    )

            run.risk_summary = risk_summary
            run.status = "awaiting_approval"
            run.approval_status = "pending"
            run.completed_at = datetime.utcnow()
            set_task_state(
                db,
                run.id,
                2,
                "completed",
                output_payload=task_two_output,
                notes=task_two_completed_note,
            )
            set_task_state(
                db,
                run.id,
                3,
                "pending_approval",
                input_payload={"recommended_actions": recommended_actions},
                output_payload={"approval_required": True},
                notes=task_three_note,
            )
            db.commit()
    except Exception as exc:
        logger.error("AI Factory run %s failed: %s\n%s", run_id, exc, traceback.format_exc())
        run = db.query(AIFactoryRun).filter(AIFactoryRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.approval_status = "blocked"
            run.completed_at = datetime.utcnow()
            run.output_payload = {
                "error": str(exc),
                "traceback": traceback.format_exc(),
            }
            set_task_state(
                db,
                run.id,
                2,
                "failed",
                output_payload={"error": str(exc)},
                notes="Workflow execution failed.",
            )
            set_task_state(
                db,
                run.id,
                3,
                "blocked",
                output_payload={"approval_required": False},
                notes="Approval was blocked because workflow execution failed.",
            )
            record_incident(
                db,
                run.id,
                "high",
                "execution_failure",
                f"AI Factory worker failed while processing run {run_id}: {exc}",
            )
            db.commit()
    finally:
        db.close()


def main() -> None:
    configure_observability()
    consumer_name = worker_consumer_name()
    logger.info("AI Factory worker listening on queue '%s'", settings.ai_factory_queue_name)
    while True:
        job = dequeue_ai_factory_run(
            consumer_name,
            timeout=5,
            reclaim_idle_ms=settings.ai_factory_queue_reclaim_idle_ms,
        )
        if not job:
            continue
        try:
            execute_ai_factory_run(job.run_id)
        finally:
            try:
                ack_ai_factory_run(job.message_id)
            except Exception as exc:
                logger.error(
                    "Failed to acknowledge AI Factory queue message %s: %s",
                    job.message_id,
                    exc,
                )


if __name__ == "__main__":
    main()
