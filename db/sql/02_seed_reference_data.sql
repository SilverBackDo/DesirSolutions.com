begin;

insert into pipeline_stages (stage_key, display_name, stage_order, default_probability, is_closed)
values
  ('new', 'New', 1, 10, false),
  ('qualified', 'Qualified', 2, 25, false),
  ('discovery', 'Discovery', 3, 40, false),
  ('proposal', 'Proposal Sent', 4, 60, false),
  ('negotiation', 'Negotiation', 5, 80, false),
  ('won', 'Won', 6, 100, true),
  ('lost', 'Lost', 7, 0, true),
  ('on_hold', 'On Hold', 8, 20, false)
on conflict (stage_key) do update set
  display_name = excluded.display_name,
  stage_order = excluded.stage_order,
  default_probability = excluded.default_probability,
  is_closed = excluded.is_closed;

insert into expense_categories (category_name, gl_code, is_tax_deductible)
values
  ('Software and Tools', '6001', true),
  ('Contractor Costs', '5001', true),
  ('Employee Payroll', '5002', true),
  ('Marketing and Advertising', '6101', true),
  ('Insurance', '6201', true),
  ('Legal and Professional Fees', '6202', true),
  ('Travel and Reimbursables', '6301', true),
  ('Office and Operations', '6401', true),
  ('Taxes and Government Fees', '6501', false)
on conflict (category_name) do update set
  gl_code = excluded.gl_code,
  is_tax_deductible = excluded.is_tax_deductible;

insert into tax_obligations (tax_name, jurisdiction, frequency, rate_percent, account_reference, active)
values
  ('Washington B&O Tax', 'Washington State', 'quarterly', null, null, true),
  ('Federal Estimated Tax', 'United States', 'quarterly', null, null, true),
  ('Payroll Withholding', 'United States', 'monthly', null, null, true)
on conflict (tax_name, jurisdiction) do update set
  frequency = excluded.frequency,
  rate_percent = excluded.rate_percent,
  active = excluded.active;

update tax_obligations
set active = false
where tax_name = 'South Dakota Tax Registration Review'
  and jurisdiction = 'South Dakota';

insert into ai_workflows (
  workflow_key,
  name,
  description,
  objective,
  version,
  status,
  autonomy_level,
  primary_provider,
  default_model,
  requires_human_approval,
  config
)
values (
  'lead_qualification',
  'Lead Qualification with Human Approval',
  'Normalize inbound demand, score the lead, and require human approval before writing pipeline records.',
  'Create an auditable, low-supervision path from inbound lead to approved CRM opportunity.',
  1,
  'active',
  'human_approved',
  'openai',
  'gpt-5.4-mini',
  true,
  jsonb_build_object(
    'agents', jsonb_build_array('intake_normalizer', 'qualification_agent', 'sales_supervisor_gate'),
    'blocked_actions', jsonb_build_array('external_email.send', 'payment.execute', 'contract.release'),
    'allowed_writes', jsonb_build_array('opportunities.create_after_approval')
  )
)
on conflict (workflow_key) do update set
  name = excluded.name,
  description = excluded.description,
  objective = excluded.objective,
  version = excluded.version,
  status = excluded.status,
  autonomy_level = excluded.autonomy_level,
  primary_provider = excluded.primary_provider,
  default_model = excluded.default_model,
  requires_human_approval = excluded.requires_human_approval,
  config = excluded.config;

commit;
