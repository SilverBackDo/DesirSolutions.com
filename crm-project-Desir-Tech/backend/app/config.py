"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    db_host: str = "db"
    db_port: int = 5432
    db_name: str = "desir"
    db_user: str = "desiruser"
    db_password: str  # no default — must be set via .env or environment

    # App
    secret_key: str  # no default — must be set via .env or environment
    allowed_origins: str = "https://desirsolutions.com,https://www.desirsolutions.com"
    env: str = "production"
    debug: bool = False
    auth_jwt_algorithm: str = "HS256"
    auth_access_token_exp_minutes: int = 480
    crm_admin_username: str | None = None
    crm_admin_password: str | None = None
    crm_admin_password_hash: str | None = None

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def crm_user_auth_enabled(self) -> bool:
        return bool(
            self.crm_admin_username
            and (self.crm_admin_password_hash or self.crm_admin_password)
        )

    class Config:
        env_file = ".env"


settings = Settings()
