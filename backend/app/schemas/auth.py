from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    email: Optional[str] = None
    role: str = "learner"


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    role: str
    is_authenticated: bool
    created_at: Optional[str] = None
