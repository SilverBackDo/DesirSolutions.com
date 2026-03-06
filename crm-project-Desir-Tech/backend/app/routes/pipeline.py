"""
Pipeline dashboard endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.database import get_db
from app.models import Opportunity
from app.schemas import PipelineStageSummaryResponse

router = APIRouter(dependencies=[Depends(require_api_key)])


@router.get("/summary", response_model=list[PipelineStageSummaryResponse])
async def pipeline_summary(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Opportunity.stage.label("stage"),
            func.count(Opportunity.id).label("opportunity_count"),
            func.coalesce(func.sum(Opportunity.estimated_value),
                          0).label("total_estimated_value"),
            func.coalesce(
                func.sum((Opportunity.estimated_value *
                         Opportunity.probability_percent) / 100.0),
                0,
            ).label("total_weighted_value"),
        )
        .group_by(Opportunity.stage)
        .order_by(Opportunity.stage.asc())
        .all()
    )

    return [
        PipelineStageSummaryResponse(
            stage=row.stage,
            opportunity_count=int(row.opportunity_count),
            total_estimated_value=float(row.total_estimated_value),
            total_weighted_value=float(row.total_weighted_value),
        )
        for row in rows
    ]
