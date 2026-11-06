import time
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hashes a password with salt using SHA-256 with key derivation."""
    salt = settings.JWT_SECRET[:16]
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "skillarena-ai"
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        return payload
    except Exception:
        return None


async def get_current_user_optional(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Returns authenticated user if JWT token is present and valid;
    otherwise returns an anonymous identity derived from 'x-anonymous-id' header or client host.
    """
    if auth and auth.credentials:
        payload = decode_token(auth.credentials)
        if payload and "sub" in payload:
            return {
                "id": payload["sub"],
                "username": payload.get("username", "user"),
                "email": payload.get("email", ""),
                "is_authenticated": True,
                "role": payload.get("role", "learner")
            }

    # Fallback to anonymous ID
    anon_id = request.headers.get("x-anonymous-id")
    if not anon_id:
        anon_id = request.query_params.get("anonymous_id")
    if not anon_id:
        # Generate stable fallback based on client IP
        client_ip = request.client.host if request.client else "unknown"
        anon_id = f"anon-{hashlib.md5(client_ip.encode()).hexdigest()[:12]}"

    return {
        "id": anon_id,
        "username": f"Guest_{anon_id[:6]}",
        "email": "",
        "is_authenticated": False,
        "role": "guest"
    }


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """Strict dependency requiring authenticated user."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required."
        )
    payload = decode_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )
    return {
        "id": payload["sub"],
        "username": payload.get("username", "user"),
        "email": payload.get("email", ""),
        "is_authenticated": True,
        "role": payload.get("role", "learner")
    }
