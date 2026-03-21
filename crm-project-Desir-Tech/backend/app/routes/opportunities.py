"""
Opportunity and activity management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import require_internal_access
from app.database import get_db
from app.models import Opportunity, OpportunityActivity
from app.schemas import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityActivityCreate,
    OpportunityActivityResponse,
)

router = APIRouter(dependencies=[Depends(require_internal_access)])


@router.get("/", response_model=list[OpportunityResponse])
async def list_opportunities(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=500),
    stage: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Opportunity)
    if stage:
        query = query.filter(Opportunity.stage == stage)

    opportunities = (
        query.order_by(Opportunity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return opportunities


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity


@router.post("/", response_model=OpportunityResponse, status_code=201)
async def create_opportunity(opportunity_data: OpportunityCreate, db: Session = Depends(get_db)):
    opportunity = Opportunity(**opportunity_data.model_dump())
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity


@router.put("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: int,
    opportunity_data: OpportunityUpdate,
    db: Session = Depends(get_db),
):
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    for key, value in opportunity_data.model_dump(exclude_unset=True).items():
        setattr(opportunity, key, value)

    db.commit()
    db.refresh(opportunity)
    return opportunity


@router.delete("/{opportunity_id}", status_code=204)
async def delete_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    db.delete(opportunity)
    db.commit()


@router.get("/{opportunity_id}/activities", response_model=list[OpportunityActivityResponse])
async def list_activities(
    opportunity_id: int,
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    exists = db.query(Opportunity.id).filter(
        Opportunity.id == opportunity_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    activities = (
        db.query(OpportunityActivity)
        .filter(OpportunityActivity.opportunity_id == opportunity_id)
        .order_by(OpportunityActivity.activity_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return activities


@router.post("/{opportunity_id}/activities", response_model=OpportunityActivityResponse, status_code=201)
async def create_activity(
    opportunity_id: int,
    activity_data: OpportunityActivityCreate,
    db: Session = Depends(get_db),
):
    exists = db.query(Opportunity.id).filter(
        Opportunity.id == opportunity_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    payload = activity_data.model_dump()
    payload["opportunity_id"] = opportunity_id
    activity = OpportunityActivity(**payload)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
