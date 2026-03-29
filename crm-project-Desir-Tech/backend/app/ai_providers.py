"""
Provider adapters for AI Factory workflows.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import json
from typing import Any

from anthropic import Anthropic
from openai import OpenAI

from app.config import settings


SUPPORTED_STAGE_OPTIONS = {"new", "qualified", "discovery"}
SUPPORTED_TIER_OPTIONS = {"low", "medium", "high"}

_SYSTEM_PROMPT = """
You are the lead qualification agent for Desir Consultant LLC.
You evaluate inbound IT consulting and contractor placement demand for a human-supervised CRM.
Return JSON only. Do not wrap the response in markdown.
Respect the human-approval model: no outbound actions, payments, contracts, or automatic CRM write-back.
""".strip()

_PROPOSAL_SYSTEM_PROMPT = """
You are the proposal drafting agent for Desir Consultant LLC.
You turn internal CRM opportunity context into a reviewable consulting proposal package for a human-supervised workflow.
Return JSON only. Do not wrap the response in markdown.
Respect the human-approval model: no outbound actions, payments, contracts, or automatic external proposal delivery.
""".strip()


@dataclass
class ProviderUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


@dataclass
class ProviderExecutionResult:
    qualification: dict[str, Any]
    recommended_actions: list[str]
    risk_summary: str
    raw_text: str
    usage: ProviderUsage = field(default_factory=ProviderUsage)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ProposalExecutionResult:
    proposal_package: dict[str, Any]
    recommended_actions: list[str]
    risk_summary: str
    raw_text: str
    usage: ProviderUsage = field(default_factory=ProviderUsage)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderFailureInfo:
    provider: str
    model: str | None
    error_type: str
    message: str
    fallback_recommended: bool = True


def _extract_json_payload(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        segments = text.split("```")
        for segment in segments:
            candidate = segment.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{") and candidate.endswith("}"):
                text = candidate
                break
    return json.loads(text)


def _usage_int(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, dict):
        for key in ("tokens", "total_tokens"):
            nested = value.get(key)
            if isinstance(nested, (int, float)):
                return int(nested)
        return 0
    for attr in ("tokens", "total_tokens"):
        nested = getattr(value, attr, None)
        if isinstance(nested, (int, float)):
            return int(nested)
    return 0


def _coerce_usage(usage: Any) -> ProviderUsage:
    if usage is None:
        return ProviderUsage()
    if isinstance(usage, dict):
        prompt_tokens = int(
            usage.get("input_tokens")
            or usage.get("prompt_tokens")
            or usage.get("prompt_token_count")
            or 0
        )
        completion_tokens = int(
            usage.get("output_tokens")
            or usage.get("completion_tokens")
            or usage.get("completion_token_count")
            or 0
        )
        total_tokens = int(usage.get("total_tokens") or (prompt_tokens + completion_tokens))
        return ProviderUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

    input_tokens = _usage_int(
        getattr(usage, "input_tokens", None) or getattr(usage, "prompt_tokens", None)
    )
    output_tokens = _usage_int(
        getattr(usage, "output_tokens", None) or getattr(usage, "completion_tokens", None)
    )
    total_tokens = _usage_int(getattr(usage, "total_tokens", None)) or (input_tokens + output_tokens)
    return ProviderUsage(
        prompt_tokens=input_tokens,
        completion_tokens=output_tokens,
        total_tokens=total_tokens,
    )


def _validate_payload(payload: dict[str, Any]) -> ProviderExecutionResult:
    qualification = payload.get("qualification")
    if not isinstance(qualification, dict):
        raise ValueError("Provider response did not include a qualification object")

    score = int(qualification.get("score") or 0)
    tier = str(qualification.get("tier") or "").lower()
    stage = str(qualification.get("recommended_stage") or "").lower()
    reasons = qualification.get("reasons") or []
    recommended_actions = payload.get("recommended_actions") or []
    risk_summary = str(payload.get("risk_summary") or "").strip()

    if tier not in SUPPORTED_TIER_OPTIONS:
        raise ValueError("Provider response used an unsupported tier")
    if stage not in SUPPORTED_STAGE_OPTIONS:
        raise ValueError("Provider response used an unsupported stage")
    if not isinstance(reasons, list) or not reasons:
        raise ValueError("Provider response did not include qualification reasons")
    if not isinstance(recommended_actions, list) or not recommended_actions:
        raise ValueError("Provider response did not include recommended actions")
    if not risk_summary:
        raise ValueError("Provider response did not include a risk summary")

    normalized_qualification = {
        "score": max(0, min(score, 100)),
        "tier": tier,
        "recommended_stage": stage,
        "reasons": [str(reason) for reason in reasons[:8]],
    }
    return ProviderExecutionResult(
        qualification=normalized_qualification,
        recommended_actions=[str(action) for action in recommended_actions[:6]],
        risk_summary=risk_summary,
        raw_text="",
    )


def _validate_proposal_payload(payload: dict[str, Any]) -> ProposalExecutionResult:
    proposal_package = payload.get("proposal_package")
    if not isinstance(proposal_package, dict):
        raise ValueError("Provider response did not include a proposal_package object")

    executive_summary = str(proposal_package.get("executive_summary") or "").strip()
    delivery_scope = proposal_package.get("delivery_scope") or []
    staffing_plan = proposal_package.get("staffing_plan") or []
    timeline_weeks = int(proposal_package.get("timeline_weeks") or 0)
    pricing_options = proposal_package.get("pricing_options") or []
    assumptions = proposal_package.get("assumptions") or []
    next_step = str(proposal_package.get("next_step") or "").strip()
    recommended_actions = payload.get("recommended_actions") or []
    risk_summary = str(payload.get("risk_summary") or "").strip()

    if not executive_summary:
        raise ValueError("Provider response did not include an executive summary")
    if not isinstance(delivery_scope, list) or not delivery_scope:
        raise ValueError("Provider response did not include delivery scope items")
    if not isinstance(staffing_plan, list) or not staffing_plan:
        raise ValueError("Provider response did not include a staffing plan")
    if timeline_weeks <= 0:
        raise ValueError("Provider response did not include a valid timeline")
    if not isinstance(pricing_options, list) or not pricing_options:
        raise ValueError("Provider response did not include pricing options")
    if not isinstance(assumptions, list) or not assumptions:
        raise ValueError("Provider response did not include assumptions")
    if not next_step:
        raise ValueError("Provider response did not include a next step")
    if not isinstance(recommended_actions, list) or not recommended_actions:
        raise ValueError("Provider response did not include recommended actions")
    if not risk_summary:
        raise ValueError("Provider response did not include a risk summary")

    normalized_package = {
        "executive_summary": executive_summary,
        "delivery_scope": [str(item) for item in delivery_scope[:6]],
        "staffing_plan": [
            {
                "role": str(item.get("role") or "Role"),
                "allocation": str(item.get("allocation") or "TBD"),
                "focus": str(item.get("focus") or "Delivery support"),
            }
            for item in staffing_plan[:5]
            if isinstance(item, dict)
        ],
        "timeline_weeks": max(1, min(timeline_weeks, 52)),
        "pricing_options": [
            {
                "name": str(item.get("name") or "Option"),
                "estimated_amount_usd": float(item.get("estimated_amount_usd") or 0),
                "rationale": str(item.get("rationale") or ""),
            }
            for item in pricing_options[:4]
            if isinstance(item, dict)
        ],
        "assumptions": [str(item) for item in assumptions[:6]],
        "next_step": next_step,
    }
    if not normalized_package["staffing_plan"]:
        raise ValueError("Provider response staffing plan items were invalid")
    if not normalized_package["pricing_options"]:
        raise ValueError("Provider response pricing options were invalid")

    return ProposalExecutionResult(
        proposal_package=normalized_package,
        recommended_actions=[str(action) for action in recommended_actions[:6]],
        risk_summary=risk_summary,
        raw_text="",
    )


def _build_user_prompt(lead_snapshot: dict[str, Any]) -> str:
    response_contract = {
        "qualification": {
            "score": "integer from 0 to 100",
            "tier": "one of: low, medium, high",
            "recommended_stage": "one of: new, discovery, qualified",
            "reasons": ["3-6 concise bullet-style strings"],
        },
        "recommended_actions": [
            "2-4 concise next actions that preserve human approval gates"
        ],
        "risk_summary": "one short sentence describing the run risk and buyer quality",
    }
    return (
        "Evaluate this inbound lead for Desir Consultant LLC.\n"
        "Use the JSON contract exactly.\n"
        f"Lead snapshot:\n{json.dumps(lead_snapshot, indent=2)}\n"
        f"Return only valid JSON matching:\n{json.dumps(response_contract, indent=2)}"
    )


def _build_proposal_user_prompt(
    opportunity_snapshot: dict[str, Any],
    lead_snapshot: dict[str, Any] | None,
) -> str:
    response_contract = {
        "proposal_package": {
            "executive_summary": "1-2 sentence summary",
            "delivery_scope": ["3-6 concise scope bullets"],
            "staffing_plan": [
                {"role": "role name", "allocation": "e.g. 0.5 FTE", "focus": "responsibility summary"}
            ],
            "timeline_weeks": "integer number of weeks",
            "pricing_options": [
                {"name": "option label", "estimated_amount_usd": "number", "rationale": "why this option fits"}
            ],
            "assumptions": ["3-6 concise assumptions"],
            "next_step": "one sentence internal next step",
        },
        "recommended_actions": [
            "2-4 concise next actions that preserve human approval gates"
        ],
        "risk_summary": "one short sentence describing proposal draft risk and completeness",
    }
    prompt = (
        "Draft an internal proposal package for Desir Consultant LLC.\n"
        "Use the JSON contract exactly.\n"
        f"Opportunity snapshot:\n{json.dumps(opportunity_snapshot, indent=2)}\n"
    )
    if lead_snapshot:
        prompt += f"Lead snapshot:\n{json.dumps(lead_snapshot, indent=2)}\n"
    prompt += f"Return only valid JSON matching:\n{json.dumps(response_contract, indent=2)}"
    return prompt


def _extract_anthropic_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    texts: list[str] = []
    for block in content or []:
        block_type = getattr(block, "type", None) or (block.get("type") if isinstance(block, dict) else None)
        if block_type == "text":
            text = getattr(block, "text", None)
            if text is None and isinstance(block, dict):
                text = block.get("text")
            if text:
                texts.append(str(text))
    return "\n".join(texts).strip()


def default_model_for_provider(provider: str) -> str:
    if provider == "openai":
        return settings.ai_openai_model
    if provider == "anthropic":
        return settings.ai_anthropic_model
    raise ValueError(f"Unsupported provider: {provider}")


def provider_is_configured(provider: str) -> bool:
    if provider == "openai":
        return bool(settings.openai_api_key)
    if provider == "anthropic":
        return bool(settings.anthropic_api_key)
    return False


def alternate_provider_targets(primary_provider: str) -> list[tuple[str, str]]:
    targets: list[tuple[str, str]] = []
    for provider in ("openai", "anthropic"):
        if provider == primary_provider or not provider_is_configured(provider):
            continue
        targets.append((provider, default_model_for_provider(provider)))
    return targets


def classify_provider_failure(
    provider: str,
    model: str | None,
    exc: Exception,
) -> ProviderFailureInfo:
    message = str(exc).strip()
    normalized = message.lower()
    fallback_recommended = any(
        token in normalized
        for token in (
            "429",
            "quota",
            "rate limit",
            "insufficient_quota",
            "timeout",
            "connection",
            "unavailable",
        )
    )
    return ProviderFailureInfo(
        provider=provider,
        model=model,
        error_type=type(exc).__name__,
        message=message,
        fallback_recommended=fallback_recommended or True,
    )


def _execute_provider_json_prompt(
    provider: str,
    model: str,
    *,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: int,
) -> tuple[str, ProviderUsage, dict[str, Any]]:
    if provider == "openai":
        client = OpenAI(api_key=settings.openai_api_key)
        request_payload: dict[str, Any] = {
            "model": model,
            "instructions": system_prompt,
            "input": user_prompt,
        }
        if model.startswith("gpt-5"):
            request_payload["reasoning"] = {"effort": "medium"}
        response = client.responses.create(**request_payload)
        raw_text = (response.output_text or "").strip()
        return raw_text, _coerce_usage(getattr(response, "usage", None)), {
            "provider_request_id": getattr(response, "_request_id", None),
            "response_id": getattr(response, "id", None),
        }

    if provider == "anthropic":
        client = Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model=model,
            max_tokens=max_output_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw_text = _extract_anthropic_text(getattr(message, "content", None))
        return raw_text, _coerce_usage(getattr(message, "usage", None)), {
            "provider_request_id": getattr(message, "_request_id", None),
            "response_id": getattr(message, "id", None),
            "stop_reason": getattr(message, "stop_reason", None),
        }

    raise ValueError(f"Unsupported provider: {provider}")


def execute_provider_qualification(
    provider: str,
    model: str,
    lead_snapshot: dict[str, Any],
) -> ProviderExecutionResult:
    user_prompt = _build_user_prompt(lead_snapshot)
    raw_text, usage, metadata = _execute_provider_json_prompt(
        provider,
        model,
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_output_tokens=1200,
    )
    payload = _extract_json_payload(raw_text)
    result = _validate_payload(payload)
    result.raw_text = raw_text
    result.usage = usage
    result.metadata = metadata
    return result


def execute_provider_proposal_draft(
    provider: str,
    model: str,
    opportunity_snapshot: dict[str, Any],
    lead_snapshot: dict[str, Any] | None,
) -> ProposalExecutionResult:
    user_prompt = _build_proposal_user_prompt(opportunity_snapshot, lead_snapshot)
    raw_text, usage, metadata = _execute_provider_json_prompt(
        provider,
        model,
        system_prompt=_PROPOSAL_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_output_tokens=1800,
    )
    payload = _extract_json_payload(raw_text)
    result = _validate_proposal_payload(payload)
    result.raw_text = raw_text
    result.usage = usage
    result.metadata = metadata
    return result
