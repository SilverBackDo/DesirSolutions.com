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

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
