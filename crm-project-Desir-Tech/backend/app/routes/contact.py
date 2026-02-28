"""
Contact form submission endpoint.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ContactSubmission
from app.schemas import ContactSubmissionCreate, ContactSubmissionResponse

router = APIRouter()


@router.post("/", response_model=ContactSubmissionResponse, status_code=201)
async def submit_contact(
    data: ContactSubmissionCreate, db: Session = Depends(get_db)
):
    submission = ContactSubmission(**data.model_dump())
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/", response_model=list[ContactSubmissionResponse])
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
