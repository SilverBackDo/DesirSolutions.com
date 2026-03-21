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
  ('Washington B&O Tax', 'Washington State', 'quarterly', 1.500, null, true),
  ('Federal Estimated Tax', 'United States', 'quarterly', null, null, true),
  ('Payroll Withholding', 'United States', 'monthly', null, null, true)
on conflict (tax_name, jurisdiction) do update set
  frequency = excluded.frequency,
  rate_percent = excluded.rate_percent,
  active = excluded.active;

commit;
