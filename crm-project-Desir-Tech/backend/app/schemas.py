"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=5000)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    company: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=5000)


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., max_length=255)
    company: str | None = Field(None, max_length=255)
    role: str | None = Field(None, max_length=255)
    environment: str | None = Field(None, max_length=50)
    timeline: str | None = Field(None, max_length=255)
    message: str | None = Field(None, max_length=5000)


class ContactSubmissionResponse(ContactSubmissionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
