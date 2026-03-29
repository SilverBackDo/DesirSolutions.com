"""
SQLAlchemy models for CRM.
"""

from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    BigInteger,
    JSON,
    Numeric,
    String,
    Text,
)

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
    website = Column(String(255), nullable=True)
    converted_to_lead = Column(Boolean, nullable=False, default=False)
    converted_at = Column(DateTime, nullable=True)
    utm_source = Column(String(120), nullable=True)
    utm_medium = Column(String(120), nullable=True)
    utm_campaign = Column(String(120), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(BigInteger, primary_key=True, index=True)
    source = Column(
        SQLEnum(
            "website",
            "referral",
            "linkedin",
            "email",
            "event",
            "partner",
            "outbound",
            "other",
            "readiness_smoke",
            name="lead_source",
        ),
        nullable=False,
        default="website",
    )
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
    stage = Column(
        SQLEnum(
            "new",
            "qualified",
            "discovery",
            "proposal",
            "negotiation",
            "won",
            "lost",
            "on_hold",
            name="opportunity_stage",
        ),
        nullable=False,
        default="new",
    )
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
    status = Column(
        SQLEnum(
            "draft",
            "issued",
            "partially_paid",
            "paid",
            "overdue",
            "void",
            name="invoice_status",
        ),
        nullable=False,
        default="draft",
    )
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
    method = Column(
        SQLEnum(
            "ach",
            "wire",
            "card",
            "check",
            "cash",
            "other",
            name="payment_method",
        ),
        nullable=False,
    )
    reference_number = Column(String(120), nullable=True)
    processor = Column(String(80), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIFactoryWorkflow(Base):
    __tablename__ = "ai_workflows"

    id = Column(BigInteger, primary_key=True, index=True)
    workflow_key = Column(String(120), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(String(40), nullable=False, default="active")
    autonomy_level = Column(String(40), nullable=False, default="copilot")
    primary_provider = Column(String(40), nullable=False, default="openai")
    default_model = Column(String(120), nullable=True)
    requires_human_approval = Column(Boolean, nullable=False, default=True)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class AIFactoryRun(Base):
    __tablename__ = "ai_runs"

    id = Column(BigInteger, primary_key=True, index=True)
    workflow_id = Column(BigInteger, ForeignKey("ai_workflows.id"), nullable=False)
    lead_id = Column(BigInteger, ForeignKey("leads.id"), nullable=True)
    opportunity_id = Column(BigInteger, ForeignKey("opportunities.id"), nullable=True)
    status = Column(String(40), nullable=False, default="queued")
    approval_status = Column(String(40), nullable=False, default="pending")
    requested_by = Column(String(120), nullable=False, default="system")
    provider = Column(String(40), nullable=False, default="openai")
    model = Column(String(120), nullable=True)
    execution_mode = Column(String(40), nullable=False, default="deterministic")
    requires_human_approval = Column(Boolean, nullable=False, default=True)
    risk_summary = Column(Text, nullable=True)
    input_payload = Column(JSON, nullable=True)
    output_payload = Column(JSON, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class AIFactoryTask(Base):
    __tablename__ = "ai_tasks"

    id = Column(BigInteger, primary_key=True, index=True)
    run_id = Column(BigInteger, ForeignKey("ai_runs.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)
    agent_key = Column(String(120), nullable=False)
    agent_name = Column(String(255), nullable=False)
    status = Column(String(40), nullable=False, default="pending")
    input_payload = Column(JSON, nullable=True)
    output_payload = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class AIFactoryApproval(Base):
    __tablename__ = "ai_approvals"

    id = Column(BigInteger, primary_key=True, index=True)
    run_id = Column(BigInteger, ForeignKey("ai_runs.id"), nullable=False)
    approval_type = Column(String(80), nullable=False)
    status = Column(String(40), nullable=False, default="pending")
    requested_from = Column(String(120), nullable=False, default="human_supervisor")
    requested_reason = Column(Text, nullable=False)
    decided_by = Column(String(120), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decision_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIFactoryCostLedger(Base):
    __tablename__ = "ai_cost_ledger"

    id = Column(BigInteger, primary_key=True, index=True)
    run_id = Column(BigInteger, ForeignKey("ai_runs.id"), nullable=False)
    provider = Column(String(40), nullable=False)
    model = Column(String(120), nullable=True)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    estimated_cost_usd = Column(Numeric(12, 6), nullable=False, default=0)
    cost_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIFactoryIncident(Base):
    __tablename__ = "ai_incidents"

    id = Column(BigInteger, primary_key=True, index=True)
    run_id = Column(BigInteger, ForeignKey("ai_runs.id"), nullable=True)
    severity = Column(String(40), nullable=False, default="medium")
    incident_type = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(40), nullable=False, default="open")
    owner = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
