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


class ContactSubmissionResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: str | None = None
    role: str | None = None
    environment: str | None = None
    timeline: str | None = None
    message: str | None = None
    converted_to_lead: bool
    converted_at: datetime | None = None
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
    role: str


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


class AgentBlueprintAgentResponse(BaseModel):
    name: str
    role: str
    mission: str
    inputs: list[str]
    outputs: list[str]


class AgentBlueprintWorkflowStepResponse(BaseModel):
    order: int
    name: str
    description: str
    owner: str
    handoff_to: str


class AgentBlueprintPromptResponse(BaseModel):
    title: str
    text: str


class AgentBlueprintResponse(BaseModel):
    framework: str
    framework_label: str
    name: str
    objective: str
    agents: list[AgentBlueprintAgentResponse]
    workflow: list[AgentBlueprintWorkflowStepResponse]
    automation_targets: list[str]
    weekly_kpis: list[str]
    starter_prompts: list[AgentBlueprintPromptResponse]


class AIFactoryWorkflowResponse(BaseModel):
    id: int
    workflow_key: str
    name: str
    description: str
    objective: str
    version: int
    status: str
    autonomy_level: str
    primary_provider: str
    default_model: str | None = None
    requires_human_approval: bool
    config: dict | list | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIFactoryRunLaunchOptions(BaseModel):
    lead_id: int = Field(..., ge=1)
    preferred_provider: str | None = Field(None, max_length=40)
    preferred_model: str | None = Field(None, max_length=120)


class AIFactoryRunCreate(AIFactoryRunLaunchOptions):
    pass


class AIFactoryProposalRunCreate(BaseModel):
    opportunity_id: int = Field(..., ge=1)
    preferred_provider: str | None = Field(None, max_length=40)
    preferred_model: str | None = Field(None, max_length=120)


class AIFactoryTaskResponse(BaseModel):
    id: int
    sequence_no: int
    agent_key: str
    agent_name: str
    status: str
    input_payload: dict | list | None = None
    output_payload: dict | list | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIFactoryApprovalResponse(BaseModel):
    id: int
    approval_type: str
    status: str
    requested_from: str
    requested_reason: str
    decided_by: str | None = None
    decided_at: datetime | None = None
    decision_notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIFactoryRunResponse(BaseModel):
    id: int
    workflow_id: int
    lead_id: int | None = None
    opportunity_id: int | None = None
    status: str
    approval_status: str
    requested_by: str
    provider: str
    model: str | None = None
    execution_mode: str
    requires_human_approval: bool
    risk_summary: str | None = None
    input_payload: dict | list | None = None
    output_payload: dict | list | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    tasks: list[AIFactoryTaskResponse] = []
    approvals: list[AIFactoryApprovalResponse] = []

    class Config:
        from_attributes = True


class AIFactoryApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject)$")
    decision_notes: str | None = Field(None, max_length=5000)


class AIFactoryIncidentResponse(BaseModel):
    id: int
    run_id: int | None = None
    severity: str
    incident_type: str
    description: str
    status: str
    owner: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIFactoryCostProviderSummaryResponse(BaseModel):
    provider: str
    model: str | None = None
    run_count: int
    total_tokens: int
    estimated_cost_usd: float


class AIFactoryCostSummaryResponse(BaseModel):
    total_estimated_cost_usd: float
    today_estimated_cost_usd: float
    last_7d_estimated_cost_usd: float
    run_alert_threshold_usd: float
    daily_alert_threshold_usd: float
    open_incident_count: int
    pricing_configured_models: list[str]
    by_provider_model: list[AIFactoryCostProviderSummaryResponse]
