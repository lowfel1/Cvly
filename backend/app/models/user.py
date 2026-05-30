from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str  
    password: str = Field(..., min_length=8)

    @validator("full_name")
    def strip_full_name(cls, value: str) -> str:
        # Normalize spaces around the full name input.
        return value.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    plan: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None
