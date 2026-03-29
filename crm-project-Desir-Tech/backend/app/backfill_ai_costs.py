"""
Backfill estimated AI costs for historical ledger rows after pricing is configured.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import or_

from app.ai_factory_runtime import estimate_cost_usd
from app.database import SessionLocal
from app.models import AIFactoryCostLedger


def backfill_estimated_costs() -> tuple[int, Decimal]:
    db = SessionLocal()
    try:
        ledger_rows = (
            db.query(AIFactoryCostLedger)
            .filter(
                AIFactoryCostLedger.estimated_cost_usd == 0,
                or_(
                    AIFactoryCostLedger.prompt_tokens > 0,
                    AIFactoryCostLedger.completion_tokens > 0,
                    AIFactoryCostLedger.total_tokens > 0,
                ),
            )
            .order_by(AIFactoryCostLedger.id.asc())
            .all()
        )

        updated_rows = 0
        total_backfilled_usd = Decimal("0")
        backfilled_at = datetime.now(timezone.utc).isoformat()

        for ledger_row in ledger_rows:
            estimated_cost_usd, pricing_metadata = estimate_cost_usd(
                ledger_row.provider,
                ledger_row.model,
                prompt_tokens=int(ledger_row.prompt_tokens or 0),
                completion_tokens=int(ledger_row.completion_tokens or 0),
            )
            if estimated_cost_usd <= 0:
                continue

            metadata = dict(ledger_row.cost_metadata or {})
            metadata.update(pricing_metadata)
            metadata["backfilled_at"] = backfilled_at
            metadata["backfill_source"] = "app.backfill_ai_costs"

            ledger_row.estimated_cost_usd = estimated_cost_usd
            ledger_row.cost_metadata = metadata
            updated_rows += 1
            total_backfilled_usd += estimated_cost_usd

        if updated_rows:
            db.commit()

        return updated_rows, total_backfilled_usd
    finally:
        db.close()


def main() -> None:
    updated_rows, total_backfilled_usd = backfill_estimated_costs()
    print(
        "backfill_complete "
        f"updated_rows={updated_rows} "
        f"total_backfilled_usd={total_backfilled_usd}"
    )


if __name__ == "__main__":
    main()
