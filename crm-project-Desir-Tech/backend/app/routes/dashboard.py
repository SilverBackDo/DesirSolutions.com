"""
Combined dashboard pull endpoints.
"""

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import require_internal_access
from app.database import get_db
from app.schemas import (
    PipelineStageSummaryResponse,
    AccountsReceivableRowResponse,
    MonthlyCashflowRowResponse,
    TaxPositionRowResponse,
    DashboardSummaryResponse,
    DashboardKpisResponse,
)

router = APIRouter(dependencies=[Depends(require_internal_access)])

_REQUIRED_FINANCIAL_VIEWS = (
    "vw_accounts_receivable",
    "vw_monthly_cashflow",
    "vw_tax_position",
)


def _csv_response(rows: list[dict], filename: str) -> Response:
    buffer = io.StringIO()
    if rows:
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    else:
        buffer.write("\n")

    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _month_floor(value: date) -> date:
    return value.replace(day=1)


def _assert_financial_views_ready(db: Session) -> None:
    rows = db.execute(
        text(
            """
            select table_name
            from information_schema.views
            where table_schema = current_schema()
              and table_name in (
                'vw_accounts_receivable',
                'vw_monthly_cashflow',
                'vw_tax_position'
              )
            """
        )
    ).mappings().all()
    existing = {str(row["table_name"]) for row in rows}
    missing = sorted(set(_REQUIRED_FINANCIAL_VIEWS) - existing)
    if not missing:
        return
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "FIN_DASHBOARD_NOT_INITIALIZED",
            "message": "Financial dashboard views are not initialized.",
            "missing_views": missing,
        },
    )


@router.get("/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    _assert_financial_views_ready(db)

    pipeline_sql = """
      select
        stage,
        count(*) as opportunity_count,
        coalesce(sum(estimated_value), 0) as total_estimated_value,
        coalesce(sum((estimated_value * probability_percent) / 100.0), 0) as total_weighted_value
      from opportunities
      where 1=1
    """
    pipeline_params: dict[str, object] = {}
    if from_date:
        pipeline_sql += " and (expected_close_date is null or expected_close_date >= :from_date)"
        pipeline_params["from_date"] = from_date
    if to_date:
        pipeline_sql += " and (expected_close_date is null or expected_close_date <= :to_date)"
        pipeline_params["to_date"] = to_date
    pipeline_sql += " group by stage order by stage"

    pipeline_rows = db.execute(
        text(pipeline_sql),
        pipeline_params,
    ).mappings().all()

    receivable_sql = """
      select
        invoice_id,
        invoice_number,
        client_id,
        client_name,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        amount_outstanding,
        status
      from vw_accounts_receivable
      where 1=1
    """
    receivable_params: dict[str, object] = {}
    if from_date:
        receivable_sql += " and due_date >= :from_date"
        receivable_params["from_date"] = from_date
    if to_date:
        receivable_sql += " and due_date <= :to_date"
        receivable_params["to_date"] = to_date
    receivable_sql += " order by due_date asc limit 250"

    receivable_rows = db.execute(
        text(receivable_sql),
        receivable_params,
    ).mappings().all()

    cashflow_sql = """
      select
        month,
        incoming_amount,
        outgoing_amount,
        net_cashflow
      from vw_monthly_cashflow
      where 1=1
    """
    cashflow_params: dict[str, object] = {}
    if from_date:
        cashflow_sql += " and month >= :from_month"
        cashflow_params["from_month"] = _month_floor(from_date)
    if to_date:
        cashflow_sql += " and month <= :to_month"
        cashflow_params["to_month"] = _month_floor(to_date)
    cashflow_sql += " order by month desc limit 24"

    cashflow_rows = db.execute(
        text(cashflow_sql),
        cashflow_params,
    ).mappings().all()

    tax_sql = """
      select
        id,
        tax_name,
        jurisdiction,
        period_start,
        period_end,
        due_date,
        paid_date,
        amount_due,
        amount_paid,
        balance_due,
        status
      from vw_tax_position
      where 1=1
    """
    tax_params: dict[str, object] = {}
    if from_date:
        tax_sql += " and due_date >= :from_date"
        tax_params["from_date"] = from_date
    if to_date:
        tax_sql += " and due_date <= :to_date"
        tax_params["to_date"] = to_date
    tax_sql += " order by due_date asc limit 250"

    tax_rows = db.execute(
        text(tax_sql),
        tax_params,
    ).mappings().all()

    return DashboardSummaryResponse(
        pipeline=[
            PipelineStageSummaryResponse(
                stage=r["stage"],
                opportunity_count=int(r["opportunity_count"]),
                total_estimated_value=float(r["total_estimated_value"]),
                total_weighted_value=float(r["total_weighted_value"]),
            )
            for r in pipeline_rows
        ],
        accounts_receivable=[
            AccountsReceivableRowResponse(
                invoice_id=int(r["invoice_id"]),
                invoice_number=r["invoice_number"],
                client_id=int(r["client_id"]),
                client_name=r["client_name"],
                invoice_date=r["invoice_date"],
                due_date=r["due_date"],
                total_amount=float(r["total_amount"]),
                amount_paid=float(r["amount_paid"]),
                amount_outstanding=float(r["amount_outstanding"]),
                status=r["status"],
            )
            for r in receivable_rows
        ],
        monthly_cashflow=[
            MonthlyCashflowRowResponse(
                month=r["month"],
                incoming_amount=float(r["incoming_amount"]),
                outgoing_amount=float(r["outgoing_amount"]),
                net_cashflow=float(r["net_cashflow"]),
            )
            for r in cashflow_rows
        ],
        tax_position=[
            TaxPositionRowResponse(
                id=int(r["id"]),
                tax_name=r["tax_name"],
                jurisdiction=r["jurisdiction"],
                period_start=r["period_start"],
                period_end=r["period_end"],
                due_date=r["due_date"],
                paid_date=r["paid_date"],
                amount_due=float(r["amount_due"]),
                amount_paid=float(r["amount_paid"]),
                balance_due=float(r["balance_due"]),
                status=r["status"],
            )
            for r in tax_rows
        ],
    )


@router.get("/kpis", response_model=DashboardKpisResponse)
async def dashboard_kpis(db: Session = Depends(get_db)):
    _assert_financial_views_ready(db)

    pipeline = db.execute(
        text(
            """
            select
              count(*) filter (where stage not in ('won','lost')) as open_opportunity_count,
              coalesce(sum(estimated_value), 0) as total_pipeline_estimated_value,
              coalesce(sum((estimated_value * probability_percent) / 100.0), 0) as total_pipeline_weighted_value
            from opportunities
            """
        )
    ).mappings().first()

    receivable = db.execute(
        text(
            """
            select
              coalesce(sum(amount_outstanding), 0) as receivables_outstanding_total,
              count(*) filter (where due_date < current_date and amount_outstanding > 0) as overdue_invoice_count
            from vw_accounts_receivable
            """
        )
    ).mappings().first()

    tax = db.execute(
        text(
            """
            select
              coalesce(sum(balance_due), 0) as tax_balance_due_total
            from vw_tax_position
            """
        )
    ).mappings().first()

    return DashboardKpisResponse(
        open_opportunity_count=int(pipeline["open_opportunity_count"] or 0),
        total_pipeline_estimated_value=float(
            pipeline["total_pipeline_estimated_value"] or 0),
        total_pipeline_weighted_value=float(
            pipeline["total_pipeline_weighted_value"] or 0),
        receivables_outstanding_total=float(
            receivable["receivables_outstanding_total"] or 0),
        overdue_invoice_count=int(receivable["overdue_invoice_count"] or 0),
        tax_balance_due_total=float(tax["tax_balance_due_total"] or 0),
    )


@router.get("/export/accounts-receivable.csv")
async def export_accounts_receivable_csv(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    _assert_financial_views_ready(db)

    sql = """
      select invoice_id, invoice_number, client_id, client_name, invoice_date, due_date,
             total_amount, amount_paid, amount_outstanding, status
      from vw_accounts_receivable
      where 1=1
    """
    params: dict[str, object] = {}
    if from_date:
        sql += " and due_date >= :from_date"
        params["from_date"] = from_date
    if to_date:
        sql += " and due_date <= :to_date"
        params["to_date"] = to_date
    sql += " order by due_date asc"

    rows = [dict(r) for r in db.execute(text(sql), params).mappings().all()]
    return _csv_response(rows, "accounts_receivable.csv")


@router.get("/export/monthly-cashflow.csv")
async def export_monthly_cashflow_csv(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    _assert_financial_views_ready(db)

    sql = """
      select month, incoming_amount, outgoing_amount, net_cashflow
      from vw_monthly_cashflow
      where 1=1
    """
    params: dict[str, object] = {}
    if from_date:
        sql += " and month >= :from_month"
        params["from_month"] = _month_floor(from_date)
    if to_date:
        sql += " and month <= :to_month"
        params["to_month"] = _month_floor(to_date)
    sql += " order by month desc"

    rows = [dict(r) for r in db.execute(text(sql), params).mappings().all()]
    return _csv_response(rows, "monthly_cashflow.csv")


@router.get("/export/tax-position.csv")
async def export_tax_position_csv(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    _assert_financial_views_ready(db)

    sql = """
      select id, tax_name, jurisdiction, period_start, period_end, due_date, paid_date,
             amount_due, amount_paid, balance_due, status
      from vw_tax_position
      where 1=1
    """
    params: dict[str, object] = {}
    if from_date:
        sql += " and due_date >= :from_date"
        params["from_date"] = from_date
    if to_date:
        sql += " and due_date <= :to_date"
        params["to_date"] = to_date
    sql += " order by due_date asc"

    rows = [dict(r) for r in db.execute(text(sql), params).mappings().all()]
    return _csv_response(rows, "tax_position.csv")
