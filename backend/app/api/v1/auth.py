import uuid
from fastapi import APIRouter, Depends, Request
from app.services.auth_service import auth_service
from app.core.security import get_current_user, get_current_user_optional, create_access_token
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserProfileResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Multi-User"])


@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegisterRequest):
    """Multi-user registration endpoint with password hashing."""
    return await auth_service.register(req.username, req.email, req.password)


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    """Multi-user authentication endpoint returning signed JWT access token."""
    return await auth_service.login(req.username_or_email, req.password)


@router.get("/me", response_model=UserProfileResponse)
async def get_current_profile(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return await auth_service.get_user_profile(current_user["id"])


@router.post("/anonymous", response_model=TokenResponse)
async def create_or_refresh_anonymous_session(request: Request):
    """
    Creates an anonymous guest user identity as described in Section 9 & 17,
    enabling immediate practice without mandatory registration while preserving progress.
    """
    anon_header = request.headers.get("x-anonymous-id")
    anon_id = anon_header if anon_header else f"anon_{uuid.uuid4().hex[:12]}"
    token = create_access_token({
        "sub": anon_id,
        "username": f"Guest_{anon_id[:6]}",
        "role": "guest"
    })
    return TokenResponse(
        access_token=token,
        user_id=anon_id,
        username=f"Guest_{anon_id[:6]}",
        email=None,
        role="guest"
    )
