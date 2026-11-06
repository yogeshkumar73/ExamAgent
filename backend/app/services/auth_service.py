from typing import Optional, Dict, Any
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import UnauthorizedException, ValidationException
from app.database.repositories.user_repository import user_repo
from app.schemas.auth import TokenResponse, UserProfileResponse


class AuthService:
    async def register(self, username: str, email: str, password: str) -> TokenResponse:
        existing_username = await user_repo.get_by_username(username)
        if existing_username:
            raise ValidationException(f"Username '{username}' is already registered.")

        existing_email = await user_repo.get_by_email(email)
        if existing_email:
            raise ValidationException(f"Email '{email}' is already in use.")

        hashed = hash_password(password)
        user = await user_repo.create_user(username, email, hashed)

        token = create_access_token({
            "sub": user["_id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        })

        return TokenResponse(
            access_token=token,
            user_id=user["_id"],
            username=user["username"],
            email=user["email"],
            role=user["role"]
        )

    async def login(self, username_or_email: str, password: str) -> TokenResponse:
        user = await user_repo.get_by_identifier(username_or_email)
        if not user or not verify_password(password, user["hashed_password"]):
            raise UnauthorizedException("Invalid username or password.")

        token = create_access_token({
            "sub": user["_id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        })

        return TokenResponse(
            access_token=token,
            user_id=user["_id"],
            username=user["username"],
            email=user["email"],
            role=user["role"]
        )

    async def get_user_profile(self, user_id: str) -> UserProfileResponse:
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User account not found.")

        return UserProfileResponse(
            id=user["_id"],
            username=user["username"],
            email=user.get("email"),
            role=user.get("role", "learner"),
            is_authenticated=True,
            created_at=user.get("created_at")
        )


auth_service = AuthService()
