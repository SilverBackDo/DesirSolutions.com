"""
Contact form submission endpoint.
"""

import logging
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth import require_internal_roles
from app.config import settings
from app.database import get_db
from app.models import ContactSubmission, Lead
from app.schemas import ContactSubmissionCreate, ContactSubmissionResponse

logger = logging.getLogger("desirtech")
router = APIRouter()


def _client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        return forwarded_for.split(",")[0].strip() or None
    return request.client.host if request.client else None


async def _send_contact_notification(
    submission: ContactSubmission,
    lead: Lead,
) -> None:
    if not settings.contact_notification_webhook_url:
        return

    summary = (
        f"New website consultation request from {submission.name} "
        f"({submission.email}) -> lead #{lead.id}"
    )
    payload = {
        "text": summary,
        "submission_id": int(submission.id),
        "lead_id": int(lead.id),
        "name": submission.name,
        "email": submission.email,
        "company": submission.company,
        "environment": submission.environment,
        "timeline": submission.timeline,
        "message": submission.message,
    }
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                settings.contact_notification_webhook_url,
                json=payload,
            )
            response.raise_for_status()
    except Exception:
        logger.exception(
            "Failed to deliver contact notification for submission_id=%s lead_id=%s",
            submission.id,
            lead.id,
        )


@router.post("/", response_model=ContactSubmissionResponse, status_code=201)
async def submit_contact(
    request: Request, db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    payload: dict[str, object]

    try:
        if "application/json" in content_type:
            payload = await request.json()
        else:
            payload = dict(await request.form())
        data = ContactSubmissionCreate.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid request payload") from exc

    # Honeypot: if the hidden 'website' field has any value, it's a bot
    if data.website:
        logger.warning("Honeypot triggered from %s", data.email)
        raise HTTPException(status_code=422, detail="Validation failed")

    client_ip = _client_ip(request)
    window_start = datetime.utcnow() - timedelta(
        minutes=settings.contact_submission_rate_limit_window_minutes
    )
    duplicate_count_query = db.query(ContactSubmission.id).filter(
        ContactSubmission.created_at >= window_start
    )
    if client_ip:
        duplicate_count_query = duplicate_count_query.filter(
            (ContactSubmission.email == data.email)
            | (ContactSubmission.ip_address == client_ip)
        )
    else:
        duplicate_count_query = duplicate_count_query.filter(
            ContactSubmission.email == data.email
        )
    duplicate_count = duplicate_count_query.count()
    if duplicate_count >= settings.contact_submission_rate_limit_max:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many contact requests received. Please try again later.",
        )

    qualification_lines = [
        f"Primary Need: {payload.get('priority')}" if payload.get("priority") else "",
        (
            f"Environment Scope: {payload.get('infrastructure_scope')}"
            if payload.get("infrastructure_scope")
            else ""
        ),
        f"Budget Range: {payload.get('budget_band')}" if payload.get("budget_band") else "",
    ]
    submission_message = "\n".join(
        item for item in [*qualification_lines, data.message or ""] if item
    ) or None
    submission = ContactSubmission(
        **data.model_dump(exclude={"website", "message"}),
        message=submission_message,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(submission)
    db.flush()

    notes = "\n".join(
        item
        for item in [
            f"Environment: {data.environment}" if data.environment else "",
            f"Timeline: {data.timeline}" if data.timeline else "",
            *qualification_lines,
            data.message or "",
        ]
        if item
    ) or None
    lead = Lead(
        source="website",
        contact_submission_id=submission.id,
        contact_name=data.name,
        contact_email=data.email,
        company_name=data.company,
        title=data.role,
        notes=notes,
    )
    db.add(lead)
    submission.converted_to_lead = True
    submission.converted_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    db.refresh(lead)
    await _send_contact_notification(submission, lead)
    logger.info(
        "Contact submission routed into CRM lead_id=%s submission_id=%s",
        lead.id,
        submission.id,
    )
    return submission


@router.get("/", response_model=list[ContactSubmissionResponse],
            dependencies=[Depends(require_internal_roles("admin", "sales", "viewer"))])
async def list_submissions(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    submissions = (
        db.query(ContactSubmission)
        .order_by(ContactSubmission.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return submissions
