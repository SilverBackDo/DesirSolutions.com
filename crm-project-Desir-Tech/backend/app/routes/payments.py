"""
Incoming payment management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import require_user_roles
from app.database import get_db
from app.models import IncomingPayment
from app.schemas import IncomingPaymentCreate, IncomingPaymentResponse, IncomingPaymentUpdate

router = APIRouter(dependencies=[Depends(require_user_roles("admin", "finance"))])


@router.get("/", response_model=list[IncomingPaymentResponse])
async def list_payments(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=500),
    client_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(IncomingPayment)
    if client_id is not None:
        query = query.filter(IncomingPayment.client_id == client_id)

    return (
        query.order_by(IncomingPayment.payment_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{payment_id}", response_model=IncomingPaymentResponse)
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(IncomingPayment).filter(
        IncomingPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=IncomingPaymentResponse, status_code=201)
async def create_payment(payment_data: IncomingPaymentCreate, db: Session = Depends(get_db)):
    payment = IncomingPayment(**payment_data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{payment_id}", response_model=IncomingPaymentResponse)
async def update_payment(payment_id: int, payment_data: IncomingPaymentUpdate, db: Session = Depends(get_db)):
    payment = db.query(IncomingPayment).filter(
        IncomingPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    for key, value in payment_data.model_dump(exclude_unset=True).items():
        setattr(payment, key, value)

    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(IncomingPayment).filter(
        IncomingPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.delete(payment)
    db.commit()
