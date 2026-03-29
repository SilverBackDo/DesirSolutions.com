"""
Application configuration loaded from environment variables.
"""

import json
from decimal import Decimal
from urllib.parse import urlsplit, urlunsplit

from pydantic import BaseModel, Field, model_validator
from pydantic_settings import BaseSettings

CRM_USER_ROLES = {"admin", "sales", "finance", "approver", "viewer"}
ALERT_SEVERITIES = {"info", "low", "medium", "high", "critical"}


class CRMAuthUser(BaseModel):
    username: str = Field(..., min_length=1, max_length=120)
    password: str | None = None
    password_hash: str | None = None
    role: str = Field(default="viewer", min_length=1, max_length=40)

    @model_validator(mode="after")
    def validate_credential_source(self):
        if self.password or self.password_hash:
            normalized_role = self.role.strip().lower()
            if normalized_role not in CRM_USER_ROLES:
                raise ValueError(
                    f"CRM auth user role must be one of: {', '.join(sorted(CRM_USER_ROLES))}"
                )
            self.role = normalized_role
            return self
        raise ValueError("CRM auth users must include password or password_hash")


class AIModelPricing(BaseModel):
    input_per_1m_tokens_usd: Decimal = Field(default=Decimal("0"), ge=0)
    output_per_1m_tokens_usd: Decimal = Field(default=Decimal("0"), ge=0)


class Settings(BaseSettings):
    # Database
    db_host: str = "db"
    db_port: int = 5432
    db_name: str = "desir"
    db_user: str = "desiruser"
    db_password: str  # no default — must be set via .env or environment

    # App
    secret_key: str  # no default — must be set via .env or environment
    auth_jwt_secret: str | None = None
    automation_api_key: str | None = None
    allowed_origins: str = "https://desirsolutions.com,https://www.desirsolutions.com"
    env: str = "production"
    debug: bool = False
    auth_jwt_algorithm: str = "HS256"
    auth_access_token_exp_minutes: int = 480
    crm_admin_username: str | None = None
    crm_admin_password: str | None = None
    crm_admin_password_hash: str | None = None
    crm_auth_users: list[CRMAuthUser] = Field(default_factory=list)
    ai_factory_primary_provider: str = "openai"
    ai_factory_require_human_approval: bool = True
    ai_factory_queue_name: str = "ai_factory"
    ai_factory_redis_url: str = "redis://redis:6379/0"
    ai_factory_queue_reclaim_idle_ms: int = 300000
    ai_openai_model: str = "gpt-5.4-mini"
    ai_anthropic_model: str = "claude-sonnet-4-6"
    ai_model_pricing_json: str = "{}"
    ai_cost_alert_per_run_usd: Decimal = Decimal("0")
    ai_cost_alert_daily_usd: Decimal = Decimal("0")
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    contact_notification_webhook_url: str | None = None
    contact_submission_rate_limit_window_minutes: int = 15
    contact_submission_rate_limit_max: int = 5
    operations_alert_webhook_url: str | None = None
    operations_alert_min_severity: str = "high"
    operations_alert_timeout_seconds: int = 5
    operations_alert_enabled_environments: str = "production,staging"
    operations_alert_notify_unhandled_exceptions: bool = True
    otel_enabled: bool = True
    otel_service_name: str = "desirtech-backend"
    otel_exporter_otlp_endpoint: str = "http://otel-collector:4318/v1/traces"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def crm_user_records(self) -> list[CRMAuthUser]:
        records: list[CRMAuthUser] = []
        if self.crm_admin_username and (
            self.crm_admin_password_hash or self.crm_admin_password
        ):
            records.append(
                CRMAuthUser(
                    username=self.crm_admin_username,
                    password=self.crm_admin_password,
                    password_hash=self.crm_admin_password_hash,
                    role="admin",
                )
            )
        records.extend(self.crm_auth_users)

        seen_usernames: set[str] = set()
        for record in records:
            normalized_username = record.username.strip()
            if normalized_username in seen_usernames:
                raise ValueError(
                    f"Duplicate CRM auth username configured: {normalized_username}"
                )
            seen_usernames.add(normalized_username)
        return records

    @property
    def crm_user_auth_enabled(self) -> bool:
        return bool(self.crm_user_records)

    @property
    def jwt_signing_key(self) -> str:
        if self.auth_jwt_secret:
            return self.auth_jwt_secret
        raise ValueError("AUTH_JWT_SECRET must be configured")

    @property
    def internal_api_key(self) -> str | None:
        return self.automation_api_key

    @property
    def ai_provider_options(self) -> list[str]:
        providers: list[str] = []
        if self.openai_api_key:
            providers.append("openai")
        if self.anthropic_api_key:
            providers.append("anthropic")
        return providers or [self.ai_factory_primary_provider]

    @property
    def ai_model_pricing(self) -> dict[str, AIModelPricing]:
        raw = (self.ai_model_pricing_json or "").strip()
        if not raw:
            return {}
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("AI_MODEL_PRICING_JSON must decode to a JSON object")
        return {
            str(model_name): AIModelPricing.model_validate(pricing_payload)
            for model_name, pricing_payload in payload.items()
        }

    def ai_pricing_for_model(self, model: str | None) -> AIModelPricing | None:
        if not model:
            return None
        return self.ai_model_pricing.get(model)

    @property
    def operations_alert_enabled_environments_list(self) -> list[str]:
        return [
            environment.strip().lower()
            for environment in self.operations_alert_enabled_environments.split(",")
            if environment.strip()
        ]

    @property
    def operations_alert_min_severity_normalized(self) -> str:
        normalized = self.operations_alert_min_severity.strip().lower()
        if normalized not in ALERT_SEVERITIES:
            raise ValueError(
                "OPERATIONS_ALERT_MIN_SEVERITY must be one of: "
                + ", ".join(sorted(ALERT_SEVERITIES))
            )
        return normalized

    @property
    def otel_traces_endpoint(self) -> str:
        endpoint = self.otel_exporter_otlp_endpoint.rstrip("/")
        parsed = urlsplit(endpoint)
        if not parsed.scheme or not parsed.netloc:
            return endpoint

        netloc = parsed.netloc
        path = parsed.path.rstrip("/")
        if netloc.endswith(":4317"):
            netloc = f"{netloc[:-5]}:4318"
        if not path:
            path = "/v1/traces"
        elif not path.endswith("/v1/traces"):
            path = f"{path}/v1/traces"
        return urlunsplit((parsed.scheme, netloc, path, "", ""))

    class Config:
        env_file = ".env"


settings = Settings()
