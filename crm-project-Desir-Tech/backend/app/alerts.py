"""
Operational alert delivery helpers.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger("desirtech.ops_alerts")

SEVERITY_RANK = {
    "info": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}


def _normalize_severity(severity: str | None) -> str:
    normalized = (severity or "high").strip().lower()
    return normalized if normalized in SEVERITY_RANK else "high"


def should_send_operations_alert(severity: str) -> bool:
    if not settings.operations_alert_webhook_url:
        return False
    allowed_environments = settings.operations_alert_enabled_environments_list
    if allowed_environments and settings.env.strip().lower() not in allowed_environments:
        return False
    return SEVERITY_RANK[_normalize_severity(severity)] >= SEVERITY_RANK[
        settings.operations_alert_min_severity_normalized
    ]


def _alert_payload(
    *,
    severity: str,
    title: str,
    message: str,
    category: str,
    source: str,
    details: dict[str, Any] | None,
) -> dict[str, Any]:
    normalized_severity = _normalize_severity(severity)
    return {
        "text": (
            f"[DesirTech][{normalized_severity.upper()}][{category}] {title}: {message}"
        ),
        "severity": normalized_severity,
        "title": title,
        "message": message,
        "category": category,
        "source": source,
        "environment": settings.env,
        "details": details or {},
    }


def send_operations_alert(
    severity: str,
    title: str,
    message: str,
    *,
    category: str = "operations",
    source: str = "backend",
    details: dict[str, Any] | None = None,
) -> bool:
    if not should_send_operations_alert(severity):
        return False
    payload = _alert_payload(
        severity=severity,
        title=title,
        message=message,
        category=category,
        source=source,
        details=details,
    )
    try:
        with httpx.Client(timeout=settings.operations_alert_timeout_seconds) as client:
            response = client.post(settings.operations_alert_webhook_url, json=payload)
            response.raise_for_status()
        return True
    except Exception:
        logger.exception(
            "Failed to deliver operations alert category=%s severity=%s title=%s",
            category,
            severity,
            title,
        )
        return False


async def send_operations_alert_async(
    severity: str,
    title: str,
    message: str,
    *,
    category: str = "operations",
    source: str = "backend",
    details: dict[str, Any] | None = None,
) -> bool:
    if not should_send_operations_alert(severity):
        return False
    payload = _alert_payload(
        severity=severity,
        title=title,
        message=message,
        category=category,
        source=source,
        details=details,
    )
    try:
        async with httpx.AsyncClient(
            timeout=settings.operations_alert_timeout_seconds
        ) as client:
            response = await client.post(
                settings.operations_alert_webhook_url,
                json=payload,
            )
            response.raise_for_status()
        return True
    except Exception:
        logger.exception(
            "Failed to deliver async operations alert category=%s severity=%s title=%s",
            category,
            severity,
            title,
        )
        return False
