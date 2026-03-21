"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field


class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=5000)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=5000)


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., max_length=255)
    company: str | None = Field(None, max_length=255)
    role: str | None = Field(None, max_length=255)
    environment: str | None = Field(None, max_length=50)
    timeline: str | None = Field(None, max_length=255)
    message: str | None = Field(None, max_length=5000)
    website: str | None = Field(None, max_length=0)  # honeypot — must be empty


class ContactSubmissionResponse(ContactSubmissionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=1, max_length=200)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class AuthUserResponse(BaseModel):
    username: str
    auth_type: str


class LeadBase(BaseModel):
    source: str = Field(default="website", max_length=40)
    contact_submission_id: int | None = None
    client_id: int | None = None
    contact_name: str = Field(..., min_length=1, max_length=255)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(None, max_length=50)
    company_name: str | None = Field(None, max_length=255)
    title: str | None = Field(None, max_length=120)
    estimated_deal_value: float | None = None
    notes: str | None = Field(None, max_length=5000)
    owner_employee_id: int | None = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    source: str | None = Field(None, max_length=40)
    contact_submission_id: int | None = None
    client_id: int | None = None
    contact_name: str | None = Field(None, min_length=1, max_length=255)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(None, max_length=50)
    company_name: str | None = Field(None, max_length=255)
    title: str | None = Field(None, max_length=120)
    estimated_deal_value: float | None = None
    notes: str | None = Field(None, max_length=5000)
    owner_employee_id: int | None = None


class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OpportunityBase(BaseModel):
    lead_id: int | None = None
    client_id: int | None = None
    name: str = Field(..., min_length=1, max_length=255)
    stage: str = Field(default="new", max_length=40)
    estimated_value: float = 0
    probability_percent: float = Field(default=10, ge=0, le=100)
    expected_close_date: date | None = None
    owner_employee_id: int | None = None
    is_won: bool = False
    is_lost: bool = False
    lost_reason: str | None = Field(None, max_length=5000)


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityUpdate(BaseModel):
    lead_id: int | None = None
    client_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=255)
    stage: str | None = Field(None, max_length=40)
    estimated_value: float | None = None
    probability_percent: float | None = Field(None, ge=0, le=100)
    expected_close_date: date | None = None
    owner_employee_id: int | None = None
    is_won: bool | None = None
    is_lost: bool | None = None
    lost_reason: str | None = Field(None, max_length=5000)


class OpportunityResponse(OpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OpportunityActivityCreate(BaseModel):
    activity_type: str = Field(..., min_length=1, max_length=60)
    activity_date: datetime | None = None
    summary: str = Field(..., min_length=1, max_length=5000)
    next_step: str | None = Field(None, max_length=5000)
    owner_employee_id: int | None = None


class OpportunityActivityResponse(OpportunityActivityCreate):
    id: int
    opportunity_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PipelineStageSummaryResponse(BaseModel):
    stage: str
    opportunity_count: int
    total_estimated_value: float
    total_weighted_value: float


class AccountsReceivableRowResponse(BaseModel):
    invoice_id: int
    invoice_number: str
    client_id: int
    client_name: str
    invoice_date: date
    due_date: date
    total_amount: float
    amount_paid: float
    amount_outstanding: float
    status: str


class MonthlyCashflowRowResponse(BaseModel):
    month: date
    incoming_amount: float
    outgoing_amount: float
    net_cashflow: float


class TaxPositionRowResponse(BaseModel):
    id: int
    tax_name: str
    jurisdiction: str
    period_start: date
    period_end: date
    due_date: date
    paid_date: date | None = None
    amount_due: float
    amount_paid: float
    balance_due: float
    status: str


class DashboardSummaryResponse(BaseModel):
    pipeline: list[PipelineStageSummaryResponse]
    accounts_receivable: list[AccountsReceivableRowResponse]
    monthly_cashflow: list[MonthlyCashflowRowResponse]
    tax_position: list[TaxPositionRowResponse]


class DashboardKpisResponse(BaseModel):
    open_opportunity_count: int
    total_pipeline_estimated_value: float
    total_pipeline_weighted_value: float
    receivables_outstanding_total: float
    overdue_invoice_count: int
    tax_balance_due_total: float


class InvoiceBase(BaseModel):
    client_id: int
    invoice_number: str = Field(..., min_length=1, max_length=80)
    invoice_date: date
    due_date: date
    status: str = Field(default="draft", max_length=40)
    subtotal: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    currency_code: str = Field(default="USD", min_length=3, max_length=3)
    notes: str | None = Field(None, max_length=5000)


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    client_id: int | None = None
    invoice_number: str | None = Field(None, min_length=1, max_length=80)
    invoice_date: date | None = None
    due_date: date | None = None
    status: str | None = Field(None, max_length=40)
    subtotal: float | None = Field(None, ge=0)
    tax_amount: float | None = Field(None, ge=0)
    total_amount: float | None = Field(None, ge=0)
    currency_code: str | None = Field(None, min_length=3, max_length=3)
    notes: str | None = Field(None, max_length=5000)


class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncomingPaymentBase(BaseModel):
    invoice_id: int | None = None
    client_id: int
    payment_date: date
    amount: float = Field(..., gt=0)
    method: str = Field(default="ach", min_length=1, max_length=40)
    reference_number: str | None = Field(None, max_length=120)
    processor: str | None = Field(None, max_length=80)
    notes: str | None = Field(None, max_length=5000)


class IncomingPaymentCreate(IncomingPaymentBase):
    pass


class IncomingPaymentUpdate(BaseModel):
    invoice_id: int | None = None
    client_id: int | None = None
    payment_date: date | None = None
    amount: float | None = Field(None, gt=0)
    method: str | None = Field(None, min_length=1, max_length=40)
    reference_number: str | None = Field(None, max_length=120)
    processor: str | None = Field(None, max_length=80)
    notes: str | None = Field(None, max_length=5000)


class IncomingPaymentResponse(IncomingPaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
