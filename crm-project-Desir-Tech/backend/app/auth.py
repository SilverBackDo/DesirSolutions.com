"""
API key authentication dependency for internal CRM endpoints.
"""

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(
    api_key: str | None = Security(_api_key_header),
) -> str:
    if not api_key or api_key != settings.secret_key:
        raise HTTPException(
            status_code=403, detail="Invalid or missing API key")
    return api_key
