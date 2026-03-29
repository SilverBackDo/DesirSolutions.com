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

from app.config import CRMAuthUser, settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass
class AuthContext:
    auth_type: str
    principal: str
    role: str


def verify_api_key(api_key: str | None) -> bool:
    return bool(api_key and settings.internal_api_key and api_key == settings.internal_api_key)


def _configured_user(username: str) -> CRMAuthUser | None:
    for user in settings.crm_user_records:
        if user.username == username:
            return user
    return None


def configured_user_role(username: str) -> str | None:
    user = _configured_user(username)
    if not user:
        return None
    return user.role


def verify_user_password(username: str, password: str) -> bool:
    if not settings.crm_user_auth_enabled:
        return False
    user = _configured_user(username)
    if not user:
        return False
    if user.password_hash:
        try:
            return _pwd_context.verify(password, user.password_hash)
        except ValueError:
            return False
    if user.password:
        return secrets.compare_digest(password, user.password)
    return False


def create_access_token(subject: str, role: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth_access_token_exp_minutes
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expires_at,
        "type": "access",
    }
    return jwt.encode(
        payload,
        settings.jwt_signing_key,
        algorithm=settings.auth_jwt_algorithm,
    )


def decode_access_token(token: str | None) -> tuple[str, str] | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.jwt_signing_key,
            algorithms=[settings.auth_jwt_algorithm],
        )
    except JWTError:
        return None
    if payload.get("type") != "access":
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        return None
    role = payload.get("role")
    if not isinstance(role, str) or not role:
        role = configured_user_role(subject) or "viewer"
    return subject, role


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
    user_context = decode_access_token(token)
    if user_context:
        subject, role = user_context
        return AuthContext(auth_type="user", principal=subject, role=role)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing bearer token",
    )


async def require_internal_access(
    api_key: str | None = Security(_api_key_header),
    token: str | None = Depends(_oauth2_scheme),
) -> AuthContext:
    user_context = decode_access_token(token)
    if user_context:
        subject, role = user_context
        return AuthContext(auth_type="user", principal=subject, role=role)
    if verify_api_key(api_key):
        return AuthContext(auth_type="api_key", principal="api_key", role="automation")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def _assert_allowed_roles(auth: AuthContext, allowed_roles: tuple[str, ...]) -> AuthContext:
    if auth.role in allowed_roles:
        return auth
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient role permissions",
    )


def require_user_roles(*allowed_roles: str):
    async def dependency(auth: AuthContext = Depends(require_user_access)) -> AuthContext:
        return _assert_allowed_roles(auth, tuple(role.strip().lower() for role in allowed_roles))

    return dependency


def require_internal_roles(*allowed_roles: str, allow_api_key: bool = False):
    normalized_roles = tuple(role.strip().lower() for role in allowed_roles)

    async def dependency(auth: AuthContext = Depends(require_internal_access)) -> AuthContext:
        if auth.auth_type == "api_key":
            if allow_api_key:
                return auth
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API key access is not allowed for this route",
            )
        return _assert_allowed_roles(auth, normalized_roles)

    return dependency
