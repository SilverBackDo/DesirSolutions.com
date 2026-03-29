"""
Authentication endpoints for CRM user access.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import (
    AuthContext,
    assert_crm_user_auth_configured,
    configured_user_role,
    create_access_token,
    require_user_access,
    verify_user_password,
)
from app.config import settings
from app.schemas import AuthUserResponse, LoginRequest, LoginResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    assert_crm_user_auth_configured()
    if not verify_user_password(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    role = configured_user_role(payload.username) or "viewer"
    token = create_access_token(payload.username, role)
    return LoginResponse(
        access_token=token,
        expires_in_seconds=settings.auth_access_token_exp_minutes * 60,
    )


@router.get("/me", response_model=AuthUserResponse)
async def me(auth: AuthContext = Depends(require_user_access)):
    return AuthUserResponse(
        username=auth.principal,
        auth_type=auth.auth_type,
        role=auth.role,
    )
