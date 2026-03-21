begin;

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'party_status') THEN
    CREATE TYPE party_status AS ENUM ('prospect','active','inactive','suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM ('website','referral','linkedin','email','event','partner','outbound','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_stage') THEN
    CREATE TYPE opportunity_stage AS ENUM ('new','qualified','discovery','proposal','negotiation','won','lost','on_hold');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('planning','active','at_risk','paused','completed','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft','issued','partially_paid','paid','overdue','void');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('ach','wire','card','check','cash','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_type') THEN
    CREATE TYPE worker_type AS ENUM ('employee','contractor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
    CREATE TYPE expense_status AS ENUM ('submitted','approved','paid','rejected');
  END IF;
END$$;

-- Preserve and expand existing clients table
alter table if exists clients
  add column if not exists status party_status default 'prospect',
  add column if not exists website varchar(255),
  add column if not exists industry varchar(120),
  add column if not exists billing_email varchar(255),
  add column if not exists legal_name varchar(255),
  add column if not exists tax_id varchar(120),
  add column if not exists payment_terms_days integer default 30,
  add column if not exists city varchar(120),
  add column if not exists state varchar(120),
  add column if not exists country varchar(120),
  add column if not exists source lead_source default 'website';

-- Preserve and expand existing contact_submissions table
alter table if exists contact_submissions
  add column if not exists converted_to_lead boolean default false,
  add column if not exists converted_at timestamptz,
  add column if not exists utm_source varchar(120),
  add column if not exists utm_medium varchar(120),
  add column if not exists utm_campaign varchar(120);

create table if not exists employees (
  id bigserial primary key,
  first_name varchar(120) not null,
  last_name varchar(120) not null,
  email varchar(255) not null unique,
  phone varchar(50),
  title varchar(120),
  department varchar(120),
  start_date date not null,
  end_date date,
  annual_salary numeric(12,2),
  status party_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contractors (
  id bigserial primary key,
  first_name varchar(120) not null,
  last_name varchar(120) not null,
  email varchar(255) not null unique,
  phone varchar(50),
  company_name varchar(255),
  worker_classification varchar(60) default '1099',
  hourly_cost_rate numeric(10,2) not null check (hourly_cost_rate >= 0),
  hourly_bill_rate numeric(10,2) check (hourly_bill_rate >= 0),
  status party_status not null default 'active',
  available_from date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contractor_skills (
  id bigserial primary key,
  contractor_id bigint not null references contractors(id) on delete cascade,
  skill_name varchar(120) not null,
  proficiency_level varchar(40),
  years_experience numeric(4,1),
  created_at timestamptz not null default now(),
  unique(contractor_id, skill_name)
);

create table if not exists pipeline_stages (
  id bigserial primary key,
  stage_key opportunity_stage not null unique,
  display_name varchar(120) not null,
  stage_order integer not null,
  default_probability numeric(5,2) not null check (default_probability between 0 and 100),
  is_closed boolean not null default false
);

create table if not exists leads (
  id bigserial primary key,
  source lead_source not null default 'website',
  contact_submission_id bigint references contact_submissions(id) on delete set null,
  client_id bigint references clients(id) on delete set null,
  contact_name varchar(255) not null,
  contact_email varchar(255),
  contact_phone varchar(50),
  company_name varchar(255),
  title varchar(120),
  estimated_deal_value numeric(12,2),
  notes text,
  owner_employee_id bigint references employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists opportunities (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  client_id bigint references clients(id) on delete set null,
  name varchar(255) not null,
  stage opportunity_stage not null default 'new',
  estimated_value numeric(12,2) not null default 0,
  probability_percent numeric(5,2) not null default 10 check (probability_percent between 0 and 100),
  weighted_value numeric(12,2) generated always as ((estimated_value * probability_percent) / 100.0) stored,
  expected_close_date date,
  owner_employee_id bigint references employees(id) on delete set null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists opportunity_activities (
  id bigserial primary key,
  opportunity_id bigint not null references opportunities(id) on delete cascade,
  activity_type varchar(60) not null,
  activity_date timestamptz not null default now(),
  summary text not null,
  next_step text,
  owner_employee_id bigint references employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id bigserial primary key,
  opportunity_id bigint not null references opportunities(id) on delete cascade,
  proposal_number varchar(80) not null unique,
  issue_date date not null,
  valid_until date,
  proposed_amount numeric(12,2) not null,
  status varchar(40) not null default 'sent',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contracts (
  id bigserial primary key,
  client_id bigint not null references clients(id) on delete restrict,
  opportunity_id bigint references opportunities(id) on delete set null,
  contract_type varchar(60) not null,
  contract_number varchar(120) unique,
  signed_date date,
  start_date date,
  end_date date,
  total_value numeric(14,2),
  status varchar(40) not null default 'draft',
  msa_signed boolean not null default false,
  sow_signed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id bigserial primary key,
  client_id bigint not null references clients(id) on delete restrict,
  contract_id bigint references contracts(id) on delete set null,
  opportunity_id bigint references opportunities(id) on delete set null,
  name varchar(255) not null,
  status project_status not null default 'planning',
  start_date date,
  end_date date,
  budget_amount numeric(14,2),
  target_margin_percent numeric(5,2),
  project_manager_employee_id bigint references employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_assignments (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  worker_type worker_type not null,
  employee_id bigint references employees(id) on delete set null,
  contractor_id bigint references contractors(id) on delete set null,
  role_name varchar(120),
  allocation_percent numeric(5,2) check (allocation_percent between 0 and 100),
  start_date date,
  end_date date,
  bill_rate numeric(10,2),
  cost_rate numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (worker_type = 'employee' and employee_id is not null and contractor_id is null)
    or (worker_type = 'contractor' and contractor_id is not null and employee_id is null)
  )
);

create table if not exists time_entries (
  id bigserial primary key,
  project_assignment_id bigint not null references project_assignments(id) on delete cascade,
  work_date date not null,
  hours numeric(6,2) not null check (hours >= 0 and hours <= 24),
  is_billable boolean not null default true,
  description text,
  approved_by_employee_id bigint references employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_assignment_id, work_date, description)
);

create table if not exists invoices (
  id bigserial primary key,
  client_id bigint not null references clients(id) on delete restrict,
  project_id bigint references projects(id) on delete set null,
  contract_id bigint references contracts(id) on delete set null,
  invoice_number varchar(80) not null unique,
  invoice_date date not null,
  due_date date not null,
  status invoice_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  currency_code char(3) not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id bigserial primary key,
  invoice_id bigint not null references invoices(id) on delete cascade,
  line_type varchar(40) not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(14,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists incoming_payments (
  id bigserial primary key,
  invoice_id bigint references invoices(id) on delete set null,
  client_id bigint not null references clients(id) on delete restrict,
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null,
  reference_number varchar(120),
  processor varchar(80),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists salary_payouts (
  id bigserial primary key,
  employee_id bigint not null references employees(id) on delete restrict,
  pay_period_start date not null,
  pay_period_end date not null,
  gross_amount numeric(12,2) not null,
  tax_withheld_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null,
  payout_date date not null,
  payment_method payment_method not null default 'ach',
  notes text,
  created_at timestamptz not null default now(),
  unique(employee_id, pay_period_start, pay_period_end)
);

create table if not exists contractor_payouts (
  id bigserial primary key,
  contractor_id bigint not null references contractors(id) on delete restrict,
  project_id bigint references projects(id) on delete set null,
  period_start date,
  period_end date,
  gross_amount numeric(12,2) not null,
  payout_date date not null,
  payment_method payment_method not null default 'ach',
  reference_number varchar(120),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists tax_obligations (
  id bigserial primary key,
  tax_name varchar(120) not null,
  jurisdiction varchar(120) not null,
  frequency varchar(40) not null,
  rate_percent numeric(6,3),
  account_reference varchar(120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tax_name, jurisdiction)
);

create table if not exists tax_payments (
  id bigserial primary key,
  tax_obligation_id bigint not null references tax_obligations(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  due_date date not null,
  paid_date date,
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2),
  status varchar(40) not null default 'scheduled',
  reference_number varchar(120),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id bigserial primary key,
  category_name varchar(120) not null unique,
  gl_code varchar(40),
  is_tax_deductible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id bigserial primary key,
  category_id bigint not null references expense_categories(id) on delete restrict,
  project_id bigint references projects(id) on delete set null,
  employee_id bigint references employees(id) on delete set null,
  contractor_id bigint references contractors(id) on delete set null,
  expense_date date not null,
  vendor_name varchar(255),
  amount numeric(12,2) not null check (amount >= 0),
  tax_amount numeric(12,2) not null default 0,
  status expense_status not null default 'submitted',
  description text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_campaigns (
  id bigserial primary key,
  campaign_name varchar(255) not null,
  channel lead_source not null,
  start_date date,
  end_date date,
  budget_amount numeric(12,2),
  owner_employee_id bigint references employees(id) on delete set null,
  status varchar(40) not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign_spend (
  id bigserial primary key,
  campaign_id bigint not null references marketing_campaigns(id) on delete cascade,
  spend_date date not null,
  amount numeric(12,2) not null,
  vendor_name varchar(255),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists marketing_leads (
  id bigserial primary key,
  campaign_id bigint not null references marketing_campaigns(id) on delete cascade,
  lead_id bigint not null references leads(id) on delete cascade,
  attribution_percent numeric(5,2) not null default 100 check (attribution_percent between 0 and 100),
  created_at timestamptz not null default now(),
  unique(campaign_id, lead_id)
);

create table if not exists documents (
  id bigserial primary key,
  document_type varchar(80) not null,
  document_number varchar(120),
  client_id bigint references clients(id) on delete set null,
  contractor_id bigint references contractors(id) on delete set null,
  employee_id bigint references employees(id) on delete set null,
  contract_id bigint references contracts(id) on delete set null,
  proposal_id bigint references proposals(id) on delete set null,
  storage_url text,
  effective_date date,
  expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_clients_source on clients(source);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_owner on leads(owner_employee_id);
create index if not exists idx_opportunities_stage on opportunities(stage);
create index if not exists idx_opportunities_owner on opportunities(owner_employee_id);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_time_entries_work_date on time_entries(work_date);
create index if not exists idx_invoices_status_due on invoices(status, due_date);
create index if not exists idx_incoming_payments_date on incoming_payments(payment_date);
create index if not exists idx_expenses_date on expenses(expense_date);
create index if not exists idx_tax_payments_due_date on tax_payments(due_date);
create index if not exists idx_marketing_campaigns_channel on marketing_campaigns(channel);

-- Updated_at triggers
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','employees','contractors','leads','opportunities','proposals',
    'contracts','projects','project_assignments','time_entries','invoices',
    'tax_obligations','tax_payments','expenses','marketing_campaigns','documents'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_%I_updated_at ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER tr_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END$$;

commit;
