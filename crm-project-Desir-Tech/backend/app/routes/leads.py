"""
Lead management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import require_internal_roles
from app.database import get_db
from app.models import Lead
from app.schemas import LeadCreate, LeadUpdate, LeadResponse

router = APIRouter(
    dependencies=[Depends(require_internal_roles("admin", "sales", allow_api_key=True))]
)


@router.get("/", response_model=list[LeadResponse])
async def list_leads(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    leads = (
        db.query(Lead)
        .order_by(Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**lead_data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: int, lead_data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for key, value in lead_data.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
