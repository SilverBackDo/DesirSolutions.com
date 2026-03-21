"""
Authentication dependencies for CRM endpoints.
Supports API key access for automation and JWT for human users.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass
class AuthContext:
    auth_type: str
    principal: str


def verify_api_key(api_key: str | None) -> bool:
    return bool(api_key and api_key == settings.secret_key)


def verify_user_password(username: str, password: str) -> bool:
    if not settings.crm_user_auth_enabled:
        return False
    if username != settings.crm_admin_username:
        return False
    if settings.crm_admin_password_hash:
        try:
            return _pwd_context.verify(password, settings.crm_admin_password_hash)
        except ValueError:
            return False
    if settings.crm_admin_password:
        return secrets.compare_digest(password, settings.crm_admin_password)
    return False


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth_access_token_exp_minutes
    )
    payload = {
        "sub": subject,
        "exp": expires_at,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.auth_jwt_algorithm)


def decode_access_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.auth_jwt_algorithm],
        )
    except JWTError:
        return None
    if payload.get("type") != "access":
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        return None
    return subject


def assert_crm_user_auth_configured() -> None:
    if settings.crm_user_auth_enabled:
        return
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "CRM_AUTH_NOT_CONFIGURED",
            "message": "CRM user authentication is not configured.",
        },
    )


async def require_user_access(
    token: str | None = Depends(_oauth2_scheme),
) -> AuthContext:
    subject = decode_access_token(token)
    if subject:
        return AuthContext(auth_type="user", principal=subject)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing bearer token",
    )


async def require_internal_access(
    api_key: str | None = Security(_api_key_header),
    token: str | None = Depends(_oauth2_scheme),
) -> AuthContext:
    subject = decode_access_token(token)
    if subject:
        return AuthContext(auth_type="user", principal=subject)
    if verify_api_key(api_key):
        return AuthContext(auth_type="api_key", principal="api_key")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
