import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.services.auth_service import auth_service


def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    payload = {"sub": "user_test_99", "username": "alice", "role": "learner"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_test_99"
    assert decoded["username"] == "alice"
    assert decoded["role"] == "learner"


@pytest.mark.asyncio
async def test_user_registration_and_login():
    reg_resp = await auth_service.register("testuser_abc", "test_abc@example.com", "Password_123")
    assert reg_resp.username == "testuser_abc"
    assert reg_resp.user_id is not None
    assert reg_resp.access_token is not None

    login_resp = await auth_service.login("testuser_abc", "Password_123")
    assert login_resp.username == "testuser_abc"
    assert login_resp.access_token is not None
