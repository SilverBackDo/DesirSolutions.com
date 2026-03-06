"""
Contact form submission endpoint.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.database import get_db
from app.models import ContactSubmission
from app.schemas import ContactSubmissionCreate, ContactSubmissionResponse

logger = logging.getLogger("desirtech")
router = APIRouter()


@router.post("/", response_model=ContactSubmissionResponse, status_code=201)
async def submit_contact(
    request: Request, db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")

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

    submission = ContactSubmission(
        **data.model_dump(exclude={"website"})
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/", response_model=list[ContactSubmissionResponse],
            dependencies=[Depends(require_api_key)])
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
