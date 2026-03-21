create or replace view vw_pipeline_summary as
select
  o.stage,
  count(*) as opportunity_count,
  coalesce(sum(o.estimated_value), 0)::numeric(14,2) as total_estimated_value,
  coalesce(sum((o.estimated_value * o.probability_percent) / 100.0), 0)::numeric(14,2) as total_weighted_value
from opportunities o
group by o.stage;

create or replace view vw_accounts_receivable as
select
  i.id as invoice_id,
  i.invoice_number,
  i.client_id,
  c.name as client_name,
  i.invoice_date,
  i.due_date,
  i.total_amount,
  coalesce(sum(p.amount), 0)::numeric(14,2) as amount_paid,
  (i.total_amount - coalesce(sum(p.amount), 0))::numeric(14,2) as amount_outstanding,
  i.status
from invoices i
join clients c on c.id = i.client_id
left join incoming_payments p on p.invoice_id = i.id
group by i.id, c.name;

create or replace view vw_project_margin as
with project_revenue as (
  select
    i.project_id,
    coalesce(sum(i.total_amount), 0)::numeric(14,2) as revenue
  from invoices i
  where i.project_id is not null
  group by i.project_id
),
contractor_cost as (
  select
    cp.project_id,
    coalesce(sum(cp.gross_amount), 0)::numeric(14,2) as contractor_cost
  from contractor_payouts cp
  where cp.project_id is not null
  group by cp.project_id
),
expense_cost as (
  select
    e.project_id,
    coalesce(sum(e.amount + e.tax_amount), 0)::numeric(14,2) as expense_cost
  from expenses e
  where e.project_id is not null
    and e.status in ('approved','paid')
  group by e.project_id
),
project_cost as (
  select
    p.id as project_id,
    coalesce(cc.contractor_cost, 0)::numeric(14,2) as contractor_cost,
    coalesce(ec.expense_cost, 0)::numeric(14,2) as expense_cost
  from projects p
  left join contractor_cost cc on cc.project_id = p.id
  left join expense_cost ec on ec.project_id = p.id
)
select
  p.id as project_id,
  p.name as project_name,
  coalesce(pr.revenue, 0)::numeric(14,2) as revenue,
  coalesce(pc.contractor_cost, 0)::numeric(14,2) as contractor_cost,
  coalesce(pc.expense_cost, 0)::numeric(14,2) as expense_cost,
  (coalesce(pr.revenue, 0) - coalesce(pc.contractor_cost, 0) - coalesce(pc.expense_cost, 0))::numeric(14,2) as gross_margin
from projects p
left join project_revenue pr on pr.project_id = p.id
left join project_cost pc on pc.project_id = p.id;

create or replace view vw_monthly_cashflow as
with incoming as (
  select
    date_trunc('month', payment_date)::date as month,
    sum(amount)::numeric(14,2) as incoming_amount
  from incoming_payments
  group by 1
),
outgoing as (
  select
    date_trunc('month', payout_date)::date as month,
    sum(gross_amount)::numeric(14,2) as outgoing_amount
  from contractor_payouts
  group by 1
),
salary as (
  select
    date_trunc('month', payout_date)::date as month,
    sum(net_amount)::numeric(14,2) as salary_amount
  from salary_payouts
  group by 1
),
expense as (
  select
    date_trunc('month', expense_date)::date as month,
    sum(amount + tax_amount)::numeric(14,2) as expense_amount
  from expenses
  where status in ('approved','paid')
  group by 1
)
select
  m.month,
  coalesce(i.incoming_amount, 0)::numeric(14,2) as incoming_amount,
  (coalesce(o.outgoing_amount, 0) + coalesce(s.salary_amount, 0) + coalesce(e.expense_amount, 0))::numeric(14,2) as outgoing_amount,
  (coalesce(i.incoming_amount, 0) - (coalesce(o.outgoing_amount, 0) + coalesce(s.salary_amount, 0) + coalesce(e.expense_amount, 0)))::numeric(14,2) as net_cashflow
from (
  select month from incoming
  union
  select month from outgoing
  union
  select month from salary
  union
  select month from expense
) m
left join incoming i on i.month = m.month
left join outgoing o on o.month = m.month
left join salary s on s.month = m.month
left join expense e on e.month = m.month
order by m.month;

create or replace view vw_tax_position as
select
  tp.id,
  tobj.tax_name,
  tobj.jurisdiction,
  tp.period_start,
  tp.period_end,
  tp.due_date,
  tp.paid_date,
  tp.amount_due,
  coalesce(tp.amount_paid, 0)::numeric(12,2) as amount_paid,
  (tp.amount_due - coalesce(tp.amount_paid, 0))::numeric(12,2) as balance_due,
  tp.status
from tax_payments tp
join tax_obligations tobj on tobj.id = tp.tax_obligation_id;
