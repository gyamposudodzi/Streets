from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.enums import UserRole, UserStatus


class RegisterRequest(BaseModel):
    email: str
    phone: str | None = None
    role: UserRole = UserRole.USER
    is_age_verified: bool = Field(default=False)


class LoginRequest(BaseModel):
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    phone: str | None
    role: UserRole
    status: UserStatus
    is_age_verified: bool
    email_verified: bool
    created_at: datetime


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
