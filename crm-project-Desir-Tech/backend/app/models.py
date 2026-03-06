"""
SQLAlchemy models for CRM.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, Date, Boolean, Numeric, ForeignKey

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    environment = Column(String(50), nullable=True)
    timeline = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(BigInteger, primary_key=True, index=True)
    source = Column(String(40), nullable=False, default="website")
    contact_submission_id = Column(BigInteger, ForeignKey(
        "contact_submissions.id"), nullable=True)
    client_id = Column(BigInteger, ForeignKey("clients.id"), nullable=True)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    company_name = Column(String(255), nullable=True)
    title = Column(String(120), nullable=True)
    estimated_deal_value = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    owner_employee_id = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(BigInteger, primary_key=True, index=True)
    lead_id = Column(BigInteger, ForeignKey("leads.id"), nullable=True)
    client_id = Column(BigInteger, ForeignKey("clients.id"), nullable=True)
    name = Column(String(255), nullable=False)
    stage = Column(String(40), nullable=False, default="new")
    estimated_value = Column(Numeric(12, 2), nullable=False, default=0)
    probability_percent = Column(Numeric(5, 2), nullable=False, default=10)
    expected_close_date = Column(Date, nullable=True)
    owner_employee_id = Column(BigInteger, nullable=True)
    is_won = Column(Boolean, nullable=False, default=False)
    is_lost = Column(Boolean, nullable=False, default=False)
    lost_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class OpportunityActivity(Base):
    __tablename__ = "opportunity_activities"

    id = Column(BigInteger, primary_key=True, index=True)
    opportunity_id = Column(BigInteger, ForeignKey(
        "opportunities.id"), nullable=False)
    activity_type = Column(String(60), nullable=False)
    activity_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    summary = Column(Text, nullable=False)
    next_step = Column(Text, nullable=True)
    owner_employee_id = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(BigInteger, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    project_id = Column(BigInteger, nullable=True)
    contract_id = Column(BigInteger, nullable=True)
    invoice_number = Column(String(80), nullable=False, unique=True)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(40), nullable=False, default="draft")
    subtotal = Column(Numeric(14, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(14, 2), nullable=False, default=0)
    total_amount = Column(Numeric(14, 2), nullable=False, default=0)
    currency_code = Column(String(3), nullable=False, default="USD")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class IncomingPayment(Base):
    __tablename__ = "incoming_payments"

    id = Column(BigInteger, primary_key=True, index=True)
    invoice_id = Column(BigInteger, ForeignKey("invoices.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    method = Column(String(40), nullable=False)
    reference_number = Column(String(120), nullable=True)
    processor = Column(String(80), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
