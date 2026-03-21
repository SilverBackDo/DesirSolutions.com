"""
Invoice management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_internal_access
from app.database import get_db
from app.models import Invoice
from app.schemas import InvoiceCreate, InvoiceResponse, InvoiceUpdate

router = APIRouter(dependencies=[Depends(require_internal_access)])


@router.get("/", response_model=list[InvoiceResponse])
async def list_invoices(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)

    return (
        query.order_by(Invoice.invoice_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=InvoiceResponse, status_code=201)
async def create_invoice(invoice_data: InvoiceCreate, db: Session = Depends(get_db)):
    invoice = Invoice(**invoice_data.model_dump())
    db.add(invoice)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Invoice number already exists")

    db.refresh(invoice)
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: int, invoice_data: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    for key, value in invoice_data.model_dump(exclude_unset=True).items():
        setattr(invoice, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Invoice number already exists")

    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.delete(invoice)
    db.commit()
